# Cache Invalidation

> "There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton

## 1. What is Cache Invalidation?

Cache invalidation is the process of removing or updating stale/outdated data from a cache so users don't see incorrect information after the underlying data has changed.

**The core problem:** cache = a _copy_ of data. When the original changes, the copy can become stale. Deciding _when_ and _how_ to remove/update that copy is surprisingly hard.

## 2. Three Main Invalidation Strategies

### a) TTL / Time-Based Expiration

Simplest approach — data automatically expires after a fixed duration, regardless of whether it actually changed.

```js
// Redis example - expires in 60 seconds no matter what
await redis.set("product:101", JSON.stringify(product), "EX", 60);
```

**Pros:** simple, self-healing (no manual work).
**Cons:** data can be stale for up to the TTL duration; picking the right TTL is a trade-off.

### b) Explicit / Manual Invalidation

The application actively deletes or updates the cache entry the moment the underlying data changes.

```js
async function updateProduct(id, newData) {
  await db.query("UPDATE products SET ? WHERE id = ?", [newData, id]);

  // Explicitly remove stale cache entry
  await redis.del(`product:${id}`);
}
```

**Pros:** cache is always accurate immediately after a write.
**Cons:** requires discipline — every code path that mutates data must remember to invalidate the cache. Easy to miss a path (e.g., a bulk update job, an admin panel, a DB migration).

### c) Event-Driven / Write-Through Invalidation

Use events (message queue, DB change stream, pub/sub) to propagate invalidation automatically, decoupled from the write path.

```js
// Publisher (after DB update)
await db.query("UPDATE products SET ? WHERE id = ?", [newData, id]);
await redis.publish(
  "cache-invalidate",
  JSON.stringify({ key: `product:${id}` }),
);

// Subscriber (could be on every app instance)
const sub = new Redis();
sub.subscribe("cache-invalidate");
sub.on("message", async (channel, message) => {
  const { key } = JSON.parse(message);
  await redis.del(key);
});
```

## 3. Invalidation Patterns

### Key-Based Invalidation

Delete a specific known key.

```js
await redis.del("user:1001");
```

### Pattern/Namespace-Based Invalidation

Delete a group of related keys (careful — `KEYS` command is O(N) and blocks Redis; use `SCAN` in production).

```js
// BAD in production (blocks the server on large datasets)
const keys = await redis.keys("product:*");
if (keys.length) await redis.del(...keys);

// GOOD - non-blocking scan
async function deleteByPattern(pattern) {
  const stream = redis.scanStream({ match: pattern, count: 100 });
  stream.on("data", async (keys) => {
    if (keys.length) await redis.del(...keys);
  });
}
deleteByPattern("product:*");
```

### Tag-Based Invalidation

Group related cache entries under a "tag" so you can invalidate them all together (common in CDN/HTTP caching, e.g., Fastly "surrogate keys").

```js
// Store tag -> keys mapping
await redis.sadd("tag:category:electronics", "product:101", "product:102");

// Invalidate all products under a tag
async function invalidateTag(tag) {
  const keys = await redis.smembers(`tag:${tag}`);
  if (keys.length) await redis.del(...keys);
  await redis.del(`tag:${tag}`);
}
await invalidateTag("category:electronics");
```

### Version/Namespace Bump ("Cache Versioning")

Instead of deleting keys, change a version number so old keys are simply never looked up again (they expire naturally via TTL and are garbage-collected).

```js
// Global version stored somewhere, e.g., Redis
let version = (await redis.get("products:version")) || 1;

function cacheKey(id) {
  return `product:${id}:v${version}`;
}

// To "invalidate everything" -> just bump the version
await redis.incr("products:version");
// Old keys (v1) become orphaned and expire via TTL; new reads use v2 keys
```

## 4. HTTP / CDN Cache Invalidation (Purge)

```bash
# Cloudflare purge specific URL
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {token}" \
  --data '{"files":["https://example.com/product/101"]}'

# AWS CloudFront invalidation
aws cloudfront create-invalidation --distribution-id ABC123 --paths "/product/101"
```

Using **surrogate keys / cache tags** (Fastly example) lets you purge by tag instead of by URL:

```http
Surrogate-Key: product-101 category-electronics
```

```bash
curl -X POST https://api.fastly.com/service/{service_id}/purge/product-101 \
  -H "Fastly-Key: {api_token}"
```

## 5. Database-Driven Invalidation (Change Data Capture)

Using tools like **Debezium** to stream DB changes and auto-invalidate cache — decouples cache logic from application code entirely.

```
[Postgres] --WAL changes--> [Debezium] --Kafka topic--> [Cache Invalidation Service] --DEL--> [Redis]
```

```js
// Simplified Kafka consumer example
consumer.on("message", async (msg) => {
  const change = JSON.parse(msg.value);
  if (change.table === "products") {
    await redis.del(`product:${change.after.id}`);
  }
});
```

## 6. Handling Race Conditions in Invalidation

A subtle bug: if you `DELETE cache` then `UPDATE DB`, a concurrent read between those steps can repopulate the cache with **stale** data.

```
Timeline (BAD ordering):
T1: DEL cache
T2: (concurrent) READ -> cache miss -> reads OLD value from DB -> writes OLD value back to cache
T3: UPDATE DB with NEW value
Result: cache now has stale data indefinitely (until TTL)
```

**Fix:** update DB first, then invalidate cache (or use short TTL as a safety net regardless).

```js
async function updateProduct(id, newData) {
  await db.query("UPDATE products SET ? WHERE id = ?", [newData, id]); // 1. DB first
  await redis.del(`product:${id}`); // 2. Then invalidate
}
```

Even better: always keep a reasonably short TTL as a safety net so any race-condition staleness self-heals.

## 7. Stale-While-Revalidate

Serve stale data immediately (fast!) while asynchronously refreshing the cache in the background — good UX trade-off.

```http
Cache-Control: max-age=60, stale-while-revalidate=86400
```

Meaning: fresh for 60s; if stale (but within 86400s), serve stale content instantly AND trigger a background refetch.

```js
async function getWithSWR(key, fetchFn, ttl = 60) {
  const cached = await redis.get(key);
  if (cached) {
    const { data, expiresAt } = JSON.parse(cached);
    if (Date.now() < expiresAt) return data; // fresh

    // stale but usable -> return immediately, refresh in background
    fetchFn().then((fresh) =>
      redis.set(
        key,
        JSON.stringify({ data: fresh, expiresAt: Date.now() + ttl * 1000 }),
      ),
    );
    return data;
  }
  const fresh = await fetchFn();
  await redis.set(
    key,
    JSON.stringify({ data: fresh, expiresAt: Date.now() + ttl * 1000 }),
  );
  return fresh;
}
```

## 8. Comparison Table

| Strategy               | Freshness               | Complexity | Best For                             |
| ---------------------- | ----------------------- | ---------- | ------------------------------------ |
| TTL-based              | Eventually consistent   | Low        | General purpose, simple              |
| Manual/explicit delete | Immediate               | Medium     | Critical, frequently-updated data    |
| Event-driven           | Near-immediate          | High       | Distributed systems, microservices   |
| Tag/versioned          | Immediate, bulk         | Medium     | Bulk invalidation (category changes) |
| Stale-while-revalidate | Fast + eventually fresh | Medium     | High-traffic reads, UX-sensitive     |

## 9. Best Practices

1. Prefer **update DB → then invalidate cache**, never the reverse.
2. Always keep a TTL as a safety net, even with explicit invalidation.
3. Use tags/namespaces for bulk invalidation instead of scanning all keys.
4. Avoid `KEYS *` in production Redis — use `SCAN`.
5. For distributed systems, use pub/sub or a message queue to propagate invalidation across all app instances/caches.
6. Log/monitor cache hit ratio drops after deploys — sudden drops can indicate invalidation bugs.
