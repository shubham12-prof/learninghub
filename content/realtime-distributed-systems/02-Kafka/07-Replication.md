# 07. Replication

## Why Replication?

Kafka replicates each partition's data across multiple brokers so the system can tolerate broker failures without losing data or becoming unavailable. Replication is Kafka's core mechanism for **fault tolerance and durability**.

## Replication Factor

The replication factor determines how many total copies of each partition exist across the cluster.

```bash
kafka-topics.sh --create \
  --topic orders \
  --partitions 3 \
  --replication-factor 3 \
  --bootstrap-server localhost:9092
```

With `replication-factor 3`, each partition has 3 copies spread across 3 different brokers — the cluster can lose up to 2 brokers holding a given partition's replicas and still not lose that partition's data (as long as at least one replica survives).

> Replication factor cannot exceed the number of brokers in the cluster (you can't have 3 copies of a partition with only 2 brokers available).

## Leaders and Followers

For each partition, exactly one replica is elected the **leader**; all others are **followers**.

```
Partition 0:  Leader = Broker 1
              Followers = Broker 2, Broker 3
```

- **All reads and writes for a partition go through its leader** — producers and consumers interact only with the leader broker for that partition (by default).
- **Followers passively replicate** the leader's log by continuously fetching new messages from it, staying in sync.

```bash
kafka-topics.sh --describe --topic orders --bootstrap-server localhost:9092
```

```
Partition: 0   Leader: 1   Replicas: 1,2,3   Isr: 1,2,3
```

## In-Sync Replicas (ISR)

The ISR (In-Sync Replica set) is the subset of a partition's replicas that are fully caught up with the leader (within a configurable lag threshold) at any given moment — this is the set of replicas eligible to be promoted to leader if the current leader fails.

```
Replicas: [1, 2, 3]     <- ALL replicas assigned to this partition
Isr: [1, 2, 3]           <- currently caught-up and eligible for leader election

If Broker 3 falls behind (e.g., slow disk, network issue):
Isr: [1, 2]               <- Broker 3 temporarily excluded from ISR until it catches back up
```

A replica falls out of the ISR if it doesn't fetch new data from the leader within `replica.lag.time.max.ms` (default 30 seconds) — protecting against promoting a stale, out-of-date replica to leader.

## Leader Election on Failure

If a partition's leader broker crashes, Kafka automatically elects a new leader from the current ISR — typically completing within seconds, restoring availability for that partition.

```
Broker 1 (leader) crashes
        │
        ▼
Kafka elects a new leader from the ISR (e.g., Broker 2)
        │
        ▼
Producers/consumers automatically redirected to the new leader (Broker 2)
```

## `min.insync.replicas` — Durability Enforcement

Works together with the producer's `acks` setting (covered in the Producers notes) to enforce a minimum durability guarantee.

```bash
kafka-configs.sh --alter \
  --entity-type topics --entity-name orders \
  --add-config min.insync.replicas=2 \
  --bootstrap-server localhost:9092
```

With `min.insync.replicas=2` and producer `acks=all`, a write is only acknowledged as successful if **at least 2 replicas** (including the leader) have it — if fewer than 2 replicas are currently in the ISR, the producer receives an error rather than a false "success," preventing silent data loss.

```
acks=all + min.insync.replicas=2:
  ISR has 3 members -> write succeeds normally (waits for all 3... actually waits for ALL current ISR members, and requires at least min.insync.replicas to exist)
  ISR shrinks to 1 (below min.insync.replicas=2) -> producer receives NotEnoughReplicasException, write REJECTED
```

This combination is the standard configuration for topics where data loss is genuinely unacceptable (financial transactions, critical audit logs).

## Unclean Leader Election — A Durability vs Availability Trade-off

If **all** in-sync replicas for a partition become unavailable simultaneously, Kafka faces a choice: wait for one to come back (favoring durability, but the partition becomes unavailable in the meantime), or elect an out-of-sync replica as the new leader anyway (favoring availability, but risking data loss from messages the out-of-sync replica never received).

```bash
kafka-configs.sh --alter \
  --entity-type topics --entity-name orders \
  --add-config unclean.leader.election.enable=false \
  --bootstrap-server localhost:9092
```

| Setting                                                               | Behavior                                                                                                                                               |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `unclean.leader.election.enable=false` (safer, generally recommended) | Partition remains unavailable until an in-sync replica returns — prioritizes not losing data                                                           |
| `unclean.leader.election.enable=true`                                 | An out-of-sync replica can be elected leader to restore availability quickly — risks losing messages that only existed on the replicas that were ahead |

## Replication and Fault Tolerance in Practice

```
3 brokers, replication factor 3, partition 0:
  Broker 1: Leader
  Broker 2: Follower (in ISR)
  Broker 3: Follower (in ISR)

Broker 1 fails:
  -> Kafka elects Broker 2 (or 3) as the new leader from the ISR
  -> No data loss (both followers were fully caught up)
  -> Brief availability blip during leader election, then normal operation resumes

If instead replication-factor was 1 (no replicas):
  Broker 1 fails -> partition 0's data is COMPLETELY UNAVAILABLE until Broker 1 recovers,
                     and PERMANENTLY LOST if the disk itself failed
```

## Replication vs Partitioning — Not the Same Thing

|              | Partitioning                                                                        | Replication                                                                              |
| ------------ | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Purpose      | Parallelism and scalability (spreading a topic's data/load across multiple brokers) | Fault tolerance and durability (copies of the same partition's data on multiple brokers) |
| Relationship | A topic is split into multiple partitions                                           | Each partition is copied across multiple brokers                                         |

A topic with 3 partitions and replication factor 3 actually results in **9 total partition replicas** spread across the cluster (3 partitions × 3 copies each) — though only 3 of those (one leader per partition) are "active" for reads/writes at any given moment.

## Rack Awareness (Production Consideration)

In production, Kafka can be configured to be aware of physical rack/availability-zone placement, ensuring a partition's replicas are spread across different racks/AZs rather than potentially landing on brokers that could all fail together (e.g., a single rack losing power).

```
broker.rack=us-east-1a   (set per-broker in server.properties)
```

This ensures replication actually provides meaningful fault tolerance against realistic failure domains, not just against individual broker process crashes.

## Common Interview-Style Questions

- **What does Kafka's replication factor control, and what's a practical constraint on its value?**
  It determines how many total copies of each partition exist across the cluster; it cannot exceed the number of available brokers, since each replica must live on a different broker.

- **What's the difference between a partition's leader and its followers?**
  The leader handles all reads and writes for that partition by default; followers passively replicate the leader's log by continuously fetching new data, existing purely for fault tolerance/failover rather than serving regular traffic themselves.

- **What is the ISR (in-sync replica set), and why does it matter?**
  The subset of a partition's replicas that are currently fully caught up with the leader within an allowed lag threshold; it matters because only ISR members are eligible to be elected the new leader if the current leader fails, protecting against promoting a stale replica.

- **How do `acks=all` and `min.insync.replicas` work together to guarantee durability?**
  `acks=all` tells the producer to wait for acknowledgment from all current in-sync replicas; `min.insync.replicas` sets a floor on how many replicas must actually be in the ISR for a write to be accepted at all — together, they ensure a write is never falsely acknowledged as durable when too few replicas actually have it.

- **What is unclean leader election, and what trade-off does it represent?**
  Electing an out-of-sync replica as leader when no in-sync replicas are available, restoring availability quickly at the risk of losing messages the promoted replica never received; disabling it (the generally recommended safer default) prioritizes not losing data over restoring availability immediately.

- **How do partitioning and replication differ in purpose?**
  Partitioning splits a topic's data across multiple brokers for parallelism/scalability; replication creates multiple copies of each partition across brokers for fault tolerance/durability — they're complementary, not the same mechanism.
