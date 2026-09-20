# Caching — Interview Questions & Answers

## Conceptual / Fundamentals

**Q1. What is caching and why is it used?**
Caching is storing a copy of data in a fast-access layer (memory, edge server, browser) so future requests for the same data can be served quickly, without repeating expensive work (DB queries, computation, network trips). It reduces latency, backend load, and bandwidth/cost.

**Q2. What is a cache hit vs cache miss?**
A **hit** means the requested data was found in the cache and served from there. A **miss** means the data wasn't in the cache, so it had to be fetched from the original/slower source (and typically then stored in the cache for next time).

**Q3. What is cache hit ratio and why does it matter?**
`hit ratio = hits / (hits + misses)`. It's a key health metric — a high ratio means the cache is effective; a low ratio suggests poor TTL choices, cache key design issues, or genuinely low-repeat traffic patterns.

**Q4. What's the difference between `Cache-Control: no-cache` and `no-store`?**
`no-cache` means the response CAN be cached, but must be revalidated with the server (via ETag/Last-Modified) before being used. `no-store` means don't cache the response at all, anywhere — used for sensitive data.

**Q5. What is TTL?**
Time To Live — the duration a cached item is considered valid/fresh before it's treated as stale and either revalidated or evicted.

## Browser Cache

**Q6. How does a browser decide whether to use a cached resource or fetch a new one?**
It checks `Cache-Control`/`Expires` headers. If still within `max-age`, it uses the cached copy with zero network calls. If stale, it sends a conditional request (`If-None-Match`/`If-Modified-Since`) — server replies `304 Not Modified` (use cache) or `200 OK` with fresh content.

**Q7. What's the difference between ETag and Last-Modified?**
`Last-Modified` is a timestamp (second-level precision); `ETag` is a content fingerprint/hash. ETag is more precise (detects any content change, even within the same second) and works better for content that changes but keeps the same modification timestamp (e.g., regenerated files).

**Q8. How would you cache-bust a JS/CSS file after deployment?**
Use content-hashed filenames (e.g., `app.a1b2c3.js`) generated at build time, combined with `Cache-Control: public, max-age=31536000, immutable`. Since the filename changes when content changes, there's no need to invalidate — new deploys just reference new URLs.

**Q9. Why shouldn't you cache `index.html` for a long time?**
Because `index.html` is the entry point that references your hashed asset filenames. If it's cached long-term, users may get stale references to assets that no longer exist (after a new deploy), or miss new deploys entirely. It should typically use `no-cache` so the browser always revalidates it, while the assets it references are cached "forever."

## CDN Cache

**Q10. How does `s-maxage` differ from `max-age`?**
`max-age` applies to all caches (browser + shared). `s-maxage` applies ONLY to shared caches like CDNs, and takes priority over `max-age` for them — letting you set a different TTL for CDN edge vs browser.

**Q11. What is the `Vary` header and how can it hurt caching?**
`Vary` tells caches to store separate versions of a response based on a specific request header (e.g., `Accept-Encoding`, `Accept-Language`). Overusing it (e.g., `Vary: User-Agent` or `Vary: Cookie`) fragments the cache into too many variants, drastically reducing the hit ratio since each unique header value creates its own cache entry.

**Q12. How would you serve personalized content through a CDN without losing caching benefits?**
Common approaches: cache the static "shell" of the page at the CDN, and personalize small dynamic parts client-side (via JS + API calls) or with edge compute (Cloudflare Workers/Lambda@Edge) that stitches in personalized fragments after the cached response is served.

**Q13. What happens when you purge/invalidate a CDN cache?**
The specific cached object (or all objects matching a pattern/tag) is marked invalid/removed from edge nodes globally, so the next request for that URL is forwarded to the origin and re-cached. Purges aren't always instant and may have rate limits/costs, so they should be used sparingly compared to versioned URLs.

## Redis Cache

**Q14. Why is Redis fast?**
It's an in-memory data store (RAM access vs disk I/O), uses efficient data structures, is single-threaded for command execution (avoiding lock contention/context switching for most operations), and uses an event loop with non-blocking I/O.

**Q15. How do you handle Redis running out of memory?**
Configure `maxmemory` and an eviction policy (`maxmemory-policy`) such as `allkeys-lru` (evict least-recently-used) or `volatile-ttl` (evict item with shortest remaining TTL). Also consider scaling out with Redis Cluster (sharding) or reducing TTLs / payload sizes.

**Q16. What is a cache stampede and how do you prevent it?**
When a popular cache key expires, many concurrent requests can simultaneously miss and hit the database at once, overwhelming it. Prevent it via: a locking/mutex pattern (only one request repopulates the cache, others wait or get stale data), probabilistic early refresh, or stale-while-revalidate patterns.

**Q17. What's the difference between Redis Sentinel and Redis Cluster?**
Sentinel provides high availability — monitoring a primary/replica setup and performing automatic failover if the primary goes down, but data isn't sharded (all fits on one primary). Cluster provides horizontal scalability — data is sharded across multiple nodes, each responsible for a subset of the keyspace (via hash slots).

**Q18. When would you NOT use Redis for caching?**
When you need caching of huge blobs (large files/media — better suited to CDN/object storage), when strict durability with zero data loss is required without configuring persistence carefully, or when a much simpler in-process cache would suffice and network round-trips to Redis add unnecessary overhead for very high-frequency small lookups.

## Cache Invalidation

**Q19. Why is cache invalidation considered "hard"?**
Because the cache is a copy of the source of truth, and there's no single universally correct way to know exactly when to expire/update it across a distributed system. Race conditions, distributed cache instances, forgotten invalidation code paths, and trade-offs between freshness and performance make it error-prone.

**Q20. What's the correct order: update DB then invalidate cache, or invalidate cache then update DB? Why?**
Update the DB first, then invalidate/delete the cache. If you invalidate first, a concurrent read could repopulate the cache with the (soon to be) stale value between your invalidation and your DB update, leaving the cache stale until the next write or TTL expiry.

**Q21. How would you invalidate a large group of related cache keys efficiently?**
Use tag-based invalidation (maintain a set of keys per tag, delete the set's members on invalidation) or a version-bump strategy (increment a version number so old keys become orphaned and expire naturally via TTL) rather than scanning/deleting by pattern with a blocking `KEYS` command.

**Q22. What is stale-while-revalidate and why is it useful?**
It's a caching strategy where, once content is stale (but still within an allowed "usable" window), the cache serves the stale copy immediately for speed while asynchronously fetching a fresh copy in the background for future requests — balancing performance and freshness.

## Cache Strategies

**Q23. Explain cache-aside vs write-through.**
Cache-aside: application checks cache first; on a miss, reads from DB and populates the cache. Writes go directly to DB, and the cache entry is invalidated (not updated). Write-through: every write updates both the cache and DB synchronously, so the cache is always in sync but writes are slower.

**Q24. What is write-back (write-behind) caching and what's its main risk?**
Writes go to the cache first (fast acknowledgment to the client), and are asynchronously flushed to the database later, often batched. Main risk: if the cache crashes or the process dies before the DB write flush completes, that data can be permanently lost — mitigated with durable queues (e.g., Kafka) or persistent write logs.

**Q25. When would you use write-around instead of write-through?**
When data is written frequently but rarely read shortly after being written (e.g., bulk imports, logging data, audit trails) — write-through would waste cache space caching things that are unlikely to be read soon, so writing directly to the DB and letting cache-aside populate the cache lazily on actual reads is more efficient.

**Q26. How would you design a caching layer for a high-traffic read-heavy API (e.g., product catalog)?**
Combine multiple layers: CDN caching for public, non-personalized GET responses (`s-maxage`); Redis as a shared cache-aside layer for computed/DB-backed data; optionally an in-process LRU cache per app instance for ultra-hot keys; use TTL + explicit invalidation on writes; monitor hit ratio and adjust TTLs based on data volatility.

**Q27. How do you prevent serving stale data to a user immediately after they update their own record?**
Options: use write-through so the cache reflects the change immediately; explicitly invalidate + refetch on write; or, for the specific user's own session, bypass cache and read from DB directly right after their own write (read-your-writes consistency), while other users may still see cached (slightly stale) data.

## Scenario / System Design Style

**Q28. Your Redis cache goes down. What happens to your application, and how do you make it resilient?**
Without a fallback, every request effectively becomes a cache miss and hits the database directly, causing a sudden traffic/load spike ("cold cache" or "cache avalanche") that can overwhelm the DB. Mitigations: circuit breakers/rate limiting to protect the DB, connection pooling/timeouts to the cache so failures fail fast, graceful degradation (serve from DB directly, maybe with a local in-memory fallback cache), and using Redis Sentinel/Cluster for high availability so a single node failure doesn't take down the whole cache.

**Q29. How would you cache a paginated API response (e.g., `/products?page=2&limit=20`)?**
Include all relevant query parameters in the cache key (e.g., `products:page=2:limit=20:sort=price`), since different parameter combinations return different data. Use a moderate TTL, and invalidate/bump a version when the underlying product list changes (new item added, deleted, etc.), since exact key-based invalidation is impractical for many parameter combinations — a version bump strategy works well here.

**Q30. What metrics would you monitor for a production caching layer?**
Hit/miss ratio, memory usage vs `maxmemory` limit, eviction rate (keys evicted due to memory pressure — a high rate signals undersized cache), latency (p50/p95/p99) for cache operations, error/timeout rate connecting to cache, and TTL expiration patterns (to catch thundering-herd risk from many keys expiring simultaneously).
