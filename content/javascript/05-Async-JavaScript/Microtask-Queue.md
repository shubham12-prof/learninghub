# Microtask Queue

Holds callbacks from Promises (`.then`, `.catch`, `.finally`) and `queueMicrotask`. **Microtasks always run before macrotasks**, and the entire microtask queue is drained before the next macrotask runs.

```js
console.log("start");

setTimeout(() => console.log("timeout"), 0); // macrotask

Promise.resolve().then(() => console.log("promise")); // microtask

console.log("end");

// Output: start, end, promise, timeout
```

**Event Loop algorithm (simplified):**

1. Run all synchronous code (call stack empties).
2. Drain the entire microtask queue.
3. Take ONE task from the macrotask (callback) queue, run it.
4. Repeat from step 2.
