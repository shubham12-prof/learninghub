# 08. Load Balancing

## What is Load Balancing?

Load balancing distributes incoming requests across multiple server instances, so no single instance becomes a bottleneck or single point of failure, while also enabling horizontal scaling (adding more instances to handle more traffic).

```
                  ┌──────────────┐
Clients  ------>  │ Load Balancer │
                  └───────┬───────┘
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
     Server A          Server B          Server C
```

## Layer 4 vs Layer 7 Load Balancing

|                            | Layer 4 (Transport)                              | Layer 7 (Application)                                                      |
| -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| Operates on                | IP address + TCP/UDP port                        | Full HTTP request (headers, path, cookies, body)                           |
| Routing decisions based on | Connection-level info only                       | Content-aware — can route by URL path, header, cookie, etc.                |
| Performance                | Faster, lower overhead                           | Slightly higher overhead, but far more flexible                            |
| Example use case           | Generic TCP load balancing, database connections | HTTP API routing, path-based microservice routing, A/B testing via headers |

```
Layer 4 example: route based purely on IP/port — can't see it's HTTP at all
Layer 7 example: route /api/orders/* to the Order Service,
                  /api/users/* to the User Service,
                  all based on inspecting the actual HTTP request
```

## Load Balancing Algorithms

### Round Robin

Requests are distributed sequentially across the pool of servers, cycling back to the start.

```
Request 1 -> Server A
Request 2 -> Server B
Request 3 -> Server C
Request 4 -> Server A  (cycle repeats)
```

**Good for:** roughly uniform servers and roughly uniform request costs.
**Weakness:** doesn't account for current server load — a slow/overloaded server still gets its "turn."

### Weighted Round Robin

Like round robin, but servers with more capacity receive a proportionally larger share of requests.

```
Server A (weight 3): gets 3 requests per cycle
Server B (weight 1): gets 1 request per cycle
```

Useful when the server pool is heterogeneous (some more powerful than others).

### Least Connections

Routes each new request to whichever server currently has the fewest active connections.

```
Server A: 12 active connections
Server B: 5 active connections   <- next request goes here
Server C: 20 active connections
```

**Good for:** workloads where request processing time varies significantly (round robin could otherwise pile up slow requests on one server).

### Least Response Time

Similar to least connections, but also factors in each server's recent average response time — routes to the server that's both lightly loaded AND currently fast.

### IP Hash

Routes based on a hash of the client's IP address, ensuring a given client consistently reaches the same backend server (a simple form of session affinity/stickiness).

```
backend = hash(client_ip) % number_of_servers
```

**Good for:** maintaining session affinity without needing a shared session store (though a shared store, as covered in the Redis session notes, is generally the more robust modern solution).

### Consistent Hashing

A more sophisticated hashing approach (covered in the Sharding notes) that minimizes redistribution when servers are added/removed from the pool — commonly used for cache load balancing where cache locality matters.

## Health Checks — Critical to Effective Load Balancing

A load balancer must know which backend instances are actually healthy, or it will keep routing traffic to dead/broken servers.

```
Load Balancer periodically sends a health check request (e.g., GET /health) to each backend
  -> 200 OK response -> server stays in the active rotation
  -> failed/timeout response -> server temporarily removed from rotation
  -> server recovers and passes health checks again -> automatically re-added
```

```js
app.get("/health", (req, res) => {
  const isHealthy = checkDependencies(); // DB connection, critical downstream services, etc.
  res.status(isHealthy ? 200 : 503).send();
});
```

## Sticky Sessions (Session Affinity)

Ensures all requests from a specific client are routed to the same backend server — needed for stateful protocols/applications that store session data in-memory on a specific server (rather than in a shared store like Redis).

```
Client's first request -> routed to Server B, load balancer remembers this (via cookie or IP hash)
All subsequent requests from that client -> ALSO routed to Server B
```

```nginx
# nginx example — cookie-based sticky sessions
upstream backend {
  server backend1.example.com;
  server backend2.example.com;
  sticky cookie srv_id expires=1h;
}
```

**Trade-off:** sticky sessions complicate scaling/failover (if that specific server goes down, that client's session data is lost unless it's also replicated elsewhere) — as covered in the Redis Session Store notes, using a shared external session store is generally preferred over relying on sticky sessions for statefulness.

## Global (Multi-Region) Load Balancing — DNS-Based

For routing traffic across geographically distributed data centers/regions, load balancing often happens at the DNS level, directing users to their nearest (or otherwise optimal) region.

```
DNS query for "api.example.com" from a user in Europe -> resolves to the EU region's load balancer IP
DNS query for "api.example.com" from a user in the US -> resolves to the US region's load balancer IP
```

This combines with regional load balancers (which then distribute within that region across individual server instances) to form a two-tier load balancing architecture common in large-scale global systems.

## Load Balancers as Part of a Broader Architecture

```
Global DNS Load Balancing (routes to nearest region)
         │
         ▼
Regional Load Balancer (Layer 7, routes by path/host to the right service)
         │
    ┌────┴────┐
    ▼         ▼
Service A   Service B    (each with its own internal load balancer/service discovery,
 instances   instances    as covered in the Service Discovery notes)
```

## Common Load Balancer Software/Services

| Tool                                            | Type                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Nginx**                                       | Software, widely used for both Layer 4 and Layer 7                                    |
| **HAProxy**                                     | Software, high-performance, popular for Layer 4/7 load balancing                      |
| **AWS Elastic Load Balancer (ALB/NLB)**         | Managed cloud service — ALB is Layer 7, NLB is Layer 4                                |
| **Kubernetes Service (ClusterIP/LoadBalancer)** | Built-in load balancing for traffic within/into a cluster                             |
| **Envoy**                                       | Modern, feature-rich proxy, commonly used in service mesh architectures (e.g., Istio) |

## Common Interview-Style Questions

- **What's the difference between Layer 4 and Layer 7 load balancing?**
  Layer 4 makes routing decisions based only on connection-level information (IP address, TCP/UDP port), offering lower overhead; Layer 7 inspects the full application-level request (HTTP headers, path, cookies), enabling much more flexible, content-aware routing at a slightly higher performance cost.

- **What's the weakness of round robin load balancing compared to least connections?**
  Round robin distributes requests purely by sequence, without considering current server load — a server handling a slow or resource-intensive request still receives its "turn" for the next request; least connections actively routes new requests to whichever server currently has the fewest active connections, better handling workloads with variable request processing time.

- **Why are health checks essential for a load balancer?**
  Without them, a load balancer has no way of knowing an instance has crashed or become unhealthy, and would keep routing traffic to it, causing failed requests; health checks let the load balancer automatically remove unhealthy instances from rotation and re-add them once they recover.

- **What are sticky sessions, and what's their main drawback?**
  A mechanism ensuring all requests from a specific client are routed to the same backend server, needed when session state is stored in-memory on a specific server; the drawback is it complicates scaling and failover, since losing that specific server also loses that client's session data unless it's separately replicated — a shared external session store (like Redis) is generally a more robust solution.

- **How does global (multi-region) load balancing typically work at a high level?**
  Often implemented at the DNS level, where a query for a service's hostname resolves to the IP of the load balancer in the region nearest (or otherwise most appropriate for) the requesting user; this combines with a regional load balancer that then distributes traffic within that region across individual service instances, forming a two-tier architecture.
