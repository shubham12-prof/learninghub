# Event Loop

JS is single-threaded — one call stack. Async behavior (timers, network requests, DOM events) is handled by **Web APIs provided by the browser/Node**, not by JS itself. The **Event Loop** coordinates moving completed async work back onto the call stack.

```js
console.log("1");
setTimeout(() => console.log("2"), 0);
console.log("3");
// Output: 1, 3, 2
// Even with 0ms delay, setTimeout callback goes through the event loop,
// so synchronous code (1, 3) always runs first.
```

**Event Loop algorithm (simplified):**

1. Run all synchronous code (call stack empties).
2. Drain the entire microtask queue (Promises).
3. Take ONE task from the macrotask (callback) queue, run it.
4. Repeat from step 2.

See `Web-APIs.md`, `Callback-Queue.md`, and `Microtask-Queue.md` for the pieces that feed into this loop.
