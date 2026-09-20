# 12. Interview Questions — Redis (Comprehensive)

A consolidated set of commonly asked Redis interview questions, organized by topic, with concise answers and code where useful.

---

## Data Structures / Fundamentals

**Q: What makes Redis fundamentally different from a traditional database?**
It stores data primarily in RAM rather than on disk, trading some durability complexity for extremely low latency; typically used to complement a primary database (cache, session store, queue) rather than replace it.

**Q: Why is `KEYS *` discouraged in production?**
Redis is single-threaded for command execution — `KEYS` blocks the entire server for its O(N) scan; `SCAN` iterates incrementally without blocking.

**Q: RDB vs AOF persistence?**
RDB takes periodic point-in-time snapshots (faster restart, can lose recent writes); AOF logs every write operation (stronger durability, larger files, slower restart). Many setups use both.

**Q: What happens when Redis hits its `maxmemory` limit?**
Depends on the eviction policy: reject writes (`noeviction`), evict least-recently-used keys (`allkeys-lru`/`volatile-lru`), evict randomly, or evict by shortest TTL — chosen based on the use case's tolerance for data loss.

---

## Strings

**Q: Why use `INCR` instead of read-modify-write in application code?**
`INCR` is atomic at the server level, safe under concurrent access; a manual read-then-write is subject to race conditions where concurrent operations overwrite each other.

**Q: What does `SET key value NX EX 30` accomplish?**
Sets the key only if it doesn't already exist, with a 30-second expiry — the foundation of simple distributed locking.

**Q: What is a Redis bitmap used for?**
Extremely memory-efficient boolean flag storage via bit-level operations on a string — e.g., tracking daily active users with one bit per day per user.

---

## Lists

**Q: Why are Lists well-suited for queues and stacks?**
O(1) push/pop at both ends — a queue uses opposite ends (`RPUSH`/`LPOP`), a stack uses the same end (`LPUSH`/`LPOP`).

**Q: Advantage of `BLPOP` over polling with `LPOP`?**
Blocks until an item is available (or timeout), avoiding wasted CPU/network from constant polling of an empty queue.

**Q: Why is `RPOPLPUSH`/`LMOVE` useful for reliable queues?**
Atomically moves an item between lists in one operation, so a job moved into a "processing" list isn't lost if a worker crashes mid-processing.

---

## Sets

**Q: What guarantee does a Set provide that a List doesn't?**
Automatic uniqueness and O(1) membership checks (versus O(N) scan for a List).

**Q: How would you find mutual friends between two users?**
`SINTER user:A:friends user:B:friends` — built-in set intersection.

**Q: Difference between `SRANDMEMBER` and `SPOP`?**
`SRANDMEMBER` returns a random member without removing it; `SPOP` returns and atomically removes it — useful for distinct random selection like prize draws.

---

## Hashes

**Q: When would you choose a Hash over a JSON string?**
When you need to read/update individual fields independently — direct field-level access (`HGET`/`HINCRBY`) without a full read-modify-write cycle.

**Q: Limitation of Hashes compared to JSON?**
Flat structure — field values are always strings, no native nesting.

**Q: How do you atomically increment one field in a hash?**
`HINCRBY key field increment`.

---

## Sorted Sets

**Q: What makes a Sorted Set different from a regular Set?**
Each member has an associated score, and Redis automatically maintains order by score — enabling efficient rank/range queries a plain Set can't support.

**Q: How would you get the top 10 entries on a leaderboard?**
`ZREVRANGE leaderboard 0 9 WITHSCORES`.

**Q: How can Sorted Sets implement a priority queue?**
Use the score as priority; `ZADD` to enqueue, `ZPOPMIN` (or `ZPOPMAX`) to atomically dequeue the highest-priority item.

**Q: How can Sorted Sets support a sliding-window rate limiter?**
Store request timestamps as scores; remove entries outside the window (`ZREMRANGEBYSCORE`), then count what remains (`ZCARD`) against the limit.

---

## Pub/Sub

**Q: What's the critical limitation of Redis Pub/Sub?**
Fire-and-forget — messages published while no subscriber is connected are lost permanently; no persistence or replay.

**Q: When would you choose Streams over Pub/Sub?**
When you need guaranteed delivery, persistence, or reliable multi-consumer work distribution (consumer groups) — scenarios where losing messages during a disconnect is unacceptable.

**Q: Why does a subscribing client need a separate connection?**
Once in subscriber mode, a connection is dedicated to receiving pushed messages and can't issue other commands.

---

## Caching

**Q: Explain the cache-aside pattern.**
Check the cache first; on a miss, fetch from the database, then populate the cache before returning — subsequent requests become cache hits.

**Q: What is a cache stampede, and how do you prevent it?**
Many concurrent requests missing simultaneously on a popular expired key, all hitting the database at once; prevented via locking (only one request repopulates) or proactive early refresh before actual expiry.

**Q: Write-through vs write-behind caching?**
Write-through updates cache and DB synchronously on every write; write-behind writes to cache immediately and asynchronously flushes to the DB later (faster, but risks data loss before flush).

**Q: How do you invalidate a cached query result that depends on multiple records?**
Tag-based invalidation — track cache keys under a logical dependency tag (a Set), and delete all tagged keys when the underlying dependency changes.

---

## Session Store

**Q: Why use Redis instead of in-memory session storage?**
In-memory storage doesn't scale across multiple server instances and loses data on restart; Redis provides a shared, fast store accessible by all instances behind a load balancer.

**Q: What is sliding expiration, and how is it implemented?**
Extending a session's TTL on each active use rather than a fixed expiry from creation — implemented by calling `EXPIRE` on each access, or via `rolling: true` in session middleware.

**Q: How would you implement "log out everywhere"?**
Track all active session IDs per user in a Set; on request, delete all referenced session keys plus the set itself.

**Q: Key advantage of Redis sessions over JWTs?**
Instant revocation — deleting the session key immediately invalidates it, unlike a stateless JWT which remains valid until expiry without an additional blocklist.

---

## Rate Limiting

**Q: What's the "boundary burst" problem with fixed window counters?**
A client can send the full limit right before a window resets and again right after, effectively getting up to double the limit across the boundary.

**Q: How does sliding window log solve this, and what's the trade-off?**
Tracks exact request timestamps (via a Sorted Set) for precise enforcement with no boundary artifacts, at the cost of higher memory usage (one entry per request).

**Q: Why use a Lua script for rate limiting instead of separate INCR/EXPIRE calls?**
Lua scripts execute atomically on the server, eliminating race conditions between multiple separate client-side calls under high concurrency.

**Q: Advantage of token bucket over fixed window?**
Allows controlled short bursts (up to bucket capacity) while enforcing a steady long-term average rate via the refill rate.

---

## Distributed Locks

**Q: What Redis command is the foundation of a basic distributed lock?**
`SET key value NX EX ttl` — `NX` ensures only one client claims the lock atomically; `EX` prevents it from being held forever.

**Q: Why is a TTL essential for a distributed lock?**
Without it, a crashed/hung process holding the lock would leave it locked forever since nothing would call release.

**Q: What's the bug in releasing a lock with a plain `DEL`, and the fix?**
It doesn't verify current ownership — could delete a different process's lock if the original TTL expired; fixed by storing a unique token as the value and only deleting via an atomic Lua script that checks the token matches before deleting.

**Q: What problem does Redlock solve?**
Addresses a single Redis instance being a point of failure during failover, by requiring lock acquisition across a majority of multiple independent Redis instances.

---

## Practical / Coding Questions Often Asked Live

**Q: Implement a simple cache-aside function.**

```js
async function getProduct(id) {
  const cached = await redis.get(`product:${id}`);
  if (cached) return JSON.parse(cached);

  const product = await db.products.findById(id);
  await redis.set(`product:${id}`, JSON.stringify(product), "EX", 600);
  return product;
}
```

**Q: Implement a safe distributed lock acquire/release pair.**

```js
async function acquireLock(resource, ttl) {
  const value = crypto.randomUUID();
  const ok = await redis.set(`lock:${resource}`, value, "NX", "EX", ttl);
  return ok === "OK" ? value : null;
}

const releaseScript = `if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end`;
async function releaseLock(resource, value) {
  return redis.eval(releaseScript, 1, `lock:${resource}`, value);
}
```

**Q: Implement a leaderboard with top-N retrieval and a player's rank.**

```js
async function addScore(player, points) {
  await redis.zincrby("leaderboard", points, player);
}

async function getTopN(n) {
  return redis.zrevrange("leaderboard", 0, n - 1, "WITHSCORES");
}

async function getRank(player) {
  const rank = await redis.zrevrank("leaderboard", player);
  return rank !== null ? rank + 1 : null;
}
```

**Q: Implement a fixed-window rate limiter with an atomic Lua script.**

```js
const script = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[2]) end
return count <= tonumber(ARGV[1]) and 1 or 0
`;

async function isAllowed(userId, limit, windowSeconds) {
  const result = await redis.eval(
    script,
    1,
    `ratelimit:${userId}`,
    limit,
    windowSeconds,
  );
  return result === 1;
}
```

**Q: How would you design a Redis-backed shopping cart that survives across sessions with a 24-hour TTL?**
Use a Hash per user (`cart:{userId}`), one field per product ID mapping to quantity, updated via `HSET`/`HINCRBY`, with `EXPIRE cart:{userId} 86400` refreshed on every cart modification to maintain a 24-hour rolling TTL.
