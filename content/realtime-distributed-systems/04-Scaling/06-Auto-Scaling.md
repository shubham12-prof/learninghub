# 06. Auto Scaling

## What is Auto Scaling?

Auto scaling automatically adjusts the number of running application instances in response to real-time demand — adding instances when traffic/load increases, and removing them when it decreases — without requiring manual intervention. It's the operational automation layer that makes horizontal scaling practical at real-world scale.

```
Traffic is low at 3 AM  -> Auto scaling reduces instance count -> saves cost
Traffic spikes at noon   -> Auto scaling adds instances automatically -> maintains performance
```

## Why Manual Scaling Doesn't Work Well

- **Traffic patterns aren't always predictable** — sudden spikes (a viral post, a flash sale, a news event) can happen faster than a human can react.
- **Cost efficiency** — running peak capacity 24/7 wastes money during low-traffic periods; auto scaling matches capacity to actual demand.
- **Operational burden** — manually monitoring and adjusting capacity around the clock isn't sustainable at scale.

## Core Components of Auto Scaling

### 1. Scaling Metrics — What Triggers a Scaling Decision

```
CPU utilization        -> scale out if average CPU > 70% for 5 minutes
Memory utilization       -> scale out if average memory > 80%
Request count/latency     -> scale out if requests per instance exceed a threshold
Queue depth (for workers)  -> scale out if a job queue's backlog grows beyond a threshold
Custom application metrics  -> scale based on business-specific signals (e.g., active WebSocket connections)
```

### 2. Scaling Policies — How Scaling Decisions Are Made

```
Target Tracking:  "keep average CPU utilization at 50%" — the system automatically
                   adds/removes instances to maintain this target, similar to a thermostat

Step Scaling:      define explicit rules, e.g.:
                    "if CPU > 70%, add 2 instances"
                    "if CPU > 90%, add 5 instances"
                    "if CPU < 30%, remove 1 instance"

Scheduled Scaling: scale based on KNOWN, predictable patterns
                    (e.g., "scale up every weekday at 8 AM before business hours begin,
                     scale down every night at 10 PM")
```

## Example: AWS Auto Scaling Group Configuration (Conceptual)

```bash
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name my-app-asg \
  --min-size 2 \
  --max-size 20 \
  --desired-capacity 4 \
  --target-group-arns arn:aws:elasticloadbalancing:...

aws autoscaling put-scaling-policy \
  --auto-scaling-group-name my-app-asg \
  --policy-name cpu-target-tracking \
  --policy-type TargetTrackingScaling \
  --target-tracking-configuration '{
    "TargetValue": 50.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ASGAverageCPUUtilization"
    }
  }'
```

## Auto Scaling in Kubernetes — Horizontal Pod Autoscaler (HPA)

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

```bash
kubectl get hpa  # monitor current scaling status
```

Kubernetes also supports scaling based on custom metrics (via the Custom Metrics API) — e.g., scaling based on queue depth or requests-per-second rather than just CPU/memory.

## Minimum and Maximum Bounds — Critical Safety Rails

```
minSize: 2    <- never scale below this, ensures baseline availability/redundancy even during quiet periods
maxSize: 50   <- never scale above this, protects against runaway costs from a scaling misconfiguration
                 or a metric feedback loop gone wrong
```

Setting sensible min/max bounds is a critical safety practice — without a maximum, a misbehaving metric (or an attack designed to trigger excessive scaling) could spin up an enormous, extremely costly number of instances.

## Cooldown Periods — Preventing Scaling Thrashing

After a scaling action, a cooldown period prevents another scaling decision from firing immediately, giving the system time to stabilize and for new instances to actually start handling load before reassessing.

```
Scale-out event at T=0 (add 3 instances)
Cooldown period: 300 seconds
  -> during this window, no NEW scaling decisions are made,
     even if the metric still looks elevated (the new instances need time to start absorbing load)
```

Without cooldowns, a system could "thrash" — rapidly scaling up and down repeatedly as it reacts to noisy, still-settling metrics, wasting resources and potentially destabilizing the service.

## Scale-Out vs Scale-In Asymmetry (Common Best Practice)

Many production configurations scale out (add capacity) **aggressively/quickly** but scale in (remove capacity) **conservatively/slowly** — the cost of under-provisioning (poor user experience, failed requests) is usually worse than the cost of briefly over-provisioning (slightly wasted spend).

```
Scale-out: react quickly to rising load — e.g., add instances within 1-2 minutes of exceeding threshold
Scale-in:  wait longer before removing instances — e.g., only scale in after 15 minutes of sustained low load,
           to avoid prematurely removing capacity right before another spike
```

## Predictive / Proactive Scaling

Some platforms support predictive scaling — using historical traffic patterns (e.g., machine learning models trained on past demand) to scale **ahead of** anticipated demand, rather than purely reacting after a metric crosses a threshold.

```
Historical pattern: traffic reliably spikes every weekday at 9 AM
Predictive scaling: begins adding instances at 8:45 AM, BEFORE the actual spike hits,
                     so capacity is already in place when demand arrives
                     (rather than reactively scaling AFTER users already experience degraded performance)
```

## Scaling Considerations Beyond Just Application Servers

### Database Connection Limits

Auto-scaled application instances can quickly exhaust a database's maximum connection limit if each instance opens its own connection pool — a common, easy-to-overlook bottleneck.

```
10 app instances × 20 connections each = 200 total connections
                                          -> could exceed the database's configured max_connections
```

Mitigated via connection pooling proxies (like PgBouncer for PostgreSQL) that sit between application instances and the database, multiplexing many application-level connections onto a smaller, more manageable pool of actual database connections.

### Downstream Service Capacity

Scaling out application servers doesn't automatically scale out everything they depend on — a downstream API, third-party service, or shared cache could become the new bottleneck instead, simply shifting where the scaling limit actually lives.

## Cost Optimization Through Auto Scaling

```
Without auto scaling: provision for PEAK capacity 24/7
                       -> wastes significant money during off-peak hours

With auto scaling:    capacity dynamically tracks actual demand
                       -> pay only for what's actually needed at any given moment
```

Combined with spot/preemptible instances (for fault-tolerant, interruptible workloads) or reserved instances (for predictable baseline capacity), auto scaling is a core lever for cloud cost optimization.

## Common Interview-Style Questions

- **What is auto scaling, and why is it preferred over manual capacity management?**
  The automated adjustment of running instance count based on real-time demand; it's preferred because traffic patterns can spike faster than humans can react, manually provisioning for peak capacity 24/7 wastes significant cost during quiet periods, and continuous manual monitoring/adjustment isn't operationally sustainable at scale.

- **What's the difference between target tracking, step scaling, and scheduled scaling?**
  Target tracking automatically maintains a specified metric value (like a thermostat); step scaling applies explicit, tiered rules based on metric thresholds; scheduled scaling proactively adjusts capacity at known, predictable times regardless of real-time metrics.

- **Why is a cooldown period important in auto scaling configuration?**
  It prevents "thrashing" — rapidly repeated scaling actions triggered by a metric that hasn't yet stabilized after a previous scaling event, giving newly added (or removed) capacity time to actually take effect before the next scaling decision is evaluated.

- **Why do many production systems scale out faster than they scale in?**
  Because under-provisioning (leading to degraded performance or failed requests) is generally more costly to the business than briefly over-provisioning (leading to modestly wasted spend) — an asymmetric response reflects that asymmetric risk.

- **What's a common bottleneck that can undermine auto scaling of application servers, and how is it typically mitigated?**
  Database connection limits — as more application instances launch, their combined connection pools can exceed the database's maximum allowed connections; this is typically mitigated with a connection pooling proxy (like PgBouncer) that multiplexes many application-level connections onto a smaller set of actual database connections.
