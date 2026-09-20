# 06. Worker Threads

## What Are Worker Threads?

Worker threads let you run genuinely CPU-intensive JavaScript code on a separate thread, **within the same process**, without blocking the main event loop. This is distinct from clustering (which spawns entirely separate processes) — worker threads share the same process but run on independent threads, each with their own V8 instance and event loop, communicating via message passing.

```
Main thread:  handles the event loop, I/O, request handling — must stay UNBLOCKED and responsive

Worker thread: runs a genuinely CPU-heavy task (image processing, complex calculations,
               data transformation) on a SEPARATE thread, so the main thread remains free
               to keep handling other requests/events while the heavy work proceeds in parallel
```

## Why Worker Threads Exist — The Problem They Solve

As covered in the Profiling notes, a long-running synchronous, CPU-bound operation blocks Node's single-threaded event loop entirely — no other request can be processed until it completes, regardless of how many concurrent connections are waiting.

```js
// BLOCKS the event loop — the ENTIRE server becomes unresponsive while this runs
app.get("/process", (req, res) => {
  const result = expensiveCpuBoundCalculation(req.body.data); // takes, say, 5 seconds
  res.json({ result });
});
// during those 5 seconds, EVERY other incoming request queues, unable to be handled at all
```

Worker threads solve this specific class of problem — genuinely CPU-bound work that can't be made non-blocking simply by using `async`/`await` (which only helps with I/O-bound waiting, not actual CPU computation).

## Basic Worker Thread Usage

```js
// main.js
const { Worker } = require("worker_threads");

function runWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./worker.js", { workerData: data });
    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}

app.get("/process", async (req, res) => {
  const result = await runWorker(req.body.data); // main thread stays FREE to handle other requests meanwhile
  res.json({ result });
});
```

```js
// worker.js
const { workerData, parentPort } = require("worker_threads");

function expensiveCpuBoundCalculation(data) {
  // genuinely CPU-intensive work — runs on this SEPARATE thread, not blocking the main thread
  let result = 0;
  for (let i = 0; i < 10_000_000_000; i++) {
    result += Math.sqrt(i);
  }
  return result;
}

const result = expensiveCpuBoundCalculation(workerData);
parentPort.postMessage(result);
```

## Communication Between Threads — Message Passing

Worker threads don't share memory by default (similar to cluster workers) — data is passed via message passing, which involves serializing/copying data between threads (unless using `SharedArrayBuffer`, covered below).

```js
// Sending data TO a worker
const worker = new Worker("./worker.js", {
  workerData: { numbers: [1, 2, 3, 4, 5] },
});

// Worker sending data BACK
worker.on("message", (result) => {
  console.log("Received from worker:", result);
});

// Bidirectional ongoing communication
worker.postMessage({ type: "update", value: 42 });
```

```js
// worker.js
const { parentPort, workerData } = require("worker_threads");

parentPort.on("message", (msg) => {
  console.log("Received from main thread:", msg);
});

parentPort.postMessage({
  status: "complete",
  result: workerData.numbers.reduce((a, b) => a + b),
});
```

## `SharedArrayBuffer` — True Shared Memory (Advanced)

For scenarios needing genuinely shared memory (rather than copying data via message passing on every exchange), `SharedArrayBuffer` allows multiple threads to read/write the same underlying memory directly.

```js
const sharedBuffer = new SharedArrayBuffer(4);
const sharedArray = new Int32Array(sharedBuffer);

const worker = new Worker("./worker.js", { workerData: { sharedBuffer } });
```

```js
// worker.js — operates on the SAME underlying memory as the main thread
const { workerData } = require("worker_threads");
const sharedArray = new Int32Array(workerData.sharedBuffer);
Atomics.add(sharedArray, 0, 1); // atomic operations needed to avoid race conditions on shared memory
```

This is a more advanced, lower-level tool — most applications never need it, since message passing is sufficient for the vast majority of worker thread use cases; reach for `SharedArrayBuffer` only when profiling has shown message-passing overhead itself to be a genuine bottleneck.

## A Worker Pool — Reusing Workers Instead of Creating New Ones Per Task

Creating a new worker thread has non-trivial startup overhead (spinning up a new V8 instance/event loop) — for applications handling many small CPU-bound tasks, maintaining a **pool** of reusable worker threads (similar in spirit to a database connection pool) is more efficient than creating a fresh worker for every single task.

```bash
npm install piscina
```

```js
const Piscina = require("piscina");

const piscina = new Piscina({
  filename: require.resolve("./worker.js"),
  maxThreads: 4,
});

app.get("/process", async (req, res) => {
  const result = await piscina.run(req.body.data); // reuses an existing pooled worker thread
  res.json({ result });
});
```

`piscina` (and similar libraries) implement exactly this pattern — a managed pool of worker threads, task queuing, and automatic load distribution — sparing you from hand-rolling worker lifecycle management for the common case of "run many discrete CPU-bound tasks efficiently."

## Worker Threads vs Clustering vs Async/Await — When to Use Each

|                    | Solves                                                                                            | Mechanism                           |
| ------------------ | ------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `async`/`await`    | I/O-bound waiting (DB queries, network calls, file I/O) — the event loop stays free WHILE waiting | Non-blocking I/O, single thread     |
| **Worker Threads** | Genuinely CPU-bound computation that would otherwise block the event loop                         | Multiple threads within ONE process |
| **Clustering**     | Utilizing multiple CPU cores for overall request-handling throughput                              | Multiple separate PROCESSES         |

```
Waiting for a database query to return:      async/await — NOT a worker thread (it's I/O-bound, not CPU-bound;
                                                a worker thread wouldn't help here at all)

Compressing a large image, parsing a huge      Worker thread — genuinely CPU-bound work that WOULD
CSV file, complex cryptographic hashing          otherwise block the event loop

Handling many concurrent HTTP requests           Clustering — utilizes multiple CPU cores for OVERALL
across all available CPU cores                    throughput across many separate, independent requests
```

A common, important point of confusion: `async`/`await` does **not** make CPU-bound code non-blocking — it only helps when the operation being awaited is genuinely I/O-bound (waiting on an external resource, during which the event loop is free to do other work). A CPU-bound synchronous loop wrapped in an `async` function still blocks the event loop just as much as if it weren't `async` at all.

```js
// This is STILL blocking, despite being "async" — async/await doesn't help with CPU-bound work
async function stillBlocks() {
  let result = 0;
  for (let i = 0; i < 10_000_000_000; i++) {
    result += i; // this loop still runs SYNCHRONOUSLY, blocking the event loop the whole time
  }
  return result;
}
```

## Common Interview-Style Questions

- **What problem do worker threads solve that `async`/`await` alone doesn't?**
  `async`/`await` only helps with I/O-bound operations, where the event loop remains free while genuinely waiting on an external resource (a database, the network, disk); it does nothing to prevent a CPU-bound synchronous computation from blocking the event loop, since that code actually occupies the thread the whole time it runs — worker threads offload such CPU-bound work to a separate thread so the main thread/event loop stays free to handle other requests.

- **How is a worker thread different from a cluster worker process?**
  A worker thread runs on a separate thread _within the same process_, sharing the process but not memory by default (communicating via message passing); a cluster worker is an entirely separate operating system process, with its own fully independent memory space — worker threads are for offloading CPU-bound tasks within one process, while clustering is for utilizing multiple CPU cores across separate processes for overall request-handling throughput.

- **Why might you use a worker thread pool (like via the `piscina` library) instead of creating a new worker for every task?**
  Creating a new worker thread has non-trivial startup overhead (spinning up a new V8 instance and event loop); for applications handling many discrete CPU-bound tasks, reusing a pool of already-running worker threads (similar in principle to a database connection pool) avoids repeatedly paying that startup cost for each individual task.

- **What is `SharedArrayBuffer`, and why is it considered an advanced/rarely-needed tool?**
  It allows multiple threads to directly read/write the same underlying memory, rather than copying data via message passing on every exchange; it's advanced because it requires careful use of atomic operations to avoid race conditions on shared memory, and most applications' worker thread use cases are adequately served by simpler message passing, so it should only be reached for when profiling has shown message-passing overhead to be a genuine, measured bottleneck.

- **Why does wrapping CPU-bound code in an `async` function not prevent it from blocking the event loop?**
  `async`/`await` only provides non-blocking behavior around genuinely asynchronous operations (I/O); a synchronous, CPU-bound computation inside an async function still executes entirely on the main thread, occupying it for the full duration of the computation regardless of the function being marked `async` — the event loop is blocked exactly as much as it would be without `async` at all.
