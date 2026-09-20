# 05. Dead Letter Queue

## What is a Dead Letter Queue (DLQ)?

A dead letter queue is a separate queue where messages are routed after they repeatedly fail processing (exceeding a defined retry limit) or otherwise can't be delivered/processed successfully. Instead of retrying forever (wasting resources) or silently discarding the message (losing data and hiding the failure), the DLQ preserves the message for investigation while letting the main queue continue processing subsequent messages without getting stuck.

```
Main Queue: [msg1] [msg2] [msg3 - fails repeatedly] [msg4] [msg5]
                              │
                    after N failed attempts
                              │
                              ▼
                    Dead Letter Queue: [msg3]

Meanwhile, msg4 and msg5 continue processing normally in the main queue,
UNBLOCKED by msg3's persistent failure
```

## Why DLQs Are Essential — The "Poison Message" Problem

Without a DLQ, a message that can never be successfully processed (a "poison message" — malformed data, a reference to a deleted entity, a bug triggered only by this specific payload) can block an entire queue/partition if retries are configured to loop indefinitely, or silently vanish if failures are simply discarded — both outcomes are bad.

```
WITHOUT a DLQ:
  Option A: retry forever -> poison message blocks all subsequent messages behind it forever
  Option B: discard on failure -> data loss, no visibility into what went wrong, no chance to fix and reprocess

WITH a DLQ:
  After N failed attempts -> message moves to DLQ
  -> main queue keeps processing subsequent messages normally
  -> the failed message is PRESERVED for investigation, alerting, and potential reprocessing
```

## DLQ Configuration in SQS

```js
// Source queue configuration — RedrivePolicy points to the DLQ
const params = {
  QueueName: "orders-queue",
  Attributes: {
    RedrivePolicy: JSON.stringify({
      deadLetterTargetArn: "arn:aws:sqs:us-east-1:123456789012:orders-dlq",
      maxReceiveCount: "3", // after 3 failed receive attempts (not deleted), route to the DLQ automatically
    }),
  },
};
```

SQS handles this entirely automatically — once a message's `ApproximateReceiveCount` exceeds `maxReceiveCount`, SQS itself moves it to the configured DLQ, with zero custom application code required.

```js
// Consuming from the DLQ to investigate failures
async function inspectDeadLetterQueue() {
  const response = await sqsClient.send(
    new ReceiveMessageCommand({
      QueueUrl: process.env.ORDERS_DLQ_URL,
      MaxNumberOfMessages: 10,
    }),
  );

  for (const message of response.Messages || []) {
    console.log("Failed message:", message.Body);
    console.log("Attributes:", message.Attributes); // includes failure history context
  }
}
```

## DLQ Configuration in RabbitMQ

RabbitMQ implements dead-lettering via a queue argument pointing to a dead-letter exchange, which routes failed messages to a designated DLQ.

```js
// Main queue configured with dead-letter routing
await channel.assertQueue("orders", {
  durable: true,
  arguments: {
    "x-dead-letter-exchange": "dlx", // route dead-lettered messages to this exchange
    "x-dead-letter-routing-key": "orders-dead", // with this routing key
  },
});

await channel.assertExchange("dlx", "direct", { durable: true });
await channel.assertQueue("orders-dlq", { durable: true });
await channel.bindQueue("orders-dlq", "dlx", "orders-dead");
```

```js
channel.consume("orders", async (msg) => {
  try {
    await processOrder(JSON.parse(msg.content.toString()));
    channel.ack(msg);
  } catch (err) {
    const retryCount = (msg.properties.headers?.["x-retry-count"] || 0) + 1;

    if (retryCount > 3) {
      channel.nack(msg, false, false); // false, false = don't requeue -> triggers dead-lettering to the configured DLX
    } else {
      // requeue with an incremented retry counter (implementation detail varies)
      channel.nack(msg, false, true);
    }
  }
});
```

## DLQ Pattern in Kafka

Kafka doesn't have a native DLQ concept the way SQS/RabbitMQ do — the pattern is implemented at the application level, typically as a dedicated topic.

```js
async function processKafkaMessageWithDlq(message, maxRetries = 3) {
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
            {
              value: message.value,
              headers: {
                originalTopic: "orders",
                originalPartition: String(message.partition),
                originalOffset: message.offset,
                errorMessage: err.message,
                failedAt: new Date().toISOString(),
              },
            },
          ],
        });
      }
    }
  }
}
```

(Full detail on Kafka's retry-topic pattern in the dedicated Retry Mechanisms notes.)

## What to Include in a DLQ Message — Preserving Debugging Context

A DLQ message should carry enough context to actually diagnose and potentially reprocess the failure — not just the raw original payload.

```js
async function sendToDeadLetterQueue(originalMessage, error) {
  const dlqPayload = {
    originalMessage,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    failedAt: new Date().toISOString(),
    retryCount: originalMessage.retryCount,
    originalQueue: "orders-queue",
  };

  await sendToQueue("orders-dlq", dlqPayload);
}
```

## Monitoring and Alerting on the DLQ

A DLQ is only useful if someone actually looks at it — messages silently accumulating in a DLQ with no monitoring defeats much of its purpose.

```js
// Conceptual: check DLQ depth periodically, alert if it grows
async function monitorDlqDepth() {
  const attributes = await sqsClient.send(
    new GetQueueAttributesCommand({
      QueueUrl: process.env.ORDERS_DLQ_URL,
      AttributeNames: ["ApproximateNumberOfMessages"],
    }),
  );

  const depth = Number(attributes.Attributes.ApproximateNumberOfMessages);
  if (depth > 0) {
    await alertOnCallEngineer(
      `Orders DLQ has ${depth} messages awaiting investigation`,
    );
  }
}
```

Most production setups wire DLQ depth into their standard monitoring/alerting stack (CloudWatch Alarms, Datadog, Prometheus) rather than relying on manual periodic checks.

## Reprocessing Messages from a DLQ

Once the underlying issue is identified and fixed (a bug patched, a downstream service restored, bad data corrected), messages in the DLQ can be moved back to the original queue for reprocessing.

```js
async function redriveFromDlq(dlqUrl, originalQueueUrl) {
  const response = await sqsClient.send(
    new ReceiveMessageCommand({
      QueueUrl: dlqUrl,
      MaxNumberOfMessages: 10,
    }),
  );

  for (const message of response.Messages || []) {
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: originalQueueUrl,
        MessageBody: message.Body,
      }),
    );

    await sqsClient.send(
      new DeleteMessageCommand({
        QueueUrl: dlqUrl,
        ReceiptHandle: message.ReceiptHandle,
      }),
    );
  }
}
```

AWS also provides a built-in **"redrive to source"** feature for SQS DLQs specifically, handling this exact workflow without custom code.

## DLQ Best Practices

1. **Always configure a maximum retry count** before dead-lettering — never retry indefinitely.
2. **Preserve failure context** (error message, timestamp, retry count, original metadata) alongside the message, not just the raw payload.
3. **Actively monitor DLQ depth** — an accumulating DLQ with no alerting is a silent, growing problem.
4. **Have a defined process for handling DLQ messages** — investigate, fix, and either reprocess or discard with a documented reason; don't let messages sit indefinitely with no resolution path.
5. **Set a retention/expiration policy on the DLQ itself** — even "failed forever" messages shouldn't accumulate without limit.
6. **Consider separate DLQs per failure type or severity** for high-volume systems, making triage easier than one giant mixed DLQ.

## Common Interview-Style Questions

- **What is a dead letter queue, and what problem does it solve?**
  A separate queue where messages are routed after repeatedly failing processing beyond a configured retry limit; it solves the "poison message" problem — preventing a message that can never succeed from either blocking the main queue indefinitely (if retried forever) or being silently lost (if simply discarded on failure).

- **How does SQS implement dead-lettering, and what triggers it?**
  Via a `RedrivePolicy` on the source queue specifying a target DLQ and a `maxReceiveCount`; once a message's receive count exceeds that threshold without being deleted (i.e., successfully processed), SQS automatically moves it to the configured DLQ with no custom application code required.

- **Why is it important to preserve failure context (error details, timestamp, retry count) when routing a message to a DLQ, rather than just the raw original payload?**
  Without that context, diagnosing why a message failed becomes much harder — the failure context provides the information needed to actually investigate, fix the underlying issue, and decide whether/how to safely reprocess the message.

- **Why is monitoring DLQ depth an essential operational practice, not just a nice-to-have?**
  A DLQ with no monitoring can silently accumulate failed messages indefinitely without anyone noticing — defeating much of the DLQ's purpose, since the entire point is to surface failures for investigation rather than let them disappear unnoticed.

- **What does "redriving" messages from a DLQ mean, and when would you do it?**
  Moving messages from the DLQ back to the original queue for reprocessing, typically done after identifying and fixing the underlying issue that caused the original failures (a bug, bad data, a downstream outage) — allowing previously-failed messages to now be successfully processed.
