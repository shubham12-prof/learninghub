# 03. Services

## Why Services Are Necessary

Pods are ephemeral — they're created and destroyed constantly (scaling, rollouts, failures), and each gets a **new IP address** every time. Nothing that depends on a stable network address could reliably talk directly to individual Pods. A Service provides a stable, unchanging network identity (a virtual IP and DNS name) that automatically routes to whichever Pods currently match a given label selector — regardless of how many times those Pods have been replaced.

```
Without a Service: Client would need to track individual, constantly-changing Pod IPs — unworkable

With a Service:     Client always talks to the SAME stable address (the Service);
                     the Service internally tracks and routes to the CURRENT set of matching Pods
```

## Basic Service Definition

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app # routes traffic to any Pod with this label
  ports:
    - port: 80 # the Service's own port
      targetPort: 3000 # the port on the Pods it forwards to
  type: ClusterIP # default type — internal-only
```

```bash
kubectl apply -f service.yaml
kubectl get services
kubectl describe service my-app-service
```

## How Selectors Connect Services to Pods

```yaml
# Deployment's Pods carry this label:
template:
  metadata:
    labels:
      app: my-app

# Service's selector matches that SAME label:
spec:
  selector:
    app: my-app
```

The Service continuously watches for Pods matching its selector and automatically updates its internal routing — as a Deployment scales, rolls out updates, or replaces failed Pods, the Service transparently keeps routing to whatever the current healthy matching Pods are.

## The Four Service Types

### ClusterIP (Default)

Exposes the Service only **within** the cluster — the standard choice for internal-only services (like a backend API only the frontend needs to reach, or a database).

```yaml
spec:
  type: ClusterIP
```

```
Reachable at: my-app-service.default.svc.cluster.local  (from WITHIN the cluster only)
```

### NodePort

Exposes the Service on a **static port on every node's IP** in the cluster, making it reachable from outside the cluster (though generally considered a somewhat blunt tool for production external access).

```yaml
spec:
  type: NodePort
  ports:
    - port: 80
      targetPort: 3000
      nodePort: 30080 # must be in the range 30000-32767
```

```
Reachable at: <any-node-ip>:30080
```

### LoadBalancer

Provisions an actual external load balancer from the underlying cloud provider (AWS ELB, GCP Load Balancer, Azure Load Balancer), giving the Service a real, internet-routable external IP address — the standard way to expose a service to the public internet on a cloud-managed Kubernetes cluster.

```yaml
spec:
  type: LoadBalancer
  ports:
    - port: 80
      targetPort: 3000
```

```bash
kubectl get service my-app-service
# EXTERNAL-IP column shows the provisioned load balancer's public address (may take a minute to appear)
```

### ExternalName

Maps a Service to an external DNS name, rather than routing to Pods at all — useful for referring to an external dependency (a managed database, a third-party API) via a consistent internal name.

```yaml
spec:
  type: ExternalName
  externalName: my-database.us-east-1.rds.amazonaws.com
```

```
Any Pod can now reach "my-database-service" internally, which resolves to the external RDS hostname
```

## Service Types — Comparison

| Type           | Accessible From                                          | Common Use Case                                                   |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| `ClusterIP`    | Inside the cluster only                                  | Internal services (backend APIs, databases)                       |
| `NodePort`     | Outside the cluster, via any node's IP + a static port   | Simple external access, often for testing/dev                     |
| `LoadBalancer` | The public internet, via a cloud-provisioned external IP | Production-facing services on a cloud provider                    |
| `ExternalName` | Internal cluster DNS alias for an external resource      | Referencing external databases/APIs by a consistent internal name |

## DNS Resolution — Reaching a Service by Name

Kubernetes runs an internal DNS service (CoreDNS) that automatically creates a DNS record for every Service, letting Pods reach it by name rather than needing to know its IP.

```
Full form:  <service-name>.<namespace>.svc.cluster.local
Shorthand:  <service-name>                    (works if calling from within the SAME namespace)
             <service-name>.<namespace>          (works from a DIFFERENT namespace)
```

```js
// Inside an application Pod
const dbHost = "my-app-service"; // same namespace — shorthand works
const dbHost2 = "my-app-service.production"; // different namespace — need the namespace qualifier
```

## Headless Services — Direct Pod-to-Pod Discovery

Sometimes an application needs to discover **individual Pod IPs** directly (rather than a single load-balanced virtual IP) — common for stateful applications where clients need to talk to a specific replica (e.g., a database cluster's specific nodes).

```yaml
spec:
  clusterIP: None # this is what makes it "headless"
  selector:
    app: my-database
```

Instead of a single virtual IP, DNS lookups against a headless Service return the IPs of **all** currently matching Pods individually — the application itself then decides how to use/select among them.

## Multi-Port Services

```yaml
spec:
  selector:
    app: my-app
  ports:
    - name: http
      port: 80
      targetPort: 3000
    - name: metrics
      port: 9090
      targetPort: 9090
```

## Session Affinity — Sticky Routing Within a Service

By default, a Service load-balances requests across matching Pods without regard to which client sent a previous request. Session affinity can pin a given client to the same backend Pod.

```yaml
spec:
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800
```

(Related trade-offs to the sticky sessions discussed in the Scaling module's Load Balancers notes — generally discouraged in favor of externalizing state, but sometimes still needed for specific protocols.)

## Common Interview-Style Questions

- **Why are Services necessary given that Pods already have IP addresses?**
  Pods are ephemeral and get a new IP address every time they're recreated (scaling, rollouts, failures); nothing depending on a stable address could reliably reach individual Pods directly — a Service provides a fixed, unchanging virtual IP and DNS name that automatically routes to whichever Pods currently match its label selector, regardless of how often those Pods change.

- **How does a Service know which Pods to route traffic to?**
  Via a label selector — the Service continuously watches for Pods whose labels match its configured selector, automatically updating its internal routing as matching Pods are created, replaced, or removed.

- **What's the difference between `ClusterIP`, `NodePort`, and `LoadBalancer` Service types?**
  `ClusterIP` (default) exposes the Service only within the cluster; `NodePort` additionally exposes it on a static port across every node's IP, making it reachable from outside the cluster; `LoadBalancer` provisions an actual external cloud load balancer with a public IP, the standard way to expose a service to the internet on a cloud-managed cluster.

- **What is a headless Service, and when would you use one?**
  A Service with `clusterIP: None`, which returns the individual IPs of all matching Pods via DNS instead of a single load-balanced virtual IP; used when an application needs to discover and address specific individual Pods directly, common for stateful applications like database clusters where clients need to reach specific replicas.

- **How do Pods within a cluster typically reach a Service by name?**
  Through Kubernetes' internal DNS (CoreDNS), which automatically creates a DNS record for every Service; Pods in the same namespace can use just the service name, while Pods in a different namespace need to qualify it with the namespace (`service-name.namespace`), or use the fully qualified `service-name.namespace.svc.cluster.local` form.
