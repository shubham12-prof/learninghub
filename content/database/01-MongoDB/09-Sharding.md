# 09. Sharding

## What is Sharding?

Sharding is MongoDB's method of **horizontal scaling** — distributing data across multiple servers (shards) so that no single machine needs to store or process the entire dataset. It's essential once a dataset or workload grows too large for a single replica set to handle efficiently (in terms of storage, RAM, or write throughput).

```
Vertical scaling  -> bigger/more powerful single machine (has limits)
Horizontal scaling (sharding) -> spread data across many machines (scales much further)
```

## Sharded Cluster Architecture

```
                ┌─────────────┐
   Client  ---> │   mongos    │  (query router)
                └──────┬──────┘
        ┌──────────────┼──────────────┐
        ▼               ▼               ▼
   ┌─────────┐     ┌─────────┐     ┌─────────┐
   │ Shard 1  │     │ Shard 2  │     │ Shard 3  │   <- each shard is itself a replica set
   │(replica  │     │(replica  │     │(replica  │
   │  set)    │     │  set)    │     │  set)    │
   └─────────┘     └─────────┘     └─────────┘
                ┌─────────────┐
                │ Config Servers│  <- store cluster metadata (which data lives on which shard)
                └─────────────┘
```

| Component          | Role                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------- |
| **Shard**          | Holds a subset of the data; each shard is typically its own replica set for high availability |
| **mongos**         | Query router — the application connects here; it routes queries to the correct shard(s)       |
| **Config Servers** | Store cluster metadata, including the mapping of data ranges to shards                        |

## The Shard Key

The **shard key** is the field (or fields) MongoDB uses to determine which shard a document belongs to. Choosing a good shard key is the single most important decision in a sharding strategy — a poor choice can severely hurt performance and is very difficult to change later.

```js
sh.shardCollection("myApp.orders", { customerId: 1 });
```

### Characteristics of a Good Shard Key

- **High cardinality** — many distinct possible values, so data spreads evenly.
- **Even distribution** — avoids "hot" shards receiving disproportionate traffic.
- **Query isolation** — ideally, most queries include the shard key, so `mongos` can route directly to a single shard instead of broadcasting to all of them.

### Example of a Bad Shard Key

```js
sh.shardCollection("myApp.orders", { status: 1 }); // BAD
// Only a few possible values ("pending", "completed", "cancelled")
// -> data (and write load) concentrates on very few shards ("hot shard" problem)
```

### Example of a Better Shard Key

```js
sh.shardCollection("myApp.orders", { customerId: 1, createdAt: 1 }); // compound shard key
// High cardinality (many distinct customers), spreads data and write load evenly
```

## Sharding Strategies

### Ranged Sharding

Documents are partitioned into contiguous ranges of shard key values.

```js
sh.shardCollection("myApp.events", { timestamp: 1 });
```

**Pros:** efficient range queries (`find({ timestamp: { $gte: ..., $lt: ... } })` hits only relevant shards).
**Cons:** risk of "hot shard" if writes cluster around a narrow, monotonically increasing range (e.g., always writing near "now").

### Hashed Sharding

MongoDB computes a hash of the shard key value to determine placement, spreading data much more evenly regardless of the underlying value distribution.

```js
sh.shardCollection("myApp.events", { _id: "hashed" });
```

**Pros:** excellent write distribution, avoids hot shards even with monotonically increasing keys.
**Cons:** range queries become inefficient (a range of original values maps to essentially random shards, requiring a broadcast query across all shards).

### Zoned (Tag-Aware) Sharding

Assigns specific ranges of shard key values to specific shards — useful for geographic data locality (e.g., keeping EU customer data on EU-based shards for compliance).

```js
sh.addShardToZone("shard0000", "US");
sh.addShardToZone("shard0001", "EU");

sh.updateZoneKeyRange(
  "myApp.customers",
  { region: "US", _id: MinKey },
  { region: "US", _id: MaxKey },
  "US",
);
```

## Setting Up Sharding (Simplified Overview)

```js
// 1. Enable sharding on a database
sh.enableSharding("myApp");

// 2. Shard a specific collection with a chosen shard key
sh.shardCollection("myApp.orders", { customerId: 1 });

// 3. Check shard distribution
sh.status();
db.orders.getShardDistribution();
```

## Query Routing Behavior

- **Targeted queries** (include the shard key) — `mongos` routes directly to the relevant shard(s), fast.
- **Scatter-gather queries** (don't include the shard key) — `mongos` must broadcast to **all** shards and merge results, much slower at scale.

```js
// Targeted — fast, hits only the relevant shard
db.orders.find({ customerId: "cust_123" });

// Scatter-gather — slow at scale, hits ALL shards
db.orders.find({ status: "pending" }); // status isn't part of the shard key
```

Designing queries (and shard keys) so that common queries are targeted, not scatter-gather, is central to a performant sharded architecture.

## Chunk Splitting and Balancing

MongoDB automatically splits data into **chunks** (default target size ~128MB in modern versions) and redistributes them across shards via a background **balancer** process, keeping data volume roughly even across all shards over time.

```js
sh.getBalancerState(); // check if the balancer is running
sh.setBalancerState(true); // enable/disable manually if needed (e.g., during a maintenance window)
```

## When Do You Actually Need Sharding?

Sharding adds significant operational complexity — it should be adopted only when genuinely needed, not preemptively:

- Dataset size exceeds what a single replica set's storage/RAM can handle efficiently.
- Write throughput exceeds what a single primary can sustain.
- You need geographic data distribution/locality for compliance or latency reasons.

For many applications, a well-indexed, properly-provisioned **replica set** (without sharding) handles substantial scale perfectly well — sharding is a scaling tool for genuinely large systems, not a default starting architecture.

## Common Interview-Style Questions

- **What problem does sharding solve that replication alone doesn't?**
  Replication provides redundancy/availability by copying the _entire_ dataset to multiple servers; it doesn't help when the dataset or write throughput exceeds what a single server can handle. Sharding solves this by horizontally partitioning data across multiple shards, each holding only a subset.

- **What is a shard key, and why is choosing a good one so important?**
  The field(s) used to determine which shard a document belongs to; a poor choice (low cardinality, uneven distribution) can create "hot shards" that bottleneck performance, and shard keys are very difficult to change after data is distributed.

- **What's the difference between ranged and hashed sharding?**
  Ranged sharding partitions data into contiguous value ranges (efficient for range queries but risks hot shards with monotonically increasing keys); hashed sharding distributes data based on a hash of the key (excellent write distribution but poor for range queries, since a range maps to essentially random shards).

- **What's the difference between a "targeted" and a "scatter-gather" query in a sharded cluster?**
  A targeted query includes the shard key, letting `mongos` route it directly to the relevant shard(s); a scatter-gather query lacks the shard key, forcing `mongos` to query all shards and merge results, which is significantly slower at scale.

- **What is the role of `mongos` in a sharded cluster?**
  It acts as a query router that the application connects to; it consults the config servers' metadata to determine which shard(s) a query should be routed to, and merges results from multiple shards when necessary.
