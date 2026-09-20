# Cache Strategies (Caching Patterns)

These are the standard architectural patterns for how an application interacts with a cache and a backing data store (database).

## 1. Cache-Aside (a.k.a. Lazy Loading) — Most Common

**How it works:** The application checks the cache first. On a miss, it reads from the DB, then populates the cache for future requests. The cache is "beside" the application logic, not automatically kept in sync.

```
READ:
App -> Cache (miss) -> DB -> App writes result -> Cache

WRITE:
App -> DB (cache is NOT updated, just invalidated/left to expire)
```

```js
async function getProduct(id) {
  const key = `product:${id}`;
  let product = await redis.get(key);
  if (product) return JSON.parse(product); // HIT

  product = await db.query("SELECT * FROM products WHERE id = ?", [id]); // MISS
  await redis.set(key, JSON.stringify(product), "EX", 3600);
  return product;
}

async function updateProduct(id, data) {
  await db.query("UPDATE products SET ? WHERE id = ?", [data, id]);
  await redis.del(`product:${id}`); // invalidate, don't update
}
```

**Pros:** Only requested data gets cached (efficient memory use); resilient to cache failure (falls back to DB).
**Cons:** First request after a miss/expiry is slow ("cold" read); possible stale data window; extra code in app layer.

## 2. Read-Through Cache

**How it works:** Similar to cache-aside, but the cache itself (or a caching library/proxy) is responsible for loading data from the DB on a miss — the application only ever talks to the cache.

```
App -> Cache -> (miss) -> Cache loads from DB internally -> App
```

```js
// Example using a caching library abstraction (conceptual)
class ReadThroughCache {
  constructor(redis, loader) {
    this.redis = redis;
    this.loader = loader; // function(key) => Promise<data>
  }

  async get(key) {
    let value = await this.redis.get(key);
    if (value) return JSON.parse(value);

    value = await this.loader(key); // cache handles the DB call itself
    await this.redis.set(key, JSON.stringify(value), "EX", 3600);
    return value;
  }
}

const productCache = new ReadThroughCache(redis, async (key) => {
  const id = key.split(":")[1];
  return db.query("SELECT * FROM products WHERE id = ?", [id]);
});

const product = await productCache.get("product:101");
```

**Pros:** Cleaner separation — app code doesn't know about the DB at all.
**Cons:** Requires a caching layer/library that supports this (e.g., Amazon DAX for DynamoDB, some ORMs).

## 3. Write-Through Cache

**How it works:** Every write goes to the cache AND the database synchronously, in the same operation. Cache is always in sync with DB.

```
App -> Cache -> DB   (both updated together, write completes only when both succeed)
```

```js
async function updateProductWriteThrough(id, data) {
  await redis.set(`product:${id}`, JSON.stringify(data), "EX", 3600);
  await db.query("UPDATE products SET ? WHERE id = ?", [data, id]);
}
```

**Pros:** Cache is always fresh; reads are always fast (no cold-read penalty).
**Cons:** Every write has added latency (writes to 2 systems); wasted cache space for data that's rarely read.

## 4. Write-Back / Write-Behind Cache

**How it works:** Writes go to the cache first (fast), and the cache asynchronously flushes changes to the DB later (batched).

```
App -> Cache (fast ack to user) -> (async, batched) -> DB
```

```js
// Simplified write-behind queue
const writeQueue = [];

async function updateProductWriteBehind(id, data) {
  await redis.set(`product:${id}`, JSON.stringify(data), "EX", 3600);
  writeQueue.push({ id, data }); // queue DB write for later
}

// Background worker flushes queue periodically
setInterval(async () => {
  while (writeQueue.length) {
    const { id, data } = writeQueue.shift();
    await db.query("UPDATE products SET ? WHERE id = ?", [data, id]);
  }
}, 5000);
```

**Pros:** Very fast writes; can batch/coalesce multiple writes to reduce DB load.
**Cons:** Risk of **data loss** if cache crashes before flushing to DB; more complex to implement correctly (needs durability guarantees, e.g., persistent queue).

## 5. Write-Around Cache

**How it works:** Writes go directly to the DB, bypassing the cache entirely. Cache is only populated on a subsequent read (cache-aside style read).

```
WRITE: App -> DB only (cache untouched)
READ:  App -> Cache (miss, since it was never written) -> DB -> populate cache
```

```js
async function createProductWriteAround(data) {
  const result = await db.query("INSERT INTO products SET ?", [data]);
  // deliberately NOT writing to cache here
  return result;
}
```

**Pros:** Avoids flooding the cache with data that may never be read again (e.g., bulk imports, write-heavy/read-rarely data).
**Cons:** Recently written data causes a cache miss on first read (slightly slower first read).

## 6. Comparison Table

| Strategy      | Read Speed         | Write Speed        | Consistency        | Risk               | Best For                          |
| ------------- | ------------------ | ------------------ | ------------------ | ------------------ | --------------------------------- |
| Cache-Aside   | Fast after warm-up | Fast (DB only)     | Eventual           | Stale window       | General purpose, read-heavy       |
| Read-Through  | Fast after warm-up | N/A (read-focused) | Eventual           | Stale window       | Clean architecture, libraries     |
| Write-Through | Always fast        | Slower (2 writes)  | Strong             | None (mostly)      | Read-heavy + consistency critical |
| Write-Back    | Always fast        | Very fast          | Eventual (delayed) | Data loss on crash | Write-heavy, high throughput      |
| Write-Around  | Slow on first read | Fast (DB only)     | Eventual           | Cold read          | Write-heavy, rarely-read data     |

## 7. Choosing a Strategy — Decision Guide

```
Is data read far more often than written?
 ├── Yes -> Cache-Aside or Write-Through
 │              ├── Need strong consistency on read? -> Write-Through
 │              └── OK with eventual consistency?     -> Cache-Aside
 └── No (write-heavy) ->
        ├── Can tolerate some data loss risk for speed? -> Write-Back
        └── Data rarely re-read after write?             -> Write-Around
```

## 8. Combining Strategies (Multi-Layer / Tiered Caching)

Real systems often combine multiple layers:

```
[Browser Cache] -> [CDN Cache] -> [App Server: In-Memory (e.g. Node LRU)] -> [Redis] -> [Database]
```

### In-Memory (L1) + Redis (L2) Example

```js
const LRU = require("lru-cache");
const localCache = new LRU({ max: 500, ttl: 30 * 1000 }); // 30 sec, per-instance

async function getProductTiered(id) {
  const key = `product:${id}`;

  // L1: in-process memory (fastest, but not shared across instances)
  if (localCache.has(key)) return localCache.get(key);

  // L2: Redis (shared across instances, still fast)
  let product = await redis.get(key);
  if (product) {
    product = JSON.parse(product);
    localCache.set(key, product);
    return product;
  }

  // L3: Database (slowest, source of truth)
  product = await db.query("SELECT * FROM products WHERE id = ?", [id]);
  await redis.set(key, JSON.stringify(product), "EX", 3600);
  localCache.set(key, product);
  return product;
}
```

## 9. Additional Strategy Concepts

### Negative Caching

Cache the fact that something does NOT exist, to avoid repeated expensive lookups for missing data.

```js
async function getUserSafe(id) {
  const key = `user:${id}`;
  const cached = await redis.get(key);
  if (cached === "NULL") return null; // negative cache hit
  if (cached) return JSON.parse(cached);

  const user = await db.query("SELECT * FROM users WHERE id = ?", [id]);
  if (!user) {
    await redis.set(key, "NULL", "EX", 60); // cache the "not found" for 60s
    return null;
  }
  await redis.set(key, JSON.stringify(user), "EX", 3600);
  return user;
}
```

### Read Replicas as a Caching Layer

Sometimes "caching" is done via DB read replicas rather than a separate cache system — reads go to replicas, writes go to primary.

## 10. Best Practices

1. Default to **cache-aside** unless you have a specific reason for another pattern — it's simple and battle-tested.
2. Use **write-through** when read-after-write consistency matters a lot (e.g., user just updated their profile and immediately views it).
3. Use **write-back** only when you can tolerate/engineer around potential data loss (e.g., using a durable queue like Kafka).
4. Combine local (in-process) + distributed (Redis) caching for the best latency/scalability trade-off.
5. Always set sane TTLs and monitor hit ratio, memory usage, and eviction rates.
