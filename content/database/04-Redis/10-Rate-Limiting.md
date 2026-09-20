# 10. Rate Limiting

## Why Redis for Rate Limiting?

Rate limiting requires tracking request counts per client (IP, user, API key) within a time window — a task requiring fast, atomic counters shared across all server instances handling traffic. Redis's atomic operations and TTL support make it the standard backend for production rate limiters (this is exactly what libraries like `express-rate-limit`'s Redis store, or `rate-limiter-flexible`, use under the hood).

## Algorithm 1: Fixed Window Counter (Simplest)

Count requests within fixed time blocks (e.g., "requests this calendar minute").

```js
async function isAllowedFixedWindow(userId, limit, windowSeconds) {
  const window = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = `ratelimit:${userId}:${window}`;

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds); // set TTL only on the first request in this window
  }

  return count <= limit;
}
```

```
Window 1 [0-60s]: 100 requests allowed
Window 2 [60-120s]: counter resets, 100 more requests allowed
```

**Pros:** simple, memory-efficient (one key per window).
**Cons:** bursty at window boundaries — a client could send `limit` requests at the very end of one window and another `limit` requests at the very start of the next, effectively getting `2x limit` requests in a short span across the boundary.

## Algorithm 2: Sliding Window Log (Most Accurate)

Store a timestamp for every request in a Sorted Set, and count only those within the trailing window — no boundary burst issue.

```js
async function isAllowedSlidingWindow(userId, limit, windowSeconds) {
  const key = `ratelimit:${userId}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  // Remove entries outside the current window
  await redis.zremrangebyscore(key, 0, windowStart);

  const count = await redis.zcard(key);

  if (count < limit) {
    await redis.zadd(key, now, `${now}-${Math.random()}`); // unique member per request
    await redis.expire(key, windowSeconds);
    return true;
  }
  return false;
}
```

**Pros:** precise, no boundary burst problem.
**Cons:** higher memory usage (stores a member per individual request within the window).

## Algorithm 3: Sliding Window Counter (Good Balance)

Approximates a true sliding window using two fixed windows and weighted interpolation — much cheaper than storing every request timestamp, while avoiding the fixed-window boundary burst problem.

```js
async function isAllowedSlidingWindowCounter(userId, limit, windowSeconds) {
  const now = Date.now();
  const currentWindow = Math.floor(now / 1000 / windowSeconds);
  const previousWindow = currentWindow - 1;

  const currentKey = `ratelimit:${userId}:${currentWindow}`;
  const previousKey = `ratelimit:${userId}:${previousWindow}`;

  const [currentCount, previousCount] = await Promise.all([
    redis.get(currentKey).then((v) => Number(v) || 0),
    redis.get(previousKey).then((v) => Number(v) || 0),
  ]);

  const elapsedInCurrentWindow = (now / 1000) % windowSeconds;
  const weight = 1 - elapsedInCurrentWindow / windowSeconds;
  const estimatedCount = previousCount * weight + currentCount;

  if (estimatedCount < limit) {
    await redis
      .multi()
      .incr(currentKey)
      .expire(currentKey, windowSeconds * 2)
      .exec();
    return true;
  }
  return false;
}
```

## Algorithm 4: Token Bucket (Allows Controlled Bursts)

Tokens refill at a steady rate up to a maximum bucket size; each request consumes one token. Naturally allows short bursts (up to the bucket size) while enforcing a long-term average rate.

```js
async function isAllowedTokenBucket(userId, capacity, refillRatePerSecond) {
  const key = `ratelimit:bucket:${userId}`;
  const now = Date.now() / 1000;

  const bucket = await redis.hgetall(key);
  let tokens = bucket.tokens ? Number(bucket.tokens) : capacity;
  const lastRefill = bucket.lastRefill ? Number(bucket.lastRefill) : now;

  const elapsed = now - lastRefill;
  tokens = Math.min(capacity, tokens + elapsed * refillRatePerSecond); // refill based on time elapsed

  if (tokens >= 1) {
    tokens -= 1;
    await redis.hset(key, { tokens, lastRefill: now });
    await redis.expire(key, Math.ceil(capacity / refillRatePerSecond) * 2);
    return true;
  }

  await redis.hset(key, { tokens, lastRefill: now });
  return false;
}
```

## Making Rate Limit Checks Atomic with Lua Scripts

The JavaScript-side logic above involves multiple separate Redis calls (get, then conditionally set) — under high concurrency, this can introduce race conditions (two requests both reading the same count before either writes back). Lua scripts execute atomically on the Redis server, eliminating this risk entirely.

```js
const rateLimitScript = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

local count = redis.call('INCR', key)
if count == 1 then
  redis.call('EXPIRE', key, window)
end

if count > limit then
  return 0
else
  return 1
end
`;

async function isAllowed(userId, limit, windowSeconds) {
  const key = `ratelimit:${userId}`;
  const result = await redis.eval(
    rateLimitScript,
    1,
    key,
    limit,
    windowSeconds,
  );
  return result === 1;
}
```

Lua scripts run as a single atomic operation on the Redis server — no other command can interleave in the middle of the script's execution, fully eliminating race conditions inherent in multi-step client-side logic.

## Using `rate-limiter-flexible` (Production-Ready Library)

Rather than hand-rolling rate limiting logic, most production Node.js apps use a well-tested library backed by Redis.

```bash
npm install rate-limiter-flexible ioredis
```

```js
const { RateLimiterRedis } = require("rate-limiter-flexible");
const Redis = require("ioredis");

const redisClient = new Redis();

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 100, // number of allowed requests
  duration: 60, // per 60 seconds
  keyPrefix: "ratelimit",
});

async function rateLimitMiddleware(req, res, next) {
  try {
    await rateLimiter.consume(req.ip); // throws if the limit is exceeded
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: "Too many requests",
      retryAfter: Math.round(rejRes.msBeforeNext / 1000),
    });
  }
}

app.use(rateLimitMiddleware);
```

## Using `express-rate-limit` with a Redis Store

```bash
npm install express-rate-limit rate-limit-redis ioredis
```

```js
const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");
const Redis = require("ioredis");

const redisClient = new Redis();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use(limiter);
```

## Comparing the Algorithms

| Algorithm              | Accuracy                   | Memory Usage                | Burst Handling            | Complexity |
| ---------------------- | -------------------------- | --------------------------- | ------------------------- | ---------- |
| Fixed Window           | Low (boundary burst issue) | Very low                    | Poor                      | Simple     |
| Sliding Window Log     | High                       | High (stores every request) | Excellent                 | Moderate   |
| Sliding Window Counter | Good approximation         | Low                         | Good                      | Moderate   |
| Token Bucket           | High                       | Low                         | Controlled bursts allowed | Moderate   |

## Rate Limiting by Different Keys

```js
// By IP address
await isAllowed(req.ip, 100, 60);

// By authenticated user
await isAllowed(req.user?.id || req.ip, 60, 60);

// By API key (for third-party/partner APIs)
await isAllowed(req.headers["x-api-key"], 1000, 60);

// By endpoint + user, for granular per-route limits
await isAllowed(`${req.user.id}:${req.path}`, 20, 60);
```

## Common Interview-Style Questions

- **Why does the fixed window counter algorithm have a "boundary burst" problem?**
  Because the counter resets sharply at fixed time boundaries, a client could send the full limit right before a window ends and the full limit again right after it resets, effectively getting up to double the intended limit within a short span straddling the boundary.

- **How does the sliding window log algorithm solve the boundary burst problem, and what's its trade-off?**
  It tracks the exact timestamp of every individual request (via a Sorted Set) and only counts those within the trailing time window, giving precise enforcement with no boundary artifacts — the trade-off is higher memory usage, since it stores a distinct entry per request rather than a single counter.

- **Why use a Lua script for rate limiting instead of separate INCR/EXPIRE calls from application code?**
  Lua scripts execute atomically on the Redis server as a single operation, eliminating race conditions that could occur between multiple separate client-side calls under high concurrency (e.g., two requests both incrementing based on a stale read).

- **What's the advantage of the token bucket algorithm over a simple fixed window counter?**
  It naturally allows controlled short bursts (up to the bucket's capacity) while still enforcing a steady long-term average rate via the refill rate, rather than rigidly capping requests within arbitrary fixed time blocks.

- **Why is Redis particularly well-suited for implementing rate limiting across multiple server instances?**
  It provides a single, shared, extremely fast source of truth for request counters accessible by all app instances behind a load balancer — an in-memory counter local to each server instance would allow a client to effectively multiply their limit by hitting different instances.
