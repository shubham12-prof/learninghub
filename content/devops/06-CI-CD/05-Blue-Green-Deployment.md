# 05. Blue-Green Deployment

## What is Blue-Green Deployment?

Blue-green deployment maintains **two complete, identical production environments** — "Blue" (currently live, serving all traffic) and "Green" (the new version, fully deployed but not yet receiving traffic). Once Green is verified healthy, traffic is switched from Blue to Green **all at once** — making both the deployment and any potential rollback essentially instantaneous.

```
Before switch:
  Blue (v1.9)  <---- ALL traffic
  Green (v2.0)    (fully deployed, idle, being verified)

After switch:
  Blue (v1.9)     (idle, kept as an instant rollback option)
  Green (v2.0)  <---- ALL traffic
```

## The Blue-Green Deployment Process

```
1. Blue (current version) is live, serving 100% of production traffic
2. Deploy the new version to Green — a COMPLETE, separate environment
3. Run smoke tests / health checks against Green (WITHOUT exposing it to real users yet)
4. Switch the router/load balancer to send ALL traffic to Green
5. Blue is now idle — keep it running for a period as an instant rollback option
6. Once confident Green is stable, Blue can be decommissioned (or repurposed as
   the target for the NEXT deployment, becoming the new "idle" environment)
```

## Implementing Blue-Green with Kubernetes

```yaml
# Blue deployment (currently live)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
      version: blue
  template:
    metadata:
      labels:
        app: my-app
        version: blue
    spec:
      containers:
        - name: my-app
          image: myapp:1.9
```

```yaml
# Green deployment (new version, deployed alongside Blue)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
      version: green
  template:
    metadata:
      labels:
        app: my-app
        version: green
    spec:
      containers:
        - name: my-app
          image: myapp:2.0
```

```yaml
# The Service's selector determines which version receives traffic
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
    version: blue # <-- change this to "green" to switch ALL traffic instantly
  ports:
    - port: 80
      targetPort: 3000
```

```bash
# The actual "switch" — a single, near-instant command
kubectl patch service my-app-service -p '{"spec":{"selector":{"version":"green"}}}'
```

This is the core mechanic: the Service's label selector is what actually routes traffic, and changing that single selector value is the entire "deployment" moment — both Blue and Green are already fully running beforehand.

## Implementing Blue-Green at the DNS/Load Balancer Level (Cloud Example)

```
Blue environment:  blue.internal.example.com  (behind Target Group A)
Green environment:  green.internal.example.com  (behind Target Group B)

Production Load Balancer: currently routes public traffic -> Target Group A (Blue)

Switch: update the Load Balancer's routing rule -> Target Group B (Green)
        (a single configuration change, typically completing in seconds)
```

Cloud provider load balancers (AWS ALB target group weights, GCP/Azure equivalents) commonly implement this pattern for infrastructure not running on Kubernetes.

## Advantages of Blue-Green Deployment

- **Instant rollback** — since Blue never stopped running, reverting is just switching the router back, no redeployment needed (full detail in the Rollbacks notes).
- **Zero downtime** — the switch itself is effectively instantaneous, with no window where the application is unavailable.
- **Full pre-production validation** — Green can be thoroughly tested against real production infrastructure/scale before ever receiving real user traffic.
- **Simplicity of the traffic model** — unlike canary deployments, there's no partial/gradual traffic split to reason about; it's either 100% Blue or 100% Green.

## Disadvantages and Challenges

### Double the Infrastructure Cost (Temporarily)

Running two complete production environments simultaneously (even briefly) means roughly double the infrastructure footprint during the transition — a real cost consideration, especially for large/expensive infrastructure.

### Database and Stateful Data Challenges

The hardest part of blue-green deployment in practice: if Blue and Green share the same database, schema changes must be carefully managed so **both** versions can function correctly against it during the transition (the same backward-compatibility principle covered in the Deployment Pipeline and Rollbacks notes) — you can't simply "blue-green" the database itself as easily as stateless application servers.

```
If Green's new code requires a schema change:
  -> the migration must be backward-compatible, since Blue might still need to
     work correctly against the SAME database during the transition/rollback window
```

### All-or-Nothing Traffic Switch — No Gradual Validation Under Real Load

Unlike canary deployments (covered in the next notes), blue-green doesn't provide a way to validate the new version against a small slice of _real_ production traffic before fully committing — the switch is instant and total, so any issue that only manifests under genuine production load/traffic patterns is discovered immediately at full scale, rather than being caught early on a small percentage of traffic.

## Blue-Green vs Rolling Update — Key Differences

|                                    | Blue-Green                                                                        | Rolling Update                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Infrastructure during transition   | 2x (both environments fully running)                                              | ~1x (gradual replace, brief slight overhead)                                       |
| Rollback speed                     | Instant (switch back)                                                             | Requires reversing the gradual replacement process                                 |
| Traffic switch                     | All-at-once                                                                       | Gradual                                                                            |
| Database compatibility requirement | Both versions must work simultaneously during the (often brief) transition window | Both versions must work simultaneously throughout the (potentially longer) rollout |
| Complexity                         | Moderate (managing two full environments + the switch mechanism)                  | Lower (built into Kubernetes Deployments by default)                               |

## When Blue-Green Makes the Most Sense

- Applications where instant rollback capability is a top priority (high-stakes, customer-facing critical systems).
- Situations where you want full validation of the new version's infrastructure/configuration before any real traffic hits it.
- Teams with sufficient infrastructure budget/tooling to comfortably run duplicate environments, even temporarily.

## Common Interview-Style Questions

- **What is blue-green deployment, and what's the core mechanism that makes the "switch" happen?**
  Maintaining two complete, identical environments (Blue = currently live, Green = new version); the switch happens by redirecting traffic routing (via a load balancer, Service selector, or DNS change) from Blue to Green all at once, rather than gradually replacing running instances.

- **Why does blue-green deployment provide such fast rollback compared to other deployment strategies?**
  Because the previous version (Blue) never actually stopped running during the transition — it's simply idle after the switch — so "rolling back" just means switching traffic routing back to it, with no need to redeploy or recreate anything.

- **What's the biggest practical challenge with blue-green deployment when a database is involved?**
  If both environments share the same database, any schema changes must remain backward-compatible so that both the old (Blue) and new (Green) application versions can function correctly against it during the transition/rollback window — you can't simply duplicate a stateful database the way you can duplicate stateless application servers.

- **What's a downside of blue-green's "all-at-once" traffic switch compared to a gradual approach like canary deployment?**
  It doesn't provide a way to validate the new version against a small slice of real production traffic before fully committing — any issue that only manifests under genuine production load or traffic patterns is discovered immediately at full scale, rather than being caught early while affecting only a small percentage of users.

- **Why does blue-green deployment temporarily require roughly double the infrastructure?**
  Because both the old (Blue) and new (Green) environments must be fully running and production-capable simultaneously during the transition period, unlike a rolling update which only maintains a slight, gradual overhead as instances are incrementally replaced.
