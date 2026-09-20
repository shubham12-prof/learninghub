# Scaling

## High-level architecture

```
Client
  |
  v
Load Balancer
  |
  v
App Servers (stateless, horizontally scaled)
  |         \
  v          v
Cache      ID Generation Service
(Redis)    (for short-code creation)
  |
  v
Database (sharded, with read replicas)
```

Optionally: a CDN in front for redirect responses in some designs, a
message queue for asynchronous analytics writes, and a background job for
expiring/cleaning up old links.

## Scaling the app tier

- App servers should be **stateless** — no session/local state tied to a
  specific request beyond the request itself — so any server can handle any
  request, and you can freely add/remove instances behind a load balancer.
- **Load balancing** — a standard round-robin or least-connections load
  balancer distributes traffic across app server instances; health checks
  remove unhealthy instances automatically.
- Horizontal auto-scaling based on CPU/request-rate metrics handles
  traffic spikes without manual intervention.

## Scaling reads

- **Caching** (see caching note) absorbs the vast majority of read
  traffic before it ever reaches the database — this is the single biggest
  lever given the read-heavy workload.
- **Read replicas** — the database's read traffic (cache misses) can be
  spread across multiple read replicas of the primary database, especially
  useful if analytics/reporting queries also read from the same data.
- **CDN caching for redirects** — since a `short_code → long_url` mapping
  is effectively immutable once created, redirect responses (HTTP 301/302)
  can in some designs be cached at a CDN/edge layer, serving repeat clicks
  without hitting your origin infrastructure at all — a good "next level"
  point to raise if asked to scale further.

## Scaling writes / the database

- **Sharding (horizontal partitioning)** — split the `urls` table across
  multiple database nodes. Since all lookups and writes are keyed by
  `short_code`, sharding by a hash of `short_code` is a natural fit: it
  distributes load evenly and every request only ever needs to hit one
  shard (no cross-shard joins/queries required on the hot path).
- **Avoiding a single point of contention for ID generation** — if using
  counter-based short-code generation, a single global counter doesn't
  scale with a sharded database; use pre-allocated ID ranges per node or a
  Snowflake-style distributed ID scheme instead (see hash-generation note).
- **Write throughput is comparatively low** (assume ~39 writes/sec average
  in the earlier estimate) relative to read throughput, so the database
  write path is rarely the bottleneck compared to reads — sharding here is
  more about total data volume and long-term growth than raw write QPS.

## High availability & fault tolerance

- **Database replication** (primary + replicas, possibly multi-region) so
  a single node failure doesn't take down the system; automated failover
  promotes a replica if the primary goes down.
- **Redundant cache nodes** — a cache cluster (not a single Redis instance)
  so cache node failure degrades gracefully (falls back to DB) rather than
  causing an outage.
- **Multi-region deployment** for global low-latency redirects and
  disaster recovery, if the product needs global reach — introduces
  cross-region data consistency questions (usually acceptable to be
  eventually consistent for this use case, since URL mappings are
  near-immutable).
- **Graceful degradation** — if the analytics/click-tracking pipeline goes
  down, redirection should keep working (analytics is not on the critical
  path) — a good design principle to state explicitly: decouple
  non-critical features (analytics) from the critical path (redirect)
  using asynchronous processing (e.g., a message queue).

## Analytics at scale (if required)

- Don't synchronously update a click-count column on every redirect —
  instead, publish a lightweight "click event" to a message queue
  (Kafka/SQS/etc.) and process it asynchronously into an analytics
  store/data warehouse, batching updates rather than hitting the primary
  database on every single request.

## Interview-relevant talking points

- Be able to justify _why_ reads and writes are scaled differently here
  (read-heavy workload → caching + read replicas + CDN; writes are lower
  volume → sharding mainly for data growth and ID-generation contention,
  not raw throughput).
- Bring up decoupling non-critical paths (analytics) from the critical path
  (redirect) as a resilience principle — a strong signal in this kind of
  interview.
- Be ready to reason about consistency tradeoffs if asked about multi-
  region — this data's near-immutability makes eventual consistency an
  easy, well-justified choice.
