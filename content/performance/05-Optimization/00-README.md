# 30. Optimization

A complete learning guide on application optimization, with theory + diagrams + working code examples (SQL, Node.js, React, CSS, Nginx).

## Contents

1. [Database Optimization](./01-Database-Optimization.md) — indexing, query optimization, N+1, pagination, replicas/sharding
2. [API Optimization](./02-API-Optimization.md) — payload reduction, caching, rate limiting, async processing, GraphQL/DataLoader
3. [Rendering Optimization](./03-Rendering-Optimization.md) — browser rendering pipeline, reflow/repaint, CSR/SSR/SSG/ISR, React memoization, virtualization
4. [Network Optimization](./04-Network-Optimization.md) — DNS/TLS overhead, HTTP/2 & HTTP/3, compression, resource hints, CDN
5. [Memory Optimization](./05-Memory-Optimization.md) — JS memory leaks, detection tools, streaming, backpressure, GC basics
6. [Interview Questions](./06-Interview-Questions.md) — 30 Q&A covering all topics above, plus scenario-based questions

## Suggested Study Order

```
Database Optimization -> API Optimization -> Network Optimization -> Rendering Optimization -> Memory Optimization -> Interview Questions
```

Start from the backend (data layer) and work outward toward the network and the browser, finishing with memory management (which applies across both frontend and backend), then tie it together with interview prep.

## How This Connects to the Other Guides

- See `28-Caching/` for a deep dive on caching strategies referenced throughout API and Network optimization.
- See `29-Lighthouse/` for the metrics (LCP, CLS, INP, FCP, TTFB) that rendering and network optimizations directly improve.
