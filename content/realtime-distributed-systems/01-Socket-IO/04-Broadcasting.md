# 04. Broadcasting

## What is Broadcasting?

Broadcasting means sending an event to multiple sockets at once, rather than a single targeted client. Socket.IO provides a flexible set of targeting options — from "everyone" to "everyone except me" to specific rooms/namespaces — all built on the same underlying `emit()` mechanism.

## Sending to a Single Socket

```js
socket.emit("event", data); // only this specific connected client receives it
```

## Broadcasting to Everyone (Including Sender)

```js
io.emit("event", data); // ALL connected clients across the whole (default) namespace
```

## Broadcasting to Everyone EXCEPT the Sender

The most common broadcasting pattern in practice — e.g., "notify everyone else that I just sent a message" (the sender already knows, since they sent it).

```js
socket.broadcast.emit("event", data); // everyone except this socket
```

### Example: Chat "User is Typing" Indicator

```js
socket.on("typing", () => {
  socket.broadcast.emit("user-typing", { userId: socket.data.userId });
});
```

## Broadcasting to a Specific Room

```js
io.to("room-A").emit("event", data); // everyone in room-A, including sender if they're a member
socket.to("room-A").emit("event", data); // everyone in room-A EXCEPT the sender
```

## Broadcasting to Multiple Rooms

```js
io.to("room-A").to("room-B").emit("event", data); // union of both rooms — no duplicate delivery even if a socket is in both
```

## Broadcasting to a Room, Excluding Specific Sockets

```js
io.to("room-A").except("room-B").emit("event", data); // everyone in room-A who is NOT also in room-B
```

## Broadcasting Within a Namespace

```js
io.of("/chat").emit("event", data); // all clients in the /chat namespace
io.of("/chat").to("room-1").emit("event", data); // room-1, scoped to the /chat namespace only
```

## Volatile Broadcasts — "At Most Once" Delivery

For data where losing occasional messages is acceptable (e.g., a live cursor position, a rapidly-updating live metric), volatile emits skip queuing/buffering for disconnected/slow clients — prioritizing throughput over guaranteed delivery.

```js
io.volatile.emit("cursor-position", { x, y }); // won't be buffered/retried if the client isn't ready to receive right now
```

## Acknowledgement-Based Broadcasting

```js
io.timeout(5000).emit("important-update", data, (err, responses) => {
  if (err) {
    console.log("Some clients did not acknowledge in time");
  } else {
    console.log("All acknowledgements received:", responses);
  }
});
```

## Compressing Large Payloads

```js
io.compress(false).emit("event", data); // disable compression for this specific emit — useful for already-compressed or very small payloads where compression overhead isn't worth it
```

## Practical Use Case 1: Live Notification System

```js
function broadcastSystemAnnouncement(message) {
  io.emit("system-announcement", { message, timestamp: Date.now() });
}

function notifyRoom(roomId, notification) {
  io.to(roomId).emit("notification", notification);
}
```

## Practical Use Case 2: Real-Time Dashboard Updates

```js
// A backend job updates data, then broadcasts the change to anyone viewing the dashboard
async function onOrderCreated(order) {
  await saveOrder(order);
  io.to("dashboard-viewers").emit("new-order", order);
}

// Clients subscribe by joining the dashboard room
io.on("connection", (socket) => {
  socket.on("view-dashboard", () => socket.join("dashboard-viewers"));
});
```

## Practical Use Case 3: Multiplayer Game State Sync

```js
io.on("connection", (socket) => {
  socket.on("join-game", (gameId) => {
    socket.join(`game:${gameId}`);
  });

  socket.on("player-move", ({ gameId, position }) => {
    // broadcast the move to everyone else in the game EXCEPT the player who moved
    socket.to(`game:${gameId}`).emit("player-moved", {
      playerId: socket.id,
      position,
    });
  });
});
```

## Broadcasting From Outside a Connection Handler (Server-Initiated Events)

A common need: broadcast an event triggered by something other than a socket message — e.g., a webhook, a scheduled job, or an HTTP API endpoint.

```js
const express = require("express");
const app = express();

app.post("/api/orders/:id/ship", async (req, res) => {
  const order = await markOrderShipped(req.params.id);

  // Broadcast directly via the `io` instance — no socket/event context needed
  io.to(`user:${order.userId}`).emit("order-shipped", order);

  res.json(order);
});
```

This works because `io` (the server instance) is available anywhere in your application, not just inside `io.on('connection', ...)` handlers — a huge advantage for integrating real-time updates with regular REST API logic.

## Broadcasting Across Multiple Server Instances

By default, broadcasts only reach clients connected to the **same server process**. In a horizontally-scaled deployment (multiple Node.js instances behind a load balancer), broadcasting requires an **adapter** (commonly backed by Redis) so events propagate across all instances — covered in full detail in the Scaling notes.

```js
// Without an adapter, this ONLY reaches clients connected to THIS specific server instance
io.to("room-A").emit("event", data);

// With the Redis adapter configured, the same code automatically reaches
// clients connected to ANY server instance in the cluster
```

## Summary Table of Broadcasting Targets

| Code                           | Recipients                                                       |
| ------------------------------ | ---------------------------------------------------------------- |
| `socket.emit()`                | Just this one socket                                             |
| `io.emit()`                    | Everyone, all namespaces' default `/`                            |
| `socket.broadcast.emit()`      | Everyone except the sender                                       |
| `io.to(room).emit()`           | Everyone in `room`                                               |
| `socket.to(room).emit()`       | Everyone in `room` except the sender                             |
| `io.of('/ns').emit()`          | Everyone in namespace `/ns`                                      |
| `io.of('/ns').to(room).emit()` | Everyone in `room`, scoped to namespace `/ns`                    |
| `io.volatile.emit()`           | Everyone, but drop the message for clients not immediately ready |

## Common Interview-Style Questions

- **What's the difference between `io.emit()` and `socket.broadcast.emit()`?**
  `io.emit()` sends to every connected client, including the one that triggered it (if applicable); `socket.broadcast.emit()` sends to everyone except the socket that called it — the standard pattern for "notify everyone else."

- **What does a "volatile" emit do, and when would you use one?**
  It sends without guaranteeing delivery — if a client isn't immediately ready to receive (e.g., temporarily disconnected or busy), the message is simply dropped rather than queued; useful for high-frequency, non-critical data like live cursor positions where the next update will supersede a missed one anyway.

- **How would you broadcast an event triggered by an HTTP API endpoint rather than a socket message?**
  Since the Socket.IO server instance (`io`) is a standalone object accessible throughout the application, you can call `io.to(...).emit(...)` directly from any Express route handler or backend job — no active socket connection context is required to broadcast.

- **Why does broadcasting to a room only reach clients on the same server process by default, and how do you fix that in a scaled deployment?**
  Room membership and broadcast delivery are tracked in-memory per server process by default; in a multi-instance deployment, you need an adapter (typically Redis-backed) that propagates broadcast events across all server instances so a client connected to any instance receives messages regardless of which instance handled the originating emit.

- **How would you implement a "someone is typing" indicator in a chat app?**
  On receiving a `typing` event from a client, use `socket.broadcast.to(room).emit('user-typing', {...})` (or `socket.to(room).emit(...)`) to notify everyone else in that chat room except the person currently typing.
