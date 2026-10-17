# 10 - Interview: Event-Loop Output Questions

> **Time to learn:** ~45 min | **Interview frequency:** Almost guaranteed ("What is the output?")
> Read `03-event-loop.md` and `04-microtasks.md` first. Cover the answers and write your prediction **before** you check.

## 1. The method (use it on every puzzle)

1. **Run all synchronous code** top to bottom. While doing so, note what each async call _queues_:
   - `setTimeout` / `setInterval` / events -> **macrotask list** (ordered by delay, then by call order)
   - `.then` / `.catch` / `.finally` / `queueMicrotask` / code after `await` -> **microtask list** (FIFO)
2. When the stack is empty, **drain the whole microtask list**. New microtasks created while draining go to the **end** of the list and also run in this step.
3. Take **one** macrotask, run it (then drain microtasks again). Repeat until both lists are empty.

**Quick rules to remember**

- The Promise **executor** runs synchronously. Only `.then` callbacks are async.
- Code **before** the first `await` is synchronous; code **after** is a microtask.
- All microtasks run **before** the next timer, even `setTimeout(fn, 0)`.
- Different promise chains **interleave**, one `.then` per tick.

## 2. Puzzles

### P1: The warm-up

```js
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");
```

### P2: Timer inside a promise

```js
setTimeout(() => console.log("timeout 1"), 0);

Promise.resolve()
  .then(() => {
    console.log("promise 1");
    setTimeout(() => console.log("timeout 2"), 0);
  })
  .then(() => console.log("promise 2"));

console.log("sync");
```

### P3: The famous async/await one

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

### P4: Microtasks spawning microtasks

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

### P5: `queueMicrotask` order

```js
Promise.resolve().then(() => console.log("then1"));
queueMicrotask(() => console.log("qm"));
Promise.resolve().then(() => console.log("then2"));
```

### P6: Timer delays

```js
setTimeout(() => console.log("a"), 10);
setTimeout(() => console.log("b"), 0);
setTimeout(() => console.log("c"), 5);
```

### P7: `await` vs a plain `.then`

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

### P8: Errors and `finally`

```js
new Promise((_, reject) => {
  throw new Error("boom");
})
  .catch((e) => console.log("caught", e.message))
  .finally(() => console.log("finally"));

console.log("end");
```

### P9: `var` in a loop with a timer and a promise

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log("t" + i), 0);
  Promise.resolve().then(() => console.log("p" + i));
}
```

### P10: Chain vs chain

```js
Promise.resolve()
  .then(() => console.log("A1"))
  .then(() => console.log("A2"))
  .then(() => console.log("A3"));

Promise.resolve()
  .then(() => console.log("B1"))
  .then(() => console.log("B2"));
```

### P11 (hard): Nested `async` functions

```js
async function a() {
  console.log("a1");
  await b();
  console.log("a2");
}
async function b() {
  console.log("b1");
  await c();
  console.log("b2");
}
async function c() {
  console.log("c1");
}

a();
Promise.resolve()
  .then(() => console.log("p1"))
  .then(() => console.log("p2"))
  .then(() => console.log("p3"));
console.log("sync");
```

### P12 (Node.js only): `nextTick`

```js
Promise.resolve().then(() => console.log("promise"));
process.nextTick(() => console.log("tick"));
setTimeout(() => console.log("timeout"), 0);
console.log("sync");
```

## 3. Answers (with the reasoning)

**P1:** `1 4 3 2`
Sync: 1, 4. Microtask: 3. Macrotask: 2.

**P2:** `sync`, `promise 1`, `promise 2`, `timeout 1`, `timeout 2`
Sync prints `sync`. Microtask `promise 1` queues `timeout 2` (a macrotask) and then `promise 2` runs as the next microtask. Macrotasks then run in order: `timeout 1` was queued first, `timeout 2` second.

**P3:**

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

Sync: `script start`; `setTimeout` queued; `async1()` runs: `async1 start`, calls `async2()` -> `async2`, then `await` pauses `async1` (continuation queued as microtask #1); the `new Promise` executor logs `promise1` and queues `promise2` (microtask #2); `script end`. Microtasks in order: `async1 end`, then `promise2`. Then the macrotask: `setTimeout`.

**P4:** `m3 m2 m1 T`
Each microtask queues the next one, and the microtask queue must be empty before the timer.

**P5:** `then1 qm then2`
Microtasks are strictly FIFO in the order they were queued.

**P6:** `b c a`
Timers run by delay: 0, 5, 10.

**P7:** `1 4 2 3`
`1` (sync), `.then(3)` queued after the `await` continuation, `4` (sync). Then `2` (queued first), then `3`.

**P8:** `end`, `caught boom`, `finally`
The executor throw rejects the promise; `.catch` and `.finally` are microtasks that run after `end`.

**P9:** `p3 p3 p3 t3 t3 t3`
The loop finishes synchronously, leaving `i = 3` (one shared `var`). Then all microtasks (`p3` x3), then all timers (`t3` x3). With `let` it would be `p0 p1 p2 t0 t1 t2`.

**P10:** `A1 B1 A2 B2 A3`
The chains interleave one step per tick: tick 1 -> A1, B1; tick 2 -> A2, B2; tick 3 -> A3.

**P11:** `a1 b1 c1 sync b2 p1 a2 p2 p3`
Sync: `a1`, `b1`, `c1`, then `sync`. Microtask queue order of events:

1. `await c()` in `b` -> continuation (prints `b2`) queued first.
2. `Promise.resolve().then(p1)` queued second.
3. Tick: `b2` runs and `b` finishes, which resolves the promise that `a` is awaiting -> `a`'s continuation (`a2`) is queued **behind** `p1`.
4. `p1` runs and queues `p2`.
5. `a2` runs. Then `p2`, then `p3`.

**P12 (Node):** `sync`, `tick`, `promise`, `timeout`
`nextTick` queue first, then promise microtasks, then timers.

## 4. Extra practice: write the output, then run it

**E1**

```js
console.log("A");
setTimeout(() => console.log("B"), 0);
setTimeout(() => console.log("C"), 0);
Promise.resolve()
  .then(() => console.log("D"))
  .then(() => console.log("E"));
console.log("F");
```

**E2**

```js
const p = new Promise((resolve) => {
  console.log(1);
  resolve();
  console.log(2);
});
console.log(3);
p.then(() => console.log(4));
console.log(5);
```

**E3**

```js
async function run() {
  console.log("start");
  await null;
  console.log("middle");
  await null;
  console.log("end");
}
run();
Promise.resolve()
  .then(() => console.log("x"))
  .then(() => console.log("y"));
console.log("sync");
```

**E1 answer:** `A F D E B C`
**E2 answer:** `1 2 3 5 4`
**E3 answer:** `start sync middle x end y`
(tick 1: `middle` (queued first by `await`) then `x`; tick 2: `end` then `y`.)

## 5. Tips for the interview

- **Write the two lists** (microtasks / macrotasks) on the whiteboard and fill them in as you trace. It shows structured thinking, even if you slip on one line.
- **Say the rule out loud** each time: "sync first, then all microtasks, then one timer".
- Watch for the **traps**: executor runs synchronously, `var` in loops, code after `await`, `setTimeout` inside a `.then`.
- If an old blog disagrees with you about `await` ordering, remember it changed in **2019** (modern engines: `await` of a native promise costs one tick).

## Recap

- Sync code -> **all** microtasks -> **one** macrotask -> **all** microtasks -> ...
- Executor = sync. `.then`/`catch`/`finally`/`await` continuation = microtask. `setTimeout` = macrotask.
- Separate promise chains interleave tick by tick.
- Microtasks spawned by microtasks still run before any timer.
- Node: `process.nextTick` runs before promise microtasks.

## Checklist

- [ ] I can state the 3-step method from memory
- [ ] I predicted P1 to P10 correctly before reading the answers
- [ ] I can trace P3 and P11 step by step
- [ ] I got E1 to E3 right
