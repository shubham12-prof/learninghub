# 02. Strings

## What Are Redis Strings?

The simplest and most versatile Redis data type — a key mapped to a binary-safe string value (up to 512MB). Despite the name, "strings" can hold text, serialized JSON, numbers, or even binary data (images, serialized objects).

## Basic Operations

```bash
SET name "Alice"
GET name              # "Alice"
DEL name               # remove the key
EXISTS name              # 0 or 1
```

```js
// ioredis
await redis.set("name", "Alice");
const name = await redis.get("name"); // 'Alice'
await redis.del("name");
```

## Setting with Expiration (TTL)

```bash
SET session:abc123 "user_data" EX 3600     # expires in 3600 seconds (1 hour)
SET session:abc123 "user_data" PX 60000    # expires in 60000 milliseconds
SETEX session:abc123 3600 "user_data"       # equivalent shorthand
```

```js
await redis.set("session:abc123", "user_data", "EX", 3600);
await redis.setex("session:abc123", 3600, "user_data");
```

## Conditional Sets — `NX` and `XX`

```bash
SET lock:resource1 "locked" NX    # only set if the key does NOT already exist
SET config:key "value" XX          # only set if the key ALREADY exists
```

```js
const acquired = await redis.set("lock:resource1", "locked", "NX", "EX", 30);
// acquired === 'OK' if the lock was acquired, null if it already existed
```

`SET ... NX` is the fundamental building block for simple distributed locks (see the Distributed Lock notes for the full pattern).

## Numeric Operations — Atomic Counters

```bash
SET views 0
INCR views          # 1
INCR views          # 2
INCRBY views 10      # 12
DECR views            # 11
DECRBY views 5         # 6
```

```js
await redis.incr("page:home:views");
await redis.incrby("page:home:views", 10);
```

These are **atomic** — safe under concurrent access from multiple clients without race conditions, unlike a naive "read, add, write back" pattern in application code.

### Example: Real-Time View Counter

```js
async function trackPageView(pageId) {
  const views = await redis.incr(`page:${pageId}:views`);
  return views;
}
```

## Float Increments

```bash
INCRBYFLOAT temperature 0.5
```

```js
await redis.incrbyfloat("sensor:1:temperature", 0.5);
```

## String Manipulation

```bash
APPEND log "first entry; "
APPEND log "second entry; "
GET log         # "first entry; second entry; "

STRLEN log       # length of the string in bytes

GETRANGE log 0 4  # substring, like a slice
SETRANGE log 0 "NEW"  # overwrite part of the string starting at an offset
```

## Multiple Keys at Once (Batch Operations)

```bash
MSET key1 "a" key2 "b" key3 "c"
MGET key1 key2 key3      # ["a", "b", "c"]
```

```js
await redis.mset("key1", "a", "key2", "b");
const values = await redis.mget("key1", "key2"); // ['a', 'b']
```

`MSET`/`MGET` are more efficient than multiple individual `SET`/`GET` round trips — fewer network calls for the same result.

## Storing JSON (Serialized Objects)

Redis strings don't natively understand JSON — you serialize/deserialize manually (or use `RedisJSON`, a Redis module, for native JSON support).

```js
async function cacheUser(user) {
  await redis.set(`user:${user.id}`, JSON.stringify(user), "EX", 3600);
}

async function getCachedUser(id) {
  const data = await redis.get(`user:${id}`);
  return data ? JSON.parse(data) : null;
}
```

## `GETSET` / `GETDEL` — Atomic Read-and-Modify

```bash
GETSET key "new_value"   # returns the OLD value, sets a new one atomically
GETDEL key                # returns the value and deletes the key atomically
```

```js
const oldValue = await redis.getset("counter", "0"); // atomically reset while retrieving the previous value
```

## Bit Operations (Compact Boolean Flags)

Strings can be manipulated at the bit level — useful for extremely memory-efficient flag storage (e.g., daily active user tracking across millions of users).

```bash
SETBIT user:1000:active_days 5 1   # mark day 5 as active
GETBIT user:1000:active_days 5       # 1
BITCOUNT user:1000:active_days        # count of set bits (total active days)
```

```js
await redis.setbit("user:1000:active_days", 5, 1);
const activeDays = await redis.bitcount("user:1000:active_days");
```

### Example: Daily Active User Tracking with Bitmaps

```js
// Mark a user active for "today" (day-of-year as the bit offset)
async function markActive(userId, dayOfYear) {
  await redis.setbit(`active:${userId}`, dayOfYear, 1);
}

// Combine multiple users' bitmaps to compute overlapping active days (BITOP)
await redis.bitop("AND", "result", "active:1000", "active:1001"); // days both users were active
```

## Common String Use Cases

| Use Case               | Pattern                               |
| ---------------------- | ------------------------------------- |
| Simple caching         | `SET cache:key value EX ttl`          |
| Atomic counters        | `INCR`/`INCRBY`                       |
| Feature flags/toggles  | `SET feature:dark_mode "on"`          |
| Distributed locks      | `SET lock:resource "token" NX EX ttl` |
| Rate limiting counters | `INCR` + `EXPIRE` combo               |
| Session tokens         | `SET session:token user_data EX ttl`  |

## Common Interview-Style Questions

- **Why is `INCR` preferred over reading a value, adding to it in application code, and writing it back?**
  `INCR` is atomic at the Redis server level — safe under concurrent access from multiple clients; a manual read-modify-write in application code is subject to race conditions where two concurrent operations could both read the same stale value and overwrite each other's increment.

- **What does `SET key value NX EX 30` accomplish, and what's a common use case?**
  It sets the key only if it doesn't already exist, with a 30-second expiration — this atomic "set if not exists with TTL" pattern is the foundation of simple distributed locking.

- **How would you store a JSON object as a Redis string, and what's the trade-off?**
  Serialize it with `JSON.stringify()` before `SET`, and `JSON.parse()` after `GET`; the trade-off is Redis has no native understanding of the structure (can't query/update individual fields without reading and rewriting the whole value) unless using a specialized module like RedisJSON or switching to a Hash for structured data.

- **What's the advantage of `MSET`/`MGET` over multiple individual `SET`/`GET` calls?**
  Fewer network round trips — batching multiple key operations into a single command reduces latency overhead compared to issuing many separate requests.

- **What is a Redis bitmap, and what's a practical use case?**
  A way to manipulate a string value at the individual-bit level, enabling extremely memory-efficient storage of boolean flags across huge key spaces — a common use case is tracking daily active users (one bit per day per user) at massive scale with minimal memory footprint.
