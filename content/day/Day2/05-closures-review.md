# 05 - Closures Review (in async code)

> **Time to learn:** ~30 min | **Level:** Review + application | **Interview frequency:** Very high
> Quick refresher from `Day 1/03-closures.md`, now applied to timers, promises and requests.

## 1. 30-second refresher

A **closure** is a function that remembers the variables of the scope where it was created, even after that outer function has finished. It remembers the **variable** (a live reference), **not a snapshot of its value**.

Async code is *full* of closures: every callback you pass to `setTimeout`, `.then`, an event listener or an `async` function's continuation keeps its surrounding variables alive until it runs.

## 2. Why closures matter more in async code

Because the callback runs **later**, by which time the variables it captured may have **changed**. Most async bugs are really closure bugs.

## 3. Pattern 1: the loop + timer problem (still the classic)

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// 3 3 3   (one shared `i`)

for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// 0 1 2   (a new `i` per iteration)
```

It happens with `await` too:

```js
async function run() {
  for (var i = 0; i < 3; i++) {
    await null;
    setTimeout(() => console.log(i), 0);
  }
}
run();
// 3 3 3  -> the loop (with its 3 awaits, all microtasks) finishes before ANY timer fires
//           (use `let` to get 0 1 2)
```

## 4. Pattern 2: callbacks see the *latest* value

```js
function makeLogger() {
  let msg = "initial";
  const log = () => console.log(msg);
  setTimeout(log, 0);
  msg = "updated";          // changed BEFORE the timer fires
}
makeLogger();
// updated
```

If you want the value *at scheduling time*, pass it in (copy it):

```js
function makeLogger2() {
  let msg = "initial";
  const snapshot = msg;               // copy now
  setTimeout(() => console.log(snapshot), 0);
  msg = "updated";
}
makeLogger2();
// initial
```

## 5. Pattern 3: "latest request wins" (race conditions)

Typing in a search box fires several requests. They can finish **out of order**, and an old, slow response may overwrite a newer one. A closure holding a request id solves it:

```js
function createLatest(fn) {
  let latestId = 0;                       // private, remembered by the closure
  return async function (...args) {
    const myId = ++latestId;              // this call's own id (its own closure variable)
    const result = await fn(...args);
    if (myId !== latestId) return undefined; // a newer call exists -> ignore this stale result
    return result;
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const search = createLatest(async (q, ms) => { await sleep(ms); return "results for " + q; });

search("ja", 200).then((r) => console.log("1st:", r));    // slow
search("java", 50).then((r) => console.log("2nd:", r));   // fast, newer
// 2nd: results for java
// 1st: undefined      <- stale result ignored
```

You will use this idea in the Day 2 API project (and with `AbortController`).

## 6. Pattern 4: cache the *promise*, not the value (memoize async)

If you cache the **promise**, two simultaneous calls share **one** request:

```js
function memoAsync(fn) {
  const cache = new Map();                     // private cache (closure)
  return (key) => {
    if (!cache.has(key)) cache.set(key, fn(key)); // store the promise immediately
    return cache.get(key);
  };
}

let calls = 0;
const getDouble = memoAsync(async (id) => { calls++; return id * 2; });

Promise.all([getDouble(1), getDouble(1), getDouble(2)])
  .then((r) => console.log(r, calls));
// [ 2, 2, 4 ] 2   -> only 2 real calls, not 3
```

(If a cached promise **rejects**, you usually want to delete it from the cache so the next call can retry.)

## 7. Pattern 5: function factories (retry, once, debounce)

```js
function withRetry(fn, retries) {
  return async function (...args) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn(...args);
      } catch (err) {
        lastError = err;                 // remembered across attempts
      }
    }
    throw lastError;
  };
}

let tries = 0;
const flaky = async () => {
  tries++;
  if (tries < 3) throw new Error("fail " + tries);
  return "ok after " + tries;
};

withRetry(flaky, 3)().then(console.log);   // ok after 3
```

**Debounce** (next file, `06-coding-debounce.md`) is the most famous closure + timer combo: it keeps the timer id in a closure so each call can cancel the previous timer.

## 8. Memory reminder

A pending timer, listener or unresolved promise keeps its closure (and everything it references) alive. Clear timers (`clearTimeout`), remove event listeners and abort requests when the work is no longer needed (for example when a component unmounts).

## 9. Common mistakes

1. Using `var` in loops with async callbacks.
2. Expecting a callback to see the value from when it was **scheduled** instead of when it **runs**.
3. Letting an old request's response overwrite a newer one (no "latest wins" check).
4. Caching resolved values instead of promises, so parallel calls duplicate work.
5. Forgetting to clear timers/listeners (leaks and stale callbacks).

## 10. Predict the output

**Q1**
```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
```

**Q2**
```js
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
```

**Q3**
```js
async function run() {
  for (var i = 0; i < 3; i++) {
    await null;
    setTimeout(() => console.log(i), 0);
  }
}
run();
```

**Q4**
```js
function memoAsync(fn) {
  const cache = new Map();
  return (k) => {
    if (!cache.has(k)) cache.set(k, fn(k));
    return cache.get(k);
  };
}
let calls = 0;
const get = memoAsync(async (id) => { calls++; return id * 2; });
Promise.all([get(1), get(1), get(2)]).then((r) => console.log(r, calls));
```

**Q5**
```js
function makeLogger() {
  let msg = "initial";
  const log = () => console.log(msg);
  setTimeout(log, 0);
  msg = "updated";
}
makeLogger();
```

## 11. Answers

- **Q1:** `3 3 3`. One shared `var i`; the loop ends before any timer fires.
- **Q2:** `0 1 2`. `let` creates a fresh binding per iteration.
- **Q3:** `3 3 3`. Still one shared `var i`; all three iterations (each just a microtask `await`) finish before the first timer runs.
- **Q4:** `[ 2, 2, 4 ] 2`. The promise for key `1` is cached on the first call, so the second call reuses it (2 real calls for 3 requests).
- **Q5:** `updated`. The closure sees the variable's current value when the timer fires.

## Recap

- Closures remember **variables**, not values, so async callbacks see the **latest** value.
- `var` in loops + async = shared variable bug. Use `let`.
- A closure holding an id/counter gives you **"latest request wins"**.
- Cache **promises** to dedupe in-flight requests.
- Closures power `debounce`, `once`, `retry` and `memoize` factories.
- Clean up timers/listeners so closures don't leak.

## Checklist

- [ ] I can explain why async callbacks see the latest value
- [ ] I can fix the `var` + `setTimeout` loop in 2 ways
- [ ] I can write the "latest request wins" wrapper
- [ ] I can explain why we cache the promise, not the result
- [ ] I got Q1 to Q5 right without looking
