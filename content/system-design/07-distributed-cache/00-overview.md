# Distributed Cache — Interview Prep Overview

Notes for the "design a distributed cache" system design interview (the
Redis-Cluster/Memcached-at-scale problem). This question is deep and
infrastructure-focused: it tests whether you understand how a cache stops
being a single machine's in-memory hash map and becomes a coordinated
cluster — partitioning, rebalancing, replication, and consistency all come
into play in ways a single-node cache never has to deal with.

## Contents

1. `01-redis-cluster.md` — how Redis Cluster (as a canonical example)
   partitions data, handles topology, and routes client requests.
2. `02-consistent-hashing.md` — the partitioning algorithm underlying most
   distributed caches, why naive hashing fails at scale, virtual nodes.
3. `03-cache-invalidation.md` — invalidation strategies, the "two hard
   things in computer science" problem, distributed invalidation.
4. `04-replication.md` — primary-replica replication, failover, consistency
   tradeoffs.
5. `05-interview-questions.md` — question bank with model answers, plus a
   suggested 45-minute interview walkthrough structure.

## How to use this

- Consistent hashing is the conceptual foundation almost everything else
  depends on — read it early even though it's listed third, since Redis
  Cluster's partitioning scheme and rebalancing behavior only make full
  sense once you understand the hashing problem it's solving.
- The four topics map cleanly onto the four questions any distributed
  cache design has to answer: **how is data partitioned across nodes**
  (consistent hashing), **how does a specific real system implement that**
  (Redis Cluster), **how do entries become stale and get removed**
  (invalidation), and **how does the system survive a node failing**
  (replication).
- Practice sketching cluster topology: N nodes, each owning a hash-slot
  range, each replicated to at least one replica, with a client-side or
  proxy-based routing layer directing each key to the right node.
