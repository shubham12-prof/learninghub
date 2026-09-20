# 04. Partitions

## What is a Partition?

A topic is split into one or more **partitions** — each partition is an independent, ordered, append-only log. Partitioning is Kafka's mechanism for both **parallelism** (multiple consumers can process different partitions simultaneously) and **scalability** (a topic's total data/throughput can exceed what a single machine could handle, spread across many partitions on many brokers).

```
Topic: "orders" (3 partitions)

Partition 0: [msg0] [msg3] [msg6] [msg9]  ...
Partition 1: [msg1] [msg4] [msg7] [msg10] ...
Partition 2: [msg2] [msg5] [msg8] [msg11] ...
```

## Ordering Guarantee: Within a Partition Only

Kafka guarantees message order **within a single partition**, but makes **no ordering guarantee across different partitions** of the same topic.

```
Partition 0: A -> B -> C   (guaranteed to be read in this order by any consumer)
Partition 1: X -> Y -> Z   (guaranteed order within itself, but no relative ordering vs Partition 0)
```

This is why the **message key** matters so much (covered in the Producers notes) — messages with the same key always land on the same partition (via a hash of the key), guaranteeing relative order for all events sharing that key (e.g., all events for a specific order or user).

```js
// All events for "order-123" go to the SAME partition, preserving their relative order
await producer.send({
  topic: "orders",
  messages: [
    { key: "order-123", value: "created" },
    { key: "order-123", value: "paid" },
  ],
});
```

## How Many Partitions Should a Topic Have?

More partitions enable more parallelism (more consumers can work simultaneously), but come with trade-offs:

| More Partitions                                                             | Fewer Partitions                                                                                        |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Higher potential throughput (more parallel consumers)                       | Simpler operationally, less overhead                                                                    |
| Higher overhead per partition (more file handles, more replication traffic) | Lower total possible parallelism                                                                        |
| More granular load balancing across a consumer group                        | Risk of a consumer group being "under-parallelized" if there aren't enough partitions for all consumers |

**Practical guidance:** partition count should generally be based on the maximum expected consumer parallelism you'll need (there's no benefit to more consumers in a group than there are partitions — extra consumers simply sit idle), and can be increased later, though not decreased without recreating the topic.

## Partitions and Consumer Parallelism

The number of partitions sets a hard ceiling on how many consumers **within a single consumer group** can actively process a topic in parallel — each partition is assigned to exactly one consumer within a group at a time.

```
Topic with 3 partitions, Consumer Group with 3 consumers:
  Partition 0 -> Consumer A
  Partition 1 -> Consumer B
  Partition 2 -> Consumer C
  (fully parallelized — each consumer handles one partition)

Topic with 3 partitions, Consumer Group with 5 consumers:
  Partition 0 -> Consumer A
  Partition 1 -> Consumer B
  Partition 2 -> Consumer C
  Consumer D, E -> IDLE (no partitions left to assign — wasted capacity)
```

This is a critical capacity-planning consideration: if you anticipate needing to scale a consumer group to N parallel workers, the topic needs at least N partitions.

## Default Partitioning Strategy

```js
// With a key: hash(key) % numPartitions determines the partition (consistent for a given key)
{ key: 'order-123', value: '...' }

// Without a key: Kafka distributes messages using a sticky/round-robin strategy across partitions
{ value: '...' } // no key provided
```

## Custom Partitioning

Some client libraries let you supply custom partitioning logic when the default hash-based approach doesn't fit your needs (e.g., deliberately routing certain high-priority messages to a dedicated partition).

```js
const producer = kafka.producer({
  createPartitioner: () => {
    return ({ message, partitionMetadata }) => {
      // custom logic: e.g., route based on message headers, geography, priority, etc.
      if (message.headers?.priority === "high") return 0; // dedicated partition for high-priority messages
      return Math.floor(Math.random() * partitionMetadata.length);
    };
  },
});
```

## Increasing Partitions (One-Way Operation)

```bash
kafka-topics.sh --alter --topic orders --partitions 6 --bootstrap-server localhost:9092
```

> **Critical caveat:** increasing partition count changes the key-to-partition hash mapping for existing keys going forward — messages with the same key produced before vs after the change may land on _different_ partitions, breaking the "same key always same partition" ordering guarantee across that transition. Plan partition counts carefully upfront; avoid relying on frequent partition count changes for topics where key-based ordering matters.

## Partition Leaders and Replicas (Preview — Full Detail in Replication Notes)

Each partition has one **leader** broker (handling all reads/writes for that partition) and zero or more **follower** replicas (passively replicating the leader's data for fault tolerance).

```
Partition 0: Leader = Broker 1, Replicas = [Broker 1, Broker 2, Broker 3]
```

Producers and consumers always interact with the partition's **current leader** — replicas exist purely for durability/failover, not for load-balancing reads (by default; some setups can allow follower reads for specific use cases, but it's not the default behavior).

## Skewed Partitioning — A Common Real-World Pitfall

If a small number of keys receive a disproportionate share of traffic (a "hot key"), the partitions they hash to become bottlenecks, even if the overall partition count seems sufficient.

```
Example: an e-commerce platform partitioning by customerId
-> one extremely high-volume enterprise customer's events
   all land on a single partition, becoming a hotspot
   while other partitions remain comparatively idle
```

Mitigations include choosing a more evenly-distributed key, adding a synthetic sub-key/salt for extremely hot keys (at the cost of giving up strict ordering for that key), or using a custom partitioner aware of the skew.

## Viewing Partition Details

```bash
kafka-topics.sh --describe --topic orders --bootstrap-server localhost:9092
```

```
Partition: 0   Leader: 1   Replicas: 1,2,3   Isr: 1,2,3
Partition: 1   Leader: 2   Replicas: 2,3,1   Isr: 2,3,1
Partition: 2   Leader: 3   Replicas: 3,1,2   Isr: 3,1,2
```

## Common Interview-Style Questions

- **What is a Kafka partition, and why does Kafka split topics into multiple partitions?**
  A partition is an independent, ordered, append-only log; splitting a topic into multiple partitions enables both parallelism (different consumers in a group can process different partitions simultaneously) and horizontal scalability (a topic's data/throughput can be spread across multiple brokers).

- **Does Kafka guarantee message ordering across an entire topic?**
  No — ordering is only guaranteed within a single partition; there's no relative ordering guarantee between messages in different partitions of the same topic.

- **How does the message key relate to partitioning and ordering?**
  Kafka hashes the key to consistently determine which partition a message goes to — messages sharing the same key always land on the same partition, which is what provides ordering guarantees for related events (e.g., all events for one specific order).

- **What's the relationship between partition count and consumer group parallelism?**
  Each partition can be actively consumed by only one consumer within a given consumer group at a time, so the partition count sets a hard ceiling on how many consumers in that group can work in parallel — extra consumers beyond the partition count sit idle.

- **Why is increasing a topic's partition count a decision that should be made carefully upfront rather than adjusted frequently?**
  Changing the partition count changes the key-to-partition hash mapping going forward, meaning messages with the same key produced before versus after the change could land on different partitions — breaking the "same key, same partition" ordering guarantee across that transition for any consumers relying on it.

- **What is a "hot partition," and how might it occur?**
  A partition receiving disproportionately more traffic than others, often caused by a small number of high-volume keys (a "hot key") consistently hashing to the same partition — mitigated by choosing more evenly-distributed keys, adding a salt/sub-key for extremely hot keys, or using custom partitioning logic aware of the skew.
