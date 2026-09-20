# 01. Pods

## What is a Pod?

A Pod is the smallest deployable unit in Kubernetes — a wrapper around one or more tightly-coupled containers that are always scheduled together on the same node, share the same network namespace (same IP address, same port space), and can share storage volumes. Kubernetes never manages a raw container directly; everything is managed at the Pod level.

```
Pod
 ├── Container: app (main application)
 └── Container: sidecar (e.g., a logging agent)
      (both share the SAME IP address and can communicate via localhost)
```

## Why Not Just Use Containers Directly?

Kubernetes needed a unit of scheduling that could represent "one or more containers that must always run together, on the same machine, sharing network/storage" — Docker containers alone don't have this grouping concept. The Pod is that abstraction.

```
Most Pods:        1 container per Pod (the common case)
Multi-container:   2+ containers per Pod, sharing network/storage — used for tightly-coupled
Pods                helper patterns (sidecars, init containers), NOT for unrelated services
```

## Basic Pod Definition (YAML)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app-pod
  labels:
    app: my-app
spec:
  containers:
    - name: my-app
      image: myapp:1.0
      ports:
        - containerPort: 3000
      env:
        - name: NODE_ENV
          value: "production"
      resources:
        requests:
          cpu: "250m"
          memory: "256Mi"
        limits:
          cpu: "500m"
          memory: "512Mi"
```

```bash
kubectl apply -f pod.yaml
kubectl get pods
kubectl describe pod my-app-pod
kubectl logs my-app-pod
kubectl exec -it my-app-pod -- sh
kubectl delete pod my-app-pod
```

## Pods Are Ephemeral — A Critical Mental Model

Pods are **not** meant to be durable, individually-managed entities — they're disposable. If a Pod crashes or its node fails, Kubernetes doesn't "heal" that specific Pod; it creates a **brand-new** Pod (with a new name, new IP address) to replace it.

```
Pod dies -> Kubernetes does NOT restart the SAME pod identity
         -> a controller (like a Deployment) creates a NEW pod to replace it
```

This is why you almost never create raw Pods directly in production — you use a higher-level controller (a **Deployment**, covered in its own notes) that manages Pod creation, replacement, and scaling on your behalf.

```bash
# Creating a bare Pod directly (rare in practice — mainly for debugging/learning)
kubectl run debug-pod --image=busybox -it --rm -- sh
```

## Multi-Container Pods — Sidecar Pattern

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-sidecar
spec:
  containers:
    - name: main-app
      image: myapp:1.0
      ports:
        - containerPort: 3000
    - name: log-shipper
      image: log-shipper:1.0
      volumeMounts:
        - name: shared-logs
          mountPath: /var/log/app
  volumes:
    - name: shared-logs
      emptyDir: {}
```

The `log-shipper` container reads logs written by `main-app` via a shared volume — a common pattern for adding cross-cutting functionality (logging, monitoring agents, proxies) without modifying the main application container itself.

## Init Containers — Running Setup Before the Main Container Starts

Init containers run to completion **before** any regular containers in the Pod start, useful for setup tasks (waiting for a dependency to be ready, running a database migration, fetching configuration).

```yaml
spec:
  initContainers:
    - name: wait-for-db
      image: busybox
      command: ["sh", "-c", "until nc -z db-service 5432; do sleep 2; done"]
  containers:
    - name: main-app
      image: myapp:1.0
```

If an init container fails, Kubernetes restarts it (per the Pod's restart policy) until it succeeds — the main containers never start until all init containers have completed successfully.

## Pod Lifecycle Phases

```
Pending    -> Pod accepted by the cluster, but containers not yet running
              (e.g., still pulling the image, or waiting to be scheduled to a node)
Running     -> at least one container is running
Succeeded    -> all containers terminated successfully (exit code 0) — for one-off/batch Pods
Failed        -> at least one container terminated with a non-zero exit code
Unknown        -> Pod's state can't be determined (e.g., lost communication with its node)
```

```bash
kubectl get pods -o wide   # shows phase, node assignment, IP address
```

## Container Restart Policies (Within a Pod)

```yaml
spec:
  restartPolicy: Always # default — always restart failed containers (typical for long-running services)
  # restartPolicy: OnFailure  # only restart on non-zero exit (typical for batch/Job workloads)
  # restartPolicy: Never       # never automatically restart
```

## Resource Requests and Limits — Why They Matter

```yaml
resources:
  requests:
    cpu: "250m" # 250 millicores = 0.25 of a CPU core — used for SCHEDULING decisions
    memory: "256Mi"
  limits:
    cpu: "500m" # hard ceiling — CPU usage above this is throttled
    memory: "512Mi" # hard ceiling — exceeding this gets the container OOM-killed
```

```
Requests: what the scheduler GUARANTEES is available for this Pod on whichever node it's placed
Limits:    the maximum the container is ALLOWED to consume, enforced at runtime
```

Without requests/limits, a single misbehaving Pod could consume unbounded resources, starving every other Pod on the same node — setting these appropriately is a foundational production best practice, not an optional nicety.

## Labels and Selectors — How Kubernetes Objects Find Each Other

```yaml
metadata:
  labels:
    app: my-app
    tier: backend
    environment: production
```

```bash
kubectl get pods -l app=my-app
kubectl get pods -l 'environment in (production, staging)'
```

Labels are the fundamental mechanism connecting Pods to the higher-level objects that manage/target them — a Deployment's `selector` and a Service's `selector` both work by matching Pod labels (full detail in the Deployments and Services notes).

## Common Interview-Style Questions

- **What is a Pod, and why is it Kubernetes' smallest deployable unit rather than a single container?**
  A Pod wraps one or more tightly-coupled containers that must always run together, sharing the same network namespace (IP address) and optionally storage; Kubernetes needed a grouping abstraction for this "always co-located" relationship, since raw containers alone don't express it — most Pods contain a single container, but the abstraction supports multi-container patterns like sidecars.

- **What happens when a Pod crashes or its node fails — does Kubernetes restart that exact Pod?**
  No — Pods are ephemeral and not individually healed; a controller (like a Deployment) detects the loss and creates a brand-new Pod (with a new identity/IP) to replace it, rather than restoring the original Pod itself.

- **What is an init container, and how does it differ from a regular container in a Pod?**
  An init container runs to completion before any regular containers start, used for setup tasks like waiting for a dependency or running a migration; regular containers don't start until all init containers have succeeded, and unlike regular containers, init containers aren't expected to keep running long-term.

- **What's the difference between resource `requests` and `limits`?**
  Requests specify what the scheduler guarantees is available for the Pod when deciding node placement; limits set a hard ceiling on actual resource consumption at runtime, with CPU usage above the limit throttled and memory usage above the limit triggering an OOM kill.

- **Why do you almost never create raw Pods directly in production?**
  Because Pods have no built-in self-healing, scaling, or rollout management on their own — a higher-level controller like a Deployment is needed to manage Pod creation, replacement on failure, scaling, and controlled updates, which is why Deployments (not raw Pods) are the standard way to run workloads in practice.
