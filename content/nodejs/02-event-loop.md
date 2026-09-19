# 🔁 The Event Loop

## 🎯 What Is It?

The event loop is the mechanism that lets Node.js perform **non-blocking I/O** despite JavaScript being single-threaded. It continuously checks: _"Is there a callback ready to run?"_ and executes queued callbacks in a well-defined order, phase by phase.

---

## 🖼️ The Phases (Simplified libuv Loop)

```
   ┌───────────────────────────┐
┌─▶│           timers           │  setTimeout / setInterval callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────▼─────────────┐
│  │     pending callbacks      │  I/O callbacks deferred to next loop tick
│  └─────────────┬─────────────┘
│  ┌─────────────▼─────────────┐
│  │       idle, prepare        │  internal use only
│  └─────────────┬─────────────┘
│  ┌─────────────▼─────────────┐
│  │            poll            │  retrieve new I/O events; execute I/O callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────▼─────────────┐
│  │           check            │  setImmediate() callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────▼─────────────┐
│  │      close callbacks       │  e.g. socket.on('close', ...)
│  └─────────────┬─────────────┘
└────────────────┘
```

Between **every phase transition** (and after every callback), Node drains two special "microtask" queues **fully**:

1. `process.nextTick()` queue (highest priority)
2. Promise microtask queue (`.then`, `async/await`)

---

## 💻 Code: Execution Order Demo

```js
console.log("Script start");

setTimeout(() => console.log("setTimeout"), 0);

setImmediate(() => console.log("setImmediate"));

Promise.resolve().then(() => console.log("Promise"));

process.nextTick(() => console.log("nextTick"));

console.log("Script end");

/* Output:
Script start
Script end
nextTick        <- always before promises
Promise
setTimeout       <- order vs setImmediate depends on context (see below)
setImmediate
*/
```

### ⚠️ `setTimeout(fn, 0)` vs `setImmediate(fn)`

- Inside the **main module**: order is **not guaranteed** (depends on process performance).
- Inside an **I/O callback**: `setImmediate` **always** fires before `setTimeout`.

```js
const fs = require("fs");

fs.readFile(__filename, () => {
  setTimeout(() => console.log("⏱️ setTimeout"), 0);
  setImmediate(() => console.log("⚡ setImmediate"));
  // Output is ALWAYS:
  // ⚡ setImmediate
  // ⏱️ setTimeout
});
```

---

## 🧵 `process.nextTick` vs Promises

Both are **microtasks**, run **before** the event loop continues to the next phase — but `nextTick` queue is drained **first**, every single time.

```js
Promise.resolve().then(() => console.log("promise 1"));
process.nextTick(() => console.log("nextTick 1"));
Promise.resolve().then(() => console.log("promise 2"));
process.nextTick(() => console.log("nextTick 2"));

// Output:
// nextTick 1
// nextTick 2
// promise 1
// promise 2
```

⚠️ **Danger**: Recursive `process.nextTick()` calls can **starve the event loop** (I/O never gets a chance to run) — this is called "nextTick starvation". Avoid infinite recursive `nextTick` chains.

---

## 🌊 The "Poll" Phase — The Heart of I/O

The **poll phase** does two things:

1. Calculates how long it should block waiting for I/O.
2. Processes events in the poll queue (executing callbacks for completed I/O like file reads, socket data).

If the poll queue is empty:

- If `setImmediate()` callbacks are scheduled → loop moves to the **check** phase.
- Otherwise → loop waits for new I/O events (or moves to timers phase if timers are due).

---

## 🚫 Blocking the Event Loop (Anti-Pattern)

```js
// ❌ BAD: synchronous heavy computation blocks everything
function blockingFib(n) {
  if (n < 2) return n;
  return blockingFib(n - 1) + blockingFib(n - 2);
}

app.get("/fib/:n", (req, res) => {
  const result = blockingFib(Number(req.params.n)); // freezes server for ALL users
  res.send({ result });
});
```

```js
// ✅ GOOD: offload to a worker thread (see topic 13)
const { Worker } = require("worker_threads");

app.get("/fib/:n", (req, res) => {
  const worker = new Worker("./fib-worker.js", { workerData: req.params.n });
  worker.on("message", (result) => res.send({ result }));
});
```

---

## 🧪 Try It Yourself

1. Predict then run: nested `setTimeout` vs `setImmediate` vs `process.nextTick` at different call depths.
2. Write a script that starves the loop with recursive `process.nextTick()` and observe an HTTP server become unresponsive.
3. Use `perf_hooks` to measure event loop lag:

```js
const { monitorEventLoopDelay } = require("perf_hooks");
const h = monitorEventLoopDelay();
h.enable();
setInterval(() => console.log("Mean delay (ms):", h.mean / 1e6), 2000);
```
