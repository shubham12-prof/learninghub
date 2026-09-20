# Caching

## Why caching matters here

The workload is heavily read-skewed (redirects vastly outnumber creations —
often assumed ~100:1 or higher), and redirection latency is user-visible and
critical. A cache in front of the database turns the hot path
(`short_code → long_url` lookup) into a fast in-memory operation for the
majority of requests, and takes enormous load off the database.

## What to cache

- **short_code → long_url mapping** — the primary hot-path lookup; this is
  the main thing worth caching.
- Optionally, existence/negative caching for invalid codes, to avoid
  hitting the database repeatedly for broken/expired links (with a shorter
  TTL, since "not found" can legitimately become "found" if links are
  created asynchronously, though this is rare).

## Cache technology

- An in-memory key-value store like **Redis** or **Memcached** sitting
  between the app servers and the database is the standard choice — matches
  the access pattern (single-key lookup) exactly.

## Cache-aside (lazy loading) pattern — the typical approach here

1. On a redirect request, check the cache for `short_code`.
2. **Cache hit:** return the cached `long_url` immediately, redirect.
3. **Cache miss:** look up the database, store the result in the cache
   (with a TTL), then redirect.
4. On write (new short URL created), you can optionally pre-populate the
   cache immediately (write-through) since a freshly created link is often
   about to be shared/clicked.

## Handling the "hot key" / celebrity link problem

A small number of short URLs (a viral link shared widely) can receive a
hugely disproportionate share of traffic.

- A cache-aside design already handles most of this well — once cached,
  that key serves from memory regardless of how many times it's hit.
- At extreme scale, a single cache node/shard can still become a bottleneck
  for one specific key; mitigations include:
  - **Local (in-process) caching** on app servers for the very hottest
    keys, in addition to the shared Redis layer, to avoid every request
    hitting the network at all.
  - **Cache replication** for hot keys across multiple cache nodes, so load
    for one key spreads across replicas rather than a single node.

## Cache invalidation

- **TTL-based expiry** — simplest approach; since a `short_code →
long_url` mapping essentially never changes once created (URLs are
  immutable in this design; you make a new short code rather than editing
  an existing one), staleness isn't usually a correctness problem — TTL is
  mainly about memory management, not consistency.
- **Explicit invalidation** — if links can be deactivated/deleted, actively
  remove or overwrite the cache entry at deletion time rather than waiting
  for TTL expiry, so a deleted link doesn't keep redirecting from a stale
  cache entry.
- **Eviction policy** — LRU (least recently used) is the standard default
  for this kind of access pattern, so infrequently accessed old links
  naturally fall out of cache while active ones stay warm.

## What NOT to over-engineer here

- Don't cache write-path logic (short-code generation) — it's low volume
  and typically needs to hit the database/ID-generator anyway for
  uniqueness guarantees.
- Analytics/click-count updates are usually handled asynchronously (e.g.,
  via a message queue and a separate counter service or batched writes)
  rather than synchronously incrementing a DB row on every cached redirect
  — incrementing a counter on every single redirect would itself become a
  write bottleneck and partially defeats the purpose of caching the read
  path.

## Interview-relevant talking points

- Explain cache-aside vs. write-through and why cache-aside is a natural
  fit for the read-heavy redirect path here.
- Bring up the hot-key problem proactively — it's a very common follow-up
  question ("what if one link goes viral?").
- Note that this data is close to immutable, which simplifies invalidation
  compared to caching typically-mutable data — a good "connecting the
  dots" observation to raise.
