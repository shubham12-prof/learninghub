# 15. Rate Limiting

## What is Rate Limiting?

Rate limiting restricts how many requests a client can make within a given time window. It protects your API from:

- Brute-force attacks (e.g., login endpoints)
- Denial-of-service (DoS) abuse
- Excessive scraping
- Runaway costs from third-party API usage

## `express-rate-limit`

The standard, widely-used rate limiting middleware for Express.

```bash
npm install express-rate-limit
```

### Basic Global Rate Limiter

```js
const express = require("express");
const rateLimit = require("express-rate-limit");

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // return rate limit info in RateLimit-* headers
  legacyHeaders: false, // disable the deprecated X-RateLimit-* headers
  message: { error: "Too many requests, please try again later." },
});

app.use(limiter); // applies to all routes

app.listen(3000);
```

## Route-Specific Rate Limiting

Different endpoints often need different limits — e.g., login should be much stricter than general browsing.

```js
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // only 5 login attempts per 10 minutes
  message: { error: "Too many login attempts, try again later." },
  skipSuccessfulRequests: true, // don't count successful logins against the limit
});

app.post("/api/login", loginLimiter, loginController);

app.use("/api", apiLimiter); // more general limiter for the rest of the API
```

## Response When Limit Is Exceeded

Default status is `429 Too Many Requests`:

```json
{ "error": "Too many requests, please try again later." }
```

Headers returned (with `standardHeaders: true`):

```
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 900
```

## Custom Key Generator (Rate Limit by User, Not Just IP)

By default, `express-rate-limit` keys on IP address. For authenticated APIs, you might rate-limit per user instead:

```js
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.id || req.ip, // per-user if logged in, else per-IP
});
```

## Custom Handler for Exceeded Limits

```js
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  handler: (req, res, next, options) => {
    console.warn(`Rate limit exceeded for ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  },
});
```

## Using a Shared Store for Multi-Server Deployments

The default in-memory store won't work correctly across multiple server instances (e.g., behind a load balancer, or in a cluster) because each instance tracks counts independently. Use a shared store like Redis:

```bash
npm install rate-limit-redis ioredis
```

```js
const RedisStore = require("rate-limit-redis");
const Redis = require("ioredis");
const redisClient = new Redis(process.env.REDIS_URL);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use(limiter);
```

This ensures rate limit counters are shared and accurate across all instances of your app.

## Layered Rate Limiting Strategy (Real-World Pattern)

```js
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });

app.use(generalLimiter); // baseline for everything

app.use("/api/auth", authLimiter); // stricter for auth endpoints

app.post("/api/posts", writeLimiter, createPostController); // stricter for writes
```

## Slowing Down Instead of Blocking: `express-slow-down`

An alternative/complement to hard-blocking — progressively delays responses instead of rejecting them outright.

```bash
npm install express-slow-down
```

```js
const slowDown = require("express-slow-down");

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50, // allow 50 requests per window at full speed
  delayMs: (hits) => hits * 100, // each request after that adds 100ms delay
});

app.use(speedLimiter);
```

## `trust proxy` Matters for Accurate IP-Based Limiting

If deployed behind a reverse proxy/load balancer, set:

```js
app.set("trust proxy", 1); // or true, depending on setup
```

Without this, `req.ip` may resolve to the proxy's IP for every request, effectively rate-limiting _all_ users together as one client.

## Common Interview-Style Questions

- **Why is rate limiting important for public APIs?**
  It prevents abuse (brute force, scraping, DoS) and protects backend resources/costs from being overwhelmed by excessive requests.

- **What's the default identifier `express-rate-limit` uses to track clients?**
  The client's IP address (`req.ip`), unless a custom `keyGenerator` is provided.

- **Why does the default in-memory store break in a multi-instance deployment?**
  Each server instance keeps its own counters in memory, so a client could exceed the "global" limit by hitting different instances — a shared store (Redis) is needed for accurate limits across instances.

- **What HTTP status code indicates a rate limit was exceeded?**
  `429 Too Many Requests`.
