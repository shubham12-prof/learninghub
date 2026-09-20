# 01. WebSockets

## What Are WebSockets?

WebSockets provide a **persistent, full-duplex communication channel** between client and server over a single TCP connection. Unlike traditional HTTP (request-response, connection closes after each exchange), a WebSocket connection stays open, allowing either side to send messages to the other at any time — essential for real-time features like chat, live notifications, collaborative editing, and multiplayer games.

```
HTTP:       Client -> request  -> Server
            Client <- response <- Server
            (connection closes)

WebSocket:  Client <-----------> Server
            (connection stays open, either side can send anytime)
```

## The WebSocket Handshake

A WebSocket connection begins as a regular HTTP request with an `Upgrade` header, which the server accepts to "upgrade" the connection from HTTP to the WebSocket protocol.

```
GET /socket HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

After this handshake, the connection switches to the WebSocket protocol — no more HTTP request/response cycles, just a raw bidirectional message stream.

## What is Socket.IO?

Socket.IO is a **library** built on top of WebSockets (not a protocol itself) that adds:

- **Automatic fallback** to HTTP long-polling if WebSockets aren't available (older browsers, restrictive proxies/firewalls).
- **Automatic reconnection** with configurable backoff.
- **Room and namespace abstractions** for organizing connections.
- **Built-in event-based messaging** (emit/on pattern) instead of raw message strings.
- **Acknowledgements** — callback-style confirmation that a message was received/processed.
- **Broadcasting** utilities — sending to all clients, all except sender, specific rooms, etc.

> Socket.IO is **not** a pure WebSocket implementation — it's a higher-level abstraction with its own client-server protocol layered on top of WebSockets (and other transports). A raw WebSocket client cannot connect directly to a Socket.IO server without speaking its specific protocol, and vice versa.

## Installing Socket.IO

```bash
npm install socket.io       # server
npm install socket.io-client # client (or use the CDN)
```

## Basic Server Setup

```js
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "https://myfrontend.com" },
});

io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

httpServer.listen(3000, () => console.log("Server running on port 3000"));
```

> Socket.IO attaches to an existing HTTP server (`httpServer`) rather than creating its own — this lets the same server handle regular HTTP routes and WebSocket connections together.

## Basic Client Setup

```js
import { io } from "socket.io-client";

const socket = io("https://api.example.com");

socket.on("connect", () => {
  console.log("Connected with id:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
```

## Event-Based Messaging — The Core Pattern

```js
// Server
io.on("connection", (socket) => {
  socket.on("chat message", (msg) => {
    console.log("Received:", msg);
    socket.emit("chat message", `Server received: ${msg}`); // reply to just this client
  });
});
```

```js
// Client
socket.emit("chat message", "Hello from the client!");

socket.on("chat message", (msg) => {
  console.log(msg); // "Server received: Hello from the client!"
});
```

## Acknowledgements — Callback-Style Confirmation

```js
// Client sends and waits for an acknowledgement
socket.emit("save data", { key: "value" }, (response) => {
  console.log("Server confirmed:", response);
});
```

```js
// Server receives the event AND a callback function to invoke
socket.on("save data", (data, callback) => {
  saveToDatabase(data);
  callback({ status: "saved" }); // invoking this triggers the client's callback
});
```

Modern Socket.IO also supports this as a Promise on the client:

```js
const response = await socket.emitWithAck("save data", { key: "value" });
```

## Connection Lifecycle Events

```js
io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("disconnect", (reason) => {
    console.log("disconnected:", reason); // e.g., 'transport close', 'client namespace disconnect'
  });

  socket.on("disconnecting", () => {
    // fires BEFORE disconnect, while socket.rooms is still populated —
    // useful for cleanup logic that needs to know which rooms it was in
    console.log("about to disconnect, was in rooms:", socket.rooms);
  });

  socket.on("error", (err) => {
    console.error("socket error:", err);
  });
});
```

## Client Reconnection Handling

```js
const socket = io("https://api.example.com", {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

socket.on("reconnect_attempt", (attempt) => {
  console.log(`Reconnection attempt ${attempt}`);
});

socket.on("reconnect", () => {
  console.log("Reconnected successfully");
});

socket.on("reconnect_failed", () => {
  console.log("Failed to reconnect after max attempts");
});
```

## Transports: WebSocket vs HTTP Long-Polling

Socket.IO negotiates the best available transport automatically, starting with HTTP long-polling and upgrading to WebSocket when possible (unless configured otherwise).

```js
const io = new Server(httpServer, {
  transports: ["websocket"], // force WebSocket only, skip long-polling fallback/negotiation
});
```

Forcing `['websocket']` skips the initial polling handshake, reducing connection latency — but loses the automatic fallback for clients/networks that can't establish a WebSocket connection (e.g., certain restrictive corporate proxies).

## When to Use Socket.IO vs Raw WebSockets vs Alternatives

|                                   | Raw WebSocket (`ws` library)              | Socket.IO                                       | Server-Sent Events (SSE)                                                                                         |
| --------------------------------- | ----------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Bidirectional?                    | Yes                                       | Yes                                             | No — server-to-client only                                                                                       |
| Automatic reconnection            | Manual implementation needed              | Built-in                                        | Built-in (browser native)                                                                                        |
| Fallback for restrictive networks | None                                      | Automatic (long-polling)                        | N/A (uses plain HTTP)                                                                                            |
| Rooms/namespaces                  | Manual implementation                     | Built-in                                        | N/A                                                                                                              |
| Overhead                          | Minimal, closest to the wire              | Slightly higher (extra protocol framing)        | Minimal                                                                                                          |
| Best for                          | Performance-critical, full control needed | Most real-time app features, faster development | One-way live updates (feeds, notifications) where the client never needs to send data back over the same channel |

## Common Interview-Style Questions

- **What is a WebSocket, and how does it differ from a standard HTTP request?**
  A WebSocket is a persistent, full-duplex connection allowing either side to send messages at any time after an initial handshake; standard HTTP is request-response, with the connection typically closing after each exchange.

- **Is Socket.IO the same thing as WebSockets?**
  No — Socket.IO is a library built on top of WebSockets (and other transports like HTTP long-polling) that adds its own protocol, automatic reconnection, fallback transports, and higher-level abstractions like rooms/namespaces/acknowledgements; a raw WebSocket client can't directly connect to a Socket.IO server without speaking its specific protocol.

- **Why does Socket.IO fall back to HTTP long-polling in some cases?**
  Some networks/proxies/older browsers don't support WebSocket connections; long-polling provides a compatible fallback so real-time functionality still works, at the cost of slightly higher latency/overhead compared to a true WebSocket connection.

- **What's the difference between the `disconnecting` and `disconnect` events on the server?**
  `disconnecting` fires just before the socket actually leaves its rooms (so `socket.rooms` is still populated, useful for cleanup that needs that room membership info); `disconnect` fires after the socket has already been removed from all rooms.

- **When might you choose Server-Sent Events (SSE) over Socket.IO/WebSockets?**
  When you only need one-way server-to-client updates (like a live feed or notification stream) and don't need the client to send data back over the same persistent channel — SSE is simpler, uses plain HTTP, and has built-in browser-native reconnection.
