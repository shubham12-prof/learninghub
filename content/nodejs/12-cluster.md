# 🧩 Cluster

## 🎯 The Problem It Solves

Node.js runs on a **single thread**, so by default it only uses **one CPU core**, no matter how many your server has. `cluster` lets you spawn multiple **worker processes** (each with its own event loop) that share the same server port — utilizing all CPU cores for better throughput.

---

## 🖼️ Architecture

```
                    ┌─────────────────┐
                    │  Master Process  │  (manages workers, no request handling)
                    └────────┬────────┘
             ┌────────────────┼────────────────┐
             ▼                ▼                 ▼
      ┌─────────────┐  ┌─────────────┐   ┌─────────────┐
      │  Worker 1    │  │  Worker 2    │   │  Worker 3    │  (each = separate process,
      │ (own memory, │  │ (own memory, │   │ (own memory, │   own event loop, own V8)
      │  event loop) │  │  event loop) │   │  event loop) │
      └─────────────┘  └─────────────┘   └─────────────┘
             ▲                ▲                 ▲
             └────────────────┴─────────────────┘
                   Shared server port (OS load-balances)
```

---

## 💻 Full Example

```js
const cluster = require("node:cluster");
const http = require("node:http");
const os = require("node:os");

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`🧠 Primary process ${process.pid} is running`);
  console.log(`🧩 Forking ${numCPUs} workers...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`⚠️ Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork(); // 🔄 auto-restart crashed workers
  });
} else {
  // 👷 This code runs in EACH worker process
  http
    .createServer((req, res) => {
      res.writeHead(200);
      res.end(`Hello from worker ${process.pid}\n`);
    })
    .listen(3000);

  console.log(`👷 Worker ${process.pid} started`);
}
```

Run it, then hit `http://localhost:3000` repeatedly — you'll see different `pid`s responding (the OS load-balances incoming connections across workers, round-robin on most platforms).

---

## 💬 Communicating Between Master & Workers

```js
if (cluster.isPrimary) {
  const worker = cluster.fork();
  worker.send({ type: "greeting", text: "Hello worker!" });

  worker.on("message", (msg) => {
    console.log("📩 Master received:", msg);
  });
} else {
  process.on("message", (msg) => {
    console.log("📩 Worker received:", msg);
    process.send({ type: "ack", text: "Got it!" });
  });
}
```

---

## 🆚 Cluster vs Worker Threads vs Child Process

|          | Cluster                             | Worker Threads                          | Child Process                                    |
| -------- | ----------------------------------- | --------------------------------------- | ------------------------------------------------ |
| Use case | Scale a network server across cores | CPU-bound JS computation                | Run external programs/scripts                    |
| Memory   | Separate (each is a full process)   | Shared via `SharedArrayBuffer` possible | Separate                                         |
| Overhead | Higher (full process each)          | Lower (thread, not process)             | Higher                                           |
| Best for | HTTP/TCP servers                    | Image processing, hashing, parsing      | Running `ffmpeg`, shell scripts, other languages |

---

## ⚠️ Common Pitfalls

- **In-memory state isn't shared** between workers (each has its own memory) — don't store session data or caches in a plain JS object; use Redis or a shared DB instead.
- Forgetting to handle the `'exit'` event → crashed workers stay dead, reducing capacity silently.
- Assuming cluster helps CPU-bound work inside a _single_ request — it helps with **concurrent requests across cores**, not a single blocking computation (use Worker Threads for that).
- Not using a process manager (PM2, Kubernetes) in production — `cluster` is a building block, not a full production-ready orchestrator by itself.

---

## 🧪 Try It Yourself

1. Run the example above and use `curl -s http://localhost:3000` in a loop to observe different PIDs responding.
2. Kill a worker manually (`worker.process.kill()`) and confirm the master auto-restarts it.
3. Benchmark request throughput with and without clustering using a tool like `autocannon`.
