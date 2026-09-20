# 07. Scaling

## Scaling Dimensions in Kubernetes

Kubernetes supports scaling along multiple independent dimensions — the number of Pod replicas, the resources allocated to each Pod, and the number of nodes in the cluster itself. Understanding all three (and how they interact) is essential for operating a production cluster effectively.

```
Horizontal Pod Scaling:  more/fewer COPIES of a Pod  (HPA)
Vertical Pod Scaling:     more/fewer RESOURCES per Pod (VPA)
Cluster (Node) Scaling:    more/fewer NODES in the cluster itself (Cluster Autoscaler)
```

## Manual Scaling — The Basics

```bash
kubectl scale deployment my-app --replicas=5
```

```yaml
spec:
  replicas: 5 # declaratively, in the Deployment YAML
```

## Horizontal Pod Autoscaler (HPA) — Automatic Replica Scaling

Automatically adjusts the number of Pod replicas in a Deployment (or ReplicaSet/StatefulSet) based on observed metrics like CPU/memory utilization, or custom application metrics.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
```

```bash
kubectl apply -f hpa.yaml
kubectl get hpa
kubectl describe hpa my-app-hpa
```

```
Current avg CPU utilization: 75% (target: 60%)
-> HPA calculates: needs MORE replicas to bring average utilization back down toward target
-> scales UP

Current avg CPU utilization: 20% (target: 60%)
-> HPA calculates: too many replicas for the actual load
-> scales DOWN (gradually, respecting cooldown/stabilization windows)
```

### Multiple Metrics and Custom Metrics

```yaml
spec:
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 70
    - type: Pods
      pods:
        metric:
          name: requests_per_second # a CUSTOM metric, requires a metrics adapter (e.g., Prometheus Adapter)
        target:
          type: AverageValue
          averageValue: "1000"
```

When multiple metrics are specified, the HPA calculates the desired replica count for **each** and scales to satisfy the **largest** (most demanding) recommendation among them.

### Scaling Behavior — Fine-Tuning Speed and Stability

```yaml
spec:
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0 # react quickly to increased load
      policies:
        - type: Percent
          value: 100 # can DOUBLE replica count per scaling step
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300 # wait 5 minutes of sustained low load before scaling down
      policies:
        - type: Pods
          value: 1 # remove at most 1 replica per scaling step
          periodSeconds: 60
```

This reflects the common best practice (also covered in the Scaling module's Auto Scaling notes) of scaling out aggressively but scaling in conservatively — the cost of under-provisioning generally outweighs the cost of briefly over-provisioning.

## Vertical Pod Autoscaler (VPA) — Automatic Resource Adjustment

Instead of (or in addition to) changing the _number_ of Pods, VPA automatically adjusts the CPU/memory **requests and limits** of individual Pods based on observed usage patterns — useful for right-sizing workloads whose per-instance resource needs are hard to predict upfront.

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: my-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  updatePolicy:
    updateMode: "Auto" # or "Off" (recommendation-only) or "Initial" (only set on Pod creation)
```

> **Important limitation:** VPA typically requires **recreating** the Pod to apply new resource values (you can't resize a running container's limits in place in most configurations) — meaning VPA in "Auto" mode causes Pod restarts, which is a meaningfully different (and more disruptive) trade-off than HPA's simple addition/removal of replicas. VPA and HPA generally should **not** both target CPU/memory for the same workload simultaneously, since they can conflict.

## Cluster Autoscaler — Scaling the Nodes Themselves

HPA and VPA scale things _within_ the existing cluster's node capacity — but if the cluster's nodes are already fully utilized, no amount of Pod-level scaling can add more actual capacity. The Cluster Autoscaler adds/removes **nodes** themselves based on whether Pods are unable to be scheduled due to insufficient resources (or nodes are significantly underutilized).

```
Pod can't be scheduled (insufficient CPU/memory on ANY existing node)
   │
   ▼
Cluster Autoscaler provisions a NEW node from the cloud provider
   │
   ▼
Pod is scheduled onto the new node

--- and in the other direction ---

Nodes are significantly underutilized for a sustained period
   │
   ▼
Cluster Autoscaler safely drains and removes underutilized nodes,
rescheduling their few remaining Pods elsewhere first
```

This is typically configured at the cloud-provider integration level (EKS, GKE, AKS each have their own Cluster Autoscaler setup) rather than as a raw Kubernetes YAML resource you write yourself.

## How HPA, VPA, and Cluster Autoscaler Work Together

```
1. Load increases
2. HPA detects rising CPU/memory utilization -> requests more Pod replicas
3. If existing nodes have capacity -> new Pods are scheduled immediately
4. If existing nodes are FULL -> new Pods remain "Pending" (unschedulable)
5. Cluster Autoscaler detects unschedulable Pods -> provisions new nodes
6. Once new nodes are ready -> the pending Pods get scheduled onto them
```

This layered relationship is a critical thing to understand: **HPA scaling can be completely ineffective if the cluster doesn't also have Cluster Autoscaler (or sufficient pre-provisioned capacity) to actually host the additional replicas** — a very common real-world production gotcha.

## Resource Requests — Why They're a Prerequisite for Effective Scaling

As covered in the Pods notes, HPA's CPU/memory-based scaling calculations are based on utilization **relative to the Pod's configured requests** — without setting requests, CPU/memory-based HPA scaling doesn't function correctly (or at all).

```yaml
resources:
  requests:
    cpu: "250m" # HPA's "60% utilization" target is calculated AGAINST this baseline
```

## Scaling StatefulSets — A Different Set of Considerations

Unlike stateless Deployments, scaling a StatefulSet (used for stateful workloads like databases) involves additional considerations — each replica has a stable, unique identity and often its own dedicated persistent storage, so scaling isn't simply "spin up an interchangeable copy."

```bash
kubectl scale statefulset my-database --replicas=3
```

StatefulSet scaling is generally more constrained/careful than Deployment scaling (often manual, or governed by application-specific operators that understand the stateful workload's specific clustering/replication requirements) rather than freely automated via a simple HPA in most real-world setups.

## Common Interview-Style Questions

- **What's the difference between the Horizontal Pod Autoscaler and the Vertical Pod Autoscaler?**
  HPA automatically adjusts the _number_ of Pod replicas based on observed metrics; VPA automatically adjusts the CPU/memory _resource requests and limits_ of individual Pods — HPA changes how many copies exist, VPA changes how much each copy is allocated.

- **Why is it generally discouraged to use HPA and VPA together targeting the same resource (like CPU) for the same workload?**
  They can conflict — HPA tries to address load by adding more replicas, while VPA tries to address it by resizing individual Pods, and their interacting adjustments can produce unstable, contradictory scaling behavior.

- **What problem does the Cluster Autoscaler solve that HPA alone can't?**
  HPA and VPA scale within the existing cluster's node capacity; if all existing nodes are already fully utilized, HPA can request more replicas, but those Pods will remain unschedulable ("Pending") until more actual node capacity exists — the Cluster Autoscaler provisions (or removes) nodes themselves based on unschedulable Pods or sustained underutilization.

- **Why are resource requests a prerequisite for effective CPU/memory-based HPA scaling?**
  HPA's utilization calculations (e.g., "scale up if average CPU exceeds 60%") are computed relative to each Pod's configured resource requests as the baseline; without requests set, there's no meaningful baseline for HPA to calculate utilization against, and CPU/memory-based autoscaling won't function correctly.

- **Describe the layered relationship between HPA and Cluster Autoscaler when load increases significantly.**
  HPA first detects rising utilization and requests more Pod replicas; if the cluster's existing nodes have enough spare capacity, those Pods schedule immediately, but if not, they remain in a Pending, unschedulable state until the Cluster Autoscaler detects this and provisions additional nodes — meaning HPA scaling alone is ineffective without either sufficient pre-provisioned node capacity or a functioning Cluster Autoscaler to actually host the additional replicas.
