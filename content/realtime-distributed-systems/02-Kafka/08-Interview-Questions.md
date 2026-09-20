# 08. Interview Questions — Kafka (Comprehensive)

A consolidated set of commonly asked Kafka interview questions, organized by topic, with concise answers and code where useful.

---

## Topics

**Q: What is a Kafka topic, and how does it differ from a database table?**
An append-only, ordered, durable log of events; unlike a database table, it's not designed for arbitrary queries/updates — data is written once (immutable) and read sequentially or by offset.

**Q: Key difference between Kafka and a traditional message queue regarding consumption?**
In a queue, a message is typically removed once consumed; in Kafka, messages remain per the retention policy regardless of consumption, allowing multiple independent consumers and replay.

**Q: What is log compaction?**
A cleanup policy retaining only the most recent message per key rather than deleting purely by age — useful for topics representing current state rather than a pure event stream.

**Q: When would you choose Kafka over a simpler queue like RabbitMQ or SQS?**
When you need high-throughput event streaming, multiple independent consumers of the same stream, replay capability, or a broader stream-processing/data-pipeline architecture.

---

## Producers

**Q: What role does the message key play?**
Determines which partition a message is routed to (via hashing); messages sharing a key always land on the same partition, preserving relative order for related events.

**Q: What happens without a key?**
Kafka distributes messages across partitions (round-robin/sticky strategy), maximizing throughput but giving up ordering guarantees relative to other messages.

**Q: Trade-off between `acks` settings?**
`acks=0` is fastest but risks silent loss; `acks=1` waits for the leader only (reasonable balance, but can lose data if the leader crashes right after acking); `acks=all` waits for all in-sync replicas (strongest durability, higher latency).

**Q: What does an idempotent producer guarantee?**
Retried sends won't create duplicate messages on a single partition — doesn't by itself guarantee exactly-once across a full pipeline (needs transactions for that).

---

## Consumers

**Q: How is consuming a message in Kafka different from a traditional queue?**
Consuming doesn't remove the message from the topic — the consumer advances its own tracked offset; the message stays available for other consumer groups or replay.

**Q: Committing offset before vs after processing?**
Before = at-most-once (crash risks losing the message); after successful processing = at-least-once (crash risks reprocessing) — at-least-once is the common default, paired with idempotent processing.

**Q: Why should consumer logic typically be idempotent?**
At-least-once delivery means a message could be processed more than once under certain failure scenarios; idempotent logic prevents incorrect duplicate side effects.

**Q: What is a dead-letter queue?**
A separate topic for messages that repeatedly fail processing, preventing a single poison message from blocking consumption of subsequent messages.

---

## Partitions

**Q: Why does Kafka split topics into multiple partitions?**
Enables parallelism (different consumers in a group process different partitions simultaneously) and scalability (data/throughput spread across multiple brokers).

**Q: Does Kafka guarantee ordering across an entire topic?**
No — only within a single partition; no relative ordering guarantee across different partitions.

**Q: Relationship between partition count and consumer group parallelism?**
Each partition is consumed by only one consumer within a group at a time, so partition count sets a hard ceiling on useful parallelism — extra consumers beyond that count sit idle.

**Q: What is a "hot partition"?**
A partition receiving disproportionate traffic, often from a high-volume key consistently hashing to the same partition — mitigated via more evenly distributed keys or a salted sub-key.

---

## Offsets

**Q: What is a Kafka offset scoped to?**
A specific partition — the same offset number in different partitions refers to entirely unrelated messages.

**Q: What does the committed offset value represent?**
The _next_ offset to be read, not the offset of the last processed message.

**Q: Where does modern Kafka store committed offsets?**
An internal replicated topic called `__consumer_offsets`.

**Q: What is consumer lag, and why does it matter?**
The gap between a partition's latest offset and a consumer group's committed offset; sustained/growing lag signals the group can't keep up and may need more consumers or optimization.

---

## Consumer Groups

**Q: What problem does a consumer group solve?**
Automatic partition distribution among collaborating consumers, enabling horizontal scaling of processing without custom coordination code.

**Q: Can two consumers in the same group process the same partition simultaneously?**
No — each partition is assigned to exactly one consumer within a group at a time.

**Q: How do different consumer groups reading the same topic interact?**
Completely independently — each tracks its own offsets and receives the full message set, unaffected by other groups.

**Q: What is a rebalance?**
Redistribution of partition assignments when group membership changes (join/leave/failure), typically causing a brief consumption pause.

**Q: What happens with more consumers than partitions?**
Extra consumers get no partition assignment and sit idle.

---

## Replication

**Q: What does replication factor control?**
How many total copies of each partition exist across the cluster; can't exceed the number of available brokers.

**Q: Leader vs follower?**
The leader handles all reads/writes for a partition by default; followers passively replicate for fault tolerance/failover.

**Q: What is the ISR?**
The subset of replicas currently fully caught up with the leader — only ISR members are eligible for leader election on failure.

**Q: How do `acks=all` and `min.insync.replicas` work together?**
`acks=all` waits for all current ISR members; `min.insync.replicas` sets a floor on how many replicas must be in the ISR for a write to be accepted at all, preventing false acknowledgment of durability.

**Q: What is unclean leader election?**
Electing an out-of-sync replica as leader when no in-sync replica is available — restores availability but risks data loss; disabling it (the safer default) prioritizes not losing data.

---

## Practical / Coding Questions Often Asked Live

**Q: Write a producer that ensures all events for the same order stay in order.**

```js
await producer.send({
  topic: "orders",
  messages: [
    { key: order.id, value: JSON.stringify({ type: "ORDER_CREATED", order }) },
  ],
});
```

**Q: Write a consumer with manual offset commits after successful processing (at-least-once).**

```js
await consumer.run({
  autoCommit: false,
  eachMessage: async ({ topic, partition, message }) => {
    await processOrder(JSON.parse(message.value.toString()));
    await consumer.commitOffsets([
      { topic, partition, offset: (Number(message.offset) + 1).toString() },
    ]);
  },
});
```

**Q: Write idempotent consumer processing logic.**

```js
async function processOrder(order) {
  const existing = await db.processedOrders.findOne({ orderId: order.id });
  if (existing) return; // already handled
  await db.orders.create(order);
  await db.processedOrders.create({ orderId: order.id });
}
```

**Q: How would you design a system where order events power both fulfillment and analytics independently?**
Use two separate consumer groups (`order-fulfillment`, `order-analytics`) both subscribed to the same `orders` topic — each group tracks its own offsets and processes at its own pace without affecting the other, since Kafka delivers the full message stream independently to each group.

**Q: How would you scale order processing to handle 3x the current throughput?**
Ensure the topic has at least as many partitions as the target number of parallel consumers, then scale the consumer group's instance count up to that partition count — Kafka automatically redistributes partitions across the new consumers via a rebalance, requiring no custom coordination code.

**Q: How would you guarantee strong durability for a payments topic?**
Set `replication-factor` to at least 3, configure `min.insync.replicas=2`, use producer `acks=all`, disable `unclean.leader.election.enable`, and use an idempotent (or transactional) producer to avoid duplicate writes on retry.
