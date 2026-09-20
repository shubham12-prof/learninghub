# Redis Cache

## 1. What is Redis?

Redis (**RE**mote **DI**ctionary **S**erver) is an in-memory, key-value data store. Because data lives in RAM (not disk), reads/writes are extremely fast (sub-millisecond), making it a very popular choice as an **application-level cache** sitting between your app and a slower database (like MySQL/Postgres).

```
[Client] -> [App Server] -> [Redis Cache] -> (miss) -> [Database]
                                  ^                          |
                                  |__________________________|
                                     (store result back in Redis)
```

## 2. Why Use Redis as a Cache?

- In-memory → very low latency (microseconds to low milliseconds)
- Supports rich data structures: strings, hashes, lists, sets, sorted sets, streams
- Built-in expiration (TTL) support
- Supports pub/sub, transactions, Lua scripting
- Horizontally scalable (Redis Cluster) and highly available (Sentinel)
- Persistence options (RDB snapshots, AOF logs) if you need durability

## 3. Basic Setup

### Install & Run (Docker)

```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### Node.js Client Setup (`ioredis`)

```bash
npm install ioredis
```

```js
const Redis = require("ioredis");
const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

redis.on("connect", () => console.log("Redis connected"));
```

## 4. Basic Commands (with Node.js)

```js
// SET a key with TTL (seconds)
await redis.set("user:1001", JSON.stringify({ name: "Alice" }), "EX", 3600);

// GET a key
const data = await redis.get("user:1001");
console.log(JSON.parse(data));

// DELETE a key
await redis.del("user:1001");

// Check TTL remaining
const ttl = await redis.ttl("user:1001"); // seconds left, -1 = no expiry, -2 = key doesn't exist

// EXISTS check
const exists = await redis.exists("user:1001"); // 1 or 0

// Increment counter (atomic)
await redis.incr("page:views");
```

## 5. Common Redis Data Structures for Caching

| Structure         | Use Case                                                          |
| ----------------- | ----------------------------------------------------------------- |
| String            | Simple key-value cache (JSON blob, HTML fragment)                 |
| Hash              | Cache an object's fields individually (e.g., user profile fields) |
| List              | Recent activity feed, queues                                      |
| Set               | Unique tags, deduplication                                        |
| Sorted Set (ZSet) | Leaderboards, rate limiting, time-ranked feeds                    |
| Bitmap            | Feature flags, attendance tracking                                |
| HyperLogLog       | Approximate unique counts (e.g., unique visitors)                 |

### Hash Example

```js
await redis.hset("user:1001", {
  name: "Alice",
  email: "alice@example.com",
  age: "29",
});
const name = await redis.hget("user:1001", "name");
const all = await redis.hgetall("user:1001");
await redis.expire("user:1001", 3600); // set TTL on the whole hash
```

### Sorted Set Example (Leaderboard)

```js
await redis.zadd("leaderboard", 500, "player1");
await redis.zadd("leaderboard", 800, "player2");

// top 10 players, highest score first
const top10 = await redis.zrevrange("leaderboard", 0, 9, "WITHSCORES");
```

## 6. Cache-Aside Pattern (Most Common) — Full Example

The application code is responsible for checking cache, and populating it on a miss.

```js
async function getUser(userId) {
  const cacheKey = `user:${userId}`;

  // 1. Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached); // cache HIT
  }

  // 2. Cache MISS -> fetch from DB
  const user = await db.query("SELECT * FROM users WHERE id = ?", [userId]);

  // 3. Store in cache for next time (TTL = 1 hour)
  await redis.set(cacheKey, JSON.stringify(user), "EX", 3600);

  return user;
}
```

## 7. Write-Through Example

Write goes to the cache AND the database at the same time (kept in sync).

```js
async function updateUser(userId, newData) {
  await db.query("UPDATE users SET ? WHERE id = ?", [newData, userId]);
  await redis.set(`user:${userId}`, JSON.stringify(newData), "EX", 3600);
  return newData;
}
```

## 8. Handling Cache Stampede ("Thundering Herd")

When a popular cache key expires, many concurrent requests may hit the DB at once. Solutions:

### a) Locking (Mutex) Pattern

```js
async function getUserSafe(userId) {
  const cacheKey = `user:${userId}`;
  let user = await redis.get(cacheKey);
  if (user) return JSON.parse(user);

  const lockKey = `lock:${cacheKey}`;
  // Try to acquire a short-lived lock
  const gotLock = await redis.set(lockKey, "1", "NX", "EX", 10);

  if (gotLock) {
    user = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
    await redis.set(cacheKey, JSON.stringify(user), "EX", 3600);
    await redis.del(lockKey);
    return user;
  } else {
    // wait briefly and retry, or serve stale data
    await new Promise((r) => setTimeout(r, 100));
    return getUserSafe(userId);
  }
}
```

### b) Probabilistic Early Expiration

Refresh the cache slightly _before_ it actually expires, randomized, so not all keys expire simultaneously.

## 9. Redis Eviction Policies (When Memory Is Full)

Set via `maxmemory-policy` in `redis.conf`:

| Policy           | Behavior                                          |
| ---------------- | ------------------------------------------------- |
| `noeviction`     | Return errors when memory limit is reached        |
| `allkeys-lru`    | Evict least-recently-used key among ALL keys      |
| `allkeys-lfu`    | Evict least-frequently-used key among ALL keys    |
| `volatile-lru`   | Evict LRU key, but only among keys with a TTL set |
| `volatile-lfu`   | Evict LFU key, only among keys with TTL           |
| `volatile-ttl`   | Evict key with shortest remaining TTL             |
| `allkeys-random` | Evict a random key                                |

```conf
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

## 10. Redis Persistence (Optional, if cache doubles as store)

- **RDB**: point-in-time snapshots (fast restart, some data loss possible)
- **AOF**: append-only log of every write (more durable, larger files)

```conf
save 900 1
appendonly yes
```

For pure caching use-cases, persistence is often disabled for performance since data can be regenerated from the source DB.

## 11. Scaling Redis

- **Redis Sentinel** — automatic failover for high availability (1 primary + replicas)
- **Redis Cluster** — data sharded across multiple nodes for horizontal scaling

```
Redis Cluster (sharded):
   Shard 1        Shard 2        Shard 3
 (keys A-H)     (keys I-P)     (keys Q-Z)
```

## 12. Python Example (using `redis-py`)

```python
import redis
import json

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

def get_user(user_id):
    cache_key = f"user:{user_id}"
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)

    user = fetch_user_from_db(user_id)
    r.setex(cache_key, 3600, json.dumps(user))  # setex = SET with EXpiry
    return user
```

## 13. Common Pitfalls

1. **No TTL set** → memory fills up indefinitely.
2. **Caching huge objects** → wastes RAM, consider caching only what's needed.
3. **Cache stampede** on popular keys → use locking/jitter.
4. **Serialization overhead** — JSON parse/stringify cost adds up at scale; consider MessagePack/Protobuf for large payloads.
5. **Using Redis as source of truth without persistence** → data loss risk on restart/crash.

## 14. Best Practices

1. Always set a TTL unless you have an explicit eviction/invalidation strategy.
2. Use key naming conventions: `entity:id:field` (e.g., `user:1001:profile`).
3. Use pipelining/multi for batch operations to reduce round-trips.
4. Monitor hit/miss ratio (`INFO stats` → `keyspace_hits` / `keyspace_misses`).
5. Use appropriate data structure (hash for objects, not one string per field).
