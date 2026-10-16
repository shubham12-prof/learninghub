# 02 - async / await

> **Time to learn:** ~35 min | **Level:** Core concept | **Interview frequency:** Extremely high

## 1. What is `async/await`?

`async/await` is **syntax on top of promises** that lets asynchronous code *read* like normal top-to-bottom code. It does not change how promises work underneath.

Two rules:

1. An `async` function **always returns a promise**. Whatever you `return` becomes the fulfilled value; whatever you `throw` becomes the rejection.
2. `await somePromise` **pauses that function** (not the whole program!) until the promise settles, then gives you the fulfilled value (or throws the rejection). It can only be used inside an `async` function (or at the top level of an ES module).

```js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getGreeting() {
  await sleep(100);        // function pauses here, other code keeps running
  return "Hello";          // becomes the promise's value
}

getGreeting().then((msg) => console.log(msg)); // Hello
```

## 2. Analogy

Reading a recipe: "put the cake in the oven, **wait** until it's baked, then add frosting". *You* wait at that step, but the rest of the kitchen keeps working (the event loop is free to do other things). `await` is that "wait here" step for **one function**, not for the whole kitchen.

## 3. Promises vs async/await (same thing, two styles)

```js
// Promise chain
function showUser(id) {
  return getUser(id)
    .then((user) => getPosts(user.id))
    .then((posts) => console.log(posts))
    .catch((err) => console.error(err));
}

// async/await
async function showUser(id) {
  try {
    const user = await getUser(id);
    const posts = await getPosts(user.id);
    console.log(posts);
  } catch (err) {
    console.error(err);
  }
}
```

Roughly, `await` is `.then()`:

```js
async function f() {
  console.log(1);
  await somePromise;
  console.log(2);
}

// behaves like
function f() {
  console.log(1);
  return Promise.resolve(somePromise).then(() => {
    console.log(2);
  });
}
```

## 4. Error handling with `try / catch / finally`

```js
async function loadData() {
  try {
    const res = await fetch("/api/data");
    if (!res.ok) throw new Error("HTTP " + res.status); // fetch does NOT reject on 404/500!
    return await res.json();
  } catch (err) {
    console.error("Failed:", err.message);
    return null;                      // recover with a fallback
  } finally {
    hideSpinner();                    // always runs
  }
}
```

An `async` function that throws (and doesn't catch) returns a **rejected promise**, so the caller can use `try/catch` with `await`, or `.catch()`:

```js
async function fail() { throw new Error("nope"); }

fail().catch((e) => console.log(e.message)); // nope
```

## 5. Sequential vs parallel (very common interview topic)

Each `await` waits for the previous one to finish.

### Sequential (slow when tasks are independent)

```js
async function sequential() {
  const a = await task("A", 100); // waits 100ms
  const b = await task("B", 100); // waits another 100ms
  const c = await task("C", 100); // waits another 100ms
  return [a, b, c];               // total ~300ms
}
```

### Parallel (start everything first, then wait)

```js
async function parallel() {
  const [a, b, c] = await Promise.all([
    task("A", 100),
    task("B", 100),
    task("C", 100),
  ]);
  return [a, b, c];               // total ~100ms
}
```

where

```js
const task = (name, ms) => sleep(ms).then(() => name);
```

**Rule of thumb:** if task B **needs the result of** task A -> sequential. If they are **independent** -> `Promise.all`.

A middle path (start early, await later):

```js
async function startEarly() {
  const pA = task("A", 100);      // started, not awaited yet
  const pB = task("B", 100);      // started too
  const a = await pA;
  const b = await pB;
  return [a, b];                  // ~100ms
}
```

## 6. Async code in loops

```js
const ids = [1, 2, 3];
```

| Goal | Code | Runs |
|---|---|---|
| One after another | `for (const id of ids) { await getUser(id); }` | **sequential** |
| All at once | `await Promise.all(ids.map((id) => getUser(id)))` | **parallel** |
| **BROKEN** | `ids.forEach(async (id) => { await getUser(id); })` | fires them all and **doesn't wait** |

### The `forEach` trap

`forEach` ignores the promise returned by its callback, so `await` outside it has nothing to wait for:

```js
async function run() {
  [1, 2, 3].forEach(async (n) => {
    await null;
    console.log(n);
  });
  console.log("done");
}
run();
// done
// 1
// 2
// 3
```

Fix: use `for...of` (sequential) or `await Promise.all(arr.map(...))` (parallel).

## 7. More facts worth knowing

- `await` on a **non-promise** just wraps it: `await 5` gives `5` (but still yields to the event loop for one microtask).
- `async` works with arrow functions, methods and IIFEs:
  ```js
  const fn = async () => {};
  const obj = { async method() {} };
  (async () => { await sleep(10); console.log("IIFE"); })();
  ```
- **Top-level await** works in ES modules (`<script type="module">`, `.mjs`):
  ```js
  const data = await fetch("/api").then((r) => r.json());
  ```
- Code **before** the first `await` runs **synchronously**:
  ```js
  async function a() {
    console.log("sync part");  // runs immediately when a() is called
    await null;
    console.log("after await"); // runs later (microtask)
  }
  ```
- `return await` vs `return` matters **only inside try/catch**:
  ```js
  async function withAwait() {
    try { return await Promise.reject(new Error("x")); }   // caught below
    catch (e) { return "caught"; }
  }

  async function withoutAwait() {
    try { return Promise.reject(new Error("x")); }          // NOT caught: returned before it rejects
    catch (e) { return "caught"; }
  }
  ```

## 8. Common mistakes

1. **Forgetting `await`**: you get a pending `Promise` object instead of the value.
   ```js
   const user = getUser(1);       // Promise, not a user
   console.log(user.name);        // undefined
   ```
2. **Awaiting in a loop when tasks are independent** (needlessly slow). Use `Promise.all`.
3. **`forEach` with `async`** (see section 6).
4. **No error handling**: an unhandled rejection from an `async` function.
5. **Marking everything `async` "just in case"**: if there's no `await`, you don't need it.
6. **Swallowing errors** with an empty `catch {}` so bugs silently disappear.
7. **Using `await` inside a non-async callback** (`arr.map((x) => await f(x))` is a SyntaxError). Make the callback `async` and wrap with `Promise.all`.

## 9. Predict the output

**Q1**
```js
async function f() { return 1; }
console.log(f() instanceof Promise);
```

**Q2**
```js
async function a() {
  console.log(1);
  await null;
  console.log(2);
}
a();
console.log(3);
```

**Q3**
```js
async function f() {
  try { return await Promise.reject(new Error("x")); }
  catch (e) { return "caught"; }
}
f().then(console.log);
```

**Q4**
```js
async function g() {
  try { return Promise.reject(new Error("x")); }
  catch (e) { return "caught"; }
}
g().then(console.log).catch((e) => console.log("outer", e.message));
```

**Q5**
```js
async function run() {
  [1, 2, 3].forEach(async (n) => {
    await null;
    console.log(n);
  });
  console.log("done");
}
run();
```

## 10. Answers

- **Q1:** `true`. `async` functions always return a promise.
- **Q2:** `1`, `3`, `2`. Code before the first `await` is synchronous; after it, the function resumes as a microtask, after the sync `console.log(3)`.
- **Q3:** `caught`. `return await` lets the `catch` see the rejection.
- **Q4:** `outer x`. Without `await`, the rejected promise is returned straight out of the `try`, so the function's own `catch` never sees it.
- **Q5:** `done`, `1`, `2`, `3`. `forEach` doesn't wait for the async callbacks.

## Recap

- `async` function = returns a promise. `await` = pause *this function* until a promise settles.
- Use `try/catch/finally` for errors (and check `res.ok` with `fetch`).
- Independent tasks -> `Promise.all` (parallel). Dependent tasks -> `await` one after another.
- Never use `forEach` with `await`; use `for...of` or `Promise.all(map)`.
- `return await` only matters inside `try/catch`.

## Checklist

- [ ] I can explain what `await` pauses (and what it doesn't)
- [ ] I can convert a `.then` chain to `async/await` and back
- [ ] I can explain sequential vs parallel with timings
- [ ] I can explain why `forEach(async ...)` is a bug
- [ ] I got Q1 to Q5 right without looking
