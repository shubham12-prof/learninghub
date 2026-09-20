# 05. Load Balancers

## What is a Load Balancer?

A load balancer distributes incoming network traffic across multiple backend servers, ensuring no single server becomes overwhelmed, enabling horizontal scaling, and improving fault tolerance (if one server fails, traffic is automatically routed to the remaining healthy ones).

```
                  ┌──────────────┐
Clients  ------>  │ Load Balancer │
                  └───────┬───────┘
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
     Server A          Server B          Server C
```

> This module covers load balancers specifically within the context of a broader scaling strategy. For a deeper dive into algorithms, Layer 4 vs Layer 7 distinctions, and sticky sessions, see the Distributed Systems module's dedicated Load Balancing notes — this file focuses on the practical role load balancers play as part of a scaling architecture.

## Why Load Balancers Are Essential for Horizontal Scaling

Horizontal scaling (covered in its own notes) means running multiple instances of your application — but clients need a single, stable entry point to reach whichever instance should handle their request. The load balancer is that entry point, making the underlying fleet of instances appear as one unified service to the outside world.

```
Without a load balancer: clients would need to know about and choose between
                          many individual server addresses themselves — unmanageable
                          and breaks the moment any instance's address changes

With a load balancer: clients only ever need ONE stable address (the load balancer's);
                       everything about the underlying fleet is abstracted away
```

## Types of Load Balancers by Deployment Model

### 1. Hardware Load Balancers

Physical, dedicated appliances (e.g., F5 BIG-IP) — historically common in traditional data centers, less common now given the flexibility and cost-effectiveness of software/cloud alternatives.

### 2. Software Load Balancers

Software running on general-purpose servers (Nginx, HAProxy, Envoy) — flexible, cost-effective, widely used in both traditional and cloud/containerized deployments.

### 3. Cloud/Managed Load Balancers

Fully-managed services provided by cloud platforms, requiring no infrastructure management.

```
AWS: Application Load Balancer (ALB, Layer 7), Network Load Balancer (NLB, Layer 4)
GCP: Cloud Load Balancing
Azure: Azure Load Balancer / Application Gateway
```

```bash
# Conceptual AWS ALB setup via CLI
aws elbv2 create-load-balancer \
  --name my-app-lb \
  --subnets subnet-abc subnet-def \
  --security-groups sg-123
```

## Health Checks — The Foundation of Reliable Load Balancing

A load balancer must continuously verify backend health to avoid routing traffic to dead/broken instances.

```js
// Application-level health check endpoint
app.get("/health", async (req, res) => {
  const dbHealthy = await checkDatabase();
  const cacheHealthy = await checkCache();

  if (dbHealthy && cacheHealthy) {
    res.status(200).json({ status: "healthy" });
  } else {
    res.status(503).json({ status: "unhealthy" });
  }
});
```

```
Load balancer health check configuration:
  - Path: /health
  - Interval: check every 10 seconds
  - Unhealthy threshold: 3 consecutive failures -> remove from rotation
  - Healthy threshold: 2 consecutive successes -> add back to rotation
```

## Load Balancers Enable Zero-Downtime Deployments

Because a load balancer can selectively route traffic away from specific instances, it becomes the mechanism enabling safe, zero-downtime deployment strategies.

### Rolling Deployment

```
1. Take Instance A out of rotation (load balancer stops sending it traffic)
2. Deploy the new version to Instance A
3. Health check passes -> add Instance A back to rotation
4. Repeat for Instance B, C, ... one at a time
   (at every point, MOST instances remain available and serving traffic)
```

### Blue-Green Deployment

```
"Blue" environment: currently live, serving 100% of traffic (old version)
"Green" environment: new version, fully deployed but NOT yet receiving traffic

Once Green is verified healthy:
  -> Load balancer instantly switches ALL traffic from Blue to Green
  -> Blue is kept briefly as an instant rollback option if issues appear
```

### Canary Deployment

```
Load balancer routes a SMALL percentage of traffic (e.g., 5%) to the new version
  -> monitor for errors/issues
  -> if healthy, gradually increase the percentage until 100% of traffic is on the new version
  -> if problems appear, roll back by routing 100% back to the old version
```

## Load Balancers as Part of a Complete Scaling Architecture

```
                     DNS (routes to nearest region)
                              │
                              ▼
                    Global Load Balancer
                              │
                  ┌───────────┴───────────┐
                  ▼                       ▼
          Regional LB (US)         Regional LB (EU)
                  │                       │
        ┌─────────┼─────────┐   ┌─────────┼─────────┐
        ▼         ▼         ▼   ▼         ▼         ▼
     App A     App B     App C  App A   App B     App C
    (US instances, auto-scaled) (EU instances, auto-scaled)
```

## Load Balancer Configuration for a Typical Web Application

```nginx
upstream app_servers {
  least_conn; # route to the server with the fewest active connections
  server app1.internal:3000;
  server app2.internal:3000;
  server app3.internal:3000;
}

server {
  listen 80;

  location /health-lb {
    return 200 'OK';
  }

  location / {
    proxy_pass http://app_servers;
    proxy_next_upstream error timeout http_502 http_503; # automatically retry a different server on failure
  }
}
```

## Load Balancers and Auto Scaling — Working Together

Load balancers and auto scaling groups are typically configured together: as auto scaling adds/removes instances in response to demand, the load balancer automatically detects and adjusts its target pool (full detail in the dedicated Auto Scaling notes).

```
Auto Scaling Group launches a new instance
        │
        ▼
New instance registers with the Load Balancer
        │
        ▼
Load balancer begins health-checking it
        │
        ▼
Once healthy, it starts receiving traffic automatically
```

## Common Interview-Style Questions

- **Why is a load balancer essential for horizontal scaling, beyond just "distributing traffic"?**
  It provides clients a single, stable entry point regardless of how many backend instances exist or how they change over time, abstracting away the entire underlying fleet — without it, clients would need direct knowledge of every individual instance's address, which breaks the moment instances are added, removed, or replaced.

- **How do load balancers enable zero-downtime deployments?**
  By selectively routing traffic away from specific instances during a rolling deployment (ensuring most instances remain available at all times), or by instantly switching all traffic between two fully-deployed environments in a blue-green deployment, or by gradually shifting a small percentage of traffic in a canary deployment to validate a new version safely before a full rollout.

- **What role do health checks play in a load balancer's operation?**
  They continuously verify that each backend instance is actually able to serve traffic, automatically removing unhealthy instances from the routing pool (preventing failed requests) and automatically re-adding them once they recover.

- **How do load balancers and auto scaling typically work together?**
  As an auto scaling group adds or removes instances based on demand, newly launched instances automatically register with the load balancer and begin receiving traffic once they pass health checks, while terminated instances are automatically removed from the routing pool — the two systems are designed to integrate seamlessly.

- **What's the difference between a rolling deployment and a blue-green deployment, from a load balancer's perspective?**
  A rolling deployment gradually updates and re-registers instances within the same pool one at a time, with the load balancer continuously adjusting which instances receive traffic throughout the process; a blue-green deployment maintains two entirely separate, fully-deployed instance pools, with the load balancer performing an instant, complete traffic switch from one pool to the other.
