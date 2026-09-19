# ❓ Node.js Interview Questions

A curated set of questions spanning fundamentals to advanced internals — with concise, accurate answers.

---

## 🟢 Fundamentals

**Q1. What is Node.js, and why is it single-threaded?**

> Node.js is a JavaScript runtime built on V8 that lets JS run outside the browser. Its **event loop / JS execution** is single-threaded by design to avoid the complexity of multi-threaded programming (locks, race conditions) — instead, non-blocking I/O and an event-driven model let one thread handle massive concurrency. Note: under the hood, **libuv uses a thread pool** for certain operations (file I/O, DNS, crypto), so Node isn't _purely_ single-threaded at the system level.

**Q2. What is the difference between Node.js and JavaScript in the browser?**

> Same language (JS), different runtime environments. Browsers give you the DOM, `window`, `fetch`; Node gives you `fs`, `http`, `process`, CommonJS/ESM modules, and no DOM. Both use an event loop, but the loop's phases and available APIs differ.

**Q3. What is npm?**

> Node Package Manager — the default tool (and public registry) for installing, publishing, and managing JavaScript packages/dependencies via `package.json`.

---

## 🟡 Event Loop & Async

**Q4. Explain the phases of the Node.js event loop.**

> `timers → pending callbacks → idle/prepare → poll → check → close callbacks`, with `process.nextTick()` and Promise microtasks drained between every phase transition. _(Full detail in_ [`02-event-loop`](../02-event-loop/README.md)_.)_

**Q5. What's the difference between `process.nextTick()` and `setImmediate()`?**

> `process.nextTick()` queues a callback to run **immediately after the current operation**, before the event loop continues — highest priority, even before Promises. `setImmediate()` queues a callback for the **check phase**, after I/O events in the current loop iteration. `nextTick` always runs first.

**Q6. What is the difference between `setTimeout(fn, 0)` and `setImmediate(fn)`?**

> Both aim to run "soon," but their relative order is only _guaranteed_ inside an I/O callback (`setImmediate` always wins there). At the top level, order is non-deterministic and depends on process performance timing.

**Q7. Why can `process.nextTick()` cause starvation?**

> If `nextTick` callbacks recursively schedule more `nextTick` callbacks, the queue is fully drained before the loop can proceed to I/O — potentially blocking timers, I/O, and everything else indefinitely.

**Q8. What is a microtask vs macrotask?**

> Microtasks (Promise `.then`, `process.nextTick`) are drained completely between each macrotask (timers, I/O callbacks, `setImmediate`) — giving microtasks higher priority and tighter scheduling guarantees.

---

## 🟠 Modules

**Q9. CommonJS vs ES Modules — key differences?**

> CJS uses `require()`/`module.exports`, loads synchronously, supports dynamic requires at runtime. ESM uses `import`/`export`, loads asynchronously, supports static analysis (tree-shaking) and top-level `await`, but no `__dirname`/`__filename` natively.

**Q10. Is `require()` synchronous or asynchronous?**

> Synchronous — file reading and module evaluation for `require()` block until complete. This is one reason CJS modules can't easily support top-level `await`.

**Q11. What happens on a circular `require()` dependency?**

> The second `require()` call for a module still being loaded returns a **partial** (possibly incomplete) `exports` object, since the module hasn't finished executing yet — leading to subtle bugs if not understood.

---

## 🔵 Streams, Buffers, I/O

**Q12. What are the four types of streams in Node.js?**

> Readable, Writable, Duplex (both), and Transform (duplex that modifies data as it flows through) — e.g. `fs.createReadStream`, `fs.createWriteStream`, TCP sockets, `zlib.createGzip()`.

**Q13. Why use streams instead of reading a whole file into memory?**

> Streams process data in chunks, keeping memory usage low and constant regardless of file size — essential for large files or continuous data (video, logs) where loading everything at once would exhaust memory.

**Q14. What is backpressure, and how does `.pipe()` handle it?**

> Backpressure occurs when a writable stream can't consume data as fast as a readable stream produces it. `.pipe()` automatically pauses the readable stream when the writable's internal buffer is full, and resumes it once drained — preventing unbounded memory growth.

**Q15. What is a Buffer, and how is it different from a regular JS array?**

> A `Buffer` is a fixed-length, low-level allocation of raw binary memory (outside the V8 heap) representing bytes — used for binary data like files or network packets. Unlike arrays, its `.length` is byte count, not element count, and it has encoding-aware methods (`toString('base64')`, etc.).

---

## 🟣 Concurrency & Scaling

**Q16. How does Node.js handle concurrency if it's single-threaded?**

> Via the event loop + non-blocking I/O: expensive I/O operations are delegated to the OS kernel (network) or libuv's thread pool (file I/O, some crypto/DNS), freeing the main thread to keep processing other requests while waiting for results.

**Q17. Cluster vs Worker Threads — when would you use each?**

> `cluster` forks multiple **full OS processes** sharing a server port — ideal for scaling an HTTP server across CPU cores, but processes don't share memory. `worker_threads` runs JS in **lighter-weight threads** within the same process, optionally sharing memory via `SharedArrayBuffer` — ideal for CPU-bound computation (hashing, image processing) without blocking the main thread.

**Q18. How would you handle a CPU-intensive task in an Express route without blocking the server?**

> Offload it to a `worker_threads` worker (or a worker pool), or move it to a separate microservice/queue (e.g., BullMQ + Redis) so the main event loop stays free to serve other requests.

---

## 🔴 Error Handling & Reliability

**Q19. What's the difference between operational and programmer errors?**

> Operational errors are expected, recoverable runtime conditions (invalid input, network timeout, 404) — handle gracefully. Programmer errors are bugs (undefined function calls, typos) — should surface loudly (crash in dev) rather than being silently caught.

**Q20. Should you keep the process running after an `uncaughtException`?**

> Generally no — the process may be in an undefined/corrupted state. Best practice: log the error, perform minimal cleanup, and exit, relying on a process manager (PM2, Kubernetes) to restart cleanly.

**Q21. Why is `process.exit()` sometimes risky?**

> It can terminate the process before pending asynchronous operations (writes, logs, network responses) finish, potentially causing data loss or truncated output. Prefer graceful shutdown patterns (closing servers/connections, then letting the process exit naturally).

---

## 🟤 Security

**Q22. Why is `exec()` more dangerous than `execFile()`?**

> `exec()` runs commands through a shell, meaning unsanitized user input can inject additional shell commands (shell injection). `execFile()` runs an executable directly with an argument array, bypassing shell interpretation entirely.

**Q23. What is prototype pollution, and how do you prevent it?**

> An attack where user-controlled input sets `__proto__`/`constructor.prototype` on objects, corrupting `Object.prototype` globally and potentially enabling privilege escalation or DoS. Prevent by guarding against dangerous keys during merges, using `Object.create(null)`, validating input, and using patched libraries.

**Q24. Why should passwords be hashed with bcrypt/argon2 instead of SHA-256/MD5?**

> SHA-256/MD5 are fast, general-purpose hashes — easily brute-forced with modern hardware (GPUs). bcrypt/argon2 are deliberately slow and salted, specifically designed to resist brute-force attacks on passwords.

---

## ⚫ Practical / Coding Round Style

**Q25. Write a function that reads a file and returns a Promise (without using `fs.promises`).**

```js
const fs = require("node:fs");

function readFilePromise(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf8", (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}
```

**Q26. Implement a simple debounce function.**

```js
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
```

**Q27. Implement an EventEmitter-based task queue with concurrency limit.**

```js
const EventEmitter = require("node:events");

class TaskQueue extends EventEmitter {
  constructor(concurrency = 2) {
    super();
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  add(task) {
    this.queue.push(task);
    this._next();
  }

  _next() {
    if (this.running >= this.concurrency || this.queue.length === 0) return;
    const task = this.queue.shift();
    this.running++;
    task().finally(() => {
      this.running--;
      this.emit("task:done");
      this._next();
    });
  }
}
```

**Q28. What does this code print, and why?**

```js
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
process.nextTick(() => console.log("D"));
console.log("E");

// Answer: A, E, D, C, B
// Sync code runs first (A, E), then nextTick queue (D),
// then Promise microtasks (C), then the timers phase (B).
```

---

## 🧪 Try It Yourself

1. Answer each question **out loud** in under 60 seconds — a common interview constraint.
2. Pick 3 questions and write a small demo script proving your answer with actual `console.log` output.
3. Practice explaining the event loop diagram from [`02-event-loop`](/nodejs/02-event-loop) on a whiteboard from memory.

**← Back to** [Main Index](/nodejs/00-INDEX)
