# 14. Rate Limiting

## Why Rate Limit a REST API?

Rate limiting caps how many requests a client can make in a given time window. For public/production APIs it:

- Prevents abuse and denial-of-service (accidental or malicious)
- Protects shared backend resources (database, third-party APIs you call)
- Enforces fair usage across clients/tiers (free vs paid plans)
- Mitigates brute-force attacks on sensitive endpoints (login, password reset)

## Common Rate Limiting Algorithms

| Algorithm          | How it Works                                                 | Notes                                              |
| ------------------ | ------------------------------------------------------------ | -------------------------------------------------- |
| **Fixed Window**   | Count requests in fixed time blocks (e.g., per minute)       | Simple but bursty at window boundaries             |
| **Sliding Window** | Smooths counts across a rolling time window                  | More accurate, slightly more overhead              |
| **Token Bucket**   | Tokens refill at a steady rate; each request consumes one    | Allows short bursts while maintaining average rate |
| **Leaky Bucket**   | Requests processed at a constant rate, excess queued/dropped | Smooths traffic, good for outbound rate limiting   |

`express-rate-limit` uses a fixed/sliding-window-hybrid approach by default; token bucket approaches are common in API gateways (AWS API Gateway, Kong, Stripe).

## Implementing Rate Limiting with `express-rate-limit`

```bash
npm install express-rate-limit
```

```js
const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per client
  standardHeaders: true, // adds RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests, please try again later.",
    },
  },
});

app.use("/api", apiLimiter);
```

## Tiered Rate Limits by Endpoint Sensitivity

```js
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });

app.use("/api", generalLimiter);
app.use("/api/auth/login", authLimiter);
app.post("/api/orders", writeLimiter, createOrderHandler);
```

## Rate Limiting per User vs per IP

For authenticated APIs, tying limits to the user ID (rather than IP) prevents shared-IP scenarios (offices, NAT, mobile carriers) from unfairly hitting a shared limit — and prevents one bad actor's key from letting them bypass limits by rotating IPs.

```js
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.user?.id || req.ip, // per-user when authenticated
});
```

## Tiered Limits by Subscription Plan

```js
function planLimiter(req) {
  const limits = { free: 60, pro: 600, enterprise: 6000 };
  return limits[req.user?.plan] || limits.free;
}

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: (req) => planLimiter(req), // dynamic limit based on the caller
  keyGenerator: (req) => req.user?.id || req.ip,
});
```

## Communicating Limits to Clients via Headers

```
RateLimit-Limit: 100
RateLimit-Remaining: 42
RateLimit-Reset: 900
Retry-After: 60
```

```js
app.use((req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode === 429) {
      console.warn(`Rate limit hit by ${req.ip} on ${req.originalUrl}`);
    }
  });
  next();
});
```

Clients should treat `429` responses as "back off and retry after `Retry-After` seconds," ideally with exponential backoff.

## Distributed Rate Limiting with Redis (Multi-Instance Deployments)

In-memory counters don't work correctly once you run more than one server instance — each instance would track separate counts. Use a shared store:

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

app.use("/api", limiter);
```

## API Gateway-Level Rate Limiting

For larger systems, rate limiting is often enforced **before** requests even reach your Express app — at an API gateway (AWS API Gateway, Kong, Nginx, Cloudflare). This offloads the work and protects the app from load even under attack. Express-level rate limiting is then often a secondary, defense-in-depth layer.

## Rate Limiting and API Keys

Public APIs commonly issue API keys per client/application and rate-limit per key rather than per IP — since many clients may share an IP (behind NAT) while a single client might rotate IPs.

```js
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  keyGenerator: (req) => req.headers["x-api-key"] || req.ip,
});

app.use("/api", validateApiKey, limiter);
```

## Common Interview-Style Questions

- **Why is rate limiting important for a production REST API?**
  It prevents abuse (DoS, brute force, scraping), protects shared backend resources, and enforces fair usage across clients or subscription tiers.

- **What's the difference between token bucket and fixed window rate limiting?**
  Fixed window counts requests within discrete time blocks (can allow bursts right at window boundaries); token bucket allows a steady refill rate with the ability to absorb short bursts up to the bucket's capacity, generally considered smoother/fairer.

- **Why rate-limit by user ID instead of IP for authenticated endpoints?**
  Multiple users can share an IP (office networks, NAT, mobile carriers), unfairly limiting them together; a malicious client could also rotate IPs to bypass an IP-based limit, whereas a user/API-key-based limit follows the actual identity.

- **What HTTP status and header should a rate-limited response include?**
  `429 Too Many Requests`, typically with a `Retry-After` header telling the client how long to wait before retrying.

- **Why does the default in-memory rate limiter break in a multi-instance deployment?**
  Each instance maintains its own separate counters, so the effective global limit becomes (per-instance limit × number of instances) rather than the intended limit — a shared store like Redis solves this.
