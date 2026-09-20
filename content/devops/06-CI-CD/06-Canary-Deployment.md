# 06. Canary Deployment

## What is Canary Deployment?

Canary deployment gradually rolls out a new version to a **small subset** of production traffic first, monitoring closely for issues, before progressively increasing that percentage until the new version fully replaces the old one. The name comes from "canary in a coal mine" — a small, controlled exposure that reveals problems before they affect everyone.

```
Stage 1:  95% traffic -> v1.9 (stable)     5% traffic -> v2.0 (canary)
             │
        monitor error rates, latency, business metrics
             │
Stage 2:  75% traffic -> v1.9                25% traffic -> v2.0
             │
        continue monitoring...
             │
Stage 3:  0% traffic -> v1.9 (decommissioned)   100% traffic -> v2.0 (fully rolled out)
```

## Why Canary Deployment? — The Core Value Proposition

Even with thorough testing, some issues only manifest under **real production conditions** — genuine traffic patterns, real user behavior, actual scale, edge-case data. Canary deployment limits the "blast radius" of such issues to a small percentage of users/requests, rather than discovering them only after 100% of traffic is affected (as would happen with a blue-green all-at-once switch, or even a fast rolling update).

```
Blue-Green / fast Rolling Update:  issue discovered -> ALREADY affecting 100% of traffic
Canary:                              issue discovered -> only affecting the small canary percentage,
                                       automatically (or manually) rolled back before wider impact
```

## Implementing Canary Deployment with Kubernetes

### Simple Approach — Adjusting Replica Ratios

```yaml
# Stable version — most replicas
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-stable
spec:
  replicas: 9 # 90% of traffic (9 out of 10 total matching pods, roughly, given equal Service load balancing)
  selector:
    matchLabels:
      app: my-app
      track: stable
  template:
    metadata:
      labels:
        app: my-app
        track: stable
    spec:
      containers:
        - name: my-app
          image: myapp:1.9
```

```yaml
# Canary version — fewer replicas
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-canary
spec:
  replicas: 1 # 10% of traffic
  selector:
    matchLabels:
      app: my-app
      track: canary
  template:
    metadata:
      labels:
        app: my-app
        track: canary
    spec:
      containers:
        - name: my-app
          image: myapp:2.0
```

```yaml
# A single Service selects BOTH via the shared "app: my-app" label —
# traffic is distributed roughly proportional to each Deployment's replica count
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app # matches BOTH stable and canary pods
  ports:
    - port: 80
      targetPort: 3000
```

> **Important limitation:** this replica-ratio approach gives only _approximate_ traffic percentages (Kubernetes Services load-balance across all matching Pods roughly evenly, not with precise percentage control) — for genuinely precise traffic splitting, a service mesh or advanced Ingress controller is needed.

### Precise Traffic Splitting — Using a Service Mesh or Advanced Ingress

Tools like Istio, Linkerd, Flagger, or NGINX Ingress's canary annotations provide exact percentage-based traffic splitting, independent of replica counts.

```yaml
# Istio VirtualService example — precise traffic weighting
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app
spec:
  hosts:
    - my-app
  http:
    - route:
        - destination:
            host: my-app
            subset: stable
          weight: 90
        - destination:
            host: my-app
            subset: canary
          weight: 10
```

```yaml
# NGINX Ingress canary annotations
metadata:
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10" # exactly 10% of traffic to this Ingress's backend
```

## Automated Canary Analysis — Progressive Delivery Tools

Manually watching dashboards and deciding when to progress/rollback a canary doesn't scale well. Tools like **Flagger** (often paired with Istio/Linkerd/NGINX) automate the entire progressive rollout, analyzing metrics at each stage and automatically promoting or rolling back.

```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: my-app
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  progressDeadlineSeconds: 60
  analysis:
    interval: 30s
    threshold: 5 # max number of failed metric checks before automatic rollback
    maxWeight: 50 # never exceed 50% canary traffic during automated analysis
    stepWeight: 5 # increase canary traffic by 5% at each successful interval
    metrics:
      - name: request-success-rate
        thresholdRange:
          min: 99 # automatic rollback if success rate drops below 99%
      - name: request-duration
        thresholdRange:
          max: 500 # automatic rollback if p99 latency exceeds 500ms
```

This entirely automates the canary process: Flagger incrementally shifts traffic, continuously checks the defined metrics, and automatically rolls back the moment any threshold is violated — no human needs to be actively watching dashboards for a routine canary rollout to be safe.

## What to Monitor During a Canary Rollout

```
Error rate         -> is the canary version throwing more errors than stable?
Latency               -> is the canary version slower (p50/p95/p99)?
Resource usage           -> is the canary consuming abnormal CPU/memory?
Business metrics             -> conversion rate, checkout completion, etc. — sometimes a change is
                                  technically "healthy" (no errors, normal latency) but still harmful
                                  to actual business outcomes, which only business-level metrics reveal
```

Relying purely on technical health signals (errors, latency) can miss genuinely harmful changes that don't manifest as technical failures — a canary analysis that also considers business/product metrics catches a broader class of problems.

## Canary Deployment vs Blue-Green — Key Trade-offs

|                                    | Canary                                                                    | Blue-Green                                                        |
| ---------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Blast radius of an issue           | Limited to the canary percentage                                          | Full (100% of traffic switches at once)                           |
| Rollback speed                     | Fast, but not instant (traffic shift takes some time either direction)    | Essentially instant (switch back)                                 |
| Infrastructure overhead            | Lower (small canary alongside mostly-stable fleet)                        | Higher (2 complete environments simultaneously)                   |
| Complexity                         | Higher (traffic splitting, metric analysis, progressive stages)           | Lower (binary switch)                                             |
| Real production traffic validation | Yes — genuinely tests against a slice of real traffic before full rollout | No — 100% of traffic hits the new version immediately upon switch |

## Canary Deployment vs A/B Testing — A Common Point of Confusion

```
Canary Deployment:  a DEPLOYMENT/RELIABILITY technique — gradually validate a new version is
                     TECHNICALLY SOUND (no errors, acceptable performance) before full rollout;
                     typically short-lived (hours to days), then the canary either fully replaces
                     stable or is rolled back entirely

A/B Testing:           a PRODUCT/EXPERIMENTATION technique — compare two (or more) variants to
                       determine which performs better against a SPECIFIC BUSINESS METRIC;
                       often runs for a much LONGER period (weeks), and typically both variants
                       are considered "correct"/valid, just being compared
```

They can use similar underlying traffic-splitting infrastructure, but serve fundamentally different purposes — one is about deployment safety, the other about product experimentation.

## Common Interview-Style Questions

- **What is canary deployment, and what specific problem does it solve that thorough pre-production testing doesn't fully address?**
  Gradually rolling out a new version to a small percentage of production traffic first, then progressively increasing it; it addresses issues that only manifest under genuine production conditions (real traffic patterns, actual scale, edge-case data) that pre-production testing environments can't perfectly replicate, limiting the "blast radius" of such issues to a small subset of traffic rather than discovering them after 100% exposure.

- **Why is precise percentage-based traffic splitting hard to achieve with plain Kubernetes Services and replica counts alone?**
  Kubernetes Services load-balance roughly evenly across all matching Pods rather than offering exact percentage-based control, so approximating a traffic split via replica ratios (e.g., 9 stable replicas vs 1 canary replica for ~90/10) is only approximate; genuinely precise traffic splitting requires a service mesh (Istio, Linkerd) or an advanced Ingress controller with dedicated canary/weighting features.

- **What does a tool like Flagger automate in a canary deployment process?**
  The entire progressive rollout — incrementally shifting traffic percentage to the canary version at defined intervals, continuously analyzing specified metrics (error rate, latency) against defined thresholds, and automatically promoting the canary to full rollout on success or automatically rolling it back if a threshold is violated, without requiring a human to actively monitor dashboards.

- **Why might a canary analysis need to consider business metrics, not just technical health signals like error rate and latency?**
  A new version could be technically "healthy" (no errors, normal latency) while still being harmful to actual business outcomes (e.g., a UI change that technically works but reduces checkout conversion) — purely technical monitoring would miss this class of problem, while business-level metrics can catch it.

- **What's the fundamental difference in purpose between canary deployment and A/B testing, even though they can use similar traffic-splitting infrastructure?**
  Canary deployment is a deployment-safety technique validating that a new version is technically sound before fully replacing the old one, typically short-lived with one version ultimately winning entirely; A/B testing is a product-experimentation technique comparing variants against a business metric over a longer period, where both variants are typically considered valid and the comparison itself is the goal, not eventual full replacement of one by the other.
