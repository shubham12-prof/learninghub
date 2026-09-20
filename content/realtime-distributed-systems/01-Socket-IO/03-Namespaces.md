# 03. Namespaces

## What Are Namespaces?

A namespace is a way to split a single Socket.IO server into multiple **separate communication channels**, each with its own independent set of connected sockets, event handlers, and middleware — while all sharing the same underlying physical connection/server infrastructure.

```
Server
 ├── / (default namespace)
 ├── /admin       (separate connected clients, separate event handlers)
 ├── /chat
 └── /notifications
```

## Namespaces vs Rooms — Key Distinction

|                  | Namespace                                                                   | Room                                                                          |
| ---------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Defined at       | Connection time (client explicitly connects to a namespace)                 | Anytime after connection (`socket.join()`)                                    |
| Scope            | A completely separate communication channel with its own middleware/events  | A grouping _within_ a namespace                                               |
| Client awareness | Client explicitly connects to a specific namespace                          | Client has no built-in awareness of rooms                                     |
| Typical use case | Separating distinct application features/areas (admin panel vs public chat) | Grouping clients within a feature (a specific chat room, a specific document) |

A useful mental model: **namespaces divide your application into separate "channels"; rooms subdivide within a single channel.**

## The Default Namespace

Every Socket.IO server has a default namespace, `/`, which is what you're using unless you explicitly create others.

```js
io.on("connection", (socket) => {
  // this handles connections to the DEFAULT namespace ("/")
});
```

## Creating a Custom Namespace

```js
const adminNamespace = io.of("/admin");

adminNamespace.on("connection", (socket) => {
  console.log("Admin client connected:", socket.id);

  socket.on("admin-action", (data) => {
    console.log("Admin action:", data);
  });
});
```

Connecting from the client to a specific namespace:

```js
import { io } from "socket.io-client";

const adminSocket = io("https://api.example.com/admin");

adminSocket.on("connect", () => {
  console.log("Connected to admin namespace");
});
```

## Why Use Namespaces? — Practical Motivations

### 1. Logical Separation of Features

```js
const chatNamespace = io.of("/chat");
const notificationsNamespace = io.of("/notifications");
const gameNamespace = io.of("/game");

chatNamespace.on("connection", (socket) => {
  socket.on("message", (msg) => chatNamespace.emit("message", msg));
});

notificationsNamespace.on("connection", (socket) => {
  // separate connection logic, doesn't interfere with chat events at all
});
```

Each namespace has entirely separate event names and handlers — a `message` event handler registered on `/chat` has no relationship to a `message` event on `/game`, even though they share the same event name.

### 2. Namespace-Specific Authentication/Authorization

A very common real-world pattern: restrict an entire namespace (like `/admin`) to a specific class of users, enforced once via namespace-level middleware, rather than repeating checks in every event handler.

```js
const adminNamespace = io.of("/admin");

adminNamespace.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const user = verifyToken(token);

  if (!user || user.role !== "admin") {
    return next(new Error("Unauthorized — admin access only"));
  }

  socket.data.user = user;
  next();
});

adminNamespace.on("connection", (socket) => {
  // guaranteed to only reach here if the middleware above called next() without an error
  console.log("Verified admin connected:", socket.data.user.email);
});
```

### 3. Resource Isolation

Since namespaces are logically separate, you can apply different rate limits, connection limits, or scaling considerations per namespace based on its specific usage pattern.

## Dynamic Namespaces (Namespace Patterns)

Instead of manually creating every namespace upfront, Socket.IO supports dynamically created namespaces matching a pattern — useful when namespaces correspond to dynamic entities (e.g., one namespace per tenant/organization in a multi-tenant app).

```js
const dynamicNamespace = io.of(/^\/tenant-\d+$/); // matches /tenant-1, /tenant-42, etc.

dynamicNamespace.on("connection", (socket) => {
  const namespaceName = socket.nsp.name; // e.g., "/tenant-42"
  console.log(`Client connected to ${namespaceName}`);
});
```

```js
// Client
const socket = io("https://api.example.com/tenant-42");
```

## Middleware at the Namespace Level

Namespace-level middleware runs for **every** connection attempt to that specific namespace, before the `connection` event fires — ideal for authentication, logging, or validation scoped to that namespace only.

```js
chatNamespace.use((socket, next) => {
  console.log(`New connection attempt to /chat: ${socket.id}`);
  next(); // must call next() to allow the connection, or next(new Error(...)) to reject it
});
```

## Namespace-Level Broadcasting

```js
adminNamespace.emit("system-alert", "Server maintenance in 10 minutes"); // to ALL clients connected to /admin

adminNamespace.to("room-A").emit("message", "hi"); // combining namespace + room targeting
```

## Comparing All Three Levels of Targeting

```js
io.emit("event"); // ALL clients across ALL namespaces (rarely what you want)
io.of("/chat").emit("event"); // all clients in the /chat namespace
io.of("/chat").to("room-1").emit("event"); // clients in room-1, WITHIN the /chat namespace
socket.emit("event"); // just this one specific socket
```

## When to Use Namespaces vs Just Using Rooms Everywhere

Many simple applications never need custom namespaces at all — rooms within the default namespace are sufficient for most chat/notification/collaboration use cases. Reach for namespaces specifically when you need:

- Genuinely separate sets of event names/handlers for distinct application areas.
- Different authentication/authorization rules applied at the connection level for a whole feature area.
- Clear architectural separation between unrelated real-time features sharing one server.

## Common Interview-Style Questions

- **What's the fundamental difference between a namespace and a room?**
  A namespace is a separate communication channel established at connection time, with its own independent events/middleware; a room is a lightweight grouping of sockets _within_ a namespace, used to target broadcasts to a subset of connected clients, and requires no special client-side connection step.

- **Why might you use namespace-level middleware instead of checking authorization inside every event handler?**
  It enforces the check once, at connection time, for every client attempting to connect to that namespace — guaranteeing that any code inside the namespace's `connection` handler only runs for already-authorized clients, rather than repeating the check in every individual event handler.

- **What's a practical use case for dynamic namespace patterns?**
  Multi-tenant applications where each tenant/organization needs its own isolated real-time channel (e.g., `/tenant-{id}`), created dynamically based on a regex pattern rather than manually defining a namespace for every possible tenant upfront.

- **If you register a `message` event handler on the `/chat` namespace and another on the `/game` namespace, do they interfere with each other?**
  No — namespaces have entirely separate event scopes; a `message` event emitted within `/chat` has no relationship to a `message` event within `/game`, even though the event name is identical.

- **Do most real-time applications need custom namespaces, or are rooms usually sufficient?**
  Rooms within the default namespace are sufficient for most common use cases (chat, notifications, collaboration); custom namespaces are reserved for genuinely separate application areas needing distinct event handling or connection-level authorization rules.
