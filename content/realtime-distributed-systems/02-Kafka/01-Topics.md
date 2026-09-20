# 01. Topics

## What is Kafka?

Apache Kafka is a distributed **event streaming platform** — a durable, high-throughput, publish-subscribe messaging system originally built at LinkedIn. Unlike a traditional message queue (where a message is consumed once and removed), Kafka retains messages for a configurable period, allowing multiple independent consumers to read the same data at their own pace, and even replay historical messages.

## What is a Topic?

A topic is a named, durable log of events — the fundamental unit of organization in Kafka, conceptually similar to a table in a database or a named channel in a Pub/Sub system, but backed by an append-only, ordered log rather than a queryable table.

```
Topic: "orders"
[event1] [event2] [event3] [event4] [event5] ... (appended in order, never modified in place)
```

Producers **append** events to a topic; consumers **read** from a topic, tracking their own position independently.

## Topics Are Append-Only Logs

Once written, a message in a topic is immutable — it can't be edited or deleted individually (only removed in bulk once it exceeds the topic's retention policy). This log-based model is what enables Kafka's core properties: ordering (within a partition), replay, and multiple independent consumers.

```
Traditional Queue:  message consumed -> REMOVED from the queue -> gone forever
Kafka Topic:        message consumed -> STAYS in the topic -> other consumers (or the same one, later) can still read it
```

## Creating a Topic

```bash
kafka-topics.sh --create \
  --topic orders \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 3
```

```bash
kafka-topics.sh --list --bootstrap-server localhost:9092
kafka-topics.sh --describe --topic orders --bootstrap-server localhost:9092
```

Example describe output:

```
Topic: orders   PartitionCount: 3   ReplicationFactor: 3
  Partition: 0   Leader: 1   Replicas: 1,2,3   Isr: 1,2,3
  Partition: 1   Leader: 2   Replicas: 2,3,1   Isr: 2,3,1
  Partition: 2   Leader: 3   Replicas: 3,1,2   Isr: 3,1,2
```

(Partitions and replication are covered in full depth in their own dedicated notes.)

## Topic Configuration — Retention

Kafka's defining trait versus most message queues: messages persist for a configurable time (or size) regardless of whether they've been consumed.

```bash
kafka-configs.sh --alter \
  --entity-type topics --entity-name orders \
  --add-config retention.ms=604800000 \
  --bootstrap-server localhost:9092
```

| Config                   | Meaning                                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| `retention.ms`           | How long messages are kept (default 7 days)                                                           |
| `retention.bytes`        | Maximum size per partition before old messages are discarded                                          |
| `cleanup.policy=delete`  | Default — old messages are deleted once retention limits are exceeded                                 |
| `cleanup.policy=compact` | Log compaction — keeps only the latest message per key (see below), instead of deleting purely by age |

## Log Compaction — Keeping Only the Latest Value per Key

For topics representing "current state" (like a changelog of user profile updates) rather than a pure event stream, compaction retains only the most recent message per key, discarding older values for that same key while preserving the log structure.

```
Before compaction:  [key=A,v=1] [key=B,v=1] [key=A,v=2] [key=A,v=3] [key=B,v=2]
After compaction:                [key=A,v=3]              [key=B,v=2]
```

```bash
kafka-configs.sh --alter \
  --entity-type topics --entity-name user-profiles \
  --add-config cleanup.policy=compact \
  --bootstrap-server localhost:9092
```

Common use case: powering a "changelog" for a key-value store, or Kafka Streams' internal state stores.

## Topics vs Traditional Queues vs Pub/Sub

|                                    | Traditional Queue (RabbitMQ-style)                       | Redis Pub/Sub                              | Kafka Topic                                                     |
| ---------------------------------- | -------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------- |
| Message removed after consumption? | Yes, typically                                           | N/A — not persisted at all                 | No — retained per retention policy                              |
| Multiple independent consumers     | Possible but typically each message goes to ONE consumer | Yes, but only if connected at publish time | Yes — each consumer group tracks its own position independently |
| Replay historical messages         | Generally no                                             | No                                         | Yes, within the retention window                                |
| Ordering guarantee                 | Often FIFO within the whole queue                        | None                                       | Guaranteed within a partition, not across the whole topic       |

## Topic Naming Conventions

```
orders
orders.created
user-events
com.company.orders.created   (reverse-domain style, common in larger orgs)
```

A common convention: `<domain>.<entity>.<event-type>` (e.g., `ecommerce.orders.created`) for clarity as the number of topics grows across a large organization.

## Producing and Consuming — Preview (Full Detail in Later Notes)

```bash
# Produce a message from the command line
kafka-console-producer.sh --topic orders --bootstrap-server localhost:9092

# Consume messages from the command line
kafka-console-consumer.sh --topic orders --from-beginning --bootstrap-server localhost:9092
```

## Using Kafka from Node.js (`kafkajs`)

```bash
npm install kafkajs
```

```js
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["localhost:9092"],
});
```

```js
// Creating a topic programmatically (usually done via infra/ops tooling in production, shown for completeness)
const admin = kafka.admin();
await admin.connect();
await admin.createTopics({
  topics: [{ topic: "orders", numPartitions: 3, replicationFactor: 3 }],
});
await admin.disconnect();
```

## When to Use Kafka vs a Simpler Message Queue

| Use Kafka when...                                                   | Use a simpler queue (RabbitMQ, Redis, SQS) when...                |
| ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| You need high-throughput event streaming at scale                   | You need simple task/job queue semantics                          |
| Multiple independent systems need to consume the same event stream  | Only one consumer needs to process each message                   |
| You need to replay historical events (event sourcing, reprocessing) | Replay isn't a requirement                                        |
| Strict ordering within a partition/key matters                      | Ordering isn't critical, or FIFO across the whole queue is enough |
| You're building a data pipeline / stream processing architecture    | You're building a straightforward background job system           |

## Common Interview-Style Questions

- **What is a Kafka topic, and how is it different from a table in a traditional database?**
  A topic is an append-only, ordered, durable log of events; unlike a database table, it's not designed for arbitrary queries/updates — data is written once (immutable) and read sequentially or by offset, optimized for high-throughput streaming rather than random access.

- **What's the key difference between Kafka and a traditional message queue regarding message consumption?**
  In a traditional queue, a message is typically removed once consumed; in Kafka, messages remain in the topic per the retention policy regardless of consumption, allowing multiple independent consumers to read the same data (each tracking its own position) and enabling replay of historical events.

- **What is log compaction, and when would you use it instead of time-based retention?**
  A cleanup policy that retains only the most recent message per key rather than deleting purely by age — useful for topics representing current state (like a changelog of the latest value per entity) rather than a pure sequential event stream.

- **Does Kafka guarantee ordering across an entire topic?**
  No — ordering is only guaranteed _within_ a single partition, not across the topic as a whole; messages in different partitions have no relative ordering guarantee (full detail in the Partitions notes).

- **When would you choose Kafka over a simpler message queue like RabbitMQ or SQS?**
  When you need high-throughput event streaming, multiple independent consumers reading the same stream, the ability to replay historical events, or you're building a broader stream-processing/data-pipeline architecture rather than simple point-to-point task queuing.
