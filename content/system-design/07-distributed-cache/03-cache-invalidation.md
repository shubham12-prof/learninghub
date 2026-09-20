# Cache Invalidation

> "There are only two hard things in Computer Science: cache invalidation
> and naming things." — a famous line worth knowing the origin of (often
> attributed to Phil Karlton) if it comes up conversationally; the reason
> it's hard is the core content of this note.

## Why invalidation is fundamentally hard

A cache is, by definition, a **copy** of data that lives elsewhere (the
source of truth — usually a database). The moment the source of truth
changes, the cached copy becomes stale, and there's no single universally
correct answer for exactly when/how to detect and react to that — every
strategy is a tradeoff between staleness tolerance, complexity, and load on
the source of truth.

## Invalidation strategies

### 1. TTL (Time To Live) expiration

- Every cached entry is written with an expiration time; after it elapses,
  the entry is automatically evicted (or treated as a miss on next read).
- **Pros:** simple, self-cleaning, bounds staleness to a known maximum
  window.
- **Cons:** doesn't react to changes immediately — data can be stale for
  up to the full TTL duration, and choosing the right TTL is itself a
  tradeoff (short TTL → more freshness but more cache misses/DB load;
  long TTL → better hit rate but staler data).
- Good default for data where some staleness is acceptable and traffic
  doesn't need instant consistency.

### 2. Explicit invalidation on write (write-through / cache-aside with delete)

- When the source of truth is updated, explicitly delete (or update) the
  corresponding cache entry as part of that write path.
- **Pros:** much lower staleness window than TTL alone — ideally the cache
  reflects a write almost immediately.
- **Cons:** requires every write path to remember to invalidate the right
  cache key(s) — easy to miss a code path, and gets significantly harder
  when one underlying data change affects **multiple** cache entries
  (e.g., updating a user's name might need to invalidate a profile cache
  entry, a "friends list" cache entry for each friend, a search-index
  cache entry, etc.) — this fan-out is a major source of real-world bugs
  and complexity, and is a good concrete example to cite when explaining
  _why_ invalidation is hard, not just that it is.

### 3. Write-through cache

- Writes go to the cache _and_ the database synchronously, as a single
  logical operation, so the cache is never stale relative to a completed
  write.
- **Pros:** strong consistency between cache and source of truth for
  entries that go through this path.
- **Cons:** adds latency to every write (must succeed in both places), and
  doesn't help with data that was cached via reads rather than writes
  (cache-aside reads populate the cache independently) unless combined
  with that pattern too.

### 4. Event-driven / pub-sub invalidation

- The source of truth publishes a change event (e.g., via a message
  queue or a database change-data-capture stream) when data is modified;
  cache nodes/services subscribe and invalidate affected entries on
  receiving the event.
- **Pros:** decouples "who writes the data" from "who needs to invalidate
  the cache" — useful when multiple different services/cache layers need
  to react to the same underlying change, avoiding needing every writer to
  know about every cache that might be affected.
- **Cons:** adds infrastructure complexity (event pipeline) and there's an
  inherent, if usually small, propagation delay between the write and the
  invalidation event being processed.

### 5. Versioned/keyed cache entries (avoiding invalidation entirely)

- Instead of invalidating a stale key, **change the key itself** when the
  underlying data changes — e.g., include a version number or a content
  hash in the cache key (`user:1234:v7`), and simply stop referencing the
  old key. Old entries naturally age out via TTL/eviction without ever
  needing an explicit delete.
- **Pros:** sidesteps the "did I remember to invalidate everywhere"
  problem — the old entry simply becomes unreferenced rather than needing
  active cleanup.
- **Cons:** requires the versioning/hash to be threaded through everywhere
  the key is constructed/looked up, and can leave orphaned old-version
  entries in the cache until they naturally expire (a minor memory-
  efficiency cost, not a correctness one).

## Distributed cache-specific invalidation challenges

- In a **single-node** cache, invalidation is a local operation. In a
  **distributed/clustered** cache, and especially with **multiple layers
  of caching** (e.g., a local in-process cache on each app server, plus a
  shared distributed cache behind it), invalidating one copy doesn't
  invalidate the others — you need to either broadcast the invalidation to
  every node/layer that might hold a copy, or lean more heavily on TTL as
  a backstop (accepting bounded staleness) rather than assuming explicit
  invalidation will always reach every copy reliably.
- **Race conditions:** a common concrete bug — a "cache-aside" read that
  populates the cache can race with a concurrent write's invalidation: (1)
  read misses cache, (2) reads old value from DB, (3) a write updates the
  DB and invalidates the cache, (4) the original read's stale value gets
  written to the cache _after_ the invalidation, leaving a stale entry
  with no future write to fix it until TTL expiry. Mitigations include
  short TTLs as a backstop, or more careful ordering/locking around the
  read-populate path — a good example to have ready if asked for a
  concrete failure scenario.

## Interview-relevant talking points

- Be ready to explain _why_ this is hard with a concrete example (the
  multi-entry fan-out problem, or the read/write race condition above) —
  abstract statements like "invalidation is tricky" without a specific
  mechanism don't land as well as a precise example.
- Present TTL as a pragmatic backstop that's often combined with, not
  replacing, explicit invalidation — most real systems layer both rather
  than choosing purely one strategy.
- Bring up the multi-layer cache invalidation problem if the design has
  more than one cache tier (e.g., local + distributed) — a strong,
  specific point that shows awareness beyond a single-cache-layer mental
  model.
