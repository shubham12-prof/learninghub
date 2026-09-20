# 07. Pub/Sub

## What is Redis Pub/Sub?

Redis Pub/Sub (Publish/Subscribe) is a messaging pattern where **publishers** send messages to named **channels**, and **subscribers** listening on those channels receive them in real time. It decouples senders from receivers — publishers don't know or care who (if anyone) is listening.

```
Publisher --> [channel: "notifications"] --> Subscriber A
                                          --> Subscriber B
                                          --> Subscriber C
```

## Basic Commands

```bash
# In one terminal — subscribe to a channel
SUBSCRIBE notifications

# In another terminal — publish a message
PUBLISH notifications "Hello subscribers!"
```

The subscribed terminal immediately receives the message.

## Using Pub/Sub with Node.js (`ioredis`)

Publishing and subscribing require **separate connections** — a client in subscriber mode can't issue other commands on that same connection.

```js
const Redis = require("ioredis");

const publisher = new Redis();
const subscriber = new Redis(); // MUST be a separate connection

subscriber.subscribe("notifications", (err, count) => {
  if (err) console.error("Failed to subscribe:", err);
  else console.log(`Subscribed to ${count} channel(s)`);
});

subscriber.on("message", (channel, message) => {
  console.log(`Received on ${channel}: ${message}`);
});

// Elsewhere in the app (or a different process entirely)
await publisher.publish("notifications", "Hello subscribers!");
```

## Pattern-Based Subscriptions — `PSUBSCRIBE`

Subscribe to multiple channels matching a glob-style pattern, instead of one exact channel name.

```bash
PSUBSCRIBE "notifications:*"
```

```js
subscriber.psubscribe("notifications:*");

subscriber.on("pmessage", (pattern, channel, message) => {
  console.log(`Pattern ${pattern} matched channel ${channel}: ${message}`);
});

await publisher.publish("notifications:user:1000", "You have a new follower");
await publisher.publish("notifications:order:5", "Your order has shipped");
```

## Practical Use Case 1: Real-Time Notifications

```js
async function notifyUser(userId, message) {
  await publisher.publish(
    `user:${userId}:notifications`,
    JSON.stringify({
      message,
      timestamp: Date.now(),
    }),
  );
}

// A WebSocket server subscribes and forwards to the connected client
subscriber.psubscribe("user:*:notifications");
subscriber.on("pmessage", (pattern, channel, message) => {
  const userId = channel.split(":")[1];
  const socket = connectedSockets.get(userId);
  if (socket) socket.send(message);
});
```

## Practical Use Case 2: Cache Invalidation Across Multiple App Instances

When running multiple server instances behind a load balancer, each with its own in-memory cache layer, Pub/Sub lets one instance broadcast "this data changed" so all instances can invalidate their local cache.

```js
async function invalidateCache(key) {
  localCache.delete(key); // invalidate locally
  await publisher.publish("cache:invalidate", key); // tell all OTHER instances too
}

subscriber.subscribe("cache:invalidate");
subscriber.on("message", (channel, key) => {
  localCache.delete(key); // every instance clears its own local copy
});
```

## Practical Use Case 3: Chat Application

```js
async function sendMessage(roomId, message) {
  await publisher.publish(`room:${roomId}`, JSON.stringify(message));
}

function joinRoom(roomId, onMessage) {
  subscriber.subscribe(`room:${roomId}`);
  subscriber.on("message", (channel, message) => {
    if (channel === `room:${roomId}`) onMessage(JSON.parse(message));
  });
}
```

## Unsubscribing

```js
await subscriber.unsubscribe("notifications");
await subscriber.punsubscribe("notifications:*");
```

## Important Limitation: Pub/Sub is "Fire and Forget"

**Messages published while no subscriber is connected are lost forever.** Redis Pub/Sub does not persist or queue messages — if a subscriber disconnects and reconnects, it will have missed anything published in between.

```
Publisher publishes "event A"  -> No subscribers connected -> message is GONE, nobody ever receives it
Subscriber connects
Publisher publishes "event B"  -> Subscriber receives it
```

This makes plain Pub/Sub unsuitable for anything requiring guaranteed delivery, message history, or replay — for that, use **Redis Streams** instead (a more robust, persistent alternative built for exactly this kind of requirement).

## Pub/Sub vs Redis Streams

|                     | Pub/Sub                                                                 | Streams                                                        |
| ------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| Message persistence | None — fire and forget                                                  | Persisted, can be replayed                                     |
| Delivery guarantee  | Only delivered if a subscriber is connected at publish time             | Consumers can catch up on missed messages                      |
| Consumer groups     | Not supported                                                           | Supported — multiple consumers can split work reliably         |
| Best for            | Real-time, ephemeral broadcast (live notifications, cache invalidation) | Event sourcing, reliable message queues, replayable event logs |

## Common Interview-Style Questions

- **What is Redis Pub/Sub, and how does it decouple publishers from subscribers?**
  A messaging pattern where publishers send messages to named channels without knowing who (if anyone) is listening; subscribers independently listen to channels they're interested in, with no direct coupling between the two sides.

- **Why does a Redis client used for subscribing need a separate connection from one used for publishing/other commands?**
  Once a connection enters subscriber mode, it's dedicated to receiving pushed messages and can't issue other regular commands on that same connection — a separate connection is needed for publishing or any other Redis operations.

- **What's the critical limitation of Redis Pub/Sub regarding message delivery?**
  Messages are fire-and-forget — if no subscriber is connected at the moment a message is published, that message is lost permanently; there's no persistence, queuing, or replay capability.

- **When would you choose Redis Streams over Pub/Sub?**
  When you need guaranteed delivery, message persistence, the ability for consumers to catch up on missed messages, or reliable work distribution across multiple consumers (consumer groups) — scenarios where losing messages during a disconnect would be unacceptable.

- **Give a practical use case for `PSUBSCRIBE` (pattern subscription).**
  Subscribing to a dynamic set of channels matching a pattern, such as `user:*:notifications`, to handle notifications for any user without needing to individually subscribe to each user's specific channel.
