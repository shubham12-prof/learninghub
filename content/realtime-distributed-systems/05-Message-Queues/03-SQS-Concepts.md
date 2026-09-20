# 03. SQS Concepts

## What is Amazon SQS?

Amazon Simple Queue Service (SQS) is a fully-managed message queuing service from AWS — no brokers to install, patch, or scale manually. It's designed for simple, reliable, at-least-once message delivery between decoupled application components, and is one of the most widely used queue services in production due to its operational simplicity.

## Core Concepts

```
Producer -> SQS Queue -> Consumer(s)
```

| Concept                | Description                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| **Queue**              | A managed buffer holding messages until they're processed and deleted                                   |
| **Message**            | The actual payload (up to 256KB by default, larger via S3 + a reference pattern)                        |
| **Visibility Timeout** | How long a message is "hidden" from other consumers after being received, while a consumer processes it |
| **Polling**            | Consumers actively poll SQS for new messages (SQS doesn't push messages to consumers)                   |

## Two Queue Types

### Standard Queues (Default)

```
- At-least-once delivery (a message might occasionally be delivered more than once)
- Best-effort ordering (NOT guaranteed FIFO)
- Nearly unlimited throughput
```

### FIFO Queues

```
- Exactly-once processing (within a 5-minute deduplication window)
- Strict FIFO ordering (within a message group)
- Lower throughput ceiling than standard queues (though still substantial)
```

```js
// FIFO queue naming convention — must end in ".fifo"
const params = {
  QueueName: "orders.fifo",
  Attributes: {
    FifoQueue: "true",
    ContentBasedDeduplication: "true", // auto-dedupe based on message content hash
  },
};
```

## Sending Messages (Node.js — AWS SDK v3)

```bash
npm install @aws-sdk/client-sqs
```

```js
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const sqsClient = new SQSClient({ region: "us-east-1" });

async function sendOrderMessage(order) {
  const command = new SendMessageCommand({
    QueueUrl: process.env.ORDER_QUEUE_URL,
    MessageBody: JSON.stringify(order),
    MessageAttributes: {
      eventType: { DataType: "String", StringValue: "ORDER_CREATED" },
    },
  });

  await sqsClient.send(command);
}
```

## Receiving and Processing Messages

```js
const {
  ReceiveMessageCommand,
  DeleteMessageCommand,
} = require("@aws-sdk/client-sqs");

async function pollQueue() {
  const receiveCommand = new ReceiveMessageCommand({
    QueueUrl: process.env.ORDER_QUEUE_URL,
    MaxNumberOfMessages: 10, // batch up to 10 messages per poll
    WaitTimeSeconds: 20, // long polling — wait up to 20s for a message rather than returning immediately
    VisibilityTimeout: 30, // hide this message from other consumers for 30s while we process it
  });

  const response = await sqsClient.send(receiveCommand);

  for (const message of response.Messages || []) {
    try {
      const data = JSON.parse(message.Body);
      await processOrder(data);

      // Explicitly delete the message once successfully processed
      await sqsClient.send(
        new DeleteMessageCommand({
          QueueUrl: process.env.ORDER_QUEUE_URL,
          ReceiptHandle: message.ReceiptHandle,
        }),
      );
    } catch (err) {
      console.error(
        "Processing failed, message will become visible again after the timeout:",
        err,
      );
      // NOT deleting the message means it automatically reappears after VisibilityTimeout expires
    }
  }
}
```

## Long Polling vs Short Polling

```
Short Polling (WaitTimeSeconds: 0):  each request returns IMMEDIATELY,
                                       even if no messages are available
                                       -> wastes API calls checking an empty queue repeatedly

Long Polling (WaitTimeSeconds: 1-20): each request WAITS (up to the specified time)
                                       for a message to become available before returning
                                       -> far more efficient, reduces empty responses and API costs
```

**Best practice:** always use long polling (`WaitTimeSeconds` > 0) in production — it's strictly better for both cost and efficiency, with essentially no downside.

## Visibility Timeout — SQS's Core Reliability Mechanism

When a consumer receives a message, SQS doesn't delete it immediately — it becomes temporarily **invisible** to other consumers for the configured visibility timeout, giving the receiving consumer time to process it and explicitly delete it.

```
T=0s:   Consumer A receives Message X -> becomes invisible to other consumers
T=0-30s: Consumer A is processing Message X (visibility timeout = 30s)
T=30s:  If Consumer A hasn't deleted it yet -> Message X becomes visible again,
         another consumer (or the same one, on the next poll) could receive it
```

If a consumer crashes mid-processing without deleting the message, SQS automatically makes it available for another consumer once the visibility timeout expires — this is what provides SQS's at-least-once delivery guarantee.

### Extending Visibility Timeout for Long-Running Processing

```js
const { ChangeMessageVisibilityCommand } = require("@aws-sdk/client-sqs");

async function extendVisibility(receiptHandle, additionalSeconds) {
  await sqsClient.send(
    new ChangeMessageVisibilityCommand({
      QueueUrl: process.env.ORDER_QUEUE_URL,
      ReceiptHandle: receiptHandle,
      VisibilityTimeout: additionalSeconds,
    }),
  );
}
```

Useful for processing that might occasionally take longer than the default timeout — proactively extend it rather than risk the message reappearing and being processed twice.

## Message Attributes and Filtering

```js
const command = new SendMessageCommand({
  QueueUrl: queueUrl,
  MessageBody: JSON.stringify(data),
  MessageAttributes: {
    priority: { DataType: "String", StringValue: "high" },
    region: { DataType: "String", StringValue: "us-east" },
  },
});
```

When paired with SNS (Simple Notification Service) as a fan-out mechanism in front of multiple SQS queues, message attributes enable **filtering** — different subscriber queues can receive only messages matching specific attribute criteria.

## SQS + SNS Fan-Out Pattern

SQS alone is point-to-point (one message, one eventual consumer); to broadcast a message to **multiple** independent queues/consumers (similar to Kafka's multiple consumer groups), SQS is commonly paired with SNS as a pub/sub layer in front of it.

```
Producer -> SNS Topic -> SQS Queue A -> Consumer A (e.g., analytics)
                       -> SQS Queue B -> Consumer B (e.g., notifications)
                       -> SQS Queue C -> Consumer C (e.g., fraud detection)
```

```js
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const snsClient = new SNSClient({ region: "us-east-1" });

async function publishOrderEvent(order) {
  await snsClient.send(
    new PublishCommand({
      TopicArn: process.env.ORDER_EVENTS_TOPIC_ARN,
      Message: JSON.stringify(order),
    }),
  );
  // SNS delivers a copy to every SQS queue subscribed to this topic
}
```

This SNS+SQS combination is AWS's answer to the "multiple independent consumers of the same event" pattern that's native to Kafka.

## Delay Queues

```js
const command = new SendMessageCommand({
  QueueUrl: queueUrl,
  MessageBody: JSON.stringify(data),
  DelaySeconds: 60, // this message won't be visible to consumers for 60 seconds
});
```

Useful for scheduling delayed processing (e.g., "send a reminder email 24 hours from now" — though for longer delays, other services like EventBridge Scheduler are often more appropriate).

## Dead Letter Queues (Preview — Full Detail in Its Own Notes)

```js
// Configured via the source queue's RedrivePolicy attribute
{
  RedrivePolicy: JSON.stringify({
    deadLetterTargetArn: 'arn:aws:sqs:us-east-1:123456789:orders-dlq',
    maxReceiveCount: 3, // after 3 failed processing attempts, route to the DLQ automatically
  }),
}
```

(Full dedicated coverage in the Dead Letter Queue notes.)

## SQS vs RabbitMQ vs Kafka — Where SQS Fits

|                     | SQS                                                  | RabbitMQ                                 | Kafka                                                           |
| ------------------- | ---------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| Management          | Fully managed, zero infrastructure                   | Self-hosted or managed broker            | Distributed cluster, most operational complexity                |
| Routing flexibility | Basic (paired with SNS for fan-out)                  | Rich (exchanges)                         | Simple (topic + partition)                                      |
| Ordering            | FIFO queues only, standard queues best-effort        | Configurable                             | Per-partition                                                   |
| Replay              | Not supported                                        | Not supported                            | Native capability                                               |
| Best for            | Simple, reliable, low-maintenance task queues on AWS | Complex routing, traditional task queues | High-throughput event streaming, multiple independent consumers |

## Common Interview-Style Questions

- **What is the visibility timeout in SQS, and what problem does it solve?**
  The period during which a received message is hidden from other consumers while the receiving consumer processes it; it ensures that if a consumer crashes mid-processing without deleting the message, SQS automatically makes it available again for another attempt — providing SQS's at-least-once delivery guarantee.

- **What's the difference between standard and FIFO SQS queues?**
  Standard queues offer at-least-once delivery with best-effort (non-guaranteed) ordering and nearly unlimited throughput; FIFO queues guarantee strict ordering within a message group and exactly-once processing (within a deduplication window), at a lower throughput ceiling.

- **Why is long polling generally preferred over short polling?**
  Long polling waits for a message to become available (up to the configured wait time) before returning, dramatically reducing wasted API calls against an empty queue compared to short polling's immediate return — it's strictly more efficient with essentially no downside.

- **Since SQS is fundamentally point-to-point, how do you broadcast a message to multiple independent consumers?**
  Pair SQS with SNS as a pub/sub fan-out layer — a producer publishes once to an SNS topic, which delivers a copy of the message to every SQS queue subscribed to it, letting each queue's consumer process the same event independently.

- **How would you extend processing time for a message that might take longer than the configured visibility timeout?**
  Proactively call `ChangeMessageVisibility` to extend the timeout before it expires, rather than risking the message becoming visible again and being picked up by a second consumer while the first is still processing it.
