# 01. RabbitMQ

## What is RabbitMQ?

RabbitMQ is a mature, widely-used open-source **message broker** implementing the AMQP (Advanced Message Queuing Protocol) standard. Unlike Kafka's log-based streaming model, RabbitMQ follows a more traditional message queue model — messages are routed to queues, delivered to consumers, and (by default) removed once acknowledged as processed.

## Core Concepts

```
Producer -> Exchange -> (routing logic) -> Queue(s) -> Consumer(s)
```

| Concept      | Description                                                                 |
| ------------ | --------------------------------------------------------------------------- |
| **Producer** | Publishes messages                                                          |
| **Exchange** | Receives messages from producers and routes them to queue(s) based on rules |
| **Queue**    | Buffers messages until a consumer processes them                            |
| **Binding**  | A rule connecting an exchange to a queue (with an optional routing key)     |
| **Consumer** | Subscribes to a queue and processes messages                                |

This is a key structural difference from Kafka: RabbitMQ has a dedicated **routing layer** (exchanges + bindings) deciding which queue(s) a message ends up in, whereas Kafka producers write directly to a specific topic/partition.

## Exchange Types — RabbitMQ's Routing Flexibility

### Direct Exchange

Routes a message to the queue(s) whose binding key exactly matches the message's routing key.

```js
channel.publish("direct_logs", "error", Buffer.from("Something failed"));
// only queues bound to "direct_logs" with routing key "error" receive this
```

### Fanout Exchange

Broadcasts every message to **all** bound queues, ignoring routing keys entirely — similar in spirit to Pub/Sub.

```js
channel.publish("notifications_fanout", "", Buffer.from("Server restarting"));
// EVERY queue bound to this exchange receives a copy
```

### Topic Exchange

Routes based on wildcard pattern matching against the routing key — the most flexible option.

```js
channel.publish(
  "logs_topic",
  "order.payment.failed",
  Buffer.from("Payment failed"),
);

// Binding "order.*.failed" would match this
// Binding "order.payment.#" would also match this
// (* matches exactly one word, # matches zero or more words)
```

### Headers Exchange

Routes based on message header attributes rather than the routing key — used less commonly, for more complex matching needs.

## Setting Up RabbitMQ in Node.js (`amqplib`)

```bash
npm install amqplib
```

```js
const amqp = require("amqplib");

async function main() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();

  const queue = "orders";
  await channel.assertQueue(queue, { durable: true }); // create the queue if it doesn't exist

  channel.sendToQueue(queue, Buffer.from(JSON.stringify({ orderId: 1 })), {
    persistent: true, // survive a broker restart
  });

  console.log("Message sent");
}

main();
```

## Consuming Messages

```js
async function consume() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();

  const queue = "orders";
  await channel.assertQueue(queue, { durable: true });

  channel.prefetch(1); // process one message at a time per consumer (fair dispatch)

  channel.consume(queue, async (msg) => {
    if (msg) {
      const data = JSON.parse(msg.content.toString());
      console.log("Received:", data);

      try {
        await processOrder(data);
        channel.ack(msg); // acknowledge — removes it from the queue
      } catch (err) {
        channel.nack(msg, false, true); // negative-acknowledge — requeue for retry
      }
    }
  });
}
```

## Message Acknowledgment — Ensuring Reliable Delivery

```js
channel.ack(msg); // message successfully processed, remove from queue
channel.nack(msg, false, true); // failed — requeue for another attempt
channel.nack(msg, false, false); // failed — discard (or route to a dead-letter queue, if configured)
channel.reject(msg, true); // similar to nack for a single message, requeue
```

If a consumer disconnects without acknowledging a message, RabbitMQ automatically redelivers it to another available consumer — ensuring messages aren't silently lost due to a crashed worker.

## Work Queues — Distributing Tasks Among Multiple Workers

```
Producer -> Queue -> Worker 1
                   -> Worker 2   (RabbitMQ round-robins messages across connected consumers by default)
                   -> Worker 3
```

```js
channel.prefetch(1); // don't dispatch a new message to a worker until it acks its current one
```

This "prefetch" setting is important — without it, RabbitMQ might dispatch many messages to a slow worker while a fast worker sits idle, since the default behavior is round-robin dispatch regardless of processing speed.

## Message Durability — Surviving a Broker Restart

```js
await channel.assertQueue("orders", { durable: true }); // the QUEUE itself survives a restart

channel.sendToQueue("orders", Buffer.from(data), {
  persistent: true, // the MESSAGE itself is written to disk, survives a restart
});
```

Both settings are needed together for true durability — a durable queue with non-persistent messages would still lose in-flight messages on a broker crash.

## Queue TTL and Message Expiration

```js
await channel.assertQueue("temp_notifications", {
  messageTtl: 60000, // messages expire after 60 seconds if not consumed
});
```

## Priority Queues

```js
await channel.assertQueue("tasks", { maxPriority: 10 });

channel.sendToQueue("tasks", Buffer.from("urgent task"), { priority: 10 });
channel.sendToQueue("tasks", Buffer.from("routine task"), { priority: 1 });
```

Higher-priority messages are delivered to consumers before lower-priority ones, when both are waiting.

## RabbitMQ vs Kafka — When to Choose Which

|                                    | RabbitMQ                                                                        | Kafka                                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Model                              | Traditional message queue/broker                                                | Distributed append-only log                                                                                   |
| Message removed after consumption? | Yes, by default                                                                 | No — retained per retention policy                                                                            |
| Routing flexibility                | Rich (exchanges: direct, fanout, topic, headers)                                | Simple (topic + partition key)                                                                                |
| Replay historical messages         | Not designed for this                                                           | Core capability                                                                                               |
| Throughput                         | High, but generally lower than Kafka at extreme scale                           | Extremely high, built for massive throughput                                                                  |
| Best for                           | Task queues, complex routing, RPC-style patterns, moderate-throughput messaging | Event streaming, event sourcing, high-throughput pipelines, multiple independent consumers of the same stream |

**Practical guidance:** RabbitMQ tends to fit "smart broker, simple consumer" scenarios — complex routing logic, traditional background job processing, request/reply patterns. Kafka tends to fit "simple broker, smart consumer" scenarios — high-throughput event streams that multiple systems need to independently process or replay.

## Practical Example: Order Processing with RabbitMQ

```js
// Producer — order service
async function publishOrderCreated(order) {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange("orders", "topic", { durable: true });
  channel.publish(
    "orders",
    "order.created",
    Buffer.from(JSON.stringify(order)),
    { persistent: true },
  );

  await channel.close();
  await connection.close();
}

// Consumer — inventory service
async function consumeOrderEvents() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange("orders", "topic", { durable: true });
  const { queue } = await channel.assertQueue("inventory-service-orders", {
    durable: true,
  });
  await channel.bindQueue(queue, "orders", "order.created");

  channel.consume(queue, async (msg) => {
    const order = JSON.parse(msg.content.toString());
    await reserveInventory(order);
    channel.ack(msg);
  });
}
```

## Common Interview-Style Questions

- **What's the fundamental structural difference between RabbitMQ and Kafka?**
  RabbitMQ is a traditional message broker where messages are routed via exchanges/bindings and typically removed once consumed and acknowledged; Kafka is a distributed append-only log where messages persist per a retention policy regardless of consumption, allowing replay and multiple independent consumers.

- **What are the four exchange types in RabbitMQ, and what does each do?**
  Direct (exact routing key match), Fanout (broadcasts to all bound queues, ignoring routing key), Topic (wildcard pattern matching on routing key), and Headers (routes based on message header attributes rather than routing key).

- **Why is `channel.prefetch(1)` an important setting for work queues with multiple workers?**
  Without it, RabbitMQ dispatches messages round-robin regardless of a worker's current processing speed, potentially overloading a slow worker with a large backlog while a fast worker sits idle; prefetch(1) ensures a worker only receives a new message once it has acknowledged its current one.

- **What's required for a message to survive a RabbitMQ broker restart?**
  Both the queue must be declared durable (`durable: true`) AND the individual message must be marked persistent (`persistent: true`) — a durable queue alone doesn't protect in-flight non-persistent messages from being lost on a crash.

- **When would you choose RabbitMQ over Kafka for a given use case?**
  When you need rich, flexible routing logic (fanout broadcasts, topic-based wildcard routing), traditional task/work queue semantics where messages should be removed once processed, or request/reply-style patterns — versus Kafka's strengths in high-throughput event streaming, replay, and multiple independent consumer groups processing the same event stream.
