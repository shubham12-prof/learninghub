# 06. Scaling

## The Core Problem: Socket.IO State Is In-Memory by Default

By default, a Socket.IO server tracks connected clients, rooms, and broadcasts entirely **in the memory of a single process**. This works perfectly for one server instance, but breaks down the moment you scale horizontally (multiple Node.js processes/servers behind a load balancer):

```
Load Balancer
     │
  ┌──┴──┐
  ▼     ▼
Server A   Server B
(has Room X in memory)  (has NO knowledge of Room X)
```

If Client 1 connects to Server A and joins "room-X", and Client 2 connects to Server B, a broadcast to "room-X" from Server A will **never reach Client 2** — Server B has no idea "room-X" or Client 2's membership in it even exists, since that state lives only in Server A's memory.

## Problem 1: Broadcasting Across Instances

Solved with an **adapter** — a pluggable mechanism that propagates events between all server instances, typically via a shared message broker like Redis.

## Problem 2: Sticky Sessions (For HTTP Long-Polling Fallback)

Socket.IO's long-polling transport involves multiple sequential HTTP requests forming one logical connection. If a load balancer routes these requests to _different_ server instances, the connection breaks, since each instance only has a piece of the conversation.

```
Client's polling requests: Request 1 -> Server A
                            Request 2 -> Server B  <- BROKEN, Server B doesn't recognize this session
```

**Solution:** configure your load balancer for **sticky sessions** (also called session affinity) — ensuring all requests from a given client are routed to the same server instance, based on a cookie or IP hash.

```nginx
# Example: nginx sticky sessions via IP hash
upstream socketio_nodes {
  ip_hash;
  server node1:3000;
  server node2:3000;
}
```

> If you force `transports: ['websocket']` only (skipping long-polling entirely), a single WebSocket connection stays pinned to one server for its whole lifetime naturally — reducing (but not entirely eliminating, since the initial handshake can still matter depending on setup) the need for sticky sessions. Still generally recommended to configure them for robustness.

## The Redis Adapter — Solving Cross-Instance Broadcasting

```bash
npm install @socket.io/redis-adapter ioredis
```

```js
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const Redis = require("ioredis");

const pubClient = new Redis(process.env.REDIS_URL);
const subClient = pubClient.duplicate(); // Redis Pub/Sub requires a SEPARATE connection for subscribing

const io = new Server(httpServer, {
  adapter: createAdapter(pubClient, subClient),
});
```

With the adapter configured, `io.to('room-X').emit(...)` automatically works correctly regardless of which server instance a given client is connected to — the adapter uses Redis Pub/Sub under the hood to relay the broadcast to every server instance, each of which then delivers it to its own locally-connected matching clients.

```
Server A: io.to('room-X').emit('event', data)
     │
     ▼ (published via Redis Pub/Sub)
  Redis
     │
  ┌──┴──┐
  ▼     ▼
Server A   Server B
(delivers to   (delivers to
local room-X    local room-X
members)         members)
```

## Full Multi-Instance Setup Example

```js
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const Redis = require("ioredis");

const app = express();
const httpServer = createServer(app);

const pubClient = new Redis(process.env.REDIS_URL);
const subClient = pubClient.duplicate();

const io = new Server(httpServer, {
  adapter: createAdapter(pubClient, subClient),
  cors: { origin: "https://myfrontend.com" },
});

io.on("connection", (socket) => {
  socket.on("join-room", (room) => socket.join(room));

  socket.on("message", ({ room, text }) => {
    io.to(room).emit("message", text); // works correctly across ALL instances now
  });
});

httpServer.listen(process.env.PORT || 3000);
```

Each server instance runs this exact same code — the Redis adapter transparently handles cross-instance coordination without any application-level changes to how you call `emit`/`to`/`in`.

## Checking Connection State Across the Whole Cluster

The adapter also enables querying room/socket state across all instances, not just the local one.

```js
const sockets = await io.in("room-X").fetchSockets(); // returns sockets from ALL instances, not just the local one
console.log(sockets.length); // accurate cluster-wide count
```

## Alternative Adapters

| Adapter                            | Backing Store                      | Notes                                                                    |
| ---------------------------------- | ---------------------------------- | ------------------------------------------------------------------------ |
| `@socket.io/redis-adapter`         | Redis Pub/Sub                      | Most common, well-documented, widely used                                |
| `@socket.io/redis-streams-adapter` | Redis Streams                      | Offers message persistence/replay guarantees Pub/Sub lacks               |
| `@socket.io/postgres-adapter`      | PostgreSQL (via `LISTEN`/`NOTIFY`) | Good if you're already heavily invested in Postgres infrastructure       |
| `@socket.io/cluster-adapter`       | Node.js Cluster module             | For scaling across CPU cores on a single machine (not multiple machines) |
| `@socket.io/mongo-adapter`         | MongoDB Change Streams             | Alternative if MongoDB is your existing infrastructure                   |

## Horizontal Scaling Architecture Overview

```
                    ┌────────────────┐
    Clients  ---->  │  Load Balancer  │  (with sticky sessions configured)
                    └────────┬────────┘
              ┌──────────────┼──────────────┐
              ▼               ▼               ▼
        Node Server A   Node Server B   Node Server C
              │               │               │
              └───────────────┼───────────────┘
                               ▼
                        Redis (Pub/Sub)
                    (coordinates broadcasts
                     across all instances)
```

## Scaling Beyond a Single Redis Instance

For very large deployments, Redis itself can become a bottleneck or single point of failure for the adapter's Pub/Sub traffic. Options include:

- **Redis Cluster** — sharding Redis itself across multiple nodes.
- **Redis Sentinel** — high availability/failover for the Redis instance backing the adapter.
- Separating the adapter's Redis instance from other Redis usage (caching, sessions, rate limiting) in your infrastructure, so Socket.IO's coordination traffic doesn't compete with unrelated Redis workloads.

## Monitoring and Health at Scale

```js
io.on("connection", (socket) => {
  console.log(`Total connections on this instance: ${io.engine.clientsCount}`);
});
```

For cluster-wide visibility (not just per-instance), you'd typically aggregate metrics via your monitoring/observability stack (Prometheus, Datadog, etc.) rather than relying solely on Socket.IO's own APIs, since `io.engine.clientsCount` only reflects the local instance.

## Common Interview-Style Questions

- **Why does a basic Socket.IO setup break when you scale to multiple server instances?**
  By default, room membership and connection state are tracked entirely in each server process's own memory; a broadcast issued from one instance has no way to reach clients connected to a different instance, since that instance doesn't share any knowledge of the originating instance's rooms/clients.

- **What problem does the Redis adapter solve?**
  It propagates broadcast events across all server instances via Redis Pub/Sub, so calling `io.to(room).emit(...)` on any instance correctly reaches matching clients regardless of which instance they're actually connected to.

- **What are sticky sessions, and why are they needed for Socket.IO at scale?**
  Load balancer configuration ensuring all requests from a given client are routed to the same server instance; needed because Socket.IO's HTTP long-polling fallback transport involves multiple sequential requests that must all reach the same server instance to form one coherent logical connection — without this, the polling-based connection breaks.

- **Does forcing WebSocket-only transport eliminate the need for sticky sessions entirely?**
  It significantly reduces the need, since a single WebSocket connection naturally stays pinned to one server instance for its whole lifetime once established — but sticky sessions are still generally recommended for robustness (e.g., around the initial handshake and any transport fallback edge cases), and are strictly required if long-polling fallback is enabled at all.

- **What does the Redis adapter use under the hood to coordinate between instances?**
  Redis Pub/Sub — each server instance both publishes broadcast events to Redis and subscribes to receive events published by other instances, then delivers those events to its own locally-connected matching clients.
