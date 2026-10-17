# 06 - Coding: Implement `debounce`

> **Time to learn:** ~40 min | **Difficulty:** Medium | **Interview frequency:** Very high (the #1 closure + timer question)
> This is one of the two Day 2 coding options (the other is `07-coding-flatten-array.md`). Your daily target is **one** of them; do both if you have time.

## 1. The problem

Write a function `debounce(fn, delay)` that returns a new function. When the new function is called, it should **wait until `delay` ms have passed without any new call** and only then run `fn`. If it's called again during the wait, the timer **restarts**.

```js
const log = debounce((msg) => console.log(msg), 300);

log("a"); // timer starts
log("b"); // timer restarts
log("c"); // timer restarts
// ...300ms of silence...
// prints: c      (only the LAST call runs)
```

## 2. Why do we need it?

Some events fire **dozens of times per second**. Running expensive work on every one is wasteful.

| Scenario                   | Debounce does                                             |
| -------------------------- | --------------------------------------------------------- |
| Search box (`input` event) | Call the API only after the user **stops typing**         |
| Window `resize`            | Recalculate the layout once after the user stops resizing |
| Auto-save a form           | Save once after the user pauses                           |
| Validate a field           | Validate once typing pauses                               |

## 3. Analogy

An **elevator door**. Every time someone walks in, the door waits again before closing. The door only closes (the function runs) after nobody has entered for a few seconds.

## 4. How to think about it

- We need to **remember the timer** between calls -> a variable that outlives each call -> a **closure**.
- Each call: **cancel the old timer** (`clearTimeout`), **start a new one** (`setTimeout`).
- We must also preserve **`this`** and the **arguments** of the call.

## 5. Solutions

### Solution 1: the standard answer (learn this one by heart)

```js
function debounce(fn, delay) {
  let timerId; // remembered by the closure

  return function (...args) {
    clearTimeout(timerId); // cancel the previous timer
    timerId = setTimeout(() => {
      fn.apply(this, args); // arrow fn keeps `this` from the returned function
    }, delay);
  };
}
```

Usage:

```js
const onSearch = debounce((text) => console.log("Search:", text), 300);

input.addEventListener("input", (e) => onSearch(e.target.value));
```

Why each line matters:

| Line                                        | Reason                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| `let timerId` outside the returned function | **Closure**: shared across calls of _this_ debounced function                  |
| `clearTimeout(timerId)`                     | Cancels the pending run -> this is the "reset the timer" part                  |
| `function (...args)` (not an arrow)         | A regular function gets its own `this` (so `obj.method = debounce(...)` works) |
| `fn.apply(this, args)`                      | Calls the original with the right `this` and **all** the arguments             |
| Arrow inside `setTimeout`                   | Keeps `this` and `args` from the outer function                                |

- Time: each call is **O(1)**. Space: **O(1)**.

### Solution 2: production-style (leading/trailing edge, `cancel`, `flush`)

Interviewers often ask for "leading edge" (run immediately on the first call) and a `cancel` method.

```js
function debounce(fn, delay, { leading = false, trailing = true } = {}) {
  let timerId = null;
  let lastArgs;
  let lastThis;

  function invoke() {
    const args = lastArgs;
    const ctx = lastThis;
    lastArgs = lastThis = undefined;
    return fn.apply(ctx, args);
  }

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;
    const callNow = leading && timerId === null; // first call of a burst?

    clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
      if (trailing && lastArgs) invoke(); // run at the END of the burst
      lastArgs = lastThis = undefined;
    }, delay);

    if (callNow) invoke(); // run at the START of the burst
  }

  debounced.cancel = function () {
    // drop the pending call
    clearTimeout(timerId);
    timerId = null;
    lastArgs = lastThis = undefined;
  };

  debounced.flush = function () {
    // run the pending call right now
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
      if (lastArgs) invoke();
    }
  };

  return debounced;
}
```

How the options behave:

| Options                              | Burst of calls A, B, C                             | Single call A          |
| ------------------------------------ | -------------------------------------------------- | ---------------------- |
| default (`trailing`)                 | runs **C** after the pause                         | runs A after the pause |
| `{ leading: true, trailing: false }` | runs **A** immediately, ignores B and C            | runs A immediately     |
| `{ leading: true, trailing: true }`  | runs **A** immediately, then **C** after the pause | runs A **once**        |

Examples:

```js
// Double-click protection: fire the first click, ignore the rest
const save = debounce(saveForm, 1000, { leading: true, trailing: false });

// Cancel on cleanup (e.g. leaving the page / unmounting a component)
const onType = debounce(search, 300);
onType.cancel();

// Flush before leaving: run the pending call now
onType.flush();
```

## 6. Debounce vs Throttle

|         | **Debounce**                      | **Throttle**                                    |
| ------- | --------------------------------- | ----------------------------------------------- |
| Runs    | **after** activity stops          | **at most once** every N ms **during** activity |
| Think   | "wait until they're done"         | "at most one per interval"                      |
| Use for | search box, resize end, auto-save | scroll, mousemove, window drag, rate limiting   |

A basic throttle (leading edge):

```js
function throttle(fn, interval) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= interval) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}
```

## 7. Test it yourself

Paste **Solution 2** (the production-style one) above this test, because the last step uses `.cancel()`. Everything before that step also works with Solution 1.

```js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function test() {
  const calls = [];
  const d = debounce((x) => calls.push(x), 50);

  d(1);
  d(2);
  d(3); // burst
  await sleep(80);
  console.log(calls); // [ 3 ]

  d(4);
  await sleep(80);
  d(5);
  await sleep(80);
  console.log(calls); // [ 3, 4, 5 ]  (calls spaced further apart than the delay all run)

  // `this` is preserved
  const obj = {
    name: "obj",
    hello: debounce(function () {
      console.log(this.name);
    }, 10),
  };
  obj.hello(); // obj  (after 10ms)
  await sleep(30);

  // cancel -> only Solution 2 has `.cancel()` (Solution 1 would throw "c.cancel is not a function")
  const c = debounce(() => console.log("should not print"), 20);
  c();
  c.cancel();
  await sleep(40); // nothing printed
}
test();
```

## 8. Edge cases to mention

| Case                    | Behaviour                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `delay = 0`             | Still async: runs after the current code and microtasks (like `setTimeout(fn, 0)`)                       |
| Two debounced functions | **Independent**: each `debounce()` call makes its own `timerId`                                          |
| Arguments               | Only the **last** call's arguments are used                                                              |
| Return value            | The wrapper returns `undefined` (the real call is delayed). Use a promise version if you need the result |
| `this`                  | Use a regular function (not an arrow) for the returned function                                          |

## 9. Common mistakes

1. **Creating the debounced function inside the handler**, so every event gets a _new_ `timerId` and nothing is ever debounced:

   ```js
   // BUG: a brand new debounced function on every keystroke
   input.addEventListener("input", (e) =>
     debounce(search, 300)(e.target.value),
   );

   // FIX: create it ONCE, outside
   const debouncedSearch = debounce(search, 300);
   input.addEventListener("input", (e) => debouncedSearch(e.target.value));
   ```

2. Forgetting `clearTimeout`, so every call eventually runs (you only delayed them).
3. Using an **arrow function** as the returned function and losing `this`.
4. Forgetting to pass `...args` through to `fn`.
5. Confusing debounce with throttle.

## 10. The 30-second explanation (say it out loud)

> "Debounce returns a wrapper function that delays calling the original until a given time has passed with no new calls. It stores a timer id in a closure. On every call it clears the previous timer and starts a new one, so the function only runs once the calls stop. I use `apply` so `this` and the arguments are preserved. It's ideal for search inputs and resize handlers. Throttle is different: it guarantees at most one call per interval during continuous activity."

## 11. Practice variations

Try each one yourself first.

1. Implement `throttle` with **trailing** call too (run once more at the end of the burst).
2. A debounce that **returns a promise** resolving with the result of `fn` (for the last call).
3. `withTimeout(promise, ms)`: reject if the promise takes longer than `ms` (hint: `Promise.race`).
4. `once(fn)` that runs only the first time (from Day 1).
5. `sleep(ms)` and `retry(fn, times)` helper.

### Hints / answers

```js
// 1. Throttle with trailing call
function throttleTrailing(fn, interval) {
  let lastCall = 0;
  let timerId = null;
  let lastArgs, lastThis;

  return function (...args) {
    const now = Date.now();
    const remaining = interval - (now - lastCall);
    lastArgs = args;
    lastThis = this;

    if (remaining <= 0) {
      // enough time passed: run now
      clearTimeout(timerId);
      timerId = null;
      lastCall = now;
      fn.apply(this, args);
    } else if (timerId === null) {
      // otherwise schedule one trailing call
      timerId = setTimeout(() => {
        lastCall = Date.now();
        timerId = null;
        fn.apply(lastThis, lastArgs);
      }, remaining);
    }
  };
}

// 2. Debounce that returns a promise
function debouncePromise(fn, delay) {
  let timerId;
  let waiting = [];

  return function (...args) {
    clearTimeout(timerId);
    return new Promise((resolve, reject) => {
      waiting.push({ resolve, reject });
      timerId = setTimeout(async () => {
        const callers = waiting;
        waiting = [];
        try {
          const result = await fn.apply(this, args);
          callers.forEach((c) => c.resolve(result));
        } catch (err) {
          callers.forEach((c) => c.reject(err));
        }
      }, delay);
    });
  };
}

// 3. Timeout wrapper
function withTimeout(promise, ms) {
  let timerId;
  const timeout = new Promise((_, reject) => {
    timerId = setTimeout(
      () => reject(new Error(`Timed out after ${ms}ms`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timerId));
}

// 5. sleep + retry
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function retry(fn, times) {
  let lastError;
  for (let i = 0; i < times; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}
```

## Recap

- Debounce = **wait for quiet**, then run once. Throttle = **at most once per interval**.
- Core trick: a `timerId` in a **closure**, `clearTimeout` + `setTimeout` on every call.
- Preserve `this` (regular function + `apply`) and `args` (`...args`).
- Create the debounced function **once**, not inside the event handler.
- Extras interviewers like: `leading`/`trailing`, `cancel`, `flush`.

## Checklist

- [ ] I can write Solution 1 from memory
- [ ] I can explain why `timerId` lives in a closure
- [ ] I can explain debounce vs throttle with examples
- [ ] I can add `cancel` and `leading` options
- [ ] I solved at least 3 practice variations
