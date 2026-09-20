# 03. Availability

## What Does "Availability" Mean in Distributed Systems?

Availability is the proportion of time a system successfully responds to requests, versus being down/unresponsive/erroring. In the CAP theorem context, it specifically means every request receives a **non-error response** — though that response isn't guaranteed to reflect the most recent write (that trade-off is what CAP is fundamentally about).

## Measuring Availability — "The Nines"

Availability is commonly expressed as a percentage, often described in terms of "nines," each additional nine representing roughly an order of magnitude less allowed downtime.

| Availability           | Downtime per Year | Downtime per Month | Downtime per Day |
| ---------------------- | ----------------- | ------------------ | ---------------- |
| 99% ("two nines")      | ~3.65 days        | ~7.3 hours         | ~14.4 minutes    |
| 99.9% ("three nines")  | ~8.76 hours       | ~43.8 minutes      | ~1.44 minutes    |
| 99.95%                 | ~4.38 hours       | ~21.9 minutes      | ~43.2 seconds    |
| 99.99% ("four nines")  | ~52.6 minutes     | ~4.38 minutes      | ~8.64 seconds    |
| 99.999% ("five nines") | ~5.26 minutes     | ~26.3 seconds      | ~0.86 seconds    |

Each additional nine of availability is exponentially harder (and more expensive) to achieve — going from 99.9% to 99.99% typically requires significant additional engineering investment (redundancy, automated failover, extensive testing of failure scenarios).

## SLA, SLO, and SLI — How Availability Targets Are Formalized

| Term                              | Meaning                                                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **SLI** (Service Level Indicator) | The actual measured metric (e.g., "percentage of successful requests over the last 30 days")                                          |
| **SLO** (Service Level Objective) | The internal target for that metric (e.g., "99.9% successful requests")                                                               |
| **SLA** (Service Level Agreement) | A contractual/external commitment, often with penalties for violation (e.g., "we guarantee 99.9% uptime or you get a service credit") |

```
SLI: measured 99.92% success rate this month
SLO: internal target of 99.9% -> MET (SLI exceeded the SLO)
SLA: contractual promise of 99.5% to customers -> comfortably met
```

## Techniques for Improving Availability

### 1. Redundancy — Eliminating Single Points of Failure

```
Single instance: 1 server -> if it fails, the whole service is down
Redundant setup: N servers behind a load balancer -> any single server failing doesn't take down the service
```

### 2. Replication

Keeping multiple copies of data (see the dedicated Replication notes) so a node failure doesn't mean data loss or unavailability of that data.

### 3. Failover

Automatically routing traffic to a healthy backup when the primary fails.

```js
// Conceptual health-check-driven failover
async function getDbConnection() {
  if (await isPrimaryHealthy()) {
    return primaryConnection;
  }
  console.warn("Primary unavailable, failing over to replica");
  return replicaConnection;
}
```

### 4. Load Balancing

Distributing traffic across multiple instances so no single instance becomes a bottleneck or single point of failure (full detail in the dedicated Load Balancing notes).

### 5. Graceful Degradation

Rather than a complete outage when a dependency fails, degrade functionality gracefully — serve a reduced but still-functional experience.

```js
async function getProductPage(productId) {
  const product = await getProduct(productId); // core data — must succeed

  let recommendations = [];
  try {
    recommendations = await getRecommendations(productId); // non-critical
  } catch (err) {
    console.warn("Recommendations service unavailable, degrading gracefully");
    // page still renders successfully, just without recommendations
  }

  return { product, recommendations };
}
```

### 6. Circuit Breakers

Prevent a failing dependency from cascading into a full system-wide outage by "opening the circuit" (failing fast) after detecting repeated failures, rather than letting every request hang waiting on a dependency that's clearly down.

```js
class CircuitBreaker {
  constructor(fn, { failureThreshold = 5, resetTimeoutMs = 30000 } = {}) {
    this.fn = fn;
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.failureCount = 0;
    this.state = "CLOSED"; // CLOSED (normal), OPEN (failing fast), HALF_OPEN (testing recovery)
    this.nextAttempt = Date.now();
  }

  async call(...args) {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) {
        throw new Error("Circuit breaker is OPEN — failing fast");
      }
      this.state = "HALF_OPEN"; // allow one trial request through
    }

    try {
      const result = await this.fn(...args);
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.resetTimeoutMs;
    }
  }
}
```

### 7. Health Checks

Continuously verify instances are actually healthy, automatically removing unhealthy ones from a load balancer's rotation.

```js
app.get("/health", async (req, res) => {
  const dbHealthy = await checkDatabaseConnection();
  const cacheHealthy = await checkCacheConnection();

  if (dbHealthy && cacheHealthy) {
    res.status(200).json({ status: "healthy" });
  } else {
    res
      .status(503)
      .json({ status: "unhealthy", db: dbHealthy, cache: cacheHealthy });
  }
});
```

### 8. Retry with Backoff (For Transient Failures)

```js
async function fetchWithRetry(fn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      const delay = Math.pow(2, attempt) * 100; // exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
```

## Availability vs Consistency Trade-off in Practice

```
Scenario: a database replica can't confirm it has the latest write (network issue reaching the primary)

Prioritize Availability: serve the (possibly stale) data anyway, log a warning
Prioritize Consistency: refuse the request, return an error/timeout until the replica can confirm freshness
```

This is the CAP trade-off in concrete, everyday engineering terms — every distributed data-serving decision under partition conditions implicitly makes this choice.

## Multi-Region Deployments for Availability

Deploying across multiple geographic regions protects against entire-region outages (a data center fire, a regional cloud provider incident) — the highest tier of availability engineering, but with significant added complexity (cross-region data replication/consistency, latency, cost).

```
Region: us-east-1  (primary)
Region: eu-west-1  (standby/active, receiving replicated data)

If us-east-1 becomes entirely unavailable:
  -> traffic is redirected (via DNS failover or a global load balancer) to eu-west-1
```

## Common Interview-Style Questions

- **What does "five nines" (99.999%) availability actually mean in terms of allowed downtime?**
  Approximately 5.26 minutes of downtime per year — an extremely stringent target requiring substantial redundancy and operational maturity to achieve reliably.

- **What's the difference between an SLI, SLO, and SLA?**
  An SLI is the actual measured metric (e.g., current success rate); an SLO is an internal target for that metric; an SLA is a contractual, often externally-facing commitment, typically with consequences (like service credits) if violated.

- **What is a circuit breaker, and what problem does it solve?**
  A pattern that "opens" (fails fast) after detecting repeated failures from a dependency, preventing every subsequent request from hanging or timing out waiting on a service that's clearly already failing — protecting the overall system from cascading failures caused by one struggling dependency.

- **What is graceful degradation, and why is it valuable for availability?**
  Serving a reduced but still-functional experience when a non-critical dependency fails, rather than failing the entire request — it keeps the core functionality available even when secondary features are temporarily broken, improving overall perceived availability.

- **How does the availability side of the CAP trade-off manifest in a concrete, practical engineering decision?**
  When a replica can't confirm it has the most up-to-date data (e.g., due to a network issue), the system must choose: serve the possibly-stale data anyway (favoring availability) or refuse/delay the request until freshness can be confirmed (favoring consistency) — this decision point is the everyday, practical form the CAP trade-off actually takes.
