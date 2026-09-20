# Interview Questions — Distributed Cache

Question bank with model answers, plus a suggested time-boxed structure
for a 45-minute interview.

---

## Suggested 45-minute structure

| Time      | Activity                                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------------------------- |
| 0–5 min   | Clarify requirements: read/write ratio, data size, consistency needs, acceptable staleness, scale target (nodes, keys, QPS) |
| 5–15 min  | Partitioning: explain the naive-modulo-hashing problem, then consistent hashing + virtual nodes as the fix                  |
| 15–25 min | Concrete architecture (e.g., Redis Cluster-style): hash slots, client routing, topology/gossip                              |
| 25–33 min | Replication & failover: primary-replica model, async vs sync, quorum-based failover                                         |
| 33–41 min | Cache invalidation: strategy choice(s), and at least one concrete failure scenario (race condition)                         |
| 41–45 min | Recap tradeoffs made and how they map to the stated requirements                                                            |

This interview leans more theoretical/algorithmic than most system design
problems — interviewers often want precise mechanisms (walk through the
consistent hashing ring, derive the remapping fraction) rather than only a
high-level architecture diagram, so practice explaining mechanisms with
specific numbers, not just names.

---

## Conceptual

**Q1. Why can't you just use `hash(key) % N` to distribute keys across N
cache nodes?**
A: Because N changes whenever a node is added or removed, and `%N`
changing changes the result for almost every key — adding one node to a
cluster of N remaps roughly `(N-1)/N` of all keys to a different node
(e.g., ~90% for a 10-node cluster), effectively invalidating nearly the
entire cache from one small topology change. Consistent hashing fixes this
by only remapping roughly `1/N` of keys on a topology change.

**Q2. Explain consistent hashing and how it avoids near-total remapping.**
A: Both nodes and keys are hashed onto the same fixed circular hash space
(a ring); a key belongs to the first node encountered walking clockwise
from the key's position. When a node is added or removed, only the keys
between that node's ring position and its predecessor's need to move —
not the whole keyspace — because every other node-to-node boundary on the
ring is unaffected.

**Q3. What problem do virtual nodes solve, and how?**
A: Plain consistent hashing with one ring position per physical node can
produce very uneven load (nodes randomly spaced close together own less
of the ring than isolated ones) and concentrates all of a departing node's
keys onto a single neighbor. Virtual nodes assign each physical node many
positions on the ring instead of one, which averages out to a fair, even
load distribution and spreads a departing node's keys across many other
nodes rather than dumping them onto one.

**Q4. Why is cache invalidation considered fundamentally hard?**
A: Because a cache is a copy of data whose source of truth can change
independently, and there's no single correct way to detect and propagate
that change instantly, cheaply, and reliably at the same time. Concretely,
one underlying data change can require invalidating multiple derived
cache entries (fan-out), and race conditions between concurrent reads and
writes can leave stale entries in the cache with nothing to fix them
until TTL expiry — every strategy trades off some combination of
staleness, complexity, and load.

---

## Technical

**Q5. How does Redis Cluster's hash-slot model differ from classic
consistent hashing?**
A: Redis Cluster divides the keyspace into 16,384 fixed hash slots via
`CRC16(key) % 16384`, and each slot is explicitly owned by one node,
tracked as cluster state rather than derived from walking a hash ring.
Rebalancing means explicitly migrating specific slots between nodes
(often via an admin-driven resharding operation) rather than an automatic
ring recalculation — same underlying goal (avoid near-total remapping) as
consistent hashing, but achieved through explicit slot ownership rather
than a hash ring.

**Q6. How would you support a multi-key operation (e.g., a transaction
touching two related keys) in a sharded cache where keys can land on
different nodes?**
A: Use hash tags (in Redis Cluster's case, a `{...}` substring within the
key) so only that substring is hashed for slot assignment — deliberately
forcing related keys onto the same slot/node so multi-key operations
against them are possible. Without this, related keys can land on
different nodes and multi-key atomic operations across them aren't
directly supported.

**Q7. Compare client-side routing vs. proxy-based routing for a
distributed cache.**
A: Client-side routing (e.g., Redis Cluster's native approach) has
cluster-aware client libraries cache the key-to-node mapping and send
requests directly to the correct node, avoiding an extra network hop and
avoiding a proxy as a single point of failure — at the cost of requiring
smarter, cluster-aware clients. Proxy-based routing (e.g., Twemproxy in
front of plain instances) centralizes routing logic so clients can stay
simple, at the cost of an extra hop and the proxy itself becoming a
potential bottleneck/failure point unless it's made highly available.

**Q8. Walk through what happens end to end when a cache node holding a
primary partition fails.**
A: Other nodes detect the failure (e.g., via a gossip protocol, requiring
quorum agreement to avoid a false-positive triggering an unnecessary
failover). One of the failed primary's replicas — ideally the one with
the least replication lag — is promoted to primary for that partition.
Cluster state propagates the new topology so clients/routing layers
redirect subsequent requests to the new primary. Any writes that hadn't
yet replicated to the promoted replica before the failure are lost — an
accepted tradeoff for a cache, given asynchronous replication's low
write-latency benefit.

**Q9. Why is asynchronous replication generally preferred over
synchronous replication for a cache specifically?**
A: Synchronous replication (waiting for replica acknowledgment before
confirming a write) adds latency to every write, which conflicts with a
cache's core purpose of being fast. Since a cache is a disposable copy of
data whose source of truth lives elsewhere, losing a small amount of
very recently written data on a primary failure is a far more acceptable
tradeoff than it would be for a system of record — so async replication's
small data-loss window is usually an easy trade for lower write latency.

**Q10. Describe a concrete race condition that can leave a stale entry in
a cache-aside design, and how you'd mitigate it.**
A: A read misses the cache, reads the (currently current) value from the
database, and is about to write it into the cache — but concurrently, a
write updates the database and invalidates the cache in between. If the
original read's now-stale value gets written to the cache _after_ that
invalidation, the cache is left with stale data with no future write
scheduled to correct it until TTL expiry. Mitigations include keeping
TTLs short as a backstop even when using explicit invalidation, or adding
versioning/locking around the read-populate path so a stale write can be
detected and discarded.

---

## Scenario / Design

**Q11. Design a distributed cache for a read-heavy social media feed
service, prioritizing low read latency and tolerance for occasional
staleness.**
A: Partition via consistent hashing with virtual nodes (or a hash-slot
scheme) across many small-to-medium nodes for even load distribution.
Use primary-replica replication with async propagation, and serve reads
from replicas as well as primaries to maximize read throughput, accepting
minor staleness from replication lag — acceptable given the stated
tolerance. Use TTL-based expiration as the primary invalidation strategy
(simple, self-cleaning, matches the "some staleness is fine" requirement)
rather than investing heavily in complex explicit invalidation.

**Q12. How would you extend this design if the product later requires
strict read-your-own-writes consistency (a user should always see their
own just-made post immediately)?**
A: This is in tension with reading from replicas under async replication,
since a just-made write might not have propagated yet. Options: route a
given user's reads to the primary for a short window after they write
(sticky routing), or read from the primary specifically for that user's
own content while still reading from replicas for other users' content
(a targeted consistency exception rather than changing the whole system's
consistency model) — a good example of scoping a stronger consistency
guarantee to only where it's actually needed, rather than paying the cost
system-wide.

**Q13. A specific cache node is receiving significantly more traffic
than others (a "hot node"). How would you diagnose and address this?**
A: First check whether it's a hot-key problem (one or a few very popular
keys concentrated on that node, common with celebrity/viral content) or a
genuine partition-imbalance problem (uneven slot/vnode distribution).
For a hot key: consider client-side local caching for the hottest keys in
addition to the distributed cache, or explicitly replicating that specific
key across multiple nodes to spread its read load. For partition
imbalance: increase the number of virtual nodes per physical node (finer-
grained distribution) or manually rebalance slot ownership.

**Q14. What would you monitor in production for a distributed cache
cluster?**
A: Per-node memory usage and eviction rate (approaching capacity limits),
hit/miss ratio overall and per key-pattern (a dropping hit ratio can
indicate a TTL/invalidation problem or a genuine traffic-pattern shift),
replication lag per replica (affects both failover data-loss risk and
stale-read severity), and cluster topology-change events (rebalances,
failovers) correlated with any latency spikes, since resharding/failover
operations can transiently affect performance. Also track key-space
distribution across nodes to catch partition imbalance before it becomes
a hot-node incident.
