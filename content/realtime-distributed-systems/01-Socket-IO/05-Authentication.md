# 05. Authentication

## Why Authenticate Socket.IO Connections?

Without authentication, any client could connect to your Socket.IO server and potentially listen to or trigger events meant only for authorized users. Just like REST API endpoints, real-time connections need to verify identity — and ideally do so **before** the connection is fully established, not after.

## Approach 1: Authentication via `handshake.auth` (Recommended)

The client sends credentials (typically a JWT) as part of the initial connection handshake, and server-side middleware verifies it before allowing the connection through.

```js
// Client
import { io } from "socket.io-client";

const socket = io("https://api.example.com", {
  auth: {
    token: localStorage.getItem("accessToken"),
  },
});
```

```js
// Server — middleware runs BEFORE the connection event fires
const jwt = require("jsonwebtoken");

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication token required"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.user = decoded; // attach user info for use in event handlers
    next(); // allow the connection
  } catch (err) {
    next(new Error("Invalid or expired token")); // reject the connection
  }
});

io.on("connection", (socket) => {
  console.log("Authenticated user connected:", socket.data.user.id);
});
```

If `next(new Error(...))` is called, the client's connection attempt fails and receives a `connect_error` event — it never reaches the `connection` handler at all.

```js
// Client — handling a rejected connection
socket.on("connect_error", (err) => {
  console.log("Connection failed:", err.message); // "Authentication token required" / "Invalid or expired token"
});
```

## Approach 2: Query Parameters (Less Secure, Generally Discouraged)

```js
// Client
const socket = io("https://api.example.com", {
  query: { token: "some-token" }, // visible in server logs, URLs, browser history — avoid for sensitive tokens
});
```

`handshake.auth` is preferred over `query` parameters specifically because query strings are more likely to be logged (by proxies, server access logs, browser history) — `auth` payload is part of the handshake body, not the URL.

## Approach 3: Cookie-Based Authentication

If your app already uses `HttpOnly` session cookies for regular HTTP auth, Socket.IO can read the same cookie during the handshake (useful for apps not using token-based auth).

```js
const io = new Server(httpServer, {
  cors: {
    origin: "https://myfrontend.com",
    credentials: true, // allow cookies to be sent cross-origin
  },
});

io.use((socket, next) => {
  const cookies = socket.handshake.headers.cookie;
  const sessionId = parseCookie(cookies, "sessionId"); // your own cookie-parsing logic

  getSessionFromStore(sessionId).then((session) => {
    if (!session) return next(new Error("Not authenticated"));
    socket.data.user = session.user;
    next();
  });
});
```

```js
// Client — cookies are sent automatically if withCredentials is set
const socket = io("https://api.example.com", { withCredentials: true });
```

## Re-Authenticating After Token Expiry

Access tokens are often short-lived (see the Authentication module's JWT notes). A long-lived socket connection can outlast the token's validity — handle this by allowing the client to refresh its auth mid-connection.

```js
// Client — refresh the token and update the socket's auth payload before reconnecting
socket.auth.token = newAccessToken;
socket.disconnect().connect(); // force a fresh handshake with the updated token
```

Or proactively refresh before expiry, using the socket's `auth` as a function (re-evaluated on every reconnection attempt):

```js
const socket = io("https://api.example.com", {
  auth: (cb) => {
    cb({ token: getCurrentAccessToken() }); // always provides the freshest token available at connection time
  },
});
```

## Authorization — Restricting Specific Events/Rooms Post-Connection

Authentication confirms identity; authorization (as with REST APIs) still needs to be checked per-action, since a connected socket might not be allowed to do everything.

```js
io.on("connection", (socket) => {
  socket.on("join-admin-room", (callback) => {
    if (socket.data.user.role !== "admin") {
      return callback({ error: "Forbidden — admin access required" });
    }
    socket.join("admin-room");
    callback({ success: true });
  });

  socket.on("delete-message", ({ messageId }, callback) => {
    if (!canDeleteMessage(socket.data.user, messageId)) {
      return callback({ error: "Forbidden" });
    }
    deleteMessage(messageId);
    callback({ success: true });
  });
});
```

## Namespace-Level Authentication (Restricting an Entire Feature Area)

```js
const adminNamespace = io.of("/admin");

adminNamespace.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const user = verifyToken(token);

  if (!user || user.role !== "admin") {
    return next(new Error("Admin access required"));
  }
  socket.data.user = user;
  next();
});
```

(Full detail on this pattern in the Namespaces notes.)

## Rate Limiting Socket Connections/Events

Just like HTTP endpoints, socket events should be protected against abuse — a malicious or buggy client could flood the server with rapid-fire events.

```js
const rateLimitMap = new Map();

io.on("connection", (socket) => {
  socket.on("chat-message", (data) => {
    const now = Date.now();
    const lastMessageTime = rateLimitMap.get(socket.id) || 0;

    if (now - lastMessageTime < 500) {
      // max one message per 500ms
      return socket.emit("error", {
        message: "You are sending messages too quickly",
      });
    }

    rateLimitMap.set(socket.id, now);
    handleChatMessage(socket, data);
  });

  socket.on("disconnect", () => rateLimitMap.delete(socket.id));
});
```

For production systems, a Redis-backed rate limiter (see the Redis module's Rate Limiting notes) is generally preferred over an in-memory `Map`, especially in a multi-instance deployment.

## Storing User Data on the Socket — `socket.data`

`socket.data` is the recommended place to attach authenticated user information (rather than a plain custom property), since it's explicitly designed and typed (in TypeScript) for this purpose.

```js
io.use((socket, next) => {
  socket.data.user = verifiedUser;
  socket.data.connectedAt = Date.now();
  next();
});

io.on("connection", (socket) => {
  console.log(socket.data.user.email);
});
```

## Common Interview-Style Questions

- **Why is `handshake.auth` preferred over passing a token via query parameters?**
  Query parameters are more likely to be captured in server access logs, browser history, or by intermediate proxies, since they're part of the URL; the `auth` payload is sent as part of the handshake body, keeping sensitive tokens out of URL-based logging.

- **When does authentication middleware run relative to the `connection` event, and why does that matter?**
  It runs before the `connection` event fires — if the middleware calls `next(new Error(...))`, the connection is rejected entirely and the handler never executes, ensuring no unauthenticated socket ever reaches your application logic.

- **How would a client handle a rejected/failed authentication attempt?**
  Listen for the `connect_error` event on the client, which fires with the error passed to `next()` on the server, allowing the client to display an appropriate message or attempt re-authentication.

- **Why is authentication alone not sufficient for a real-time application — what else is needed?**
  Authorization — verifying not just who the user is, but whether they're permitted to perform a specific action (like joining a particular room or deleting a specific message) — must still be checked on a per-event basis, since a connected/authenticated socket isn't automatically authorized for everything.

- **How would you handle a socket connection outliving its JWT's expiration?**
  Provide the client a way to refresh its token and either force a fresh handshake (disconnect and reconnect with updated `auth`) or use a function-based `auth` option that always supplies the freshest token available at each (re)connection attempt.
