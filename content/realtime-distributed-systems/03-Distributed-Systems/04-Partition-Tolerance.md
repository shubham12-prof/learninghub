# 04. Partition Tolerance

## What is a Network Partition?

A network partition occurs when a network failure splits a distributed system's nodes into groups that can no longer communicate with each other, even though each individual node might still be running and healthy. Causes include switch/router failures, cable cuts, firewall misconfigurations, or even a node being severely overloaded/slow enough to functionally act as if it's unreachable.

```
Normal:  [Node A] <---> [Node B] <---> [Node C]   (all nodes can reach each other)

Partition: [Node A]  X  [Node B] <---> [Node C]
                     ^
              network split — A can't reach B or C, but B and C can still reach each other
```

## Partition Tolerance is Not Optional in Practice

As covered in the CAP Theorem notes, partition tolerance isn't really a design choice you can opt out of for any system distributed across more than one machine/network path — partitions **will** happen eventually. The real question every distributed system must answer is: **what happens when a partition occurs?**

## What Happens During a Partition — The Core Decision

```
Partition splits the cluster into: {Node A} and {Node B, Node C}

Option 1 (CP): Node A refuses to serve requests it can't guarantee are consistent
               -> Node A becomes temporarily UNAVAILABLE
               -> Nodes B/C (majority side) may continue operating normally

Option 2 (AP): Node A continues serving requests using its local (possibly stale) data
               -> Node A stays AVAILABLE, but might return outdated data
               -> Data on A may diverge from B/C until the partition heals
```

## Quorum-Based Approaches — A Common Practical Middle Ground

Many distributed systems use a **quorum** mechanism: require a majority of nodes to agree before a write/read is considered successful, which naturally handles partitions in a principled way.

```
5-node cluster, quorum = 3 (majority)

Partition splits into: {2 nodes} and {3 nodes}

The 3-node side has a quorum -> can continue accepting writes (it IS the "majority" of the cluster)
The 2-node side lacks a quorum -> refuses writes (prevents a "split-brain" where both sides
                                   independently accept conflicting writes)
```

This ensures at most one side of any partition can make progress, preventing conflicting writes from both sides — a form of principled CP behavior without requiring a single point of coordination.

```
Quorum formula: W + R > N   (for strong consistency on reads)
  N = total replicas
  W = replicas required to acknowledge a write
  R = replicas required to acknowledge a read

Example: N=3, W=2, R=2 -> W+R=4 > 3 -> guarantees any read overlaps with the most recent write's replicas
```

## Split-Brain — The Danger Quorums Prevent

Split-brain occurs when a partition causes **both** sides of a cluster to believe they're the legitimate "primary" and independently accept writes — leading to genuinely conflicting, hard-to-reconcile data.

```
WITHOUT a quorum mechanism:

Partition: {Node A}  and  {Node B, Node C}

Node A thinks: "I'm isolated, but I'll keep accepting writes to stay available"
Node B/C think: "We're isolated, but we'll keep accepting writes too, since we can't reach A"

-> Both sides accept DIFFERENT, CONFLICTING writes for the same data
-> When the partition heals, reconciling these conflicting writes may be impossible
   without data loss or complex conflict-resolution logic
```

Quorum-based systems avoid this specifically by requiring a **majority**, which mathematically guarantees at most one side of any partition can have a majority (you can't have two different majorities of the same set simultaneously).

## Detecting a Partition — Heartbeats and Timeouts

Nodes typically detect that a partition has occurred (versus just a slow/busy peer) via periodic heartbeat messages and timeout thresholds.

```
Node B sends a heartbeat to Node A every 1 second
If Node A doesn't respond within 5 seconds (missed 5 heartbeats)
  -> Node B considers Node A "unreachable" (possibly partitioned, possibly crashed — can't fully distinguish)
```

> A fundamental limitation: a node experiencing a partition genuinely **cannot distinguish** between "the other node crashed" and "the other node is fine but unreachable due to a network issue" — this ambiguity is exactly why distributed systems need principled strategies (like quorums) rather than simple "assume the other side is dead" logic.

## Practical Example: etcd/ZooKeeper Handling Partitions

Systems like etcd and ZooKeeper (commonly used for distributed coordination — leader election, configuration management, service discovery) are explicitly built as CP systems using quorum-based consensus (Raft for etcd, ZAB for ZooKeeper).

```
5-node etcd cluster, partition splits into {2 nodes} and {3 nodes}

3-node side: has a quorum (3 out of 5) -> elects/retains a leader, continues normal operation
2-node side: lacks a quorum -> cannot elect a leader, refuses writes, effectively unavailable
             until the partition heals and it can rejoin the majority
```

This is precisely why coordination services intentionally favor consistency over availability during a partition — accepting conflicting configuration or leadership state would be far more dangerous than briefly refusing requests.

## Practical Example: Cassandra Handling Partitions (AP-Leaning, Tunable)

```
Partition splits a Cassandra cluster

With consistency level ONE: each side keeps accepting reads/writes independently
                             (favoring availability, accepting temporary divergence)

With consistency level QUORUM: writes require a majority of replicas to acknowledge,
                                behaving more like a CP system for that specific operation
```

Cassandra's tunable consistency (per query) illustrates that the CP/AP choice doesn't have to be a single fixed, system-wide decision — it can be made per-operation based on that operation's actual requirements.

## Designing Applications to Tolerate Partitions Gracefully

```js
async function getInventoryCount(productId) {
  try {
    return await primaryDb.query("SELECT stock FROM inventory WHERE id = ?", [
      productId,
    ]);
  } catch (err) {
    if (isPartitionOrTimeoutError(err)) {
      console.warn("Primary unreachable, falling back to cached/replica data");
      return (
        cache.get(`inventory:${productId}`) ?? { stock: "unknown", stale: true }
      );
    }
    throw err;
  }
}
```

Well-designed applications anticipate partitions as a normal (if infrequent) operating condition, with explicit fallback behavior, rather than treating them as an unhandled exceptional case.

## Common Interview-Style Questions

- **What is a network partition, and why is it considered unavoidable in distributed systems?**
  A failure that splits nodes into groups unable to communicate with each other, despite each node individually still running; it's considered unavoidable because network failures (hardware issues, misconfigurations, extreme latency/overload) are an inherent risk of any system spanning multiple machines/network paths over a long enough timeframe.

- **What is split-brain, and how do quorum-based systems prevent it?**
  A dangerous scenario where multiple sides of a partitioned cluster each believe they're the legitimate primary and independently accept conflicting writes; quorum-based systems prevent this by requiring a majority of nodes to agree before accepting a write, which mathematically guarantees at most one side of any partition can ever have a majority simultaneously.

- **Why can't a node definitively distinguish between "a peer crashed" and "a peer is unreachable due to a network partition"?**
  Both scenarios look identical from the observing node's perspective — it simply stops receiving responses/heartbeats either way; this fundamental ambiguity is why robust distributed systems rely on principled mechanisms like quorums and timeouts rather than assuming a specific cause for unresponsiveness.

- **Why do coordination systems like etcd/ZooKeeper typically favor consistency (CP) over availability during a partition?**
  Because they're used for critical coordination tasks like leader election and configuration management, where accepting conflicting/inconsistent state (e.g., two nodes both believing they're the leader) would be far more dangerous and harder to recover from than briefly refusing requests on the minority side of a partition.

- **Explain the quorum formula W + R > N and what it guarantees.**
  With N total replicas, W replicas required to acknowledge a write, and R replicas required to acknowledge a read, ensuring W + R > N guarantees that any read quorum and the most recent write's quorum must overlap by at least one replica — meaning a read is mathematically guaranteed to see the latest acknowledged write.
