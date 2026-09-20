# 08. Interview Questions — Kubernetes (Comprehensive)

A consolidated set of commonly asked Kubernetes interview questions, organized by topic, with concise answers and code where useful.

---

## Pods

**Q: What is a Pod, and why is it Kubernetes' smallest deployable unit rather than a container?**
A Pod wraps one or more tightly-coupled containers that must always run together, sharing the same network namespace and optionally storage; Kubernetes needed a grouping abstraction for this, since raw containers alone don't express "always co-located."

**Q: What happens when a Pod crashes — does Kubernetes restart the exact same Pod?**
No — a controller like a Deployment detects the loss and creates a brand-new Pod with a new identity to replace it.

**Q: What is an init container?**
A container that runs to completion before any regular containers start, used for setup tasks like waiting for a dependency or running a migration.

**Q: Requests vs limits?**
Requests guide scheduling decisions (what's guaranteed available); limits set a hard runtime ceiling (CPU throttled, memory OOM-killed above it).

---

## Deployments

**Q: Relationship between Deployment, ReplicaSet, and Pods?**
A Deployment declares desired state and manages ReplicaSets; each ReplicaSet ensures a specific Pod count exists; a new ReplicaSet is created on each update, enabling rollback.

**Q: How does a rolling update achieve zero downtime?**
Gradually replaces old Pods with new ones per `maxSurge`/`maxUnavailable`, only terminating an old Pod once its replacement passes its readiness probe.

**Q: Readiness probe vs liveness probe?**
Readiness determines current traffic-serving ability (failure removes from load balancing without restart); liveness determines if the app is still functioning at all (failure triggers a container restart).

**Q: How do you roll back a bad deployment?**
`kubectl rollout undo deployment/<name>`, optionally with `--to-revision`.

---

## Services

**Q: Why are Services necessary given Pods have IPs?**
Pod IPs change constantly as Pods are recreated; a Service provides a stable virtual IP/DNS name that automatically routes to whichever Pods currently match its label selector.

**Q: ClusterIP vs NodePort vs LoadBalancer?**
ClusterIP: internal-only (default). NodePort: exposed on a static port across every node's IP. LoadBalancer: provisions an actual external cloud load balancer with a public IP.

**Q: What is a headless Service?**
A Service with `clusterIP: None`, returning individual Pod IPs via DNS instead of a single virtual IP — used when clients need to address specific Pods directly (e.g., stateful database clusters).

---

## ConfigMaps

**Q: What problem does a ConfigMap solve?**
Separates configuration from the container image, letting the same image be reused across environments with different config, without rebuilding.

**Q: Two ways to consume a ConfigMap in a Pod?**
As environment variables (individual keys or all at once), or as mounted files in a volume.

**Q: Does a running Pod pick up ConfigMap changes automatically?**
Env vars don't auto-update (need a restart); volume-mounted files eventually sync, but the app still typically needs logic to detect and reload them.

---

## Secrets

**Q: Are Kubernetes Secrets encrypted by default?**
No — only base64-encoded, which is trivially reversible; real protection requires encryption at rest configuration plus RBAC restrictions.

**Q: `data` vs `stringData`?**
`data` requires pre-encoded base64 values; `stringData` accepts plain text, automatically encoded by Kubernetes.

**Q: Why might file-mounted Secrets be safer than env vars?**
Env vars can leak more easily via crash dumps/logs or inherited child processes; files require an explicit read.

**Q: Actual primary defense for Secrets?**
RBAC restricting who can read Secret objects, combined with cluster-level encryption at rest.

---

## Ingress

**Q: What problem does Ingress solve versus a LoadBalancer Service?**
A LoadBalancer Service provisions one external load balancer per Service; Ingress exposes many services through a single entry point with host/path-based routing.

**Q: Why doesn't an Ingress resource alone do anything?**
It only declares routing rules — an Ingress Controller (separately installed) actually implements the routing; Kubernetes ships with no default controller.

**Q: How does TLS termination work with Ingress?**
The Ingress references a TLS-type Secret (cert + key); the controller terminates HTTPS there, often forwarding plain HTTP internally within the cluster.

**Q: What does cert-manager do?**
Automates provisioning and renewal of TLS certificates (commonly via Let's Encrypt), keeping the referenced Secret up to date automatically.

---

## Scaling

**Q: HPA vs VPA?**
HPA adjusts the number of Pod replicas based on metrics; VPA adjusts CPU/memory requests/limits of individual Pods.

**Q: Why avoid running HPA and VPA together on the same resource metric?**
They can conflict — HPA scales replica count while VPA resizes Pods, producing unstable, contradictory adjustments.

**Q: What problem does Cluster Autoscaler solve that HPA can't?**
If existing nodes are fully utilized, HPA-requested replicas remain unschedulable; Cluster Autoscaler provisions additional nodes based on unschedulable Pods.

**Q: Why are resource requests a prerequisite for CPU/memory-based HPA?**
HPA's utilization percentage is calculated relative to the Pod's configured requests as a baseline — without requests, there's nothing meaningful to calculate against.

---

## Practical / Coding Questions Often Asked Live

**Q: Write a Deployment with readiness/liveness probes and resource limits.**

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
          resources:
            requests: { cpu: "250m", memory: "256Mi" }
            limits: { cpu: "500m", memory: "512Mi" }
          readinessProbe:
            httpGet: { path: /health/ready, port: 3000 }
          livenessProbe:
            httpGet: { path: /health/live, port: 3000 }
```

**Q: Write a Service exposing that Deployment internally.**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 3000
```

**Q: Write an HPA scaling that Deployment between 3 and 20 replicas based on CPU.**

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
        target: { type: Utilization, averageUtilization: 60 }
```

**Q: Write an Ingress routing api.example.com and app.example.com to different Services with TLS.**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts: [api.example.com, app.example.com]
      secretName: my-tls-secret
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service: { name: api-service, port: { number: 80 } }
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service: { name: app-service, port: { number: 80 } }
```

**Q: Diagnose why a Deployment's HPA shows increased replica count, but the application still appears slow.**
Check whether the new Pods are actually `Running` (not stuck `Pending`) with `kubectl get pods` — if Pending, the cluster's nodes are likely at capacity and the Cluster Autoscaler either isn't configured or hasn't finished provisioning new nodes yet; also verify resource `requests` are set correctly, since HPA's utilization calculation depends on them, and check whether a downstream dependency (database connections, an external API) — not application server capacity — is the actual bottleneck.

**Q: Design a complete deployment for a Node.js API with a Postgres database, external HTTPS access, and secrets for DB credentials.**
A Deployment for the API (with readiness/liveness probes, resource requests/limits, environment variables sourced from a Secret via `secretKeyRef` for DB credentials and a ConfigMap for non-sensitive config); a ClusterIP Service exposing the API internally; an Ingress with a cert-manager-issued TLS certificate routing the public hostname to that Service; the database itself likely run as a managed cloud service rather than in-cluster (or, if in-cluster, a StatefulSet with a PersistentVolumeClaim for durable storage) with its own internal-only Service and a Secret holding its credentials, referenced by the API Deployment.
