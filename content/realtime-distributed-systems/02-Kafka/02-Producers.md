# 02. Producers

## What is a Producer?

A producer is any client application that writes (publishes) messages/events to a Kafka topic. Producers decide which partition each message goes to, handle batching/retries for efficiency and reliability, and can wait for varying levels of acknowledgment before considering a write "successful."

## Basic Producer Setup (Node.js — `kafkajs`)

```bash
npm install kafkajs
```

```js
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "order-service",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer();

async function run() {
  await producer.connect();

  await producer.send({
    topic: "orders",
    messages: [{ value: JSON.stringify({ orderId: 1, total: 49.99 }) }],
  });

  await producer.disconnect();
}

run();
```

## Message Structure

A Kafka message consists of a **key** (optional but important), a **value** (the payload), and **headers** (optional metadata).

```js
await producer.send({
  topic: "orders",
  messages: [
    {
      key: "order-123", // determines the partition (see below)
      value: JSON.stringify({ orderId: 123, total: 49.99 }),
      headers: { "correlation-id": "abc-123", source: "checkout-service" },
    },
  ],
});
```

## Why the Message Key Matters

The key determines **which partition** a message is routed to (via a hash of the key, by default). Messages with the same key always land on the same partition, preserving their relative order.

```js
// All events for the SAME order will always go to the SAME partition, preserving their order
await producer.send({
  topic: "orders",
  messages: [
    { key: "order-123", value: JSON.stringify({ event: "created" }) },
    { key: "order-123", value: JSON.stringify({ event: "paid" }) },
    { key: "order-123", value: JSON.stringify({ event: "shipped" }) },
  ],
});
```

Without a key (`key: null`), Kafka distributes messages across partitions round-robin (or via a sticky partitioning strategy in newer versions) — fine for throughput, but gives up any ordering guarantee between related messages.

## Sending Multiple Messages (Batching)

```js
await producer.send({
  topic: "orders",
  messages: [
    { key: "order-1", value: "data1" },
    { key: "order-2", value: "data2" },
    { key: "order-3", value: "data3" },
  ],
});
```

Batching multiple messages into a single `send()` call is significantly more efficient than issuing many individual sends — fewer network round trips, better broker-side batching.

## Acknowledgment Levels (`acks`) — Durability vs Throughput Trade-off

Controls how many broker replicas must confirm receipt before the producer considers a write successful.

```js
const producer = kafka.producer({
  // configured at the producer/client level, or per-send depending on the client library
});

await producer.send({
  topic: "orders",
  acks: -1, // wait for ALL in-sync replicas to acknowledge (strongest durability)
  messages: [{ value: "important data" }],
});
```

| `acks` Value    | Behavior                           | Trade-off                                                                                                             |
| --------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `0`             | Don't wait for any acknowledgment  | Fastest, but messages can be silently lost if the broker fails                                                        |
| `1`             | Wait for the partition leader only | Balanced — safe against most failures, but a leader crash right after acking (before replicating) can still lose data |
| `-1` (or `all`) | Wait for all in-sync replicas      | Strongest durability guarantee, higher latency                                                                        |

## Idempotent Producer — Preventing Duplicate Messages on Retry

Network issues can cause a producer to retry a send that actually succeeded on the broker side, risking duplicate messages. An idempotent producer assigns each message a sequence number, letting the broker detect and discard duplicates automatically.

```js
const kafka = new Kafka({
  clientId: "order-service",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer({
  idempotent: true, // ensures retries don't produce duplicate messages
});
```

Idempotence guarantees **exactly-once delivery to a single partition** on retry — it does not, by itself, provide end-to-end exactly-once semantics across an entire pipeline (that requires transactional producers/consumers working together, see below).

## Transactional Producers — Atomic Multi-Topic/Partition Writes

For use cases needing multiple writes (potentially across different topics/partitions) to succeed or fail together atomically — e.g., "write an event AND update an offset" in a read-process-write stream processing pipeline.

```js
const producer = kafka.producer({
  transactionalId: "order-processor-1",
  idempotent: true,
});

await producer.connect();

const transaction = await producer.transaction();
try {
  await transaction.send({
    topic: "orders",
    messages: [{ value: "order data" }],
  });
  await transaction.send({
    topic: "order-audit-log",
    messages: [{ value: "audit entry" }],
  });
  await transaction.commit();
} catch (err) {
  await transaction.abort();
  throw err;
}
```

## Handling Producer Errors and Retries

```js
const producer = kafka.producer({
  retry: {
    retries: 5,
    initialRetryTime: 300,
  },
});

try {
  await producer.send({ topic: "orders", messages: [{ value: "data" }] });
} catch (err) {
  console.error("Failed to send message after retries:", err);
  // dead-letter queue, alerting, or other fallback handling
}
```

## Compression

Producers can compress message batches before sending, trading a bit of CPU for significantly reduced network bandwidth and broker storage — especially valuable for high-throughput topics.

```js
const { CompressionTypes } = require("kafkajs");

await producer.send({
  topic: "orders",
  compression: CompressionTypes.GZIP, // also supports Snappy, LZ4, ZSTD
  messages: [{ value: "data" }],
});
```

## Practical Example: Producing Order Events

```js
class OrderEventProducer {
  constructor(kafka) {
    this.producer = kafka.producer({ idempotent: true });
  }

  async connect() {
    await this.producer.connect();
  }

  async publishOrderCreated(order) {
    await this.producer.send({
      topic: "orders",
      messages: [
        {
          key: order.id, // ensures all events for this order stay ordered within one partition
          value: JSON.stringify({
            type: "ORDER_CREATED",
            order,
            timestamp: Date.now(),
          }),
        },
      ],
    });
  }

  async disconnect() {
    await this.producer.disconnect();
  }
}
```

## Common Interview-Style Questions

- **What role does the message key play in Kafka producing?**
  It determines which partition a message is routed to (via hashing, by default) — messages sharing the same key always land on the same partition, which is essential for preserving relative order between related events (e.g., all events for a single order).

- **What happens if you don't provide a key when producing a message?**
  Kafka distributes keyless messages across partitions (round-robin or a sticky batching strategy, depending on the client/broker version), maximizing throughput/load distribution but giving up any ordering guarantee relative to other messages.

- **Explain the trade-off between the different `acks` settings.**
  `acks=0` is fastest but risks silent message loss; `acks=1` waits for the partition leader's acknowledgment (a reasonable balance, but can still lose data if the leader crashes immediately after acking before replication); `acks=-1`/`all` waits for all in-sync replicas, providing the strongest durability guarantee at the cost of higher latency.

- **What does an idempotent producer guarantee, and what does it NOT guarantee?**
  It guarantees that retried sends won't create duplicate messages on a single partition (the broker detects and discards duplicate sequence numbers); it does not, by itself, guarantee exactly-once semantics across an entire multi-step pipeline — that requires transactional producers/consumers working together.

- **Why batch multiple messages into a single `send()` call instead of sending them individually?**
  Batching significantly reduces the number of network round trips and allows more efficient broker-side handling (larger, more efficient writes/compression), improving overall throughput compared to many small individual sends.
