# 07. Service Discovery

## What is Service Discovery?

In a distributed system with many services running across many dynamically-changing instances (containers/VMs being created, destroyed, rescheduled, scaled up/down), service discovery is the mechanism by which one service finds the network location (IP address + port) of another service it needs to communicate with — without hardcoding that location, which would break the moment anything moved or scaled.

```
Without service discovery:
  Service A hardcodes: "call http://192.168.1.42:8080 for the Order Service"
  -> breaks the moment the Order Service moves to a different IP (very common in containerized/cloud environments)

With service discovery:
  Service A asks: "where is the Order Service right now?"
  -> gets a current, valid address, adapting automatically as instances change
```

## Why Service Discovery Is Necessary in Modern Architectures

- **Dynamic infrastructure** — containers/instances are frequently created and destroyed (auto-scaling, deployments, failures), constantly changing IP addresses.
- **Microservices proliferation** — dozens or hundreds of services need to find each other reliably.
- **Load balancing integration** — discovery often needs to return not just "a" location, but a currently-healthy one among potentially many replicas.

## Two Main Patterns: Client-Side vs Server-Side Discovery

### Client-Side Discovery

The calling service directly queries a service registry to get a list of available instances, then chooses one itself (often applying its own load-balancing logic).

```
Client Service ---> Service Registry: "where is order-service?"
Service Registry ---> Client Service: [10.0.1.5:8080, 10.0.1.6:8080, 10.0.1.7:8080]
Client Service picks one (e.g., round-robin) ---> calls it directly
```

```js
// Conceptual client-side discovery example
async function callOrderService(path) {
  const instances = await serviceRegistry.getInstances("order-service");
  const instance = loadBalancer.choose(instances); // e.g., round-robin, random, least-connections
  return fetch(`http://${instance.host}:${instance.port}${path}`);
}
```

**Pros:** no extra network hop, client has full control over load-balancing strategy.
**Cons:** every client needs discovery/load-balancing logic (or a shared library implementing it), coupling clients to the registry's specific API.

### Server-Side Discovery

The calling service simply sends its request to a well-known, stable endpoint (like a load balancer); the load balancer itself queries the registry and routes the request to a healthy instance.

```
Client Service ---> Load Balancer (stable, well-known address)
                          │
                          ▼ (LB internally queries the registry and picks an instance)
                     Order Service Instance
```

```js
// Client-side code is much simpler — no discovery logic needed at all
async function callOrderService(path) {
  return fetch(`http://order-service.internal${path}`); // resolves to a stable load balancer address
}
```

**Pros:** simpler client code (no discovery logic needed in every service), centralizes load-balancing logic.
**Cons:** the load balancer becomes an additional network hop and a critical piece of infrastructure that itself needs to be highly available.

## Service Registry — The Core Component

A service registry is the database of currently-available service instances and their locations, kept up to date as instances start, stop, and health-check.

### Popular Service Registry / Discovery Tools

| Tool                          | Notes                                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Consul** (HashiCorp)        | Full-featured service mesh/discovery tool, built-in health checking, key-value store                     |
| **etcd**                      | Distributed key-value store, commonly used as Kubernetes' backing store and for custom service discovery |
| **ZooKeeper**                 | Older, battle-tested coordination service, historically very common (e.g., original Kafka coordination)  |
| **Kubernetes DNS / Services** | Built-in service discovery via DNS for anything running in a Kubernetes cluster                          |
| **Eureka** (Netflix)          | Popular in the Spring Cloud / Java microservices ecosystem                                               |

## Service Registration — How Instances Get Into the Registry

### Self-Registration

Each service instance registers itself with the registry on startup, and deregisters (or lets its registration expire) on shutdown.

```js
// Conceptual self-registration on startup
async function registerService() {
  await serviceRegistry.register({
    name: "order-service",
    host: process.env.HOST,
    port: process.env.PORT,
    healthCheckUrl: "/health",
  });
}

process.on("SIGTERM", async () => {
  await serviceRegistry.deregister("order-service", instanceId);
  process.exit(0);
});
```

### Third-Party Registration

An external agent/orchestrator (like Kubernetes itself) monitors instances and registers/deregisters them on the service's behalf — the service itself has no awareness of the registry at all.

```
Kubernetes automatically tracks pod lifecycle and updates internal DNS/service records
-> individual application pods don't need any registration code themselves
```

Third-party registration (common with Kubernetes) is generally preferred in modern cloud-native environments, since it removes discovery concerns entirely from application code.

## Health Checking — Keeping the Registry Accurate

A registry is only useful if it reflects reality — unhealthy instances must be detected and removed promptly, or requests will keep being routed to dead/broken instances.

```js
app.get("/health", async (req, res) => {
  const dbOk = await checkDbConnection();
  res.status(dbOk ? 200 : 503).json({ status: dbOk ? "healthy" : "unhealthy" });
});
```

```
Registry periodically polls each registered instance's health endpoint
  -> instance responds 200 OK -> stays in the registry, eligible for traffic
  -> instance fails to respond (or responds unhealthy) -> removed from the registry after a threshold
```

## DNS-Based Service Discovery

A simple, widely-supported approach: use DNS itself as the discovery mechanism, where a service name resolves to the current healthy instance(s).

```
order-service.internal  -> DNS resolves to the current healthy instance IP(s)
```

Kubernetes uses this pattern extensively — every Service object gets a stable DNS name that resolves correctly even as the underlying pods change.

```js
// Application code just uses the stable DNS name — no discovery library needed
const response = await fetch(
  "http://order-service.default.svc.cluster.local/orders",
);
```

**Trade-off:** DNS has caching/TTL behavior that can introduce a delay before clients notice an instance has become unhealthy or a new one has come online, compared to a purpose-built registry with real-time push updates.

## Service Discovery in Kubernetes (A Concrete, Widely-Used Example)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  selector:
    app: order-service
  ports:
    - port: 80
      targetPort: 8080
```

Kubernetes automatically:

1. Tracks all Pods matching the `app: order-service` label.
2. Creates a stable DNS name (`order-service.default.svc.cluster.local`) and virtual IP for the Service.
3. Load-balances traffic to that Service across all currently-healthy matching Pods.
4. Updates routing automatically as Pods are created, destroyed, or fail health checks.

This is server-side discovery, DNS-based, with third-party (Kubernetes-managed) registration — combining several of the patterns above into Kubernetes' built-in networking model.

## Common Interview-Style Questions

- **What problem does service discovery solve?**
  It allows services in a dynamic environment (where instances are frequently created, destroyed, or moved) to find each other's current network location without hardcoding addresses that would quickly become stale.

- **What's the difference between client-side and server-side service discovery?**
  In client-side discovery, the calling service queries a registry directly and chooses an instance itself; in server-side discovery, the caller sends requests to a stable load balancer address, which internally handles querying the registry and routing to a healthy instance — client-side avoids an extra network hop but requires discovery logic in every client, while server-side centralizes that logic at the cost of an additional hop.

- **What's the difference between self-registration and third-party registration?**
  Self-registration means each service instance registers/deregisters itself with the registry directly; third-party registration means an external system (like Kubernetes) tracks instance lifecycle and manages registration on the service's behalf, removing discovery-related code from the application entirely.

- **Why is health checking a critical part of service discovery?**
  Without it, the registry could keep routing traffic to instances that have crashed or become unhealthy, since nothing would detect and remove them — health checks ensure the registry accurately reflects which instances are actually able to serve traffic.

- **What's a trade-off of using DNS as a service discovery mechanism compared to a purpose-built service registry?**
  DNS caching and TTL behavior can introduce a delay before clients notice an instance has gone down or a new one has come online, whereas a purpose-built registry can often push updates more immediately — DNS-based discovery is simpler and widely supported, but less real-time.
