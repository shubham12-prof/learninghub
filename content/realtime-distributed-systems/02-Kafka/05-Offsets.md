# 05. Offsets

## What is an Offset?

An offset is a sequential, unique integer identifying the position of a message **within a specific partition**. It's essentially the message's index in that partition's log — the first message has offset 0, the second offset 1, and so on, monotonically increasing as new messages are appended.

```
Partition 0:
Offset:   0      1      2      3      4
Message: [msgA] [msgB] [msgC] [msgD] [msgE]
```

Offsets are **partition-scoped**, not topic-wide — offset `5` in Partition 0 and offset `5` in Partition 1 are two entirely different, unrelated messages.

## How Consumers Use Offsets

A consumer tracks its position in each partition it reads from via an offset. This is the mechanism that lets Kafka support multiple independent consumers reading the same topic at different paces — each tracks (and commits) its own offset separately, with no interference between them.

```
Consumer Group A's committed offset for Partition 0: 3  (has read messages 0-2, will next read from offset 3)
Consumer Group B's committed offset for Partition 0: 1  (has read message 0, will next read from offset 1)
```

## Committing Offsets

"Committing" an offset means durably recording your current read position, so that if the consumer restarts (crash, deploy, rebalance), it resumes from where it left off instead of starting over (or reprocessing everything).

```js
await consumer.commitOffsets([
  { topic: "orders", partition: 0, offset: "5" }, // next offset to read is 5 (i.e., messages 0-4 are considered processed)
]);
```

> The committed offset represents the **next** offset to be read, not the offset of the last successfully processed message — so after processing the message at offset 4, you commit `5`.

## Where Committed Offsets Are Stored

Modern Kafka stores committed consumer offsets in an internal, special topic called `__consumer_offsets` (rather than in Zookeeper, as very old Kafka versions did) — this makes offset tracking itself just another durable, replicated Kafka log.

```bash
kafka-console-consumer.sh --topic __consumer_offsets \
  --bootstrap-server localhost:9092 \
  --formatter "kafka.coordinator.group.GroupMetadataManager\$OffsetsMessageFormatter"
```

## Auto-Commit vs Manual Commit

```js
// Auto-commit (default in many clients) — offsets committed periodically in the background
const consumer = kafka.consumer({
  groupId: "my-group",
  // autoCommit defaults to true in kafkajs, committing periodically
});

// Manual commit — full control over exactly when an offset is considered "done"
const consumer = kafka.consumer({ groupId: "my-group" });
await consumer.run({
  autoCommit: false,
  eachMessage: async ({ topic, partition, message }) => {
    await processMessage(message);
    await consumer.commitOffsets([
      { topic, partition, offset: (Number(message.offset) + 1).toString() },
    ]);
  },
});
```

Auto-commit is simpler but risks committing an offset for a message that was actually never fully/successfully processed (if a crash happens between the periodic auto-commit and completing the work) — manual commits after successful processing give stronger control over delivery semantics (see the Consumers notes for the full at-least-once/at-most-once discussion).

## Resetting Offsets

Sometimes you need to intentionally move a consumer group's position — to reprocess historical data, skip a batch of poison messages, or recover from a bug that corrupted previously-processed data.

```bash
# Reset to the very beginning of the topic
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group my-group --topic orders \
  --reset-offsets --to-earliest --execute

# Reset to the very end (skip everything currently unprocessed)
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group my-group --topic orders \
  --reset-offsets --to-latest --execute

# Reset to a specific offset
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group my-group --topic orders --partition 0 \
  --reset-offsets --to-offset 1000 --execute

# Reset to a specific point in time
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group my-group --topic orders \
  --reset-offsets --to-datetime 2026-07-01T00:00:00.000 --execute
```

> The consumer group must be **inactive** (no running consumers currently in that group) to reset its offsets — you can't reset while consumers are actively committing.

## Programmatically Seeking to a Specific Offset

```js
await consumer.connect();
await consumer.subscribe({ topic: "orders" });

consumer.on(consumer.events.GROUP_JOIN, async () => {
  consumer.seek({ topic: "orders", partition: 0, offset: "1000" }); // jump directly to a specific offset
});
```

## Checking Consumer Group Lag

**Lag** is the difference between the latest offset in a partition (the "high watermark" — the offset of the next message that _will_ be written) and the consumer group's current committed offset — essentially, "how far behind is this consumer group?"

```bash
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group my-group
```

```
GROUP     TOPIC   PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
my-group  orders  0          950              1000            50
my-group  orders  1          1000             1000            0
my-group  orders  2          800              1000            200
```

**Lag monitoring is one of the most important operational metrics for a Kafka-based system** — sustained/growing lag indicates a consumer can't keep up with the incoming message rate, signaling a need to add more consumer instances (up to the partition count), optimize processing logic, or investigate a stuck/slow consumer.

## Offset Reset Policy for New Consumer Groups

`auto.offset.reset` controls where a **brand-new** consumer group (with no previously committed offset) starts reading — distinct from `fromBeginning` in some client libraries, but conceptually the same underlying broker-side setting.

```js
const consumer = kafka.consumer({
  groupId: "new-analytics-group",
});

await consumer.subscribe({
  topic: "orders",
  fromBeginning: true, // in kafkajs, this maps to essentially the same effect as auto.offset.reset=earliest
});
```

| Setting            | Behavior for a brand-new consumer group                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| `earliest`         | Start from the oldest retained message                                                                        |
| `latest` (default) | Start from new messages only, ignoring everything already in the topic                                        |
| `none`             | Throw an error if no previous offset exists — forces explicit handling rather than silently picking a default |

## Common Interview-Style Questions

- **What is a Kafka offset, and what is it scoped to?**
  A sequential integer identifying a message's position within a specific partition; offsets are scoped per-partition, meaning the same offset number in different partitions refers to entirely unrelated messages.

- **What does "committing an offset" actually mean, and what does the committed value represent?**
  It durably records a consumer group's current read position for a partition, so that a restarted consumer resumes from that point rather than starting over; the committed value represents the _next_ offset to be read, not the offset of the last processed message.

- **Where does modern Kafka store committed consumer offsets?**
  In an internal, replicated Kafka topic called `__consumer_offsets`, rather than in an external system like Zookeeper (as much older Kafka versions did).

- **What is consumer lag, and why is it an important metric to monitor?**
  The difference between a partition's latest offset (log-end-offset) and a consumer group's current committed offset — it indicates how far behind the consumer is from real-time; sustained or growing lag signals the consumer group can't keep up with incoming message volume and may need more parallel consumers or processing optimization.

- **Why might you need to manually reset a consumer group's offsets, and what's a prerequisite for doing so?**
  To reprocess historical data, recover from a bug that mishandled previously-processed messages, or skip past problematic messages; the consumer group must be inactive (no actively running/committing consumers) before its offsets can be reset.
