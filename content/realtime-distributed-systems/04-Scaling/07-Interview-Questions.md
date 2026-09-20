# 07. Interview Questions — Scaling (Comprehensive)

A consolidated set of commonly asked scaling interview questions, organized by topic, with concise answers and code where useful.

---

## Vertical Scaling

**Q: What is vertical scaling, and why is it often the first step?**
Increasing a single machine's resources (CPU, RAM, disk); it's the simplest first step since it requires no architectural or code changes.

**Q: What's the fundamental limitation of vertical scaling?**
There's a maximum available machine size — once reached, no further vertical scaling is possible regardless of budget, making horizontal scaling the only remaining path.

**Q: Why are databases often vertically scaled before being sharded?**
Horizontally scaling a database (sharding, distributed consensus) is significantly more complex than scaling stateless app servers; vertical scaling (plus read replicas) can handle substantial growth with far less complexity, deferring sharding until genuinely necessary.

**Q: Does vertical scaling solve the single-point-of-failure problem?**
No — a bigger single machine is still one machine, remaining a single point of failure regardless of capacity.

---

## Horizontal Scaling

**Q: What's the key requirement for horizontal scaling of application servers to work cleanly?**
Statelessness — any instance must be able to handle any request, requiring session/state data to live in a shared external store rather than in-process memory.

**Q: Why is horizontally scaling a database harder than horizontally scaling app servers?**
A database is inherently stateful (its entire purpose is storing data), requiring sharding and/or replication with careful consistency handling, unlike stateless app servers that can simply be duplicated.

**Q: What problem do distributed locks solve in horizontally-scaled environments?**
Ensuring tasks meant to run exactly once (like a scheduled job) don't run redundantly on every instance simultaneously.

**Q: How does auto scaling relate to horizontal scaling?**
Auto scaling is the automated mechanism for adding/removing instances (horizontal scaling) based on real-time demand.

---

## CDN

**Q: What problem does a CDN primarily solve?**
Latency caused by requests traveling long physical distances to a single origin server, by caching/serving content from edge locations near users, while also offloading origin traffic.

**Q: `max-age` vs `s-maxage`?**
`max-age` applies to any cache including browsers; `s-maxage` specifically targets shared caches like CDNs, allowing a different cache duration for the CDN layer.

**Q: Why prefer content-hashed filenames over manual cache purging?**
It avoids the invalidation problem entirely — a content change produces a new URL, so there's never stale content at a given cached URL, enabling very long safe cache lifetimes.

**Q: What is edge compute?**
Running actual application logic at CDN edge locations (not just serving cached files), enabling routing/auth/A-B testing decisions to happen close to the user before reaching the origin.

---

## Reverse Proxy

**Q: Reverse proxy vs forward proxy?**
A reverse proxy sits in front of servers, acting on the server's behalf and hiding backend architecture; a forward proxy sits in front of clients, acting on the client's behalf.

**Q: Why terminate SSL/TLS at a reverse proxy instead of each backend server?**
Centralizes certificate management, offloads encryption/decryption CPU cost from app servers, and lets backends communicate over simpler plain HTTP internally.

**Q: Why is `trust proxy` needed for an app behind a reverse proxy?**
Without it, the app only sees the proxy's local connection, losing visibility into the real client IP/protocol; `trust proxy` reads this from `X-Forwarded-*` headers the proxy adds.

**Q: Reverse proxy vs load balancer vs API gateway?**
Overlapping concepts often implemented by the same software; reverse proxy is the general-purpose category, load balancer specifically distributes traffic across instances, API gateway focuses on API-level concerns (auth, rate limiting, transformation).

---

## Load Balancers

**Q: Why is a load balancer essential for horizontal scaling?**
It provides a single, stable client-facing entry point regardless of how many backend instances exist or change, abstracting the fleet away from clients.

**Q: How do load balancers enable zero-downtime deployments?**
By selectively routing traffic away from instances during rolling deployments, instantly switching all traffic in blue-green deployments, or gradually shifting a percentage of traffic in canary deployments.

**Q: What role do health checks play?**
Continuously verifying backend instance health, automatically removing unhealthy instances from rotation and re-adding them once recovered.

**Q: How do load balancers and auto scaling work together?**
Newly launched instances automatically register with the load balancer and receive traffic once healthy; terminated instances are automatically removed — the systems integrate seamlessly.

---

## Auto Scaling

**Q: Target tracking vs step scaling vs scheduled scaling?**
Target tracking maintains a specified metric value automatically (like a thermostat); step scaling applies explicit tiered rules based on thresholds; scheduled scaling proactively adjusts capacity at known predictable times.

**Q: Why is a cooldown period important?**
Prevents "thrashing" — rapid repeated scaling actions triggered by a metric that hasn't stabilized yet after a previous scaling event.

**Q: Why do systems often scale out faster than they scale in?**
Under-provisioning (poor UX, failed requests) is generally costlier than briefly over-provisioning (modest wasted spend), so the asymmetric response reflects that asymmetric risk.

**Q: What's a common bottleneck undermined by auto-scaled app servers?**
Database connection limits — many instances' combined connection pools can exceed the database's max connections, mitigated with a pooling proxy like PgBouncer.

---

## Practical / Coding Questions Often Asked Live

**Q: Configure an Nginx reverse proxy with load balancing and health-aware failover.**

```nginx
upstream app_servers {
  least_conn;
  server app1.internal:3000;
  server app2.internal:3000;
  server app3.internal:3000;
}

server {
  listen 443 ssl;
  location / {
    proxy_pass http://app_servers;
    proxy_next_upstream error timeout http_502 http_503;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

**Q: Configure a Kubernetes HPA to scale a service between 3 and 50 replicas based on CPU.**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 3
  maxReplicas: 50
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
```

**Q: Design a scaling strategy for a new web application expecting rapid, unpredictable growth.**
Start with vertical scaling for the database (simplicity while establishing baseline load patterns) plus read replicas for read scaling; make application servers stateless from day one (externalize sessions to Redis) so they can be horizontally scaled behind a load balancer with auto scaling configured on CPU/request-rate metrics; serve static assets via a CDN with content-hashed filenames; introduce sharding only once the database's vertical/read-replica capacity is genuinely insufficient.

**Q: How would you diagnose a production incident where auto scaling added many new instances but the application is still slow?**
Check whether a downstream dependency (database connections, a third-party API, a shared cache) has become the actual bottleneck rather than application server CPU/memory — since scaling app servers doesn't automatically scale everything they depend on; check database connection pool exhaustion specifically, as it's a very common culprit when many new instances come online simultaneously.

**Q: How would you implement a canary deployment using a load balancer?**
Deploy the new version to a small subset of instances (or a separate small instance group) alongside the existing stable version; configure the load balancer to route a small percentage (e.g., 5%) of traffic to the new version while monitoring error rates/latency; gradually increase that percentage if healthy, or immediately route 100% back to the stable version if problems are detected.
