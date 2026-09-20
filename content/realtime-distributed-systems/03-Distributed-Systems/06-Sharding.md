# 06. Sharding

## What is Sharding?

Sharding (also called horizontal partitioning) splits a dataset across multiple independent nodes, so each node holds only a **subset** of the total data, rather than every node holding a full copy (which is what replication does instead). Sharding is how distributed systems scale beyond what any single machine's storage or throughput could handle.

```
Unsharded: [Node A holds ALL data]  <- storage/throughput ceiling = one machine's capacity

Sharded:   [Node A: users A-H]  [Node B: users I-P]  [Node C: users Q-Z]
           <- total capacity scales with the number of nodes
```

> Sharding and replication are complementary, not competing techniques — most large-scale systems use both together: data is sharded across many nodes for scale, and each shard is separately replicated for fault tolerance.

## Sharding Strategies

### 1. Range-Based Sharding

Data is partitioned based on contiguous ranges of a chosen key.

```
Shard 1: user_id 1-1000000
Shard 2: user_id 1000001-2000000
Shard 3: user_id 2000001-3000000
```

**Pros:** efficient range queries (a query for "user_id between 500 and 600" hits only one shard).
**Cons:** risk of "hot spots" if data/traffic isn't evenly distributed across the range (e.g., if user IDs are assigned sequentially and most active users are recent signups, the newest shard gets disproportionate traffic).

### 2. Hash-Based Sharding

A hash function is applied to the shard key, and the result determines which shard the data belongs to.

```
shard_index = hash(user_id) % number_of_shards
```

**Pros:** generally even distribution of data/traffic across shards, regardless of the underlying key distribution.
**Cons:** range queries become inefficient (a range of original key values maps to essentially random shards, requiring a broadcast query across all of them); resharding (changing the number of shards) requires re-hashing and moving most existing data.

### 3. Consistent Hashing — Solving the Resharding Problem

A refinement of hash-based sharding designed to minimize data movement when shards are added or removed — a critical property for systems that need to scale elastically without massive, disruptive data reshuffling.

```
Naive hashing: shard_index = hash(key) % N
  -> changing N (adding/removing a shard) reassigns almost EVERY key to a different shard

Consistent hashing: nodes and keys are placed on a conceptual "ring" (hash space)
  -> adding/removing one node only affects the keys immediately adjacent to it on the ring,
     not the entire dataset
```

```
        Hash Ring (0 to 2^32-1)
             Node A
           ↗        ↘
    Node D              Node B
           ↖        ↙
             Node C

A key hashes to a position on the ring; it belongs to the NEXT node clockwise from that position.
Adding a new node only reassigns keys between it and its counter-clockwise neighbor — everything else stays put.
```

Consistent hashing is the technique behind many distributed caches (Memcached client libraries), distributed databases (Cassandra, DynamoDB), and CDN request routing.

### 4. Directory-Based (Lookup Table) Sharding

A separate service/table explicitly maps each key (or key range) to its shard, rather than deriving the mapping algorithmically.

```
Lookup Service:
  user_id 1-1000    -> Shard A
  user_id 1001-5000  -> Shard B
  user_id 5001-9000   -> Shard C
```

**Pros:** maximum flexibility — can rebalance individual keys/ranges without a rigid formula, supports arbitrary custom placement logic.
**Cons:** the lookup service itself becomes a critical dependency and potential bottleneck/single point of failure (though it can itself be replicated/cached).

## Choosing a Shard Key — The Most Important Sharding Decision

A well-chosen shard key should have:

- **High cardinality** — many distinct values, enabling fine-grained, even distribution.
- **Even access patterns** — no single value receiving disproportionate traffic ("hot key").
- **Alignment with common query patterns** — ideally, most queries include the shard key, so they can be routed to a single shard rather than requiring a broadcast across all of them.

```
BAD shard key: "country" — a small number of possible values, likely very uneven
               (e.g., a huge fraction of users might be in just 2-3 countries)

GOOD shard key: "user_id" — high cardinality, generally even distribution,
                and most user-related queries naturally include a user_id
```

## Cross-Shard Queries — A Fundamental Sharding Challenge

Once data is spread across shards, queries that need data from multiple shards become significantly more complex and expensive than they would be in an unsharded system.

```
Single-shard query (fast):
  "Get user 12345's orders" -> hits exactly ONE shard (assuming sharded by user_id)

Cross-shard query (slow, expensive):
  "Get the total revenue across ALL users this month" -> must query EVERY shard and aggregate results
```

Application/database design should aim to minimize cross-shard queries by choosing a shard key aligned with the most common/critical query patterns — accepting that some inherently cross-cutting queries (analytics, reporting) will remain expensive and may need a separate analytical data store (like a data warehouse) rather than querying the sharded operational database directly.

## Rebalancing Shards

As data grows unevenly or shard count changes, data needs to be redistributed ("rebalanced") across shards.

```
Before rebalancing: Shard A has 80% of the data, Shard B has 20%  <- imbalanced, Shard A is a bottleneck
After rebalancing:  Shard A has 50%, Shard B has 50%               <- balanced
```

Rebalancing is operationally risky and resource-intensive — it involves moving large amounts of data between live nodes while the system continues serving traffic. Consistent hashing (discussed above) specifically minimizes how much data movement is required per rebalancing event.

## Practical Example: Sharding an E-Commerce Database

```
Sharding strategy: hash(customer_id) % 4

Shard 0: customers where hash(customer_id) % 4 == 0
Shard 1: customers where hash(customer_id) % 4 == 1
Shard 2: customers where hash(customer_id) % 4 == 2
Shard 3: customers where hash(customer_id) % 4 == 3

Each shard holds that customer's full profile, orders, and order history together
-> "get customer's order history" queries stay within a single shard (fast)
-> "total revenue across all customers" requires querying all 4 shards and summing (slow, run less often / via a separate analytics pipeline)
```

## Sharding vs Replication — Key Distinction Recap

|                         | Sharding                                                          | Replication                                                                    |
| ----------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Purpose                 | Distribute DIFFERENT data across nodes (scale storage/throughput) | Distribute COPIES of the SAME data across nodes (fault tolerance/availability) |
| Effect of adding a node | Increases total capacity                                          | Increases redundancy, not total capacity                                       |
| Data on each node       | A subset of the total dataset                                     | A full copy of whatever it's replicating                                       |

## Common Interview-Style Questions

- **What problem does sharding solve that replication alone doesn't?**
  Replication copies the entire dataset to multiple nodes for fault tolerance/availability, but doesn't help when the dataset or throughput exceeds what a single node can handle; sharding solves this by splitting the data itself across multiple nodes, each holding only a subset — the two techniques are typically used together in large systems.

- **What makes a good shard key?**
  High cardinality (many distinct values for even distribution), even access patterns (no disproportionately "hot" values), and alignment with the application's most common query patterns (so most queries can be routed to a single shard rather than requiring a cross-shard broadcast).

- **What problem does consistent hashing solve compared to naive `hash(key) % N` sharding?**
  Naive modulo-based hashing requires reassigning almost every key when the number of shards (N) changes; consistent hashing places nodes and keys on a conceptual ring so that adding or removing a node only affects the keys immediately adjacent to it, dramatically minimizing data movement during rebalancing.

- **Why are cross-shard queries expensive, and how do systems typically handle them?**
  Because the required data is spread across multiple independent nodes, a cross-shard query must fan out to every relevant shard and aggregate results, unlike a single-shard query that can be served by one node directly; systems typically minimize this by choosing a shard key aligned with common query patterns, and route genuinely cross-cutting queries (like analytics) to a separate data store designed for that purpose instead of the sharded operational database.

- **What is shard rebalancing, and why is it operationally risky?**
  Redistributing data across shards as the dataset grows unevenly or the number of shards changes; it's risky because it involves moving potentially large volumes of data between live production nodes while the system continues serving traffic, with real potential for performance impact or data inconsistency if not executed carefully.
