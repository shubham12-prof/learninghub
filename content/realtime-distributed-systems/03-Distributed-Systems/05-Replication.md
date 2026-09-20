# 05. Replication

## What is Replication?

Replication means maintaining multiple copies of the same data across different nodes/machines. It's a foundational technique in distributed systems, used to achieve fault tolerance (surviving node failures without data loss), availability (continuing to serve requests even if some nodes are down), and read scalability (spreading read load across multiple copies).

## Why Replicate?

| Benefit                 | Explanation                                                               |
| ----------------------- | ------------------------------------------------------------------------- |
| **Fault tolerance**     | If one node holding the data fails, other replicas still have it          |
| **Availability**        | Requests can be served by any healthy replica, not just one specific node |
| **Read scalability**    | Read traffic can be distributed across multiple replicas                  |
| **Geographic locality** | Replicas placed near users in different regions reduce latency            |

## Replication Strategies

### 1. Single-Leader (Primary-Replica) Replication

One node (the leader/primary) accepts all writes; other nodes (followers/replicas) replicate from it and typically serve read traffic.

```
        Writes
          │
          ▼
      [Leader] ────replicates────> [Follower 1]
          │
          └──────────replicates────> [Follower 2]

Reads can go to the Leader OR any Follower (depending on consistency requirements)
```

**Pros:** simple to reason about, no write conflicts (only one node accepts writes).
**Cons:** the leader is a single point of failure for writes (requires failover handling), and a write bottleneck (all writes funnel through one node).

```js
// Application-level read/write splitting — common pattern with single-leader replication
async function writeData(data) {
  await leaderDb.write(data); // all writes go to the leader
}

async function readData(query) {
  return followerDb.read(query); // reads can be spread across followers, reducing leader load
}
```

### 2. Multi-Leader Replication

Multiple nodes can each accept writes independently, replicating changes to each other. Useful for multi-datacenter setups where you want each region to accept local writes without waiting on a distant leader.

```
[Leader A (US)] <----replicates both ways----> [Leader B (EU)]
      │                                                │
   accepts writes                                accepts writes
   from US users                                  from EU users
```

**Pros:** lower write latency for geographically distributed users (writes happen locally).
**Cons:** write conflicts become possible (two leaders accepting different writes to the same data simultaneously) — requires conflict resolution logic.

```js
// Conflict resolution example: "last write wins" based on timestamp
function resolveConflict(writeA, writeB) {
  return writeA.timestamp > writeB.timestamp ? writeA : writeB;
}
```

More sophisticated approaches include CRDTs (Conflict-free Replicated Data Types), which are specifically designed so concurrent updates can always be merged deterministically without data loss, for certain data structures (counters, sets, etc.).

### 3. Leaderless Replication

No single node is designated leader — clients write to (and read from) multiple replicas directly, typically using a quorum mechanism to determine success.

```
Client writes to Replicas A, B, C simultaneously
Write considered successful once W replicas acknowledge (e.g., W=2 out of 3)

Client reads from multiple replicas, using R replicas' responses
(possibly resolving version conflicts via timestamps/vector clocks if replicas disagree)
```

**Examples:** Cassandra, DynamoDB, Riak.

**Pros:** highly available, no single point of failure for either reads or writes, good for globally distributed systems.
**Cons:** more complex conflict resolution, potential for reading stale/conflicting data depending on the configured quorum.

## Synchronous vs Asynchronous Replication

```
Synchronous:  Leader waits for follower(s) to CONFIRM the write before acknowledging the client
              -> stronger durability guarantee, higher write latency

Asynchronous: Leader acknowledges the client immediately, replicates to followers in the background
              -> lower write latency, but a leader crash before replication completes can LOSE the write
```

```
Semi-synchronous (a common middle ground):
  Leader waits for AT LEAST ONE follower to confirm (not all), then acknowledges the client
  -> balances durability and latency
```

## Replication Lag

The delay between a write completing on the leader/primary and that write becoming visible on a given replica — an inherent characteristic of asynchronous replication.

```
T=0ms:   Write X=5 completes on the Leader
T=0ms:   Client immediately reads X from a Follower -> might still return the OLD value
T=50ms:  Replication catches up -> Follower now returns X=5
```

Replication lag is the root cause behind many of the consistency trade-offs covered in the Consistency notes (read-your-writes, monotonic reads, etc. are all strategies for managing the user-facing effects of replication lag).

## Handling Leader Failure — Failover

```
1. Leader becomes unreachable (crash, network partition)
2. Followers/monitoring system detect the failure (missed heartbeats)
3. A new leader is elected from among the followers (often the most up-to-date one)
4. Clients are redirected to the new leader
5. The old leader, if it recovers, must be demoted to a follower (to avoid split-brain)
```

Automating this safely is genuinely difficult — premature failover (declaring a healthy leader dead due to a transient network blip) can cause unnecessary disruption or even split-brain if not handled carefully (see the Partition Tolerance notes).

## Replication Topologies (Multi-Leader Variants)

```
Circular topology:  A -> B -> C -> A   (each node replicates to the next in a ring)
Star topology:       Hub node replicates to/from all others
All-to-all topology: Every node replicates directly with every other node
```

Circular and star topologies are simpler but can have single points of failure in the replication path itself (a broken link in a ring can delay propagation); all-to-all is more resilient but generates more replication traffic.

## Real-World Examples

| System                      | Replication Model                                                     |
| --------------------------- | --------------------------------------------------------------------- |
| PostgreSQL (standard setup) | Single-leader, synchronous or asynchronous followers                  |
| MongoDB                     | Single-leader (primary) within a replica set, asynchronous by default |
| Cassandra                   | Leaderless, tunable consistency via quorum                            |
| MySQL Group Replication     | Multi-leader capable, with conflict detection                         |
| DynamoDB                    | Leaderless, quorum-based                                              |

## Common Interview-Style Questions

- **What's the difference between single-leader and multi-leader replication?**
  Single-leader designates one node to accept all writes (simpler, no write conflicts, but a write bottleneck/single point of failure); multi-leader allows multiple nodes to accept writes independently (useful for low-latency multi-region writes), at the cost of needing conflict resolution for concurrent conflicting writes.

- **What is leaderless replication, and what's a common mechanism for ensuring consistency in this model?**
  A model where clients write to and read from multiple replicas directly with no single designated leader; consistency is typically managed via a quorum mechanism (requiring a minimum number of replicas to acknowledge reads/writes) rather than relying on a single authoritative node.

- **What's the trade-off between synchronous and asynchronous replication?**
  Synchronous replication waits for follower confirmation before acknowledging a write, providing stronger durability at the cost of higher latency; asynchronous replication acknowledges immediately and replicates in the background, offering lower latency but risking data loss if the leader fails before replication completes.

- **What is replication lag, and what problems can it cause?**
  The delay between a write completing on the leader and becoming visible on a follower/replica; it's the root cause of many consistency issues users might notice, like not seeing their own recent write immediately, or seeing data appear to "go backward" across successive requests routed to differently-lagged replicas.

- **Why is automated leader failover a genuinely difficult problem to solve safely?**
  Because distinguishing "the leader actually crashed" from "the leader is just temporarily unreachable due to a network issue" is fundamentally ambiguous from an observing node's perspective; a premature failover risks either unnecessary disruption (if the original leader was actually fine) or split-brain (if the "failed" leader recovers and both it and the newly-elected leader simultaneously believe they're in charge).
