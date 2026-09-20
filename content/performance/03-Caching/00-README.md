# 28. Caching

A complete learning guide on caching, with theory + diagrams + working code examples (Node.js, Redis, Nginx, AWS, Cloudflare, Python).

## Contents

1. [Browser Cache](./01-Browser-Cache.md) — `Cache-Control`, `ETag`, `Expires`, Service Workers, cache-busting
2. [CDN Cache](./02-CDN-Cache.md) — Edge servers, `s-maxage`, `Vary`, purging, edge compute
3. [Redis Cache](./03-Redis-Cache.md) — Setup, data structures, cache-aside code, eviction policies, scaling
4. [Cache Invalidation](./04-Cache-Invalidation.md) — TTL, manual, event-driven, tag-based, race conditions, stale-while-revalidate
5. [Cache Strategies](./05-Cache-Strategies.md) — Cache-aside, read-through, write-through, write-back, write-around
6. [Interview Questions](./06-Interview-Questions.md) — 30 Q&A covering all topics above

## Suggested Study Order

```
Browser Cache -> CDN Cache -> Cache Strategies -> Redis Cache -> Cache Invalidation -> Interview Questions
```

Start with browser/CDN (client-facing, HTTP-header driven caching), then move to application-level caching strategies and Redis (server-side), then tie it together with invalidation (the hardest part), and finish with interview prep.
