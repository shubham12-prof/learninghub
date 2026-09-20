# 01. Profiling

## Why Profiling Matters

Profiling measures where your application actually spends time and memory — CPU-intensive functions, slow I/O calls, memory leaks, garbage collection pauses. Without profiling, performance optimization is guesswork; developers often intuit the wrong bottleneck entirely, optimizing code that was never actually slow while missing the real culprit.

```
"I think the database query is slow"  -> might be WRONG — could actually be JSON serialization,
                                          a synchronous CPU-bound loop, or network latency instead

Profiling: replaces GUESSING with MEASURING
```

## CPU Profiling — Finding Where Time Is Actually Spent

### Node.js Built-in Profiler

```bash
node --prof server.js
# after the app runs and generates load...
node --prof-process isolate-0x*.log > profile.txt
```

```bash
node --cpu-prof server.js   # generates a .cpuprofile file, viewable in Chrome DevTools
```

### Chrome DevTools for Node.js

```bash
node --inspect server.js
```

Then open `chrome://inspect` in Chrome, connect to the Node process, and use the **Profiler** tab to record and analyze a CPU profile — showing a flame graph of exactly which functions consumed the most time.

```
Flame graph reading:
  Wider bars = more time spent in that function
  Stacked bars = call hierarchy (what called what)
  -> the widest bars at any level are your primary optimization targets
```

### `clinic.js` — A Purpose-Built Node.js Profiling Suite

```bash
npm install -g clinic
clinic doctor -- node server.js       # diagnoses general performance issues (CPU, event loop, memory)
clinic flame -- node server.js          # generates a flame graph specifically
clinic bubbleprof -- node server.js       # visualizes async operation flow and delays
```

`clinic doctor` is particularly useful as a first diagnostic step — it identifies the _category_ of problem (CPU-bound, I/O-bound, memory issue, event loop blocking) before you dive into more detailed tooling.

## Memory Profiling — Finding Leaks and Excessive Allocation

```bash
node --inspect server.js
```

In Chrome DevTools' **Memory** tab:

```
Heap snapshot:      captures the current state of all objects in memory — useful for comparing
                     TWO snapshots over time to identify objects that shouldn't still exist
Allocation timeline:  records memory allocations over a period, showing WHERE allocations happened
```

### A Common Memory Leak Pattern

```js
// LEAK — this array grows forever, never cleared, holding references that prevent garbage collection
const requestLog = [];

app.use((req, res, next) => {
  requestLog.push({ url: req.url, timestamp: Date.now() }); // NEVER removed
  next();
});
```

```js
// FIXED — bounded, or using a proper time-windowed store (e.g., with TTL, like Redis)
const requestLog = [];
const MAX_LOG_SIZE = 1000;

app.use((req, res, next) => {
  requestLog.push({ url: req.url, timestamp: Date.now() });
  if (requestLog.length > MAX_LOG_SIZE) requestLog.shift();
  next();
});
```

### Detecting a Leak Over Time

```bash
node --inspect --expose-gc server.js
```

```
1. Take a heap snapshot
2. Generate load / let the app run for a while
3. Force garbage collection (via the exposed gc() function, or DevTools' "collect garbage" button)
4. Take a SECOND heap snapshot
5. Compare — objects that SHOULD have been collected but persist across both snapshots
   are strong leak candidates
```

## Profiling the Event Loop — Detecting Blocking Code

Node.js is single-threaded for JavaScript execution — a long-running synchronous operation blocks the entire event loop, delaying every other request being handled by that process.

```js
// BLOCKS the event loop — nothing else can be processed while this runs
function slowSyncOperation(data) {
  let result = 0;
  for (let i = 0; i < 10_000_000_000; i++) {
    result += i;
  }
  return result;
}
```

```js
const { monitorEventLoopDelay } = require("perf_hooks");

const histogram = monitorEventLoopDelay({ resolution: 20 });
histogram.enable();

setInterval(() => {
  console.log(
    `Event loop delay: mean=${histogram.mean / 1e6}ms, max=${histogram.max / 1e6}ms`,
  );
  histogram.reset();
}, 5000);
```

Elevated event loop delay is one of the most common, high-impact Node.js performance problems — every incoming request effectively queues behind whatever synchronous work is currently blocking the loop.

## Application Performance Monitoring (APM) — Production-Grade, Continuous Profiling

Local profiling sessions are great for investigating a specific known issue, but production systems need continuous, always-on visibility — APM tools provide this.

```
Popular APM tools: New Relic, Datadog APM, Dynatrace, Elastic APM, self-hosted OpenTelemetry + a backend
```

```js
// Conceptual APM integration — automatically instruments requests, DB calls, external API calls
require("newrelic"); // often just requiring/initializing the agent at the top of your entry file
```

APM tools automatically trace individual requests end-to-end (including downstream calls to databases, external APIs, and other microservices), surfacing slow endpoints, N+1 query patterns, and error rates without requiring manual instrumentation of every code path.

## Profiling Database Query Performance

```js
// A common, high-value practice — log/track query execution time
const start = Date.now();
const result = await db.query("SELECT * FROM orders WHERE user_id = ?", [
  userId,
]);
const duration = Date.now() - start;

if (duration > 100) {
  logger.warn(`Slow query (${duration}ms): SELECT * FROM orders...`);
}
```

Combined with the database's own `EXPLAIN ANALYZE` (covered in the PostgreSQL module's Performance Tuning notes), application-level query timing helps pinpoint exactly which endpoints are actually affected by slow queries in real production traffic, not just in isolated testing.

## Benchmarking — Comparing Before/After

```bash
npx autocannon -c 100 -d 30 http://localhost:3000/api/orders   # 100 concurrent connections, 30 seconds
```

```
Requests/sec:      1,240
Latency (avg):       78ms
Latency (p99):        340ms
```

Always benchmark **before and after** a proposed optimization to verify it actually helped — intuition about what should be faster is frequently wrong, and a "fix" can sometimes make things measurably worse.

## A Practical Profiling Workflow

```
1. Identify the SYMPTOM (slow endpoint, high memory usage, high CPU) via monitoring/user reports
2. Reproduce the issue under controlled conditions (load testing, or capturing a production profile)
3. Profile (CPU flame graph, memory snapshot, event loop delay — whichever fits the symptom)
4. Identify the ACTUAL bottleneck from the profiling data — not from assumption
5. Make a targeted fix
6. Benchmark AGAIN to confirm the fix actually improved the measured metric
7. Deploy, then continue monitoring in production to confirm the improvement holds under real traffic
```

## Common Interview-Style Questions

- **Why is profiling necessary rather than relying on intuition about where an application is slow?**
  Developer intuition about bottlenecks is frequently wrong — the actual slow part of a system (a specific query, a synchronous CPU-bound loop, JSON serialization) is often not what seems intuitively suspicious; profiling replaces guessing with actual measurement, ensuring optimization effort targets the real problem.

- **What does a CPU flame graph show, and how do you read it?**
  A visualization of where CPU time was spent across the call stack during a profiling session; wider bars represent functions that consumed more time, and the stacking shows the call hierarchy (what called what) — the widest bars at any level are the primary candidates for optimization.

- **Why can a long-running synchronous operation be especially damaging in a Node.js application?**
  Node.js is single-threaded for JavaScript execution, so a blocking synchronous operation halts the entire event loop, preventing any other request from being processed until it completes — even requests entirely unrelated to the blocking operation are delayed.

- **How would you detect a memory leak using heap snapshots?**
  Take a heap snapshot, let the application run under load for a period, force garbage collection, then take a second snapshot — objects that persist across both snapshots despite garbage collection running (and that shouldn't logically still be needed) are strong candidates for a memory leak.

- **Why is it important to benchmark both before and after making a performance optimization?**
  Intuition about what should improve performance is often wrong, and some "optimizations" can actually make things measurably worse; benchmarking before and after provides concrete evidence that a change actually achieved its intended effect, rather than relying on assumption.
