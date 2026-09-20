# 02. Sessions

## What is Session-Based Authentication?

Session-based auth is a **stateful** authentication model: after login, the server creates a session record (stored server-side — in memory, a database, or Redis) and gives the client a session ID (typically via a cookie). On every subsequent request, the client sends that session ID, and the server looks up the session to identify the user.

```
1. Client logs in with credentials
2. Server verifies credentials, creates a session record, generates a session ID
3. Server sends session ID to client via Set-Cookie
4. Client automatically includes the cookie on every future request
5. Server looks up the session ID in its store to identify the user
```

## Basic Setup with `express-session`

```bash
npm install express-session
```

```js
const express = require("express");
const session = require("express-session");

const app = express();

app.use(
  session({
    secret: process.env.SESSION_SECRET, // signs the session ID cookie
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something is stored
    cookie: {
      maxAge: 1000 * 60 * 60, // 1 hour
      httpOnly: true, // not accessible via client-side JS
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax",
    },
  }),
);
```

## Login: Creating a Session

```js
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  req.session.userId = user.id; // store identifying info in the session
  res.json({ message: "Logged in" });
});
```

## Protecting Routes

```js
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

app.get("/profile", requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.json({ id: user.id, name: user.name });
});
```

## Logout: Destroying a Session

```js
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.clearCookie("connect.sid"); // default express-session cookie name
    res.json({ message: "Logged out" });
  });
});
```

## Why Not Store Sessions In-Memory in Production?

`express-session`'s default `MemoryStore` is explicitly **not** production-ready:

- Data is lost on server restart.
- Doesn't scale across multiple server instances (each instance has its own memory).
- Leaks memory over time (no automatic cleanup by default).

## Production Session Store: Redis

```bash
npm install connect-redis ioredis
```

```js
const RedisStore = require("connect-redis").default;
const Redis = require("ioredis");
const redisClient = new Redis(process.env.REDIS_URL);

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60, httpOnly: true, secure: true },
  }),
);
```

With Redis (or a database like MongoDB via `connect-mongo`), sessions persist across restarts and are shared across multiple server instances — solving both problems of the default memory store.

## Sessions vs Tokens (JWT) — Key Trade-offs

|                  | Sessions                                        | JWT (Tokens)                                                         |
| ---------------- | ----------------------------------------------- | -------------------------------------------------------------------- |
| State            | Stateful — server stores session data           | Stateless — all data is in the token itself                          |
| Storage          | Server-side store (Redis/DB) + cookie on client | Client stores the token (localStorage, memory, or cookie)            |
| Revocation       | Easy — delete the session record                | Hard — token is valid until expiry unless you maintain a blocklist   |
| Scaling          | Requires shared session store across instances  | Naturally stateless, scales horizontally with no shared store needed |
| Typical use case | Traditional server-rendered web apps            | APIs, SPAs, mobile apps, microservices                               |

## Session Fixation Attack & Prevention

An attacker tricks a victim into using a known session ID, then hijacks the session after the victim logs in. Prevention: **regenerate the session ID upon login** (never reuse the pre-login session ID).

```js
app.post("/login", async (req, res) => {
  const user = await authenticateUser(req.body);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: "Login failed" });
    req.session.userId = user.id;
    res.json({ message: "Logged in" });
  });
});
```

## Session Timeout & Sliding Expiration

```js
app.use(
  session({
    // ...
    rolling: true, // resets maxAge on every request — "sliding" expiration
    cookie: { maxAge: 1000 * 60 * 30 }, // 30 min of inactivity before expiry
  }),
);
```

## Common Interview-Style Questions

- **What's the fundamental difference between session-based and token-based (JWT) authentication?**
  Sessions are stateful — the server stores session data and the client just holds a reference (session ID); JWTs are stateless — all necessary data is encoded in the token itself, and the server verifies it without a lookup.

- **Why is `express-session`'s default `MemoryStore` unsuitable for production?**
  It doesn't persist across restarts, doesn't scale across multiple server instances, and can leak memory over time.

- **How do you revoke a session-based login (force logout)?**
  Delete the corresponding session record from the store (Redis/DB) — since the server holds the source of truth, revocation is immediate.

- **What is session fixation, and how do you prevent it?**
  An attack where an attacker sets/knows a victim's session ID before login and hijacks it afterward; prevented by regenerating the session ID immediately upon successful login.

- **Why can't you easily revoke a JWT the way you can a session?**
  A JWT is self-contained and verified cryptographically without a server-side lookup — there's no built-in mechanism to invalidate it before its expiry unless you maintain an additional server-side blocklist/allowlist, which reintroduces statefulness.
