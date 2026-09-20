# 02. Deployments

## What is a Deployment?

A Deployment is a controller that manages a set of identical Pods on your behalf — handling creation, replacement on failure, scaling, and controlled rolling updates. It's the standard way to run stateless application workloads in Kubernetes; you almost never create raw Pods directly (as covered in the Pods notes).

```
Deployment
   │
   ▼ manages
ReplicaSet  (ensures the desired NUMBER of Pod replicas exist)
   │
   ▼ manages
Pods, Pods, Pods...  (the actual running instances)
```

## Basic Deployment Definition

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app
          image: myapp:1.0
          ports:
            - containerPort: 3000
```

```bash
kubectl apply -f deployment.yaml
kubectl get deployments
kubectl get pods -l app=my-app   # see the Pods the Deployment created
kubectl describe deployment my-app
```

## The Relationship Between Deployment, ReplicaSet, and Pods

```
Deployment    -> declares: "I want 3 replicas of this Pod template, and manage rollout history"
     │
ReplicaSet     -> the ACTUAL mechanism ensuring exactly 3 matching Pods exist at any time
     │              (a Deployment creates a NEW ReplicaSet on each update, for rollout/rollback support)
Pods
```

You typically never interact with ReplicaSets directly — Deployments manage them automatically, using them internally to implement rolling updates and rollback history.

```bash
kubectl get replicasets   # you CAN inspect these, but you manage the Deployment, not the ReplicaSet directly
```

## Scaling a Deployment

```bash
kubectl scale deployment my-app --replicas=5
```

```yaml
spec:
  replicas: 5 # or declaratively, in the YAML itself
```

(Full detail on both manual and automatic scaling in the dedicated Scaling notes.)

## Rolling Updates — Zero-Downtime Deployments

When you update a Deployment's Pod template (e.g., a new image version), Kubernetes performs a **rolling update** by default — gradually replacing old Pods with new ones, ensuring some capacity remains available throughout.

```bash
kubectl set image deployment/my-app my-app=myapp:2.0
# or edit the YAML's image field and re-apply
kubectl apply -f deployment.yaml
```

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1 # how many EXTRA Pods can be created above the desired count during the update
      maxUnavailable: 0 # how many Pods can be UNAVAILABLE during the update (0 = never drop below desired capacity)
```

```
Rolling update process (with maxSurge=1, maxUnavailable=0):
  Start: [v1] [v1] [v1]                       (3 replicas, all v1)
  Step 1: [v1] [v1] [v1] [v2]                  (new v2 Pod created — surge)
  Step 2: [v1] [v1] [v2] (old v1 terminated once v2 is Ready)
  Step 3: [v1] [v2] [v2] [v2]                    (repeat, one at a time)
  Final:  [v2] [v2] [v2]                           (fully rolled out)
```

## Monitoring a Rollout

```bash
kubectl rollout status deployment/my-app
kubectl rollout history deployment/my-app
```

## Rolling Back a Deployment

```bash
kubectl rollout undo deployment/my-app                  # roll back to the PREVIOUS revision
kubectl rollout undo deployment/my-app --to-revision=3     # roll back to a SPECIFIC revision
```

This is one of the most operationally valuable features of Deployments — if a new release turns out to be broken, rolling back is a single command, and Kubernetes handles the same graceful, controlled process in reverse.

## Readiness and Liveness Probes — Making Rollouts Actually Safe

Without health checks, Kubernetes has no way to know if a newly-created Pod is actually ready to serve traffic (vs still starting up) or has become unhealthy while running — critical for rolling updates to be genuinely safe.

```yaml
spec:
  containers:
    - name: my-app
      image: myapp:1.0
      readinessProbe:
        httpGet:
          path: /health/ready
          port: 3000
        initialDelaySeconds: 5
        periodSeconds: 10
      livenessProbe:
        httpGet:
          path: /health/live
          port: 3000
        initialDelaySeconds: 15
        periodSeconds: 20
```

```
Readiness probe:  "Is this Pod ready to receive traffic RIGHT NOW?"
                   -> fails: Pod is temporarily removed from Service load-balancing (see Services notes),
                      but NOT restarted — useful during startup or brief overload

Liveness probe:     "Is this Pod's application still functioning correctly at all?"
                     -> fails: Kubernetes RESTARTS the container — used to recover from a genuinely
                        stuck/deadlocked process that a simple process-alive check wouldn't catch
```

A rolling update won't proceed to terminate an old Pod until the corresponding new Pod passes its readiness probe — this is the actual mechanism that makes rolling updates zero-downtime in practice, not just a documentation promise.

## Deployment Strategies Beyond Basic Rolling Update

```yaml
spec:
  strategy:
    type:
      Recreate # terminates ALL old Pods before creating any new ones
      # (causes downtime — used when a new version genuinely can't coexist with the old one,
      #  e.g., an incompatible database migration)
```

More advanced strategies (blue-green, canary) aren't built directly into core Deployments — they're typically implemented via additional tooling (Argo Rollouts, Flagger) or manual manipulation of multiple Deployments + Service routing, layered on top of the basic primitives Kubernetes provides.

## Updating Environment Variables or Config Triggers a Rollout Too

Any change to the Pod template (`spec.template`) — not just the image — triggers a new rollout, including environment variable changes, resource limit changes, or ConfigMap/Secret references (with appropriate configuration, covered in their own notes).

## A Complete, Production-Minded Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app
          image: myapp:2.1.0
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 5
          livenessProbe:
            httpGet:
              path: /health/live
              port: 3000
            initialDelaySeconds: 15
```

## Common Interview-Style Questions

- **What is the relationship between a Deployment, a ReplicaSet, and Pods?**
  A Deployment declares the desired state (Pod template, replica count, rollout strategy) and manages ReplicaSets to achieve it; each ReplicaSet ensures a specific number of matching Pods exist, and the Deployment creates a new ReplicaSet on each update (enabling rollout history and rollback) rather than modifying Pods directly itself.

- **How does a rolling update achieve zero downtime?**
  It gradually replaces old Pods with new ones according to `maxSurge`/`maxUnavailable` settings, only terminating an old Pod once its replacement passes its readiness probe — ensuring sufficient healthy capacity remains available to serve traffic throughout the entire update process.

- **What's the difference between a readiness probe and a liveness probe?**
  A readiness probe determines if a Pod is currently able to serve traffic — failing it temporarily removes the Pod from Service load-balancing without restarting it; a liveness probe determines if the application is still functioning at all — failing it causes Kubernetes to restart the container, used to recover from a genuinely stuck or deadlocked process.

- **How would you roll back a bad deployment?**
  `kubectl rollout undo deployment/<name>` reverts to the previous revision (or a specific revision with `--to-revision`), triggering the same controlled, graceful rollout process in reverse.

- **What triggers a new rollout of a Deployment?**
  Any change to the Pod template (`spec.template`) — not just the container image, but also environment variable changes, resource limit changes, or referenced ConfigMap/Secret changes (with appropriate configuration) — since a rollout is fundamentally about reconciling the actual running Pods with a changed desired Pod specification.
