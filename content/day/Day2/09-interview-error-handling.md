# 09 - Interview: Error Handling in Async Code

> **Time to learn:** ~40 min | **Interview frequency:** Very high
> Read `01-promises.md` and `02-async-await.md` first.

## 1. The 30-second answer (say this out loud)

> "With promises I end chains with `.catch()`, and with `async/await` I wrap awaits in `try/catch/finally`. An error thrown in a `.then` or an `async` function becomes a rejection, so it flows to the nearest handler. I use `finally` for cleanup like hiding a spinner. For `fetch`, I must check `res.ok` myself, because `fetch` only rejects on network failures, not on HTTP 404 or 500. I also handle timeouts with `AbortController`, retry transient failures with backoff, and never leave a rejection unhandled."

## 2. The tools

| Tool | Use |
|---|---|
| `try / catch / finally` | with `await`, in `async` functions |
| `.catch(fn)` | at the end of a promise chain |
| `.finally(fn)` | cleanup that must run on success **and** failure |
| `throw` / `Promise.reject()` | signal an error |
| `Promise.allSettled` | when partial failure is acceptable |
| `window.addEventListener("unhandledrejection", ...)` | last-resort logging (browser) |
| `process.on("unhandledRejection", ...)` | last-resort logging (Node) |

## 3. Examples

### 3.1 try / catch / finally with async/await

```js
async function loadUser(id) {
  showSpinner();
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Could not load user:", err.message);
    return null;                    // fallback value
  } finally {
    hideSpinner();                  // runs on success AND failure, even after `return`
  }
}
```

### 3.2 Where does a `.catch` catch?

A `.catch` handles errors from **everything above it** in the chain:

```js
Promise.reject(new Error("a"))
  .catch((e) => {
    console.log("1", e.message);   // 1 a
    throw new Error("b");           // rethrow / throw a new error -> goes to the NEXT catch
  })
  .catch((e) => console.log("2", e.message)) // 2 b
  .then(() => console.log("3"));             // 3  (the chain recovered)
```

### 3.3 `.then(onOk, onErr)` is NOT the same as `.then(onOk).catch(onErr)`

```js
Promise.resolve("ok")
  .then(
    () => { throw new Error("from then"); },
    () => console.log("not called")        // handles errors from BEFORE, not from the callback next to it
  )
  .catch((e) => console.log("catch:", e.message));
// catch: from then
```

Prefer `.then(...).catch(...)` so the `catch` also covers errors thrown inside `then`.

### 3.4 `fetch` does NOT reject on HTTP errors (the #1 interview trap)

`fetch` rejects only on **network failure** (offline, DNS error, CORS block). A `404` or `500` is a *successful* fetch with `res.ok === false`.

```js
fetch("/missing")
  .then((res) => console.log("then, ok =", res.ok))   // then, ok = false   (status 404)
  .catch(() => console.log("catch"));                   // NOT called for a 404
```

The standard fix is a small wrapper (reused in the Day 2 API project):

```js
class HttpError extends Error {
  constructor(status, statusText) {
    super(`HTTP ${status} ${statusText}`);
    this.name = "HttpError";
    this.status = status;                 // lets callers branch: 404 vs 500
  }
}

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new HttpError(res.status, res.statusText);
  return res.json();
}
```

### 3.5 try/catch does NOT catch errors in callbacks scheduled for later

```js
try {
  setTimeout(() => { throw new Error("late"); }, 0);   // runs AFTER the try block is over
} catch (e) {
  console.log("caught");                                // never runs
}
console.log("end");
// end
// Uncaught Error: late    (crashes Node / logs an error in the browser)
```

Same for plain callbacks and event handlers. With promises/`await` the error **is** transported, which is one of the big benefits of promises:

```js
try {
  await new Promise((_, reject) => setTimeout(() => reject(new Error("late")), 0));
} catch (e) {
  console.log("caught", e.message);   // caught late
}
```

### 3.6 Throwing inside the `Promise` executor

```js
new Promise(() => { throw new Error("boom"); })
  .catch((e) => console.log("caught", e.message));   // caught boom (converted to a rejection)
```

But an error thrown **inside a `setTimeout` inside the executor** is NOT converted: it is uncaught. Call `reject()` there instead.

### 3.7 Unhandled rejections

If a promise rejects and **nobody** attaches a handler, you get an *unhandled rejection*:

- **Node.js (15+):** the process **crashes** (exit code 1) by default.
- **Browsers:** an error is logged and an `unhandledrejection` event fires.

```js
Promise.reject(new Error("nobody catches me"));   // Node: crashes with an error and exit code 1

// last-resort logging (do NOT use as your main strategy)
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled:", event.reason);
  event.preventDefault();
});
```

Common causes: forgetting `.catch`, forgetting `await` (so the `try/catch` doesn't wrap it), or calling an `async` function without handling its result:

```js
async function save() { throw new Error("fail"); }

try {
  save();                  // BUG: not awaited -> the rejection escapes the try/catch
} catch (e) { /* never runs */ }

try {
  await save();            // correct
} catch (e) { console.log("caught", e.message); }
```

### 3.8 Custom errors to branch on

```js
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

try {
  throw new ValidationError("Email is required", "email");
} catch (err) {
  if (err instanceof ValidationError) console.log("Fix field:", err.field);
  else throw err;            // not ours -> rethrow, don't swallow unknown errors
}
```

**Rule:** only catch errors you can actually handle; **rethrow** the rest.

### 3.9 Timeouts with `AbortController`

`fetch` has no built-in timeout. Cancel it yourself:

```js
async function fetchWithTimeout(url, ms = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") throw new Error(`Request timed out after ${ms}ms`);
    throw err;
  } finally {
    clearTimeout(timer);                  // always clean the timer
  }
}
```

(Unlike `Promise.race`, aborting actually **stops** the network request.)

### 3.10 Retry with exponential backoff

For temporary failures (network blips, 503): wait a little, then retry with growing delays (200 ms, 400 ms, 800 ms...).

```js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function retry(fn, { retries = 3, baseDelay = 200, shouldRetry = () => true } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= retries || !shouldRetry(err)) throw err;   // give up
      await sleep(baseDelay * 2 ** attempt);                    // 200, 400, 800...
      attempt++;
    }
  }
}

// don't retry client errors (4xx): they will never succeed
const data = await retry(() => fetchJSON("/api/data"), {
  retries: 3,
  shouldRetry: (err) => !(err instanceof HttpError && err.status < 500),
});
```

### 3.11 Partial failure with `Promise.allSettled`

```js
const results = await Promise.allSettled(ids.map((id) => fetchJSON(`/api/users/${id}`)));

const users  = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
const failed = results.filter((r) => r.status === "rejected").map((r) => r.reason);
```

## 4. Follow-up questions interviewers ask

**Q: Why doesn't `try/catch` catch my `setTimeout` error?**
The callback runs later in a different call stack, after the `try` block has finished. Use a promise (and `await` it) or handle errors inside the callback.

**Q: Does `fetch` reject on a 404?**
No. Only on network errors. Check `res.ok` / `res.status` and throw yourself.

**Q: What's the difference between `.catch()` and the second argument of `.then()`?**
`.catch` also handles errors thrown by the `.then` callback before it; the 2nd argument of `.then(a, b)` handles only errors from earlier in the chain, not from `a`.

**Q: What happens if I `return` inside `finally`, or throw inside it?**
A `return` overrides the result (avoid it). A `throw` in `finally` replaces the original error.

**Q: How do you avoid unhandled rejections?**
Always `await` inside `try/catch` or end the chain with `.catch`; use `allSettled` for batches; add a global `unhandledrejection` handler for logging.

**Q: How do you handle errors in `Promise.all`?**
It rejects with the first reason. Use `try/catch` around `await Promise.all(...)`, or `allSettled` / per-promise `.catch` if you need every result.

**Q: Should every `async` function have its own `try/catch`?**
No. Catch **where you can do something useful** (show a message, retry, use a fallback). Let errors bubble up otherwise.

**Q: How do you cancel an async operation?**
`AbortController` for `fetch` (and anything that accepts a `signal`). Plain promises can't be cancelled; you can only ignore their result (the "latest wins" pattern from `05-closures-review.md`).

## 5. Predict the output

**Q1**
```js
try {
  setTimeout(() => { throw new Error("late"); }, 0);
} catch (e) {
  console.log("caught");
}
console.log("end");
```

**Q2**
```js
Promise.reject(new Error("a"))
  .catch((e) => { console.log("1", e.message); throw new Error("b"); })
  .catch((e) => console.log("2", e.message))
  .then(() => console.log("3"));
```

**Q3**
```js
async function f() {
  try { await Promise.reject(new Error("x")); }
  finally { console.log("cleanup"); }
}
f().catch((e) => console.log("caught", e.message));
```

**Q4**
```js
Promise.resolve("ok")
  .then(
    () => { throw new Error("from then"); },
    () => console.log("not called")
  )
  .catch((e) => console.log("catch:", e.message));
```

**Q5** (assume the server answers with status 404)
```js
fetch("/missing")
  .then((res) => console.log("then, ok =", res.ok))
  .catch(() => console.log("catch"));
```

## 6. Answers

- **Q1:** prints `end`, then the program crashes with `Uncaught Error: late`. `"caught"` is never printed because the callback runs after the `try` block has exited.
- **Q2:** `1 a`, `2 b`, `3`. The first catch rethrows, the second handles it and the chain recovers.
- **Q3:** `cleanup`, then `caught x`. `finally` runs first, and the error still propagates to the caller.
- **Q4:** `catch: from then`. The second argument of `.then` doesn't cover its own sibling callback.
- **Q5:** `then, ok = false`. `fetch` resolves for HTTP errors; `.catch` is **not** called.

## Recap

- Promises: end chains with `.catch`; `async/await`: `try/catch/finally`.
- Errors thrown in `.then` / `async` functions become rejections that flow to the nearest handler.
- `fetch` doesn't reject on 404/500: check `res.ok` and throw (`HttpError`).
- `try/catch` can't catch errors from callbacks run later (`setTimeout`); promises fix that.
- Handle timeouts with `AbortController`, transient failures with retry + backoff, partial failures with `allSettled`.
- Never leave a rejection unhandled; catch only what you can handle, rethrow the rest.

## Checklist

- [ ] I can say the 30-second answer without notes
- [ ] I can explain the `fetch` + `res.ok` trap
- [ ] I can explain why `try/catch` misses `setTimeout` errors
- [ ] I can write `fetchWithTimeout` and `retry` from memory
- [ ] I got Q1 to Q5 right without looking
