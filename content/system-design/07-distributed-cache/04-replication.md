# Replication

## Why a distributed cache needs replication

Partitioning (via consistent hashing / hash slots) spreads data across
nodes for scale, but each piece of data still lives on only **one** node
unless it's also replicated — meaning that node's failure means that
data's total, immediate loss/unavailability from the cache. Replication
copies each partition's data onto one or more additional nodes so the
system tolerates individual node failures without losing cached data or
availability for the affected keyspace.

## Primary-replica model (the standard pattern)

- Each partition (shard/slot range) has one **primary** node that accepts
  writes, and one or more **replica** nodes that maintain a copy by
  continuously receiving updates from the primary.
- Reads can typically be served from either the primary or a replica
  (depending on configuration/consistency needs — see below); writes
  always go to the primary for that partition.
- If the primary fails, one of its replicas is **promoted** to become the
  new primary (failover — see below), and the system continues serving
  that partition's keyspace from the new primary.

## Replication mechanics

- Typically **asynchronous**: the primary acknowledges a write immediately
  (fast, low latency) and propagates the change to replicas in the
  background, rather than waiting for replicas to confirm before
  responding to the client.
- This means there's a small **replication lag window** where a replica's
  data is slightly behind the primary — if the primary fails during this
  window, whatever hadn't yet propagated to the promoted replica is lost.
  This is a real, named tradeoff (favoring availability/latency over
  strict durability) that's very much in character for a _cache_ (where
  losing a small amount of recently-written data is much more acceptable
  than it would be for a primary database) — a good point to make
  explicitly, since it distinguishes cache replication expectations from
  database replication expectations.
- **Synchronous replication** (wait for replica acknowledgment before
  confirming the write) is possible but adds latency to every write and is
  less commonly used for pure caching layers specifically because caches
  usually tolerate a bit of data loss on failure far better than a
  system of record does — worth naming as the alternative and explaining
  why it's less commonly chosen here.

## Failover

- **Failure detection:** nodes (in Redis Cluster, via the gossip
  protocol covered in the Redis Cluster note) monitor each other's
  health; when enough nodes agree a primary is unreachable (a quorum-based
  decision, to avoid a single node's network blip triggering an
  unnecessary failover), a failover is triggered.
- **Promotion:** one of the failed primary's replicas is elected/promoted
  to primary — typically the replica with the most up-to-date data
  (least replication lag) among the candidates, to minimize data loss.
- **Client re-routing:** clients (or the routing layer) need to learn
  about the new primary and redirect subsequent writes/reads to it —
  handled via the same cluster-state propagation mechanism used for normal
  topology awareness.
- **Split-brain risk:** if a network partition makes the old primary
  unreachable from _some_ nodes but not others, there's a risk of two
  nodes both believing they're the primary simultaneously — quorum-based
  failover decisions (requiring agreement from a majority of nodes) are
  the standard mitigation, since a true majority can't exist on both sides
  of a partition simultaneously.

## Read scaling via replicas

- Beyond fault tolerance, replicas can also serve **read traffic**,
  effectively scaling read capacity horizontally beyond what a single
  primary could handle — a secondary benefit of replication worth
  mentioning if the design needs to handle very high read volume.
- Reading from replicas trades off consistency: a replica read might
  return slightly stale data (due to replication lag) compared to
  reading from the primary — acceptable for most cache use cases, but
  worth explicitly flagging as a consistency/freshness tradeoff being
  made, especially if the interviewer probes on consistency guarantees.

## Consistency tradeoffs, summarized

| Choice                 | Gains                    | Costs                                     |
| ---------------------- | ------------------------ | ----------------------------------------- |
| Async replication      | Low write latency        | Small data-loss window on primary failure |
| Sync replication       | No data loss on failover | Higher write latency                      |
| Read from replicas     | Higher read throughput   | Possible stale reads (replication lag)    |
| Read from primary only | Always fresh             | Primary becomes the read bottleneck       |

## Interview-relevant talking points

- Explicitly frame async replication's data-loss tradeoff as _more
  acceptable for a cache_ than it would be for a primary datastore — this
  framing shows you understand the system's actual role (a fast, mostly-
  disposable copy) rather than treating cache replication with the same
  durability bar as database replication.
- Be ready to explain quorum-based failover decisions and why they matter
  (avoiding split-brain) — a standard, expected follow-up.
- Mention read-from-replicas as a throughput lever, paired explicitly with
  its consistency cost — a good way to show you think about tradeoffs as
  pairs (gain + cost), not just listing features.
