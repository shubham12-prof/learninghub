# 01. CAP Theorem

## What is the CAP Theorem?

The CAP theorem, formalized by Eric Brewer, states that a distributed data system can only provide **two out of three** of the following guarantees simultaneously, in the presence of a network partition:

- **C**onsistency — every read receives the most recent write or an error.
- **A**vailability — every request receives a (non-error) response, without guarantee it contains the most recent write.
- **P**artition Tolerance — the system continues to operate despite network partitions (messages between nodes being dropped or delayed).

```
        Consistency
           /  \
          /    \
   CP    /      \    CA
        /        \
Partition ------- Availability
Tolerance
```

## The Critical Nuance: P Isn't Really Optional

In any real distributed system spanning multiple machines/networks, network partitions **will** eventually happen — a switch fails, a cable is cut, a data center loses connectivity. Since partition tolerance isn't something you can opt out of in practice, the real-world choice CAP describes is actually just:

**When a partition occurs, do you sacrifice Consistency or Availability?**

`CA` systems (consistent and available, but not partition-tolerant) are really only a meaningful category for single-node systems, or systems that don't need to tolerate a network partition at all — the moment you're truly distributed across an unreliable network, you must choose between CP and AP during a partition.

## CP Systems — Choosing Consistency Over Availability

During a network partition, a CP system will **refuse to respond** (or return an error) rather than risk returning stale or conflicting data.

```
Partition occurs, splitting the cluster into two groups: {Node A} and {Node B, Node C}

CP behavior: Node A (isolated, can't confirm it has the latest data)
             refuses writes/reads rather than risk inconsistency
             -> Node A becomes UNAVAILABLE until the partition heals
```

**Examples of CP-leaning systems:** MongoDB (with majority write/read concerns), HBase, ZooKeeper, etcd, traditional RDBMS with synchronous replication.

## AP Systems — Choosing Availability Over Consistency

During a partition, an AP system keeps responding to reads/writes on **every** side of the partition, accepting that different nodes might temporarily hold divergent, inconsistent data — to be reconciled later once the partition heals.

```
Partition occurs: {Node A} and {Node B, Node C}

AP behavior: Both sides keep accepting writes independently
             -> Node A might have different data than Node B/C
                until the partition heals and they reconcile
```

**Examples of AP-leaning systems:** Cassandra, DynamoDB, CouchDB, Riak — many systems designed explicitly for "eventual consistency."

## CAP in Practice — It's a Spectrum, Not a Strict Binary Choice

Real systems often let you **tune** this trade-off per-operation rather than making one fixed system-wide choice.

```js
// Cassandra example — consistency level is configurable PER QUERY
// ONE: fastest, most available, weakest consistency
// QUORUM: majority of replicas must respond — balanced
// ALL: strongest consistency, least available (fails if any replica is down)

const query = "SELECT * FROM users WHERE id = ?";
// client.execute(query, [id], { consistency: types.consistencies.quorum });
```

Many modern databases (Cassandra, DynamoDB, CockroachDB) let you choose consistency level per read/write, effectively letting different parts of an application make different CAP trade-offs based on their specific requirements.

## PACELC — An Extension of CAP

CAP only describes behavior **during a partition**. PACELC extends the idea to also describe behavior during **normal operation** (no partition):

> **If** there's a **P**artition, choose between **A**vailability and **C**onsistency; **e**lse (normal operation), choose between **L**atency and **C**onsistency.

```
PA/EL systems (e.g., Cassandra, DynamoDB):
  During partition: favor Availability
  During normal operation: favor Latency (weaker consistency, faster responses)

PC/EC systems (e.g., traditional RDBMS with sync replication, some configurations of MongoDB):
  During partition: favor Consistency
  During normal operation: favor Consistency (accept higher latency for strong guarantees)
```

PACELC captures an important reality CAP alone misses: even without any partition at all, there's still a fundamental trade-off between how strongly consistent a system is and how fast it can respond, because achieving strong consistency across replicas requires coordination overhead.

## Real-World Examples Mapped to CAP Leanings

| System                                            | Typical Leaning                                          | Notes                                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Traditional RDBMS (single primary, sync replicas) | CP                                                       | Prioritizes consistency; can become unavailable if replicas can't confirm                             |
| MongoDB (default majority write concern)          | CP-leaning                                               | Configurable, but defaults favor consistency over availability during a partition                     |
| Cassandra                                         | AP-leaning (tunable)                                     | Designed for availability, but consistency level configurable per-query                               |
| DynamoDB                                          | AP-leaning (tunable)                                     | Offers both "eventually consistent" and "strongly consistent" reads, at different cost/latency        |
| ZooKeeper / etcd                                  | CP                                                       | Explicitly designed for strong consistency, used for coordination/consensus (leader election, config) |
| Redis (single instance)                           | CA in a trivial sense (no partition risk if single node) | Redis Cluster mode introduces real partition-tolerance trade-offs                                     |

## Practical Example: An E-Commerce System's Different CAP Needs

Different parts of the **same application** often want different CAP trade-offs:

```
Inventory count during checkout:
  -> Leaning CP: better to briefly reject a purchase than oversell a limited-stock item

Product recommendations / "recently viewed" list:
  -> Leaning AP: showing slightly stale recommendations is much better than
     showing an error page just because one replica is temporarily unreachable

User's shopping cart:
  -> Often AP-leaning: available and responsive is more important
     than perfect real-time consistency across devices
```

This is why many real architectures mix databases with different CAP characteristics for different subsystems, rather than forcing one CAP choice across an entire application.

## Common Interview-Style Questions

- **State the CAP theorem in your own words.**
  A distributed system can provide at most two of Consistency, Availability, and Partition Tolerance simultaneously; since network partitions are an unavoidable reality in any truly distributed system, the practical choice becomes whether to sacrifice consistency or availability when a partition actually occurs.

- **Why is "CA" (consistent and available, but not partition-tolerant) not a realistic option for a genuinely distributed system?**
  Because network partitions are an inherent possibility whenever multiple nodes communicate over a network — a system that isn't partition-tolerant either isn't truly distributed (e.g., a single node) or will simply fail/behave incorrectly whenever a real partition occurs, rather than making a deliberate, safe trade-off.

- **What's the practical difference in behavior between a CP and an AP system during a network partition?**
  A CP system will refuse requests (become unavailable) on the side of the partition that can't guarantee up-to-date consistency; an AP system continues accepting reads/writes on both sides of the partition, accepting the risk of temporarily divergent data that must be reconciled once the partition heals.

- **What does PACELC add on top of CAP?**
  It extends the trade-off to normal (non-partitioned) operation, framing it as a choice between latency and consistency even when there's no partition — capturing the reality that strong consistency requires coordination overhead that adds latency, independent of partition scenarios.

- **Give a real-world example where different parts of the same application might want different CAP trade-offs.**
  An e-commerce platform might want strong consistency (CP-leaning) for inventory/stock counts during checkout to avoid overselling, while favoring availability (AP-leaning) for something like a "recently viewed products" feature, where showing slightly stale data is far preferable to showing an error.
