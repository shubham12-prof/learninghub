# 09. Interview Questions — Distributed Systems (Comprehensive)

A consolidated set of commonly asked distributed systems interview questions, organized by topic, with concise answers and code where useful.

---

## CAP Theorem

**Q: State the CAP theorem.**
A distributed system can provide at most two of Consistency, Availability, and Partition Tolerance simultaneously; since partitions are unavoidable in real distributed systems, the practical choice is between consistency and availability when a partition actually occurs.

**Q: Why isn't "CA" a realistic option for a truly distributed system?**
Network partitions are an inherent risk whenever multiple nodes communicate over a network; a non-partition-tolerant system either isn't truly distributed or fails/behaves incorrectly during a real partition rather than making a deliberate trade-off.

**Q: CP vs AP behavior during a partition?**
CP systems refuse requests on the side that can't guarantee consistency (becoming unavailable); AP systems keep serving requests on both sides, accepting temporarily divergent data to be reconciled later.

**Q: What does PACELC add to CAP?**
It extends the trade-off to normal (non-partitioned) operation, framing it as latency vs consistency even without a partition — since strong consistency requires coordination overhead that adds latency regardless.

---

## Consistency

**Q: Strong vs eventual consistency?**
Strong guarantees every read reflects the latest write (higher latency, coordination required); eventual allows temporarily stale reads that converge over time (lower latency, higher availability).

**Q: What is causal consistency?**
Guarantees causally-related writes are seen in order by all nodes, while unrelated concurrent writes have no ordering guarantee — a middle ground matching real-world intuition without full global ordering cost.

**Q: What is read-your-writes consistency, and how is it implemented?**
A guarantee that a user always sees their own writes immediately; typically implemented via session affinity (routing a user's reads to the replica that handled their write) or short-lived local caching.

**Q: Difference between CAP's "Consistency" and ACID's "Consistency"?**
CAP's consistency is about all nodes seeing the same (latest) data at a given time; ACID's consistency is about a transaction moving the database from one valid state to another respecting constraints — related but distinct concepts.

---

## Availability

**Q: What does "five nines" mean in terms of downtime?**
Approximately 5.26 minutes of downtime per year.

**Q: Difference between SLI, SLO, and SLA?**
SLI is the actual measured metric; SLO is the internal target for that metric; SLA is a contractual, often externally-facing commitment with consequences for violation.

**Q: What is a circuit breaker, and what does it solve?**
A pattern that fails fast after detecting repeated failures from a dependency, preventing cascading failures from every request hanging on a service that's clearly down.

**Q: What is graceful degradation?**
Serving a reduced but still-functional experience when a non-critical dependency fails, rather than failing the entire request.

---

## Partition Tolerance

**Q: What is split-brain, and how do quorums prevent it?**
A scenario where multiple sides of a partitioned cluster each believe they're the primary and accept conflicting writes; quorums prevent this by requiring a majority to accept a write, mathematically guaranteeing only one side of a partition can ever have a majority.

**Q: Why can't a node distinguish a crashed peer from a partitioned (unreachable) peer?**
Both look identical from the observing node's perspective — no response either way — which is why robust systems use quorums/timeouts rather than assuming a cause.

**Q: Why do coordination systems like etcd/ZooKeeper favor CP over AP?**
They handle critical coordination (leader election, config) where conflicting state would be far more dangerous than briefly refusing requests on the minority side of a partition.

**Q: Explain W + R > N.**
With N replicas, W required write acknowledgments, and R required read acknowledgments, this guarantees any read quorum overlaps with the most recent write's quorum by at least one replica, ensuring reads see the latest write.

---

## Replication

**Q: Single-leader vs multi-leader replication?**
Single-leader designates one node for all writes (simple, no conflicts, but a bottleneck/single point of failure); multi-leader allows multiple nodes to accept writes independently (lower latency for distributed writes) at the cost of needing conflict resolution.

**Q: What is leaderless replication?**
No designated leader — clients write to/read from multiple replicas directly, typically using quorums to determine success, common in systems like Cassandra and DynamoDB.

**Q: Synchronous vs asynchronous replication trade-off?**
Synchronous waits for follower confirmation before acknowledging (stronger durability, higher latency); asynchronous acknowledges immediately and replicates in the background (lower latency, risk of data loss if the leader fails before replicating).

**Q: What is replication lag?**
The delay between a write completing on the leader and becoming visible on a follower — the root cause of many practical consistency issues.

---

## Sharding

**Q: What problem does sharding solve that replication doesn't?**
Replication copies the full dataset for fault tolerance but doesn't help when data/throughput exceeds a single node's capacity; sharding splits data itself across nodes, each holding a subset.

**Q: What makes a good shard key?**
High cardinality, even access patterns (no hot keys), and alignment with common query patterns so most queries hit a single shard.

**Q: What problem does consistent hashing solve?**
Naive `hash(key) % N` requires reassigning almost every key when N changes; consistent hashing places nodes/keys on a ring so adding/removing a node only affects adjacent keys, minimizing data movement.

**Q: Why are cross-shard queries expensive?**
They must fan out to every relevant shard and aggregate results, unlike a single-shard query served by one node — mitigated by choosing an aligned shard key and routing cross-cutting analytics to a separate data store.

---

## Service Discovery

**Q: What problem does service discovery solve?**
Lets services find each other's current network location in a dynamic environment (instances constantly created/destroyed/moved) without hardcoding addresses.

**Q: Client-side vs server-side discovery?**
Client-side: the caller queries a registry and picks an instance itself (no extra hop, but needs discovery logic everywhere); server-side: the caller hits a stable load balancer that handles discovery internally (simpler clients, extra hop).

**Q: Self-registration vs third-party registration?**
Self-registration: instances register/deregister themselves; third-party: an external system (like Kubernetes) manages registration on the service's behalf, removing discovery code from the application.

**Q: Why is health checking critical to service discovery?**
Without it, the registry could keep routing traffic to crashed/unhealthy instances, since nothing would detect and remove them.

---

## Load Balancing

**Q: Layer 4 vs Layer 7 load balancing?**
Layer 4 routes based on connection-level info (IP/port) with lower overhead; Layer 7 inspects the full HTTP request (path, headers, cookies) enabling content-aware routing at slightly higher cost.

**Q: Weakness of round robin vs least connections?**
Round robin ignores current server load, potentially piling requests on an already-busy server; least connections actively routes to the currently least-loaded server, better for variable request costs.

**Q: What are sticky sessions, and their drawback?**
Ensuring a client's requests always reach the same backend server; the drawback is complicated scaling/failover, since losing that server loses in-memory session data unless separately replicated — a shared session store is generally preferred.

**Q: How does global (multi-region) load balancing typically work?**
Often DNS-based — a hostname resolves to the load balancer IP of the nearest/optimal region, combined with a regional load balancer distributing traffic within that region.

---

## Practical / Coding Questions Often Asked Live

**Q: Implement a simple circuit breaker.**

```js
class CircuitBreaker {
  constructor(fn, { threshold = 5, resetMs = 30000 } = {}) {
    this.fn = fn;
    this.threshold = threshold;
    this.resetMs = resetMs;
    this.failures = 0;
    this.state = "CLOSED";
    this.nextAttempt = 0;
  }
  async call(...args) {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) throw new Error("Circuit OPEN");
      this.state = "HALF_OPEN";
    }
    try {
      const result = await this.fn(...args);
      this.failures = 0;
      this.state = "CLOSED";
      return result;
    } catch (err) {
      this.failures++;
      if (this.failures >= this.threshold) {
        this.state = "OPEN";
        this.nextAttempt = Date.now() + this.resetMs;
      }
      throw err;
    }
  }
}
```

**Q: Design a sharding scheme for a multi-tenant SaaS application.**
Shard by `tenant_id` (high cardinality across many organizations, and nearly all queries are naturally scoped to a single tenant) — this keeps almost every query within a single shard, avoiding expensive cross-shard fan-out, while still allowing new tenants to be distributed evenly across shards via consistent hashing.

**Q: How would you design a globally available, strongly consistent inventory system for a flash sale, while keeping the browsing experience fast everywhere?**
Use strong consistency (quorum writes, `acks=all`-equivalent) specifically for the stock-decrement operation during checkout to prevent overselling, routed to a primary region; use eventually consistent, geographically replicated read replicas for general product browsing/search, accepting brief staleness there since it doesn't risk correctness the way overselling would.

**Q: Explain how you'd detect and recover from a leader failure in a replicated database cluster.**
Followers monitor the leader via periodic heartbeats; after missing a configured number of heartbeats/timeout threshold, they initiate a leader election among themselves (typically favoring the most up-to-date follower), redirect client traffic to the newly elected leader, and ensure the old leader — if it later recovers — is demoted to a follower rather than allowed to keep acting as a leader, to avoid split-brain.

**Q: How would you design rate limiting for an API gateway distributed across multiple regions?**
Use a shared, low-latency data store (e.g., a regional Redis cluster, potentially with cross-region replication for global limits) as the source of truth for request counters, applying an atomic increment-and-check pattern (via a Lua script or similar) per client key — favoring a per-region limit with eventual global reconciliation over strict global synchronous coordination, to avoid adding cross-region latency to every request.
