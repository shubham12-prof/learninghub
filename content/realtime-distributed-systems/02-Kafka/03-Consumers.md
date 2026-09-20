# 03. Consumers

## What is a Consumer?

A consumer is any client application that reads (subscribes to and processes) messages from one or more Kafka topics. Unlike traditional message queues, consuming a message in Kafka does **not** remove it from the topic — the consumer simply tracks its own position (offset) and moves forward independently.

## Basic Consumer Setup (Node.js — `kafkajs`)

```js
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "order-processor",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "order-processing-group" });

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: "orders", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        topic,
        partition,
        offset: message.offset,
        key: message.key?.toString(),
        value: message.value.toString(),
      });
    },
  });
}

run();
```

## `fromBeginning` — Where to Start Reading

```js
await consumer.subscribe({ topic: "orders", fromBeginning: true }); // start from the OLDEST retained message
await consumer.subscribe({ topic: "orders", fromBeginning: false }); // start from the LATEST message (default) — only new messages going forward
```

`fromBeginning` only matters the **first time** a consumer group reads a topic (i.e., when no committed offset exists yet for that group) — once offsets are committed, the consumer resumes from its last committed position on restart, regardless of this setting.

## Subscribing to Multiple Topics

```js
await consumer.subscribe({
  topics: ["orders", "payments", "shipments"],
  fromBeginning: false,
});

await consumer.run({
  eachMessage: async ({ topic, message }) => {
    if (topic === "orders") handleOrderEvent(message);
    else if (topic === "payments") handlePaymentEvent(message);
    else if (topic === "shipments") handleShipmentEvent(message);
  },
});
```

## Processing Messages in Batches

For higher throughput, process a whole batch of messages at once rather than one at a time.

```js
await consumer.run({
  eachBatch: async ({
    batch,
    resolveOffset,
    heartbeat,
    commitOffsetsIfNecessary,
  }) => {
    for (const message of batch.messages) {
      await processMessage(message);
      resolveOffset(message.offset); // mark this message as processed within the batch
      await heartbeat(); // let Kafka know this consumer is still alive during long batch processing
    }
    await commitOffsetsIfNecessary();
  },
});
```

## Manual vs Automatic Offset Commits

By default, most Kafka clients auto-commit offsets periodically. For stronger processing guarantees, commit manually **after** successfully processing a message — ensuring you never mark a message as "done" before you've actually finished handling it.

```js
const consumer = kafka.consumer({
  groupId: "order-processing-group",
});

await consumer.run({
  autoCommit: false, // disable automatic commits, take full manual control
  eachMessage: async ({ topic, partition, message }) => {
    try {
      await processOrder(JSON.parse(message.value.toString()));
      await consumer.commitOffsets([
        { topic, partition, offset: (Number(message.offset) + 1).toString() },
      ]);
    } catch (err) {
      console.error("Processing failed, NOT committing offset:", err);
      // message will be re-delivered on next poll/restart since the offset wasn't advanced
    }
  },
});
```

> Committed offset is always the **next** offset to read, not the offset of the last processed message — hence `+1` above.

## At-Least-Once vs At-Most-Once vs Exactly-Once Processing

| Semantics                               | How It's Achieved                                                                               | Risk                                                                                                                            |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **At-most-once**                        | Commit the offset _before_ processing the message                                               | Message could be lost if processing fails after the commit                                                                      |
| **At-least-once** (most common default) | Commit the offset _after_ successfully processing the message                                   | Message could be processed twice if a crash happens after processing but before the commit                                      |
| **Exactly-once**                        | Requires transactional producers/consumers, or idempotent processing logic on the consumer side | Most complex to implement correctly; often achieved via idempotent downstream operations rather than pure exactly-once delivery |

```js
// At-least-once pattern (most common in practice)
await processOrder(message); // do the work FIRST
await commitOffset(message); // THEN commit — if processing fails, the message is redelivered later
```

## Designing Idempotent Consumers (Handling At-Least-Once Safely)

Since at-least-once delivery means a message could be processed more than once (e.g., after a crash-and-restart before the offset commit lands), consumer logic should be **idempotent** — safe to run multiple times with the same net effect.

```js
async function processOrder(order) {
  // Using the order's own ID as an idempotency key prevents double-processing
  const alreadyProcessed = await db.processedOrders.findOne({
    orderId: order.id,
  });
  if (alreadyProcessed) return; // already handled — safely skip

  await db.orders.create(order);
  await db.processedOrders.create({
    orderId: order.id,
    processedAt: new Date(),
  });
}
```

## Consumer Configuration Options

```js
const consumer = kafka.consumer({
  groupId: "order-processing-group",
  sessionTimeout: 30000, // how long the broker waits before considering a consumer dead
  heartbeatInterval: 3000, // how often the consumer sends a heartbeat
  maxBytesPerPartition: 1048576, // max data fetched per partition per request
  minBytes: 1, // minimum data to wait for before returning a fetch response
  maxWaitTimeInMs: 5000, // max time to wait for minBytes to accumulate
});
```

## Pausing and Resuming Consumption

```js
consumer.pause([{ topic: "orders" }]); // stop consuming from this topic temporarily (e.g., during a downstream outage)

// ... later
consumer.resume([{ topic: "orders" }]);
```

## Graceful Shutdown

```js
const errorTypes = ["unhandledRejection", "uncaughtException"];
const signalTraps = ["SIGTERM", "SIGINT", "SIGUSR2"];

errorTypes.forEach((type) => {
  process.on(type, async () => {
    try {
      await consumer.disconnect();
    } finally {
      process.exit(1);
    }
  });
});

signalTraps.forEach((type) => {
  process.once(type, async () => {
    await consumer.disconnect(); // allows in-flight processing to complete and offsets to commit cleanly
  });
});
```

## Dead Letter Queue Pattern (Handling Poison Messages)

If a message consistently fails processing (a "poison pill"), retrying it forever blocks the partition. Route it to a separate dead-letter topic after a limited number of retries so consumption of subsequent messages can continue.

```js
async function processWithDeadLetter(message, producer, maxRetries = 3) {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      return await processOrder(JSON.parse(message.value.toString()));
    } catch (err) {
      attempts++;
      if (attempts >= maxRetries) {
        await producer.send({
          topic: "orders-dlq",
          messages: [
            { value: message.value, headers: { originalError: err.message } },
          ],
        });
      }
    }
  }
}
```

## Common Interview-Style Questions

- **How is consuming a message in Kafka different from consuming a message in a traditional queue?**
  In Kafka, consuming a message doesn't remove it from the topic — the consumer just advances its own tracked offset (position); the message remains available for other consumer groups (or replay by the same group, if offsets are reset) per the topic's retention policy.

- **What's the difference between committing an offset before vs after processing a message?**
  Committing before processing gives at-most-once semantics (a crash after commit but before/during processing loses the message); committing after successful processing gives at-least-once semantics (a crash after processing but before commit causes reprocessing on restart) — at-least-once is the more common default, paired with idempotent processing logic.

- **Why should consumer processing logic typically be idempotent?**
  Because at-least-once delivery (the common default) means a message could be delivered and processed more than once under certain failure/restart scenarios; idempotent logic ensures reprocessing the same message doesn't cause incorrect duplicate side effects (like double-charging a customer).

- **What is a dead-letter queue, and why is it useful?**
  A separate topic where messages that repeatedly fail processing are routed after a limited number of retries, preventing a single "poison" message from blocking consumption of all subsequent messages in the same partition.

- **What does `fromBeginning: true` actually control?**
  It only determines where a consumer group starts reading the _very first time_ it has no previously committed offset for that topic; once offsets exist for the group, the consumer always resumes from its last committed position on restart, regardless of this setting.
