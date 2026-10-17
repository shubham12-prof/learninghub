# 04 - Microtasks (and how `await` fits in)

> **Time to learn:** ~30 min | **Level:** Core concept (the detail interviewers use to separate good from great) | **Interview frequency:** Very high
> Read `03-event-loop.md` first.

## 1. What is a microtask?

A **microtask** is a small callback that runs **right after the current code finishes**, before the event loop moves on to the next macrotask (timer, click, I/O).

What creates microtasks:

| Source               | Example                                                   |
| -------------------- | --------------------------------------------------------- |
| Promise reactions    | `.then()`, `.catch()`, `.finally()` callbacks             |
| `await`              | the code **after** an `await` is a microtask continuation |
| `queueMicrotask(fn)` | explicit microtask                                        |
| `MutationObserver`   | DOM change observers (browser)                            |

What does **not** create microtasks: `setTimeout`, `setInterval`, DOM events, `fetch` completion callbacks themselves (the _promise_ `fetch` returns resolves via a macrotask-ish task, but your `.then` on it then runs as a microtask).

## 2. The rules

1. Microtasks are processed in **FIFO order** (first queued, first run).
2. The queue is drained **completely** before the next macrotask, _including microtasks added while draining_.
3. A promise callback is queued **only when the promise is settled** (or immediately if it is already settled when `.then` is called).
4. Each `.then` hop in a chain costs **one round** of the microtask queue (one "tick").

## 3. Analogy

Think of microtasks as **"do this right after I finish what I'm doing"** sticky notes. Before the chef takes any new regular order, they handle every sticky note on the counter, including new sticky notes written while handling the others.

## 4. Examples

### 4.1 Two chains interleave

```js
Promise.resolve()
  .then(() => console.log(1))
  .then(() => console.log(2));
Promise.resolve()
  .then(() => console.log("a"))
  .then(() => console.log("b"));
// 1, a, 2, b
```

Why? Tick 1 runs both first callbacks (1 and a). Each one then queues its next link, so tick 2 runs 2 and b.

### 4.2 `queueMicrotask` is FIFO with promise callbacks

```js
Promise.resolve().then(() => console.log("then1"));
queueMicrotask(() => console.log("qm"));
Promise.resolve().then(() => console.log("then2"));
// then1, qm, then2
```

### 4.3 Microtasks queued by microtasks run before any timer

```js
setTimeout(() => console.log("T"), 0);

(function loop(n) {
  if (n > 0) {
    Promise.resolve().then(() => {
      console.log("m" + n);
      loop(n - 1);
    });
  }
})(3);
// m3, m2, m1, T
```

### 4.4 `await` is "the rest of the function becomes a microtask"

```js
async function a() {
  console.log(1);
  await null;
  console.log(2); // runs as a microtask
}

a();
Promise.resolve().then(() => console.log(3));
console.log(4);
// 1, 4, 2, 3
```

Step by step:

1. `a()` runs synchronously: logs `1`, hits `await` and **pauses**, queueing the continuation (microtask #1).
2. `Promise.resolve().then(...)` queues microtask #2.
3. `4` logs (sync).
4. Microtask #1 runs: `2`. Microtask #2 runs: `3`.

### 4.5 A famous one (async/await mixed with timers)

```js
async function async1() {
  console.log("async1 start");
  await async2();
  console.log("async1 end");
}
async function async2() {
  console.log("async2");
}

console.log("script start");
setTimeout(() => console.log("setTimeout"), 0);
async1();
new Promise((resolve) => {
  console.log("promise1");
  resolve();
}).then(() => console.log("promise2"));
console.log("script end");
```

Output:

```
script start
async1 start
async2
promise1
script end
async1 end
promise2
setTimeout
```

Reading it: everything synchronous first (`script start`, `async1 start`, `async2`, `promise1`, `script end`). Then microtasks in the order they were queued: the `await` continuation (`async1 end`) was queued **before** `promise2`. Finally the macrotask: `setTimeout`.

> Modern engines (V8 since 2019, Node 12+, Chrome 73+) produce exactly this order. Very old articles show `promise2` before `async1 end`: that is outdated.

### 4.6 Returning a promise from an `async` function costs extra ticks (advanced)

```js
async function f1() {
  return Promise.resolve("x");
} // returns a promise
async function f2() {
  return "x";
} // returns a plain value

f1().then(() => console.log("f1"));
f2().then(() => console.log("f2"));
Promise.resolve()
  .then(() => console.log("p1"))
  .then(() => console.log("p2"))
  .then(() => console.log("p3"))
  .then(() => console.log("p4"));
// f2, p1, p2, f1, p3, p4
```

`f2` settles right away. `f1` returns a promise, and resolving a promise with another promise takes **2 extra ticks**, so it lands after `p2`. You don't need to memorise the numbers. The takeaway is: _returning a promise from an `async` function (or from a `.then`) is slower than returning a plain value._

### 4.7 Node.js only: `process.nextTick`

```js
Promise.resolve().then(() => console.log("promise"));
process.nextTick(() => console.log("tick"));
console.log("sync");
// sync, tick, promise
```

The `nextTick` queue is drained **before** the promise microtask queue. It does not exist in browsers.

## 5. Errors in microtasks

An error thrown inside a `.then` callback is **caught by the promise** and turns into a rejection (handled by `.catch`). An error thrown inside a `queueMicrotask` callback is **not** a promise rejection: it becomes an uncaught exception.

```js
Promise.resolve()
  .then(() => {
    throw new Error("A");
  })
  .catch((e) => console.log("caught", e.message));
// caught A

queueMicrotask(() => {
  throw new Error("B");
});
// Uncaught Error: B  (reported as an uncaught exception)
```

## 6. How to solve any "what's the output" question

1. Run all the **synchronous** code top to bottom, noting which callbacks get queued where.
2. Put promise `.then`/`await` continuations in the **microtask** list (in queue order) and timers in the **macrotask** list.
3. When the stack is empty, run **all** microtasks (add any new ones to the end of the list as they appear).
4. Take **one** macrotask, run it, then drain microtasks again. Repeat.

More practice in `10-interview-event-loop-output.md`.

## 7. Common mistakes

1. Thinking `await` blocks the program. It only pauses its own function; the continuation is a microtask.
2. Assuming code after an `await` runs synchronously.
3. Forgetting that microtasks **queued by microtasks** still run before timers.
4. Mixing up order in chains: `.then` callbacks of **different** chains interleave tick by tick.
5. Using very old blog posts for `async/await` ordering (it changed in 2019).

## 8. Predict the output

**Q1**

```js
Promise.resolve()
  .then(() => console.log(1))
  .then(() => console.log(2));
Promise.resolve()
  .then(() => console.log("a"))
  .then(() => console.log("b"));
```

**Q2**

```js
Promise.resolve().then(() => console.log("then1"));
queueMicrotask(() => console.log("qm"));
Promise.resolve().then(() => console.log("then2"));
```

**Q3**

```js
setTimeout(() => console.log("T"), 0);
(function loop(n) {
  if (n > 0) {
    Promise.resolve().then(() => {
      console.log("m" + n);
      loop(n - 1);
    });
  }
})(3);
```

**Q4**

```js
async function f() {
  console.log(1);
  await Promise.resolve();
  console.log(2);
}
f();
Promise.resolve().then(() => console.log(3));
console.log(4);
```

**Q5**

```js
new Promise((_, reject) => {
  throw new Error("boom");
})
  .catch((e) => console.log("caught", e.message))
  .finally(() => console.log("finally"));
console.log("end");
```

## 9. Answers

- **Q1:** `1 a 2 b`. Chains interleave tick by tick.
- **Q2:** `then1 qm then2`. Strict FIFO.
- **Q3:** `m3 m2 m1 T`. All chained microtasks finish before the timer.
- **Q4:** `1 4 2 3`. `f()` logs 1 and pauses; the `await` continuation was queued before the `.then(3)` callback; `4` is sync.
- **Q5:** `end`, `caught boom`, `finally`. A throw inside the executor rejects the promise; `.catch` and `.finally` run as microtasks after the sync `end`.

## Recap

- Microtasks = promise callbacks, `await` continuations, `queueMicrotask`.
- They run **after the current code and before the next macrotask**, FIFO, and the queue is drained **fully**.
- Each `.then` in a chain is one tick, so separate chains interleave.
- Code after `await` is a microtask; code before the first `await` is synchronous.
- Node's `process.nextTick` runs before promise microtasks.

## Checklist

- [ ] I can list 4 things that create microtasks
- [ ] I can explain why two promise chains interleave
- [ ] I can explain that code after `await` is a microtask
- [ ] I can trace the `async1 / async2` example without help
- [ ] I got Q1 to Q5 right without looking
