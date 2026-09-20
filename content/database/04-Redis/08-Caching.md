# 08. Caching

## Why Cache with Redis?

Caching stores the result of an expensive operation (a slow database query, a costly computation, an external API call) so future requests can be served instantly from memory instead of repeating the work. Redis's in-memory speed makes it the most common caching layer for web applications.

## The Cache-Aside Pattern (Most Common)

The application checks the cache first; on a miss, it fetches from the source of truth (database) and populates the cache for next time.

```js
async function getUser(userId) {
  const cacheKey = `user:${userId}`;

  // 1. Try the cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached); // cache HIT
  }

  // 2. Cache MISS — fetch from the source of truth
  const user = await db.users.findById(userId);
  if (!user) return null;

  // 3. Populate the cache for next time
  await redis.set(cacheKey, JSON.stringify(user), "EX", 3600); // 1 hour TTL

  return user;
}
```

```
Request -> Check Redis
              |
      HIT     |     MISS
       |      |      |
   Return   from  Query DB -> Store in Redis -> Return
   cached   cache
```

## Cache Invalidation — The Hard Part

> "There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton

### Strategy 1: TTL-Based Expiration (Simplest)

```js
await redis.set(cacheKey, JSON.stringify(data), "EX", 300); // auto-expires after 5 minutes
```

Simple, but means cached data can be stale for up to the TTL duration — acceptable for many use cases (e.g., a product listing that doesn't need to be perfectly real-time).

### Strategy 2: Explicit Invalidation on Write

```js
async function updateUser(userId, updates) {
  const user = await db.users.update(userId, updates);
  await redis.del(`user:${userId}`); // invalidate the stale cache entry immediately
  return user;
}
```

Combine both in practice: explicit invalidation for correctness on known writes, plus a TTL as a safety net for cases you might have missed.

```js
async function updateUser(userId, updates) {
  const user = await db.users.update(userId, updates);
  await redis.del(`user:${userId}`);
  return user;
}

async function getUser(userId) {
  const cached = await redis.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);

  const user = await db.users.findById(userId);
  await redis.set(`user:${userId}`, JSON.stringify(user), "EX", 3600); // TTL as a safety net
  return user;
}
```

## Cache Stampede ("Thundering Herd") Problem

If a popular cache key expires and many concurrent requests all miss at once, they can all simultaneously hit the database with the same expensive query, overwhelming it.

```
Cache key expires
   |
1000 concurrent requests all miss simultaneously
   |
1000 identical, expensive DB queries fire at once -> database overload
```

### Solution: Locking (Only One Request Repopulates the Cache)

```js
async function getWithStampedeProtection(cacheKey, fetchFn, ttl) {
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const lockKey = `lock:${cacheKey}`;
  const acquired = await redis.set(lockKey, "1", "NX", "EX", 10); // only one request wins the lock

  if (acquired) {
    try {
      const data = await fetchFn(); // only the lock-winner queries the database
      await redis.set(cacheKey, JSON.stringify(data), "EX", ttl);
      return data;
    } finally {
      await redis.del(lockKey);
    }
  } else {
    // Didn't get the lock — wait briefly and retry reading from cache
    await new Promise((resolve) => setTimeout(resolve, 50));
    return getWithStampedeProtection(cacheKey, fetchFn, ttl);
  }
}
```

### Solution: Early/Probabilistic Refresh

Refresh the cache slightly **before** it actually expires (with some randomized jitter across requests) so it rarely, if ever, hits a hard miss under heavy load.

```js
async function getWithEarlyRefresh(cacheKey, fetchFn, ttl) {
  const cached = await redis.get(cacheKey);
  const remainingTtl = await redis.ttl(cacheKey);

  if (cached && remainingTtl > ttl * 0.1) {
    return JSON.parse(cached); // still comfortably fresh
  }

  if (cached && Math.random() < 0.1) {
    // Occasionally, a single request proactively refreshes ahead of actual expiry
    fetchFn().then((data) =>
      redis.set(cacheKey, JSON.stringify(data), "EX", ttl),
    );
    return JSON.parse(cached); // still return the (slightly stale but valid) cached value immediately
  }

  const data = await fetchFn();
  await redis.set(cacheKey, JSON.stringify(data), "EX", ttl);
  return data;
}
```

## Caching Strategies Overview

| Strategy                       | Description                                                                                       | Trade-off                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Cache-Aside** (Lazy Loading) | App checks cache, falls back to DB, populates cache on miss                                       | Simple, most common; first request after a miss is slow                                     |
| **Write-Through**              | Every write goes to the cache AND the database simultaneously                                     | Cache always fresh, but adds latency to every write                                         |
| **Write-Behind (Write-Back)**  | Writes go to the cache first, asynchronously flushed to the DB later                              | Fast writes, but risk of data loss if the cache fails before flushing                       |
| **Read-Through**               | Cache itself is responsible for loading from the DB on a miss (often via a caching library/proxy) | Similar to cache-aside, but the loading logic lives in the cache layer, not the application |

### Write-Through Example

```js
async function updateProductWriteThrough(productId, updates) {
  const updated = await db.products.update(productId, updates);
  await redis.set(`product:${productId}`, JSON.stringify(updated), "EX", 3600); // update cache immediately, in sync
  return updated;
}
```

## Caching Query Results (Not Just Single Records)

```js
async function getProductsByCategory(category) {
  const cacheKey = `products:category:${category}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const products = await db.products.find({ category });
  await redis.set(cacheKey, JSON.stringify(products), "EX", 600);
  return products;
}

// Invalidating this kind of cache when ANY product in the category changes
// requires either a broader TTL-only strategy, or tracking which cache keys
// depend on which category (a "tag"-based invalidation approach — see below).
```

## Tag-Based Invalidation (For Complex Dependency Graphs)

When many cache keys can be invalidated by a single underlying change, track dependencies explicitly using a Set.

```js
async function cacheWithTags(cacheKey, data, tags, ttl) {
  await redis.set(cacheKey, JSON.stringify(data), "EX", ttl);
  for (const tag of tags) {
    await redis.sadd(`tag:${tag}`, cacheKey);
  }
}

async function invalidateTag(tag) {
  const keys = await redis.smembers(`tag:${tag}`);
  if (keys.length) await redis.del(...keys);
  await redis.del(`tag:${tag}`);
}

// Usage:
await cacheWithTags(
  `product:${id}`,
  product,
  [`category:${product.category}`],
  3600,
);
// Later, when ANY product in a category changes:
await invalidateTag(`category:shoes`); // clears every cached key tagged with this category
```

## Setting Appropriate TTLs

| Data Type                                            | Typical TTL Guidance           |
| ---------------------------------------------------- | ------------------------------ |
| Frequently changing data (stock counts, live prices) | Seconds to a couple of minutes |
| Semi-static data (product details, user profiles)    | Minutes to hours               |
| Rarely changing data (configuration, static lookups) | Hours to a day+                |
| Session data                                         | Matches session lifetime       |

## Common Interview-Style Questions

- **Explain the cache-aside pattern.**
  The application checks the cache first; on a hit, it returns cached data directly. On a miss, it queries the source of truth (database), then populates the cache with the result before returning it — subsequent requests for the same data become cache hits.

- **What is a cache stampede, and how do you prevent it?**
  When a popular cache key expires and many concurrent requests simultaneously miss, all hitting the database with the same expensive query at once; prevented via a locking mechanism (only one request repopulates the cache while others wait/retry) or by proactively refreshing the cache slightly before actual expiry.

- **What's the difference between write-through and write-behind caching?**
  Write-through updates the cache and the database synchronously on every write (cache always fresh, but adds write latency); write-behind writes to the cache immediately and asynchronously flushes to the database later (faster writes, but risks data loss if the cache fails before the flush completes).

- **Why is cache invalidation considered a genuinely hard problem?**
  Determining exactly when cached data becomes stale — and precisely which cache keys are affected by a given underlying change — gets complex quickly, especially when multiple cache entries can depend on overlapping pieces of underlying data (requiring approaches like tag-based invalidation to track those dependencies correctly).

- **How would you implement invalidation for a cached query result that depends on multiple underlying records (e.g., "all products in a category")?**
  Track cache keys under a "tag" (a Redis Set mapping a logical dependency, like a category, to all cache keys that depend on it); when any underlying record affecting that dependency changes, look up and delete all associated cache keys via that tag's set.
