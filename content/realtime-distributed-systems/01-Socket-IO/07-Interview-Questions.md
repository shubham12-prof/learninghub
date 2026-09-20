# 07. Interview Questions — Socket.IO (Comprehensive)

A consolidated set of commonly asked Socket.IO / WebSocket interview questions, organized by topic, with concise answers and code where useful.

---

## WebSockets

**Q: What is a WebSocket, and how does it differ from standard HTTP?**
A persistent, full-duplex connection allowing either side to send messages anytime after an initial handshake; standard HTTP is request-response, with the connection typically closing after each exchange.

**Q: Is Socket.IO the same as WebSockets?**
No — Socket.IO is a library built on top of WebSockets (and other transports like HTTP long-polling) that adds its own protocol, automatic reconnection, fallback transports, and abstractions like rooms/namespaces. A raw WebSocket client can't directly connect to a Socket.IO server without speaking its specific protocol.

**Q: Why does Socket.IO fall back to HTTP long-polling?**
Some networks/proxies/older browsers don't support WebSocket connections; long-polling provides a compatible fallback, at the cost of higher latency/overhead versus a true WebSocket.

**Q: When would you choose Server-Sent Events (SSE) over Socket.IO?**
When you only need one-way server-to-client updates and don't need the client to send data back over the same channel — SSE is simpler, plain HTTP, with built-in browser-native reconnection.

---

## Rooms

**Q: Is a room a client-side or server-side concept?**
Server-side — the client has no built-in awareness of room membership beyond receiving messages sent to rooms it happens to be in.

**Q: What room does every socket automatically join?**
A room matching its own `socket.id`, enabling `socket.emit()` to a single client.

**Q: Difference between `io.to(room).emit()` and `socket.to(room).emit()`?**
`io.to()` sends to everyone in the room including the sender (if a member); `socket.to()` sends to everyone except the sender.

**Q: How would you implement per-user notifications across multiple open tabs?**
Automatically join every authenticated socket to a room named after the user's ID (`user:{id}`); notifications sent to that room reach every open connection for that user.

**Q: Do rooms persist across a server restart?**
No — they exist only in server process memory and are recreated as sockets rejoin based on application logic.

---

## Namespaces

**Q: Fundamental difference between a namespace and a room?**
A namespace is a separate communication channel established at connection time with its own events/middleware; a room is a lightweight grouping within a namespace requiring no special client connection step.

**Q: Why use namespace-level middleware instead of per-event authorization checks?**
It enforces the check once at connection time for every client attempting to connect, guaranteeing the `connection` handler only runs for already-authorized clients.

**Q: Practical use case for dynamic namespace patterns?**
Multi-tenant applications needing isolated real-time channels per tenant (`/tenant-{id}`), created dynamically via a regex pattern.

**Q: Do event handlers on different namespaces interfere with each other even if named the same?**
No — namespaces have entirely separate event scopes.

---

## Broadcasting

**Q: Difference between `io.emit()` and `socket.broadcast.emit()`?**
`io.emit()` sends to every connected client including the sender; `socket.broadcast.emit()` sends to everyone except the sender — the standard pattern for "notify everyone else."

**Q: What does a volatile emit do?**
Sends without guaranteeing delivery — messages are dropped for clients not immediately ready, rather than queued; useful for high-frequency non-critical data like live cursor positions.

**Q: How would you broadcast from an HTTP API endpoint rather than a socket handler?**
Since the `io` server instance is accessible anywhere in the app, call `io.to(...).emit(...)` directly from an Express route handler — no active socket context is required.

**Q: Why does broadcasting only reach clients on the same server by default?**
Room membership and broadcast delivery are tracked in-memory per process; a multi-instance deployment needs an adapter (typically Redis-backed) to propagate events across instances.

---

## Authentication

**Q: Why prefer `handshake.auth` over query parameters for tokens?**
Query parameters are more likely captured in logs/browser history/proxies since they're part of the URL; `auth` is sent as part of the handshake body.

**Q: When does authentication middleware run relative to the `connection` event?**
Before it — calling `next(new Error(...))` rejects the connection entirely, so the handler never executes for unauthenticated sockets.

**Q: How does a client handle a rejected authentication attempt?**
Listen for the `connect_error` event, which fires with the error passed to `next()` on the server.

**Q: Why is authentication alone insufficient for a real-time app?**
Authorization (checking whether an authenticated user can perform a specific action, like joining a room or deleting a message) must still be verified per-event.

**Q: How would you handle a socket connection outliving its JWT's expiration?**
Let the client refresh its token and force a fresh handshake (disconnect/reconnect with updated `auth`), or use a function-based `auth` option that supplies the freshest token on each (re)connection attempt.

---

## Scaling

**Q: Why does a basic Socket.IO setup break across multiple server instances?**
Room/connection state is tracked in each process's own memory by default; a broadcast from one instance can't reach clients connected to a different instance without shared coordination.

**Q: What does the Redis adapter solve?**
It propagates broadcast events across all server instances via Redis Pub/Sub, so `io.to(room).emit(...)` correctly reaches matching clients regardless of which instance they're connected to.

**Q: What are sticky sessions, and why are they needed?**
Load balancer configuration ensuring all requests from a client route to the same server instance; needed because HTTP long-polling involves multiple sequential requests that must reach the same instance to form one coherent connection.

**Q: Does WebSocket-only transport eliminate the need for sticky sessions?**
Significantly reduces it (a single WebSocket connection stays pinned to one instance naturally), but sticky sessions are still generally recommended for robustness, and strictly required if long-polling fallback is enabled.

**Q: What does the Redis adapter use under the hood?**
Redis Pub/Sub — each instance publishes broadcast events and subscribes to events from other instances, delivering to its own locally-connected matching clients.

---

## Practical / Coding Questions Often Asked Live

**Q: Write a basic authenticated Socket.IO server setup.**

```js
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    socket.data.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.data.user.id}`);
});
```

**Q: Write a chat room join/message/leave flow.**

```js
io.on("connection", (socket) => {
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("send-message", ({ roomId, message }) => {
    io.to(roomId).emit("new-message", { message, senderId: socket.id });
  });

  socket.on("leave-room", (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit("user-left", socket.id);
  });
});
```

**Q: Set up horizontal scaling with the Redis adapter.**

```js
const pubClient = new Redis(process.env.REDIS_URL);
const subClient = pubClient.duplicate();

const io = new Server(httpServer, {
  adapter: createAdapter(pubClient, subClient),
});
```

**Q: How would you design a real-time notification system that works across multiple server instances and multiple devices per user?**
Join each authenticated socket to a `user:{id}` room on connection; configure the Redis adapter so broadcasts to that room reach the correct sockets regardless of which server instance they're connected to; emit notifications via `io.to('user:' + userId).emit('notification', data)` from anywhere in the app, including plain HTTP route handlers.

**Q: How would you rate-limit incoming socket events to prevent abuse?**
Track the last event timestamp per socket (in-memory `Map` for a single instance, or Redis for a multi-instance deployment), reject/ignore events that arrive faster than the allowed interval, and optionally emit an error event back to the offending client.
