# 06. Interview Questions — Message Queues (Comprehensive)

A consolidated set of commonly asked message queue interview questions, organized by topic, with concise answers and code where useful.

---

## RabbitMQ

**Q: What's the fundamental structural difference between RabbitMQ and Kafka?**
RabbitMQ is a traditional message broker where messages are routed via exchanges/bindings and typically removed once consumed and acknowledged; Kafka is a distributed append-only log where messages persist per retention policy regardless of consumption.

**Q: What are the four RabbitMQ exchange types?**
Direct (exact routing key match), Fanout (broadcasts to all bound queues), Topic (wildcard pattern matching), Headers (routes based on header attributes).

**Q: Why is `channel.prefetch(1)` important for work queues?**
Without it, RabbitMQ dispatches messages round-robin regardless of processing speed, potentially overloading a slow worker; prefetch ensures a worker gets a new message only after acknowledging its current one.

**Q: What's required for a message to survive a RabbitMQ broker restart?**
Both a durable queue (`durable: true`) AND a persistent message (`persistent: true`) — durability alone doesn't protect non-persistent in-flight messages.

---

## Kafka (as a Message Queue)

**Q: Can Kafka be used as a traditional task queue?**
Yes — a single consumer group processing a topic behaves similarly to a work queue, but Kafka's operational complexity is significantly higher than purpose-built queues like SQS/RabbitMQ.

**Q: What capability does Kafka provide that traditional queues generally don't?**
Multiple independent consumer groups reading the full event stream at their own pace without coordination, plus replay of historical events within the retention window.

**Q: When would you choose a traditional queue over Kafka?**
Simple point-to-point task distribution with messages removed once processed, rich routing logic needs, or when minimizing operational complexity matters more than Kafka's streaming/replay capabilities.

---

## SQS Concepts

**Q: What is the visibility timeout, and what problem does it solve?**
The period a received message is hidden from other consumers while being processed; if the consumer crashes without deleting it, the message becomes available again after the timeout — providing at-least-once delivery.

**Q: Standard vs FIFO queues?**
Standard: at-least-once delivery, best-effort ordering, nearly unlimited throughput. FIFO: strict ordering within a message group, exactly-once processing (within a dedup window), lower throughput ceiling.

**Q: Why is long polling preferred over short polling?**
It waits for a message to become available before returning, dramatically reducing wasted API calls against an empty queue compared to short polling's immediate return.

**Q: How do you broadcast a message to multiple independent SQS consumers?**
Pair SQS with SNS as a pub/sub fan-out layer — publish once to an SNS topic, which delivers a copy to every subscribed SQS queue.

---

## Retry Mechanisms

**Q: Why distinguish transient from permanent failures in retry design?**
Retrying a permanent failure (malformed data) will never succeed, wasting resources and delaying routing to a DLQ; only transient failures genuinely benefit from retries.

**Q: What is exponential backoff, and why use it?**
Increasing delay between successive retries (1s, 2s, 4s...); prevents overwhelming an already-struggling downstream dependency with immediate repeated retries.

**Q: What is jitter, and what does it solve?**
Randomness added to backoff delays, preventing many failed consumers/messages from retrying at exactly synchronized moments, which would otherwise cause repeated traffic spikes.

**Q: Why must processing logic be idempotent when using retries?**
Retries mean a message could be processed more than once; without idempotency, this can cause duplicate charges, emails, or inventory deductions.

---

## Dead Letter Queue

**Q: What problem does a DLQ solve?**
The "poison message" problem — preventing a message that can never succeed from blocking the main queue indefinitely (if retried forever) or being silently lost (if discarded).

**Q: How does SQS implement dead-lettering?**
Via a `RedrivePolicy` with a `maxReceiveCount`; once a message's receive count exceeds that threshold, SQS automatically moves it to the configured DLQ.

**Q: Why preserve failure context in DLQ messages, not just the raw payload?**
Without it, diagnosing why a message failed is much harder — context (error details, timestamp, retry count) is needed to investigate, fix, and decide on reprocessing.

**Q: Why is DLQ monitoring essential?**
Without it, failed messages can silently accumulate unnoticed, defeating the DLQ's purpose of surfacing failures for investigation.

**Q: What does "redriving" mean?**
Moving messages from the DLQ back to the original queue for reprocessing, typically after fixing the underlying issue that caused the original failures.

---

## Cross-Cutting / Comparative Questions

**Q: Compare RabbitMQ, Kafka, and SQS in terms of operational complexity.**
SQS is fully managed with zero infrastructure to run; RabbitMQ requires self-hosting or a managed broker with moderate overhead; Kafka involves running a distributed cluster (brokers, partitions, replication) with the highest operational complexity, though managed offerings (Confluent Cloud, AWS MSK) reduce this gap.

**Q: How does message ordering differ across RabbitMQ, Kafka, and SQS?**
RabbitMQ: configurable, generally not strictly guaranteed across a queue by default. Kafka: guaranteed only within a single partition. SQS: best-effort for standard queues, strict FIFO within a message group for FIFO queues.

**Q: How does "at-least-once" delivery manifest across these systems, and what's the common mitigation?**
All three can redeliver a message more than once under certain failure/retry scenarios (SQS via visibility timeout expiry, RabbitMQ via nack/requeue, Kafka via offset commit timing); the common mitigation across all of them is designing idempotent consumer processing logic.

**Q: When would you choose SQS over self-hosted RabbitMQ?**
When minimizing operational overhead is a priority (no infrastructure to manage, automatic scaling) and you're already on AWS, and you don't need RabbitMQ's more flexible routing (fanout, topic-based wildcard exchanges) — SQS paired with SNS covers many of the same fan-out use cases with less operational burden.

---

## Practical / Coding Questions Often Asked Live

**Q: Write a retry wrapper with exponential backoff and jitter.**

```js
function backoffWithJitter(attempt, base = 1000, max = 30000) {
  const exp = Math.min(max, base * Math.pow(2, attempt));
  return exp * (0.5 + Math.random() * 0.5);
}

async function processWithRetry(fn, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      await new Promise((r) => setTimeout(r, backoffWithJitter(attempt)));
    }
  }
}
```

**Q: Configure an SQS queue with a dead letter queue after 3 failed attempts.**

```js
{
  RedrivePolicy: JSON.stringify({
    deadLetterTargetArn: 'arn:aws:sqs:us-east-1:123456789012:orders-dlq',
    maxReceiveCount: '3',
  }),
}
```

**Q: Write an idempotent payment processing function suitable for use with a retry-driven queue consumer.**

```js
async function processPayment(payment) {
  const existing = await db.processedPayments.findOne({
    idempotencyKey: payment.id,
  });
  if (existing) return existing.result;

  const result = await chargeCustomer(payment);
  await db.processedPayments.create({ idempotencyKey: payment.id, result });
  return result;
}
```

**Q: Design a message processing pipeline with retries and a dead letter queue for an order service.**
Consumer attempts processing; on transient failure, message is retried with exponential backoff up to a max retry count (tracked via a header/attribute); on permanent/validation failures or after exhausting retries, the message (plus failure context: error, timestamp, retry count) is routed to a dedicated DLQ; DLQ depth is monitored with alerting wired to on-call; once root-caused and fixed, messages are redriven from the DLQ back to the main queue for reprocessing.

**Q: How would you choose between RabbitMQ, Kafka, and SQS for a new background job processing system with moderate scale and no need for event replay?**
SQS is likely the best fit — moderate scale doesn't need Kafka's high-throughput streaming/replay capabilities (which would add unnecessary operational complexity), and the requirement is simple point-to-point task distribution rather than RabbitMQ's more complex routing features; SQS's fully-managed nature minimizes operational burden for a straightforward use case like this.
