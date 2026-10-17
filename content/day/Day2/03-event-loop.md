# 03 - The Event Loop

> **Time to learn:** ~40 min | **Level:** Core concept (the "why" behind all async) | **Interview frequency:** Extremely high

## 1. The big idea

JavaScript is **single-threaded**: it has **one call stack** and can run **one piece of code at a time**. Yet it can wait for timers, network requests and clicks without freezing. How?

The **runtime** (browser or Node.js) does the waiting **outside** the JavaScript engine, and when something is ready, it puts a callback in a **queue**. The **event loop** is the mechanism that moves callbacks from the queues onto the call stack **only when the stack is empty**.

## 2. The pieces

| Piece                                       | What it is                                                                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Call stack**                              | Where your functions run (see `Day 1/05-execution-context.md`). One at a time.                                                        |
| **Web APIs / Node APIs**                    | Provided by the runtime, _not_ JavaScript itself: `setTimeout`, `fetch`, DOM events, file I/O. They do the waiting in the background. |
| **Macrotask queue** (task / callback queue) | Callbacks from timers, I/O, UI events (`setTimeout`, `setInterval`, clicks, `MessageChannel`, Node's `setImmediate`).                 |
| **Microtask queue**                         | Promise callbacks (`.then/.catch/.finally`), `await` continuations, `queueMicrotask`, `MutationObserver`.                             |
| **Event loop**                              | The loop that decides what runs next.                                                                                                 |

```
        ┌────────────────────────┐
        │       CALL STACK       │  <- runs one thing at a time
        └───────────┬────────────┘
                    │ empty?
                    ▼
        ┌────────────────────────┐
        │     EVENT LOOP         │
        └───┬────────────────┬───┘
            │ 1st            │ 2nd
            ▼                ▼
   ┌─────────────────┐  ┌──────────────────┐
   │ MICROTASK QUEUE │  │ MACROTASK QUEUE  │
   │ .then, await,   │  │ setTimeout, I/O, │
   │ queueMicrotask  │  │ click events     │
   └─────────────────┘  └──────────────────┘
            ▲                  ▲
            └──── Web / Node APIs put callbacks here
                  (timers, fetch, DOM events)
```

## 3. The algorithm (memorise this!)

1. Run the current script / task until the **call stack is empty**. (The first task is your whole script.)
2. Run **ALL microtasks**, one after another, until the microtask queue is **completely empty**. (Microtasks queued _by_ microtasks also run now.)
3. _(Browser only)_ If it's time, **render** the page.
4. Take **ONE macrotask** from the macrotask queue, run it, and **go back to step 2**.

> **Golden rule:** after every macrotask, _all_ microtasks run before the next macrotask. That is why promises "beat" `setTimeout(fn, 0)`.

## 4. Analogy

A **single chef** (call stack) in a kitchen with two order boxes. The chef finishes the dish in front of them, then checks the **VIP box** (microtasks) and clears _every_ ticket in it, including new VIP tickets that appear while clearing. Only then does the chef take **one** ticket from the **regular box** (macrotasks), and then checks the VIP box again. The waiters (Web APIs) bring tickets to the boxes in the background.

## 5. Examples

### 5.1 The classic

```js
console.log("A");

setTimeout(() => console.log("B"), 0);

Promise.resolve().then(() => console.log("C"));

console.log("D");
```

Output: `A`, `D`, `C`, `B`

Walkthrough:

1. `A` logs (sync).
2. `setTimeout` hands the callback to the timer API -> it will be queued as a **macrotask**.
3. The promise `.then` callback is queued as a **microtask**.
4. `D` logs (sync). Stack is empty.
5. Microtasks run: `C`.
6. Next macrotask: `B`.

### 5.2 `setTimeout(fn, 0)` does NOT mean "now"

`0` means "as soon as possible _after_ the current code and all microtasks finish". Browsers also clamp nested timers to at least ~4 ms. A timer's delay is a **minimum**, never a guarantee.

### 5.3 Timers are ordered by their delay

```js
setTimeout(() => console.log("a"), 10);
setTimeout(() => console.log("b"), 0);
setTimeout(() => console.log("c"), 5);
// b, c, a
```

### 5.4 Blocking the loop

Long synchronous work stops _everything_, including timers and (in a browser) painting and clicks:

```js
setTimeout(() => console.log("timer"), 0);

const start = Date.now();
while (Date.now() - start < 50) {} // busy-wait for 50ms: nothing else can run

console.log("loop done");
// loop done
// timer
```

The timer was ready after ~0ms, but it had to wait until the stack was free. This is why you should **never** do heavy CPU work on the main thread (use Web Workers, or break the work into chunks).

### 5.5 Microtask starvation (conceptual, don't run it!)

```js
function loop() {
  Promise.resolve().then(loop); // each microtask queues another microtask
}
loop();
setTimeout(() => console.log("never"), 0); // never runs: the microtask queue is never empty
```

Because step 2 only finishes when the microtask queue is **empty**, an endless microtask chain freezes the page. Endless `setTimeout` recursion does **not** do this because the loop can handle other tasks in between.

## 6. Browser vs Node.js

- **Browser:** has the rendering step between tasks. Heavy microtasks delay painting.
- **Node.js:** extra queues. `process.nextTick` callbacks run **before** promise microtasks:
  ```js
  Promise.resolve().then(() => console.log("promise"));
  process.nextTick(() => console.log("tick"));
  console.log("sync");
  // sync, tick, promise
  ```
  `setImmediate` runs in the "check" phase after I/O callbacks. From the main module the order of `setTimeout(0)` vs `setImmediate` is **not guaranteed**; inside an I/O callback `setImmediate` always wins.

(For interviews, the browser model in section 3 is what they want unless they say "Node".)

## 7. Common mistakes

1. Thinking `setTimeout(fn, 0)` runs immediately.
2. Thinking JavaScript "runs in parallel". Only the **waiting** is parallel, the **running** is single-threaded.
3. Forgetting that **all** microtasks run before the next macrotask.
4. Putting heavy loops on the main thread and freezing the UI.
5. Assuming timer order across different delays is by call order (it's by delay, then call order).

## 8. Predict the output

**Q1**

```js
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");
```

**Q2**

```js
setTimeout(() => console.log("a"), 10);
setTimeout(() => console.log("b"), 0);
setTimeout(() => console.log("c"), 5);
```

**Q3**

```js
setTimeout(() => console.log("timer"), 0);
const start = Date.now();
while (Date.now() - start < 50) {}
console.log("loop done");
```

**Q4** (conceptual, don't run): what happens here?

```js
function loop() {
  Promise.resolve().then(loop);
}
loop();
setTimeout(() => console.log("never"), 0);
```

**Q5**

```js
console.log(1);
setTimeout(() => console.log(2), 0);
setTimeout(() => console.log(3), 0);
Promise.resolve().then(() => console.log(4));
console.log(5);
```

## 9. Answers

- **Q1:** `A D C B`
- **Q2:** `b c a`. Sorted by delay.
- **Q3:** `loop done`, then `timer`. The timer callback waits for the stack to clear.
- **Q4:** The page/process freezes and `"never"` is never printed, because the microtask queue never becomes empty, so the event loop never reaches the macrotask queue.
- **Q5:** `1 5 4 2 3`. Sync first (1, 5), then microtask (4), then the two timers in the order they were created.

## Recap

- One thread, one call stack. The runtime does the waiting; the event loop feeds callbacks back.
- Two queues: **microtasks** (promises, `await`, `queueMicrotask`) and **macrotasks** (timers, I/O, events).
- Order: **sync code -> ALL microtasks -> (render) -> ONE macrotask -> ALL microtasks -> ...**
- `setTimeout(fn, 0)` = "after the current code and all microtasks", not "now".
- Blocking the stack blocks everything.

## Checklist

- [ ] I can draw the stack + two queues + event loop from memory
- [ ] I can state the 4-step algorithm
- [ ] I can explain why a promise runs before `setTimeout(fn, 0)`
- [ ] I can explain how a long loop freezes a page
- [ ] I got Q1 to Q5 right without looking
