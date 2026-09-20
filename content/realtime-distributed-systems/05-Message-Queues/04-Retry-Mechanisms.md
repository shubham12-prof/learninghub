# 04. Retry Mechanisms

## Why Retries Matter in Message Queue Systems

Message processing can fail for many reasons — a transient network blip, a temporarily overloaded downstream service, a brief database outage. Retry mechanisms let a system recover automatically from these **transient** failures without losing the message or requiring manual intervention, while avoiding the pitfalls of retrying too aggressively or retrying failures that will never succeed no matter how many times you try.

## Transient vs Permanent Failures — A Critical Distinction

```
Transient failure:  a downstream database connection briefly times out
                     -> RETRYING is likely to succeed once the issue passes

Permanent failure:   the message payload is malformed JSON, or references a
                      product ID that doesn't exist and never will
                      -> RETRYING will NEVER succeed — it's the same result every time
```

Blindly retrying every failure the same way wastes resources on permanent failures (which will never succeed) and can even make things worse (hammering an already-struggling downstream service with rapid retries). Effective retry strategies distinguish between these cases.

```js
async function processMessage(message) {
  try {
    await handleOrder(message);
  } catch (err) {
    if (err instanceof ValidationError) {
      // Permanent failure — retrying won't help, route straight to a dead-letter queue
      await sendToDeadLetterQueue(message, err);
      return;
    }
    if (err instanceof TransientError) {
      throw err; // let the retry mechanism handle it
    }
  }
}
```

## Basic Retry Pattern

```js
async function processWithRetry(message, maxRetries = 3) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await processMessage(message);
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) {
        throw err; // exhausted retries, let the caller handle final failure (e.g., route to DLQ)
      }
    }
  }
}
```

## Exponential Backoff — Avoiding a Retry Storm

Immediately retrying a failed operation repeatedly (especially at scale, across many messages/consumers) can overwhelm an already-struggling downstream dependency, making the problem worse instead of better. Exponential backoff increases the delay between successive retry attempts.

```js
async function processWithExponentialBackoff(message, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await processMessage(message);
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;

      const delayMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s, 16s...
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
```

## Jitter — Preventing Synchronized Retry Storms

If many consumers/messages fail at roughly the same time (e.g., a downstream service briefly goes down), pure exponential backoff can cause them all to retry at the exact same synchronized moments, creating repeated traffic spikes. Adding randomness ("jitter") spreads retries out over time.

```js
function backoffWithJitter(attempt, baseDelayMs = 1000, maxDelayMs = 30000) {
  const exponentialDelay = Math.min(
    maxDelayMs,
    baseDelayMs * Math.pow(2, attempt),
  );
  const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5); // randomize within a range
  return jitteredDelay;
}

async function processWithBackoffAndJitter(message, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await processMessage(message);
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      const delay = backoffWithJitter(attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
```

## Retry Strategies by Message Queue System

### RabbitMQ — Requeue and Delayed Retry

```js
channel.consume(queue, async (msg) => {
  try {
    await processMessage(JSON.parse(msg.content.toString()));
    channel.ack(msg);
  } catch (err) {
    const retryCount = (msg.properties.headers["x-retry-count"] || 0) + 1;

    if (retryCount > 3) {
      channel.nack(msg, false, false); // exceeded retries — route to DLQ (if configured), discard from this queue
    } else {
      channel.nack(msg, false, false); // remove from current queue
      channel.sendToQueue(queue, msg.content, {
        headers: { "x-retry-count": retryCount },
        expiration: String(Math.pow(2, retryCount) * 1000), // delayed retry via a TTL + dead-letter-to-original-queue pattern
      });
    }
  }
});
```

RabbitMQ doesn't have built-in delayed retry natively — the common pattern uses a combination of message TTL and dead-lettering back into the original queue (or a delayed-message plugin) to implement delay.

### SQS — Visibility Timeout as a Natural Retry Delay

```js
// If processing fails, simply DON'T delete the message —
// it automatically becomes available again after the visibility timeout, acting as a built-in retry delay
async function processQueueMessage(message) {
  try {
    await processMessage(JSON.parse(message.Body));
    await deleteMessage(message.ReceiptHandle);
  } catch (err) {
    console.error(
      "Processing failed — message will retry after visibility timeout",
    );
    // no action needed; SQS handles the redelivery automatically
  }
}
```

SQS tracks the receive count automatically (`ApproximateReceiveCount` message attribute), which is what drives the dead-letter queue's `maxReceiveCount` threshold (full detail in the Dead Letter Queue notes).

### Kafka — Retry Topics Pattern

Since Kafka doesn't have built-in per-message retry/redelivery (a consumer either commits an offset and moves on, or doesn't), a common pattern uses dedicated **retry topics** with increasing delays.

```
orders-topic -> (processing fails) -> orders-retry-1m (wait 1 min, then retry)
                                    -> orders-retry-5m (wait 5 min, then retry)
                                    -> orders-retry-30m (wait 30 min, then retry)
                                    -> orders-dlq (all retries exhausted)
```

```js
async function processWithKafkaRetry(message, currentTopic) {
  try {
    await processMessage(message);
  } catch (err) {
    const retryTopic = getNextRetryTopic(currentTopic); // e.g., orders -> orders-retry-1m -> orders-retry-5m -> orders-dlq
    await producer.send({
      topic: retryTopic,
      messages: [
        {
          value: JSON.stringify(message),
          headers: { originalTopic: currentTopic },
        },
      ],
    });
  }
}
```

A separate consumer for each retry topic waits the appropriate delay (often implemented by simply pausing consumption for that duration, or using the message's timestamp to determine if enough time has passed) before reprocessing.

## Idempotency — Retries' Essential Companion

Since retries mean a message might be processed more than once (especially with at-least-once delivery systems), the processing logic itself must be **idempotent** — safe to run multiple times with the same net effect.

```js
async function processPayment(payment) {
  // Using the payment's own idempotency key prevents double-charging on a retry
  const existing = await db.processedPayments.findOne({
    idempotencyKey: payment.id,
  });
  if (existing) {
    return existing.result; // already processed — return the same result without repeating the side effect
  }

  const result = await chargeCustomer(payment);
  await db.processedPayments.create({ idempotencyKey: payment.id, result });
  return result;
}
```

Without idempotency, retries can cause serious bugs — duplicate charges, duplicate emails, duplicate inventory deductions — precisely because the retry mechanism is doing its job of trying again.

## Retry Limits — Knowing When to Stop

```js
const MAX_RETRIES = 5;

if (retryCount >= MAX_RETRIES) {
  await sendToDeadLetterQueue(message);
  await alertOnCallEngineer(message, retryCount); // repeated failures often warrant human attention
}
```

Unlimited retries risk a message getting stuck in an infinite retry loop indefinitely (a "poison message"), consuming resources forever without ever succeeding — a firm retry limit paired with a dead-letter queue (covered in its own dedicated notes) is essential.

## Circuit Breakers — Complementing Retries

When a downstream dependency is clearly down (not just occasionally flaky), continuing to retry every single message against it wastes resources and delays recovery detection. A circuit breaker (covered in the Distributed Systems Availability notes) can pause processing entirely for a period once failures exceed a threshold, rather than retrying every message individually against a dependency that's obviously unavailable.

## Common Interview-Style Questions

- **Why is it important to distinguish transient failures from permanent failures when designing a retry strategy?**
  Retrying a permanent failure (like malformed data) will never succeed no matter how many attempts are made, wasting resources and delaying the message's eventual routing to a dead-letter queue; only transient failures (temporary network issues, brief downstream outages) genuinely benefit from being retried.

- **What is exponential backoff, and why is it preferred over immediate/fixed-interval retries?**
  A strategy that increases the delay between successive retry attempts (e.g., 1s, 2s, 4s, 8s...); it's preferred because immediately retrying a failed operation repeatedly can overwhelm an already-struggling downstream dependency, potentially worsening the underlying problem instead of allowing it time to recover.

- **What is "jitter," and what problem does it solve on top of exponential backoff?**
  Adding randomness to the calculated backoff delay; it prevents many consumers/messages that failed around the same time from all retrying at exactly the same synchronized moments, which would otherwise create repeated, predictable traffic spikes against the recovering dependency.

- **Why must message processing logic be idempotent when using a retry mechanism?**
  Because retries (especially with at-least-once delivery systems) mean the same message could be processed more than once; without idempotent logic, this can cause serious bugs like duplicate charges, duplicate emails, or duplicate inventory deductions — the retry mechanism doing exactly what it's designed to do becomes harmful without idempotency as its safety net.

- **How does SQS provide retry behavior without any explicit application-level retry code?**
  Through its visibility timeout mechanism — if a consumer fails to delete a message (because processing failed or it crashed), the message automatically becomes visible again after the timeout expires, making it available for another processing attempt without any additional retry logic needed in the application.
