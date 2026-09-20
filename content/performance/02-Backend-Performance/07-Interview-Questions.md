# 07. Interview Questions — Backend Performance (Comprehensive)

A consolidated set of commonly asked backend performance interview questions, organized by topic, with concise answers and code where useful.

---

## Profiling

**Q: Why is profiling necessary rather than relying on intuition?**
Developer intuition about bottlenecks is frequently wrong; profiling replaces guessing with actual measurement of where time/memory is really spent.

**Q: What does a CPU flame graph show?**
Where CPU time was spent across the call stack; wider bars represent more time consumed, stacking shows call hierarchy.

**Q: Why is a long synchronous operation especially damaging in Node.js?**
Node is single-threaded for JS execution; a blocking operation halts the entire event loop, delaying every other request regardless of relevance.

**Q: How do you detect a memory leak via heap snapshots?**
Compare two snapshots taken before/after forced garbage collection under load; objects persisting across both despite GC running are leak candidates.

---

## Connection Pooling

**Q: Why is connection pooling necessary?**
Establishing a new connection has real overhead (TCP handshake, TLS, auth, session setup); pooling amortizes this cost by reusing already-open connections.

**Q: Why must transactions use a manually checked-out connection?**
All statements in a transaction must run on the same connection to maintain transaction context; automatic per-query pooling could route statements to different connections.

**Q: What's a common serious connection pool bug?**
Forgetting to release a manually checked-out connection (especially in error paths), permanently leaking it out of the pool and eventually exhausting it.

**Q: What problem does an external pooler like PgBouncer solve?**
Reduces the total connections reaching the database when many app instances each maintain their own pool, by multiplexing onto a smaller shared set of actual database connections.

---

## Compression

**Q: How does HTTP compression negotiation work?**
Client sends `Accept-Encoding`; server compresses using a supported algorithm and sets `Content-Encoding`; client auto-decompresses.

**Q: Brotli vs gzip trade-off?**
Brotli generally compresses better but costs more CPU, especially at max levels; often used for pre-compressed static assets where the cost is paid once.

**Q: Why not compress already-compressed content?**
Images/videos/zips have little remaining redundancy; re-compression wastes CPU for negligible or negative benefit.

**Q: Why does compression middleware apply a minimum size threshold?**
Below a certain size, compression overhead can exceed the actual savings, making it counterproductive.

---

## Streaming

**Q: What problem does streaming solve?**
Avoids holding an entire dataset/file in memory at once, keeping memory usage roughly constant regardless of total size, and lets clients receive data immediately.

**Q: What is backpressure?**
When a writable stream can't consume data as fast as a readable stream produces it; `.pipe()`/`pipeline()` handle this automatically, naive manual handling doesn't.

**Q: Why prefer `pipeline()` over manual `.pipe()` chaining?**
Correctly propagates errors across the whole chain and cleans up all streams if any part fails.

**Q: Why use a database cursor instead of fetching a full result array for a large export?**
Processes and streams records one at a time rather than loading the entire result set into memory upfront.

---

## Clustering

**Q: Why does a default Node.js app fail to use all CPU cores?**
JS executes on a single thread by default; clustering forks multiple worker processes (typically one per core) sharing the same port.

**Q: Why can't you share an in-memory variable across cluster workers?**
Each worker is a separate OS process with isolated memory — no automatic sharing between them.

**Q: How should shared state be handled in a clustered deployment?**
Externalized to a shared store (Redis, database) accessible to all workers, not held in any individual worker's process memory.

**Q: What does PM2's `reload` do differently from `restart`?**
Performs a rolling restart across workers one at a time, keeping the app available throughout — appropriate for zero-downtime deploys.

---

## Worker Threads

**Q: What problem do worker threads solve that async/await doesn't?**
Async/await only helps I/O-bound waiting; it does nothing for CPU-bound computation, which still blocks the event loop — worker threads offload that work to a separate thread.

**Q: Worker thread vs cluster worker?**
A worker thread runs on a separate thread within the same process (message passing, no shared memory by default); a cluster worker is an entirely separate process with fully independent memory.

**Q: Why use a worker thread pool instead of creating a new worker per task?**
Creating a worker has real startup overhead (new V8 instance/event loop); pooling reuses already-running workers to avoid repeated startup cost.

**Q: Why doesn't wrapping CPU-bound code in `async` prevent event loop blocking?**
Async/await only provides non-blocking behavior for genuinely asynchronous I/O; a synchronous CPU-bound loop inside an async function still occupies the thread for its full duration.

---

## Practical / Coding Questions Often Asked Live

**Q: Set up a PostgreSQL connection pool with a safely-released transaction.**

```js
const pool = new Pool({ max: 20, idleTimeoutMillis: 30000 });

async function transferFunds(fromId, toId, amount) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
      [amount, fromId],
    );
    await client.query(
      "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
      [amount, toId],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
```

**Q: Stream a large file download instead of loading it fully into memory.**

```js
app.get("/download", (req, res) => {
  fs.createReadStream("large-file.zip").pipe(res);
});
```

**Q: Offload a CPU-intensive task to a worker thread.**

```js
const { Worker } = require("worker_threads");

function runWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./worker.js", { workerData: data });
    worker.on("message", resolve);
    worker.on("error", reject);
  });
}
```

**Q: Set up clustering across all CPU cores with automatic worker replacement.**

```js
if (cluster.isPrimary) {
  os.cpus().forEach(() => cluster.fork());
  cluster.on("exit", () => cluster.fork());
} else {
  require("./server");
}
```

**Q: A Node.js API's response times degrade under load, and CPU usage on the server climbs to 100%. Walk through your diagnostic approach.**
Run a CPU profiler (Chrome DevTools or `clinic flame`) to generate a flame graph and identify which specific function(s) are consuming disproportionate CPU time; check for synchronous, CPU-bound operations that might be better offloaded to worker threads; verify the app is actually clustered/utilizing all available CPU cores rather than running as a single process; check the event loop delay metric to confirm whether the issue is genuine event-loop blocking; after identifying the specific bottleneck, apply a targeted fix (worker threads for CPU-bound logic, algorithmic optimization, or caching to avoid repeated expensive computation) and re-benchmark to confirm measurable improvement.

**Q: Design a backend architecture for a service that needs to process large CSV file uploads (potentially GBs in size) without running out of memory.**
Stream the incoming upload directly (via a Transform stream or a streaming CSV parser) rather than buffering the entire file in memory; process and validate/transform records incrementally as they're parsed, writing results to the database in batches (or streaming them to a message queue for async processing) rather than accumulating all parsed records in memory; if per-record processing is CPU-intensive, offload that work to a worker thread pool to avoid blocking the main event loop while still handling other concurrent requests; use backpressure-aware streaming (`pipeline()`) throughout to ensure the upload processing rate naturally adapts to downstream write speed rather than overwhelming memory.
