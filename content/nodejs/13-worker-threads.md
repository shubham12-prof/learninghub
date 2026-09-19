# 🧵 Worker Threads

## 🎯 The Problem It Solves

CPU-intensive JS (image processing, big loops, complex parsing, hashing) **blocks Node's single thread**, freezing your whole app. `worker_threads` lets you run JS in **true parallel threads**, each with its own V8 instance and event loop, while optionally sharing memory efficiently.

---

## 🖼️ Architecture

```
┌─────────────────────┐        ┌─────────────────────┐
│    Main Thread        │        │   Worker Thread       │
│  (event loop, I/O,    │◀──────▶│  (own event loop,     │
│   your app logic)     │  msg   │   isolated V8 heap)    │
└─────────────────────┘  passing└─────────────────────┘
```

Unlike `cluster` (full OS processes), worker threads are **lighter-weight** and can share memory via `SharedArrayBuffer`.

---

## 💻 Basic Example

**main.js**

```js
const { Worker } = require("node:worker_threads");

function runWorker(workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./fib-worker.js", { workerData });

    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}

async function main() {
  console.log("🧮 Calculating fib(40) in a worker thread...");
  console.time("worker");
  const result = await runWorker(40);
  console.timeEnd("worker");
  console.log("✅ Result:", result);

  console.log("👍 Main thread stayed responsive the whole time!");
}
main();
```

**fib-worker.js**

```js
const { parentPort, workerData } = require("node:worker_threads");

function fib(n) {
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
}

const result = fib(workerData);
parentPort.postMessage(result); // 📤 send result back to main thread
```

---

## 🔄 Two-Way Communication

```js
// main.js
const { Worker } = require("node:worker_threads");
const worker = new Worker("./echo-worker.js");

worker.on("message", (msg) => console.log("📩 From worker:", msg));
worker.postMessage("Hello, worker!");

// echo-worker.js
const { parentPort } = require("node:worker_threads");
parentPort.on("message", (msg) => {
  parentPort.postMessage(`Echo: ${msg}`);
});
```

---

## 🚀 Shared Memory with `SharedArrayBuffer` (Zero-Copy)

```js
// main.js
const { Worker } = require("node:worker_threads");

const sharedBuffer = new SharedArrayBuffer(4); // 4 bytes = 1 Int32
const sharedArray = new Int32Array(sharedBuffer);

const worker = new Worker("./increment-worker.js", {
  workerData: sharedBuffer,
});

worker.on("exit", () => {
  console.log("🔢 Final value:", sharedArray[0]); // both threads mutated the SAME memory
});

// increment-worker.js
const { workerData } = require("node:worker_threads");
const arr = new Int32Array(workerData);
for (let i = 0; i < 1000; i++) {
  Atomics.add(arr, 0, 1); // ⚛️ thread-safe increment
}
```

⚠️ Always use `Atomics` operations when multiple threads read/write the **same** `SharedArrayBuffer` region to avoid race conditions.

---

## 🏊 Worker Pools (Reusing Threads)

Spawning a new thread per task has overhead. For repeated tasks, use a **pool** (or the popular `piscina` npm package):

```js
const { Worker } = require("node:worker_threads");
const os = require("node:os");

class WorkerPool {
  constructor(workerFile, size = os.cpus().length) {
    this.workerFile = workerFile;
    this.pool = Array.from({ length: size }, () => new Worker(workerFile));
    this.queue = [];
    this.freeWorkers = [...this.pool];
  }

  run(data) {
    return new Promise((resolve, reject) => {
      this.queue.push({ data, resolve, reject });
      this._next();
    });
  }

  _next() {
    if (!this.queue.length || !this.freeWorkers.length) return;
    const worker = this.freeWorkers.pop();
    const { data, resolve, reject } = this.queue.shift();

    worker.once("message", (result) => {
      this.freeWorkers.push(worker);
      resolve(result);
      this._next();
    });
    worker.once("error", reject);
    worker.postMessage(data);
  }
}
```

---

## 🆚 When to Use Worker Threads vs Alternatives

| Scenario                                               | Best Tool                                                      |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| CPU-heavy computation (hashing, image resize, parsing) | ✅ Worker Threads                                              |
| Scaling an HTTP server across cores                    | ✅ Cluster                                                     |
| Running external binaries/scripts                      | ✅ Child Process                                               |
| I/O-bound work (DB calls, API requests)                | ❌ Neither — just use async/await, I/O is already non-blocking |

---

## ⚠️ Common Pitfalls

- Using worker threads for **I/O-bound** tasks — no benefit, since I/O is already async/non-blocking in the main thread.
- Spawning a new `Worker` per request under high load — the creation overhead can hurt more than it helps; use a **pool**.
- Forgetting `worker.terminate()` for long-lived workers you no longer need → memory/resource leaks.
- Not handling the `'error'` and `'exit'` events → silent failures.

---

## 🧪 Try It Yourself

1. Compare execution time of `fib(40)` on the main thread (blocking) vs in a worker thread (non-blocking) while pinging an HTTP endpoint concurrently.
2. Build a worker pool that processes an array of image-resize "jobs" (simulate with `setTimeout` if no image lib available).
3. Experiment with `SharedArrayBuffer` + `Atomics` to safely increment a counter from two threads simultaneously.
