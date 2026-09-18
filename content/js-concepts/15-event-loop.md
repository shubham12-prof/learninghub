# The Event Loop

## Explanation
JavaScript is single-threaded — it can only do one thing at a time. But it can *feel* like it does multiple things at once (timers, network requests, UI events) because of the **event loop**, which manages how async tasks get scheduled.

Key pieces:
- **Call stack** — where currently executing code lives. Runs top to bottom, one thing at a time.
- **Web APIs / Node APIs** — where async work (like `setTimeout`, `fetch`) actually happens, outside the main thread.
- **Callback queue (macrotask queue)** — where completed `setTimeout`, event handler, etc. callbacks wait their turn.
- **Microtask queue** — where completed Promise callbacks (`.then`, `async/await` continuations) wait — this queue has *higher priority* than the macrotask queue.
- **Event loop** — constantly checks: "Is the call stack empty? If so, run everything in the microtask queue first, then take one task from the macrotask queue."

## Examples
```js
console.log("1");

setTimeout(() => console.log("2"), 0); // macrotask

Promise.resolve().then(() => console.log("3")); // microtask

console.log("4");

// Output order: 1, 4, 3, 2
```

Why this order?
1. `"1"` and `"4"` run immediately (synchronous, on the call stack).
2. Once the call stack is empty, the event loop drains the **microtask queue** first → `"3"` logs.
3. Only then does it take from the **macrotask queue** → `"2"` logs, even though its delay was `0`.

## Why it matters
This explains many "weird" async ordering bugs — like why a `setTimeout(fn, 0)` doesn't run immediately, or why Promise callbacks always run before timer callbacks even if the timer was scheduled first. It's core to understanding how JS achieves non-blocking behavior despite being single-threaded.

## Questions
1. Why is JavaScript described as "single-threaded" and how does the event loop work around that limitation?
2. What's the difference between the microtask queue and the macrotask (callback) queue?
3. Why does a Promise's `.then()` callback run before a `setTimeout(fn, 0)` callback?
4. Predict the output order:
```js
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");
```
5. What would happen to the UI of a webpage if a synchronous piece of code took 10 seconds to run?
