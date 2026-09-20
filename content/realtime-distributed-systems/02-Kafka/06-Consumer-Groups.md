# 06. Consumer Groups

## What is a Consumer Group?

A consumer group is a named set of consumer instances that **collaborate** to consume a topic's partitions, with Kafka automatically distributing partitions among the group's members so each partition is processed by exactly one consumer within that group at any given time. This is the mechanism behind Kafka's horizontal scalability for consumption.

```js
const consumer = kafka.consumer({ groupId: "order-processing-group" });
```

## How Partition Assignment Works

```
Topic "orders" — 3 partitions
Consumer Group "order-processing-group" — 3 consumer instances

  Partition 0  -->  Consumer A
  Partition 1  -->  Consumer B
  Partition 2  -->  Consumer C
```

Each partition is assigned to exactly **one** consumer within the group — never split across multiple consumers in the same group simultaneously. This is what guarantees ordered processing within a partition even with a scaled-out group of consumers.

## Multiple Independent Consumer Groups on the Same Topic

Different consumer groups reading the same topic are **completely independent** of each other — each group tracks its own offsets, and messages are delivered to every group (not divided among groups the way partitions are divided among consumers within one group).

```
Topic "orders"
      │
      ├──> Consumer Group "order-processing"    (processes orders, e.g., fulfillment logic)
      ├──> Consumer Group "analytics-pipeline"    (independently reads the SAME messages for analytics)
      └──> Consumer Group "fraud-detection"        (independently reads the SAME messages for fraud checks)
```

This is one of Kafka's most powerful properties — the same event stream can power multiple, entirely separate downstream systems without the producer needing any awareness of who's consuming it, and without one consumer's processing speed affecting another's.

## Consumer Group ID — How Groups Are Identified

```js
const consumerA = kafka.consumer({ groupId: "order-processing" }); // joins/creates this group
const consumerB = kafka.consumer({ groupId: "order-processing" }); // joins the SAME group — shares partitions with consumerA
const consumerC = kafka.consumer({ groupId: "analytics-pipeline" }); // a DIFFERENT, independent group
```

## Rebalancing — What Happens When Group Membership Changes

Whenever a consumer joins or leaves a group (scaling up/down, a crash, a deploy), Kafka triggers a **rebalance** — redistributing partitions among the currently active members of the group.

```
Before: 3 partitions, 2 consumers
  Partition 0, 1 -> Consumer A
  Partition 2     -> Consumer B

Consumer C joins the group -> REBALANCE triggered

After: 3 partitions, 3 consumers
  Partition 0 -> Consumer A
  Partition 1 -> Consumer B
  Partition 2 -> Consumer C
```

During a rebalance, consumption from affected partitions **pauses briefly** while Kafka determines the new assignment — frequent rebalances (e.g., from consumers crashing/restarting repeatedly) can noticeably hurt throughput, making consumer stability an important operational concern.

## Handling Rebalance Events in Application Code

```js
const consumer = kafka.consumer({ groupId: "order-processing-group" });

consumer.on(consumer.events.REBALANCING, () => {
  console.log("Rebalance starting — partition assignments will change");
});

consumer.on(consumer.events.GROUP_JOIN, ({ payload }) => {
  console.log("Rebalance complete, new assignment:", payload.memberAssignment);
});
```

Rebalance-aware code sometimes needs to flush in-progress work or clean up partition-specific state before losing ownership of a partition — more advanced clients expose hooks for this (e.g., a listener called just before a partition is revoked).

## Partition Assignment Strategies

Kafka supports different algorithms for how partitions get distributed among a group's consumers:

| Strategy                                                | Behavior                                                                                                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Range**                                               | Assigns contiguous partition ranges per topic to each consumer — can lead to uneven distribution across multiple topics                                       |
| **Round Robin**                                         | Distributes partitions evenly across consumers, considering all subscribed topics together                                                                    |
| **Sticky**                                              | Aims to preserve as much of the previous assignment as possible during a rebalance, minimizing unnecessary partition movement                                 |
| **Cooperative Sticky** (modern default in many clients) | An incremental version of sticky assignment that avoids a full "stop-the-world" rebalance — only reassigns the specific partitions that actually need to move |

```js
const consumer = kafka.consumer({
  groupId: "order-processing-group",
  // partition assignment strategy configuration varies by client library
});
```

Cooperative/incremental rebalancing (as opposed to older "eager" rebalancing, which revokes all partitions from all consumers before reassigning) significantly reduces the disruption/pause caused by group membership changes.

## Scaling a Consumer Group

```
Adding consumers UP TO the partition count -> increases parallelism, reduces per-consumer load
Adding consumers BEYOND the partition count -> extra consumers sit completely idle
```

```
3 partitions, scaling from 1 -> 2 -> 3 consumers: each addition increases parallelism
3 partitions, scaling from 3 -> 4 consumers: the 4th consumer has NO partition to process
```

This is why partition count planning (covered in the Partitions notes) directly determines a consumer group's maximum useful scale.

## Static Group Membership (Reducing Unnecessary Rebalances)

For consumers that restart frequently (rolling deploys, brief network blips) but should be treated as "the same member" rather than triggering a full rebalance each time, Kafka supports assigning a persistent identity.

```js
const consumer = kafka.consumer({
  groupId: "order-processing-group",
  groupInstanceId: "consumer-instance-1", // persistent identity across restarts within the session timeout
});
```

With a `groupInstanceId` set, a brief restart within the configured session timeout is treated as the same member rejoining (retaining its prior partition assignment) rather than triggering a disruptive full rebalance.

## Monitoring Consumer Groups

```bash
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list

kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group order-processing-group
```

```
GROUP                  TOPIC   PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG  CONSUMER-ID
order-processing-group orders  0          950              1000            50   consumer-1-abc...
order-processing-group orders  1          1000             1000            0    consumer-2-def...
order-processing-group orders  2          800              1000            200  consumer-3-ghi...
```

## Practical Example: Scaling Order Processing

```js
// Deploy N instances of this same service — Kafka automatically distributes partitions among them
const consumer = kafka.consumer({ groupId: "order-processing-group" });

await consumer.connect();
await consumer.subscribe({ topic: "orders", fromBeginning: false });

await consumer.run({
  eachMessage: async ({ partition, message }) => {
    console.log(`Processing on partition ${partition}`);
    await processOrder(JSON.parse(message.value.toString()));
  },
});
```

Running 3 copies of this exact code (e.g., 3 Kubernetes pods, same `groupId`) against a 3-partition topic automatically parallelizes processing with zero additional coordination code — Kafka's group protocol handles the partition distribution entirely.

## Common Interview-Style Questions

- **What is a Kafka consumer group, and what problem does it solve?**
  A named set of consumer instances that collaborate to consume a topic, with Kafka automatically distributing partitions so each is handled by exactly one consumer in the group at a time — this enables horizontal scaling of message processing without any custom coordination logic in application code.

- **What happens if two consumers with the same `groupId` both try to process the same partition?**
  They can't — Kafka guarantees each partition is assigned to exactly one consumer within a given group at any time; the group's partition assignment protocol ensures this exclusivity.

- **How do multiple, different consumer groups reading the same topic interact with each other?**
  They're completely independent — each group tracks its own committed offsets and receives the full set of messages, unaffected by other groups' processing speed or position; this is what allows the same event stream to power multiple unrelated downstream systems.

- **What is a rebalance, and when does it occur?**
  A redistribution of partition assignments among a consumer group's active members, triggered whenever group membership changes (a consumer joins, leaves, or is detected as failed); it typically causes a brief pause in consumption from affected partitions while the new assignment is determined.

- **What happens if you add more consumers to a group than there are partitions in the topic?**
  The extra consumers beyond the partition count receive no partition assignment and sit completely idle, since each partition can only be assigned to one consumer within the group — partition count sets the hard ceiling on useful parallelism for a single consumer group.

- **What is cooperative/incremental rebalancing, and why is it preferred over the older "eager" approach?**
  It reassigns only the specific partitions that actually need to move during a rebalance, rather than revoking all partitions from all consumers before reassigning everything from scratch — significantly reducing the processing pause/disruption caused by group membership changes.
