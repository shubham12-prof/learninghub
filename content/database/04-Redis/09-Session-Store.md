# 09. Session Store

## Why Use Redis for Sessions?

Session-based authentication requires storing session data somewhere the server can quickly look up on every request. Redis is the standard choice for this in production because:

- **Speed** — sub-millisecond lookups, critical since sessions are checked on nearly every request.
- **Built-in expiration** — `EXPIRE`/TTL maps naturally onto session lifetimes.
- **Shared across server instances** — unlike in-memory session storage, Redis lets multiple app servers (behind a load balancer) share the same session store, avoiding "sticky session" requirements.
- **Automatic cleanup** — expired sessions are automatically evicted, no manual cleanup job needed.

## Basic Session Storage Pattern

```js
const crypto = require("crypto");

async function createSession(userId) {
  const sessionId = crypto.randomBytes(32).toString("hex");
  const sessionData = { userId, createdAt: Date.now() };

  await redis.set(
    `session:${sessionId}`,
    JSON.stringify(sessionData),
    "EX",
    3600,
  ); // 1 hour TTL

  return sessionId;
}

async function getSession(sessionId) {
  const data = await redis.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

async function destroySession(sessionId) {
  await redis.del(`session:${sessionId}`);
}
```

## Using `express-session` with a Redis Store

```bash
npm install express-session connect-redis ioredis
```

```js
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const Redis = require("ioredis");

const redisClient = new Redis(process.env.REDIS_URL);

app.use(
  session({
    store: new RedisStore({ client: redisClient, prefix: "session:" }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60, // 1 hour
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  }),
);
```

```js
app.post("/login", async (req, res) => {
  const user = await authenticateUser(req.body);
  req.session.userId = user.id; // automatically persisted to Redis by the store
  res.json({ message: "Logged in" });
});

app.get("/profile", (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: "Not authenticated" });
  res.json({ userId: req.session.userId });
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ message: "Logged out" })); // removes the session from Redis
});
```

## Sliding Expiration — Extending Sessions on Activity

```js
async function getSessionWithSlidingExpiry(sessionId, ttl = 3600) {
  const data = await redis.get(`session:${sessionId}`);
  if (!data) return null;

  await redis.expire(`session:${sessionId}`, ttl); // reset the TTL on every access — "sliding window"

  return JSON.parse(data);
}
```

With `express-session` + `connect-redis`, this is often the default behavior (`rolling: true` on the session middleware config resets the cookie/TTL on each request).

```js
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    rolling: true, // resets maxAge on every response
    // ...
  }),
);
```

## Storing Rich Session Data with a Hash

For sessions with several distinct fields you might update independently, a Hash can be more efficient than repeatedly rewriting an entire JSON string.

```js
async function createSession(sessionId, userId) {
  await redis.hset(`session:${sessionId}`, {
    userId,
    createdAt: Date.now(),
    lastActive: Date.now(),
  });
  await redis.expire(`session:${sessionId}`, 3600);
}

async function touchSession(sessionId) {
  await redis.hset(`session:${sessionId}`, "lastActive", Date.now());
  await redis.expire(`session:${sessionId}`, 3600); // refresh TTL
}
```

## Managing Multiple Sessions per User (Multi-Device Login)

```js
async function createSession(userId, sessionId, deviceInfo) {
  await redis.set(
    `session:${sessionId}`,
    JSON.stringify({ userId, deviceInfo }),
    "EX",
    3600,
  );
  await redis.sadd(`user:${userId}:sessions`, sessionId); // track all active sessions for this user
}

async function getAllUserSessions(userId) {
  const sessionIds = await redis.smembers(`user:${userId}:sessions`);
  const sessions = await Promise.all(
    sessionIds.map((id) => redis.get(`session:${id}`)),
  );
  return sessions.filter(Boolean).map(JSON.parse);
}

// "Log out everywhere" — revoke ALL of a user's active sessions
async function revokeAllSessions(userId) {
  const sessionIds = await redis.smembers(`user:${userId}:sessions`);
  if (sessionIds.length) {
    await redis.del(...sessionIds.map((id) => `session:${id}`));
  }
  await redis.del(`user:${userId}:sessions`);
}
```

## Session Data Cleanup Consideration

Redis's TTL mechanism handles expiration automatically — but if you're also tracking a separate "set of session IDs" per user (as above), those set entries won't automatically disappear when the individual session keys expire. Periodically clean these up, or check for expired entries when reading:

```js
async function getAllUserSessions(userId) {
  const sessionIds = await redis.smembers(`user:${userId}:sessions`);
  const results = [];

  for (const id of sessionIds) {
    const data = await redis.get(`session:${id}`);
    if (data) {
      results.push(JSON.parse(data));
    } else {
      await redis.srem(`user:${userId}:sessions`, id); // clean up a stale reference to an expired session
    }
  }
  return results;
}
```

## Sessions vs JWTs — Where Redis Fits

Redis-backed sessions are the classic "stateful" authentication approach, contrasted with stateless JWTs:

|                               | Redis Sessions                                                 | JWT                                                                          |
| ----------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Revocation                    | Instant — just delete the key                                  | Hard, unless you also maintain a server-side blocklist (reintroducing state) |
| Server dependency             | Requires Redis to be available for every authenticated request | No lookup needed — self-contained, verified cryptographically                |
| Scaling                       | Requires a shared store (Redis) across all app instances       | Naturally stateless, no shared store needed                                  |
| Payload size on every request | Small (just a session ID/cookie)                               | Can be larger (the full token is sent every request)                         |

Many production systems still prefer Redis-backed sessions specifically because of easy, immediate revocation — a meaningful security advantage over stateless JWTs for many applications.

## Security Best Practices for Redis-Backed Sessions

```js
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET, // strong, random, kept in an environment variable
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // prevent client-side JS from reading the session cookie
      secure: true, // HTTPS only in production
      sameSite: "lax", // CSRF mitigation
      maxAge: 1000 * 60 * 60,
    },
  }),
);
```

- Regenerate the session ID on login (prevents session fixation) — most session middleware libraries handle this automatically or via a `regenerate()` call.
- Set a reasonable TTL — don't let sessions live forever.
- Use `HttpOnly`, `Secure`, and `SameSite` cookie attributes.
- Ensure Redis itself is properly secured (authentication enabled, not exposed publicly) since it now holds sensitive session data.

## Common Interview-Style Questions

- **Why is Redis commonly used as a session store instead of in-memory storage on the application server?**
  In-memory storage doesn't scale across multiple server instances (each instance would have its own separate session data, breaking authentication if a load balancer routes a user's requests to a different instance) and loses all sessions on a server restart; Redis provides a shared, fast, persistent-enough store accessible by all instances.

- **How does Redis's TTL mechanism benefit session management?**
  Sessions automatically expire and get cleaned up without requiring a separate scheduled cleanup job — setting `EX` on session creation (or refreshing it on activity for sliding expiration) handles the entire lifecycle declaratively.

- **What is "sliding expiration," and how would you implement it with Redis?**
  Extending a session's expiration every time it's actively used, rather than having a fixed expiry from creation; implemented by calling `EXPIRE` (resetting the TTL) on each request/access to the session, or via a session middleware's `rolling: true` option.

- **How would you implement "log out everywhere" (revoke all of a user's active sessions) with Redis?**
  Maintain a Set tracking all active session IDs per user (`user:{id}:sessions`); on a "log out everywhere" request, delete all the individual session keys referenced by that set, then delete the set itself.

- **What's a key advantage of Redis-backed sessions over JWTs for authentication?**
  Instant, straightforward revocation — deleting the session key from Redis immediately invalidates it, whereas a stateless JWT remains valid until its natural expiry unless you separately implement and maintain a server-side blocklist, which reintroduces the statefulness JWTs were meant to avoid.
