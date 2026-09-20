# Optimization — Interview Questions & Answers

## Database Optimization

**Q1. How does a database index speed up queries, and what's the trade-off?**
An index (typically a B-Tree) lets the database jump directly to matching rows instead of scanning the whole table, turning an O(n) scan into roughly O(log n) lookup. The trade-off is write overhead — every `INSERT`/`UPDATE`/`DELETE` must also update the index — plus extra storage, so indexes should be added deliberately, not on every column.

**Q2. What is the "leftmost prefix rule" for composite indexes?**
A composite index on `(a, b, c)` can serve queries filtering on `a`, `(a, b)`, or `(a, b, c)`, but cannot efficiently serve a query filtering only on `b` or `c` alone — the database can only use the index starting from its leftmost column.

**Q3. What is the N+1 query problem and how do you fix it?**
It happens when fetching a list (1 query) and then making a separate query per item to get related data (N additional queries) — e.g., fetching posts, then querying each post's author individually. Fix with a single JOIN query, or with eager/batched loading (ORM `include`, DataLoader).

**Q4. Why is `OFFSET`-based pagination problematic on large tables, and what's the alternative?**
`OFFSET` forces the database to scan and discard all preceding rows before returning the requested page, getting slower as the offset grows. Keyset (cursor-based) pagination — filtering on `WHERE created_at < last_seen_value ORDER BY created_at LIMIT n` — uses the index directly and stays fast regardless of page depth.

**Q5. When would you use a read replica vs sharding?**
Read replicas scale read throughput by copying data across additional read-only nodes — good when reads vastly outnumber writes and one primary can still handle write volume. Sharding partitions data horizontally across multiple independent database instances — needed when a single node can't handle the total data volume or write throughput even with replicas, at the cost of significant added complexity (cross-shard queries, rebalancing).

## API Optimization

**Q6. How would you reduce over-fetching in a REST API without switching to GraphQL?**
Support sparse fieldsets via a query parameter (e.g., `?fields=id,name,email`) so clients can request only needed fields, provide purpose-built endpoints for common views (BFF pattern), and always paginate list endpoints.

**Q7. What problem does GraphQL's DataLoader solve?**
It batches and caches individual data-fetching calls that happen within the same tick (e.g., resolving an `author` field for many posts), coalescing what would be N separate database queries into a single batched query — solving GraphQL's version of the N+1 problem.

**Q8. Why should slow operations (e.g., report generation) not block the API request/response cycle?**
Holding an HTTP connection open for a long-running task wastes server resources (thread/connection pool exhaustion), risks client/gateway timeouts, and creates a poor UX. Better to return a `202 Accepted` immediately with a job ID, process asynchronously via a queue/worker, and let the client poll or receive a webhook/websocket notification on completion.

**Q9. How does rate limiting protect an API, and what's a common algorithm used?**
Rate limiting caps how many requests a client can make in a given window, protecting the backend from abuse, accidental traffic spikes, and ensuring fair resource usage across clients. A common algorithm is the **token bucket**: a bucket holds a capped number of tokens that refill at a fixed rate; each request consumes a token, and requests are rejected (429) when the bucket is empty.

**Q10. Why is `Promise.all` often used for API optimization, and when is it inappropriate?**
It runs independent asynchronous operations concurrently instead of sequentially, cutting total latency to roughly the slowest single operation instead of the sum of all of them. It's inappropriate when operations depend on each other's results (must run sequentially) or when running too many in parallel could overwhelm a downstream service/database — in that case, concurrency should be limited (e.g., with `p-limit`).

## Rendering Optimization

**Q11. Which CSS properties are cheapest to animate, and why?**
`transform` and `opacity` are cheapest because they only trigger the **Composite** stage of the rendering pipeline (handled by the GPU), skipping Layout and Paint entirely. Properties like `width`, `top`, or `margin` trigger a full Layout recalculation (reflow), which is far more expensive and can cascade to sibling/child elements.

**Q12. What is layout thrashing and how do you avoid it?**
It happens when JavaScript repeatedly interleaves DOM reads (e.g., `offsetHeight`) and writes (e.g., `style.height =`) in a loop, forcing the browser to synchronously recalculate layout on every read. Avoid it by batching all reads first, then performing all writes afterward, so layout is only recalculated once.

**Q13. Compare CSR, SSR, SSG, and ISR.**
CSR renders entirely client-side after downloading JS (slow first paint, good subsequent navigation). SSR renders full HTML per request on the server (fast first paint, needs hydration, server load per request). SSG pre-builds HTML at build time (fastest, served from CDN, but content is fixed until rebuild). ISR combines SSG's speed with periodic/on-demand background regeneration so content can stay reasonably fresh without a full rebuild.

**Q14. Why would you virtualize a long list in a UI framework?**
Rendering thousands of DOM nodes at once is expensive for both initial render and ongoing reflow/repaint costs, and consumes significant memory. Virtualization (e.g., `react-window`) only renders the DOM nodes currently visible in the viewport (plus a small buffer), keeping DOM node count and rendering cost roughly constant regardless of total list size.

**Q15. What does `React.memo` do, and when might it not help?**
It skips re-rendering a component if its props are shallowly equal to the previous render. It won't help (and can even hurt slightly) if the component is cheap to render anyway, or if new prop references (new objects/arrays/functions) are created on every parent render, since shallow equality will always fail unless those are also memoized with `useMemo`/`useCallback`.

## Network Optimization

**Q16. What's the difference between `preconnect` and `prefetch`?**
`preconnect` establishes the DNS lookup, TCP handshake, and TLS negotiation for an origin you'll need very soon (high priority, used for critical resources). `prefetch` fetches a resource likely needed for the _next_ navigation at low priority, so it doesn't compete with resources needed for the current page.

**Q17. How does HTTP/2 improve on HTTP/1.1?**
HTTP/2 multiplexes many requests over a single TCP connection, eliminating the need for multiple parallel connections per origin and reducing connection overhead, while HTTP/1.1 processes one request at a time per connection and typically requires 6 parallel connections to parallelize requests to one origin (still suffering head-of-line blocking).

**Q18. Why might HTTP/3 (QUIC) outperform HTTP/2 on lossy networks?**
HTTP/2 still runs over TCP, so a single lost packet blocks all multiplexed streams on that connection until it's retransmitted (TCP-level head-of-line blocking). HTTP/3 runs over QUIC (UDP-based), where each stream is independent, so a lost packet only affects its own stream — better performance on unreliable/mobile networks.

**Q19. What's the benefit of a CDN beyond just caching static files?**
Beyond serving cached content from edge locations closer to users (reducing latency), CDNs reduce origin server load, provide DDoS protection/absorb traffic spikes, improve availability via automatic failover between edge nodes, and increasingly offer edge compute for running logic close to the user.

**Q20. How would you decide what to lazy-load vs eagerly load on a page?**
Anything visible above-the-fold or critical to the initial user experience (hero image, critical CSS/JS) should load eagerly and be prioritized (`fetchpriority="high"`, preloaded). Anything below-the-fold or not immediately needed (footer images, off-screen widgets, non-critical scripts) should be lazy-loaded (`loading="lazy"`, dynamic `import()`) to reduce initial load cost.

## Memory Optimization

**Q21. Name three common causes of memory leaks in a JavaScript SPA.**
Uncleared `setInterval`/`setTimeout` timers, event listeners never removed (especially on `window`/`document`), and detached DOM nodes still referenced by JS variables after being removed from the tree. (Also: unbounded caches/global objects growing indefinitely, and subscriptions/observables never unsubscribed.)

**Q22. How would you detect a memory leak in a running web application?**
Use Chrome DevTools' Memory tab to take heap snapshots before and after repeating a suspected leaking action (e.g., opening/closing a modal several times), then compare snapshots for objects whose count keeps growing instead of returning to baseline. For Node.js, use `process.memoryUsage()` monitoring over time or generate heap snapshots via the `v8` module and inspect them in Chrome DevTools.

**Q23. What is a `WeakMap` and why is it useful for memory management?**
A `WeakMap` holds its keys weakly — meaning if an object used as a key has no other references, it can still be garbage collected even while it exists as a `WeakMap` key. This makes it ideal for attaching metadata to objects (like DOM nodes) without preventing them from being cleaned up when they're otherwise no longer needed.

**Q24. Why should large files be processed with streams instead of being fully loaded into memory?**
Loading an entire large file (e.g., a multi-GB CSV) into memory at once can exhaust available RAM and crash the process. Streaming processes the file in small chunks, keeping memory usage roughly constant regardless of file size, at the cost of slightly more complex code (handling chunk boundaries, backpressure).

**Q25. What is backpressure, and why does unlimited `Promise.all` concurrency risk memory issues?**
Backpressure is the practice of limiting how much work is in flight at once so a fast producer doesn't overwhelm a slower consumer (or available memory/resources). Running `Promise.all` over millions of items spawns effectively unlimited concurrent operations at once, which can exhaust memory (holding all those pending promises/results) and overwhelm downstream systems (DB connections, APIs) — better to cap concurrency (e.g., with `p-limit`) or process in batches.

## Cross-Cutting / Scenario-Based

**Q26. A product page loads slowly. Walk through how you'd diagnose whether the bottleneck is database, API, network, or rendering.**
Start by checking the Network tab / Lighthouse to see the timing breakdown: high TTFB points to backend/database (check slow query logs, `EXPLAIN ANALYZE`); large/many requests with fast TTFB but slow overall load points to network/payload issues (check compression, image sizes, request count); fast network but slow visual completion (high FCP/LCP relative to network timing) points to rendering (render-blocking resources, heavy JS execution, layout thrashing). Isolate each layer with its own tools (DB query plans, API APM traces, Chrome DevTools Performance panel) rather than guessing.

**Q27. Your Node.js API's memory usage grows steadily over days until it crashes. How do you investigate?**
This pattern strongly suggests a memory leak rather than a genuine load-driven need for more memory (which would plateau, not grow indefinitely). Monitor `process.memoryUsage()` over time to confirm the trend, then take heap snapshots at intervals under production-like load and diff them to find object types with ever-increasing counts (common culprits: unbounded caches, accumulating event listeners on long-lived objects, unclosed database/connection references, or a growing in-memory queue that isn't being drained).

**Q28. How would you optimize an endpoint that aggregates data from 5 different microservices?**
Fetch independent service calls in parallel with `Promise.all` rather than sequentially; add a caching layer (e.g., Redis) for the aggregated result if it doesn't need to be real-time; consider circuit breakers/timeouts per downstream call so one slow service doesn't block the whole response; and evaluate whether a dedicated aggregation/BFF (Backend-For-Frontend) layer or GraphQL federation could reduce round trips further.

**Q29. A dashboard renders a table with 50,000 rows and the browser tab becomes unresponsive. What would you do?**
Virtualize the table so only visible rows are rendered as DOM nodes (e.g., `react-window`), paginate or lazy-load data from the server instead of fetching all 50,000 rows at once, and move any heavy client-side computation (sorting/filtering across the full dataset) to a Web Worker or back to the server so the main thread stays responsive.

**Q30. How do database, API, and rendering optimizations interact — can optimizing one hurt another?**
Yes — for example, aggressively denormalizing a database schema for faster reads can bloat write complexity and storage; caching API responses too broadly can serve stale data to users who expect real-time freshness; and over-memoizing every React component can add CPU overhead from comparison checks that outweighs the render cost it was meant to save. Optimization should be guided by actual measured bottlenecks (profiling) rather than applied uniformly, since each layer's "fix" has its own trade-offs.
