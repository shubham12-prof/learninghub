# 02. Horizontal Scaling

## What is Horizontal Scaling?

Horizontal scaling ("scaling out") means adding **more machines/instances** to handle increased load, rather than making a single machine bigger. Instead of one powerful server, you run many smaller (often commodity) servers working together, typically coordinated by a load balancer.

```
Vertical:    [1 big server]

Horizontal:  [Server A]  [Server B]  [Server C]  [Server D]
                    all behind a load balancer, sharing the load
```

## Why Horizontal Scaling Is Necessary at Larger Scale

- **No hard ceiling** — theoretically, you can keep adding more machines almost indefinitely (practically limited by cost, architecture complexity, and coordination overhead, but not by "there's no bigger machine available" the way vertical scaling is).
- **Better fault tolerance** — if one instance fails, others continue serving traffic; a single powerful machine failing takes down 100% of capacity, while one of many instances failing takes down a much smaller fraction.
- **Often more cost-efficient at scale** — many commodity machines can be cheaper in aggregate than the largest available single machine, and cloud providers often price the largest instance tiers at a premium.

## The Fundamental Requirement: Statelessness

Horizontal scaling works cleanly when application servers are **stateless** — any instance can handle any request, since no instance holds unique in-memory data another instance lacks.

```
STATEFUL (problematic for horizontal scaling):
  Server A holds User X's session data in memory
  -> if User X's next request goes to Server B, Server B has no idea who they are

STATELESS (horizontal-scaling-friendly):
  All session/state data lives in a SHARED external store (Redis, database)
  -> any server (A, B, C, ...) can handle ANY request, since none of them
     hold unique in-memory state the others lack
```

```js
// Stateless pattern — session data lives in Redis, not in-process memory
app.use(
  session({
    store: new RedisStore({ client: redisClient }), // any server instance can read this
    secret: process.env.SESSION_SECRET,
  }),
);
```

(Full detail on this pattern in the Redis Session Store notes.)

## Load Balancing — Distributing Traffic Across Instances

Horizontal scaling requires something to distribute incoming requests across the pool of instances — this is the load balancer's job (full detail in the dedicated Load Balancers notes).

```
                  ┌──────────────┐
Clients  ------>  │ Load Balancer │
                  └───────┬───────┘
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
     Instance A        Instance B        Instance C
```

## Horizontal Scaling for Application Servers vs Databases

|                             | Application Servers                                 | Databases                                                                            |
| --------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Statelessness               | Usually achievable by design                        | Data itself is inherently stateful — this is the whole point of a database           |
| Horizontal scaling approach | Add more identical instances behind a load balancer | Requires sharding (splitting data) and/or read replicas — significantly more complex |
| Difficulty                  | Relatively straightforward                          | One of the hardest problems in distributed systems                                   |

Scaling stateless application servers horizontally is comparatively easy; horizontally scaling a database (the actual source of truth for data) is a much harder problem, requiring careful handling of consistency, replication, and partitioning (covered in depth in the Distributed Systems module's Sharding and Replication notes).

## Horizontal Scaling and Kafka's Message Ordering

As covered in the Kafka module, horizontal scaling of consumers is only possible up to the partition count of a topic — a direct example of how horizontal scaling requires the underlying system to be architecturally designed to support it (in this case, via partitioning).

## Auto Scaling — Horizontal Scaling Driven Automatically

Rather than manually adding/removing instances, auto scaling automatically adjusts the number of running instances based on real-time demand (full detail in the dedicated Auto Scaling notes).

```
Traffic spikes -> auto scaling adds more instances automatically
Traffic drops  -> auto scaling removes excess instances automatically, saving cost
```

## Horizontal Scaling Challenges

### 1. Session/State Management

Covered above — requires externalizing state to a shared store.

### 2. Sticky Connections for Stateful Protocols

Some protocols (like Socket.IO's HTTP long-polling fallback, covered in the Socket.IO module) require requests from the same client to consistently reach the same instance — solved via sticky sessions at the load balancer level.

### 3. Deployment Complexity

Deploying updates to many instances requires coordination (rolling deployments, blue-green deployments) rather than simply restarting one server.

```
Rolling deployment: update instances one (or a few) at a time,
                     ensuring some instances always remain available
Blue-green deployment: deploy the new version to an entirely separate
                        set of instances, then switch traffic over atomically
```

### 4. Distributed Coordination

Certain tasks (a scheduled cron job, a background cleanup task) shouldn't run on every instance simultaneously — this requires distributed coordination mechanisms (like the distributed locks covered in the Redis module) to ensure exactly one instance performs the task.

```js
// Only one instance should actually run this scheduled job
async function runScheduledCleanup() {
  const lock = await acquireLock("scheduled-cleanup", 60);
  if (!lock) return; // another instance already has it
  try {
    await performCleanup();
  } finally {
    await releaseLock("scheduled-cleanup", lock);
  }
}
```

### 5. Logging and Monitoring Across Many Instances

With many instances, logs/metrics must be aggregated centrally (rather than checking individual server logs), typically via a centralized logging/monitoring stack (ELK, Datadog, CloudWatch, Prometheus/Grafana).

## Horizontal Scaling in Containerized/Orchestrated Environments

Modern horizontal scaling is often managed by container orchestration platforms like Kubernetes, which handle instance scheduling, health checking, and traffic routing (via Services, covered in the Distributed Systems Service Discovery notes) largely automatically.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 5 # horizontally scaled to 5 instances
  selector:
    matchLabels:
      app: order-service
  template:
    spec:
      containers:
        - name: order-service
          image: myregistry/order-service:latest
```

```bash
kubectl scale deployment order-service --replicas=10  # manually scale out to 10 instances
```

## Vertical vs Horizontal — Combined Real-World Approach

Most mature production systems use **both** strategically:

```
Application servers: horizontally scaled (many stateless instances)
Database:             vertically scaled first, with read replicas,
                       sharded only once genuinely necessary
Cache layer (Redis):   often horizontally scaled via clustering once it outgrows a single instance
```

## Common Interview-Style Questions

- **What is horizontal scaling, and how does it differ from vertical scaling?**
  Horizontal scaling adds more machines/instances to handle increased load; vertical scaling increases the resources of a single existing machine — horizontal scaling has no hard ceiling and improves fault tolerance, while vertical scaling is simpler but limited by the largest available machine size.

- **Why is statelessness so important for horizontal scaling of application servers?**
  If instances hold unique in-memory state (like session data), a request routed to a different instance than a previous request from the same client won't have access to that state; externalizing state to a shared store (like Redis) lets any instance handle any request, which is what makes horizontal scaling actually work cleanly.

- **Why is horizontally scaling a database significantly harder than horizontally scaling stateless application servers?**
  A database is inherently stateful — its entire purpose is storing data — so horizontal scaling requires sharding (splitting the actual data across nodes) and/or replication, both of which introduce substantial complexity around consistency, coordination, and data distribution, unlike stateless application servers which can simply be duplicated.

- **What problem do distributed locks solve in a horizontally-scaled environment?**
  Certain tasks (like a scheduled background job) should run exactly once, not on every instance simultaneously; a distributed lock ensures only one instance actually performs the task at a time, even though many identical instances are running the same code.

- **How does auto scaling relate to horizontal scaling?**
  Auto scaling is the automated process of adding or removing instances (horizontal scaling) based on real-time demand, rather than requiring manual intervention to scale up during traffic spikes or scale down during quiet periods to save cost.
