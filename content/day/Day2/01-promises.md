# 01 - Promises

> **Time to learn:** ~35 min | **Level:** Core concept | **Interview frequency:** Extremely high

## 1. What is a Promise?

A **Promise** is an object that represents a value that **isn't available yet but will be later** (or will fail). Instead of passing a callback into a function, the function hands you a Promise and you attach what should happen next.

A promise is always in one of three states:

| State         | Meaning                                   | Can change?                   |
| ------------- | ----------------------------------------- | ----------------------------- |
| **pending**   | Still waiting                             | Yes, to fulfilled or rejected |
| **fulfilled** | Finished successfully, has a value        | No                            |
| **rejected**  | Failed, has a reason (usually an `Error`) | No                            |

Once a promise is **settled** (fulfilled or rejected) it **never changes again**. Calling `resolve()` twice, or `resolve()` then `reject()`, does nothing the second time.

## 2. Analogy

Ordering food at a restaurant and getting a **buzzer**. The buzzer isn't your food, it is a _promise_ of food. While you wait it's **pending**. Eventually it buzzes (**fulfilled**: pick up your food) or the kitchen says "sorry, we ran out" (**rejected**). Meanwhile you are free to do other things (JavaScript keeps running other code).

## 3. Creating a promise

```js
const promise = new Promise((resolve, reject) => {
  // do some work...
  const ok = true;
  if (ok) {
    resolve("It worked!"); // fulfil with a value
  } else {
    reject(new Error("It failed")); // reject with a reason
  }
});
```

Important: the function you pass in (the **executor**) runs **immediately and synchronously**. Only the `.then()` callbacks are asynchronous.

A reusable example: a `sleep` helper (you will use it all through Day 2):

```js
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

sleep(500).then(() => console.log("500ms later"));
```

## 4. Consuming a promise

```js
getUser(1)
  .then((user) => console.log("Got", user.name)) // runs on success
  .catch((err) => console.log("Failed:", err.message)) // runs on failure
  .finally(() => console.log("Done")); // runs either way
```

A fake API to practise with:

```js
function getUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id <= 0) reject(new Error("Invalid id"));
      else resolve({ id, name: "User " + id });
    }, 100);
  });
}

getUser(1).then((u) => console.log(u)); // { id: 1, name: 'User 1' }
getUser(0).catch((e) => console.log(e.message)); // Invalid id
```

## 5. Chaining: the rules you must know

`.then()` **always returns a new promise**, so you can chain. What the next link receives depends on what the previous callback does:

| The callback...           | The next promise...                        |
| ------------------------- | ------------------------------------------ |
| returns a **plain value** | fulfils with that value                    |
| returns a **promise**     | waits for it, then fulfils/rejects like it |
| **throws** an error       | rejects with that error                    |
| returns nothing           | fulfils with `undefined`                   |

```js
Promise.resolve(1)
  .then((n) => n + 1) // 2
  .then((n) => sleep(100).then(() => n * 10)) // returns a promise -> waits -> 20
  .then((n) => console.log(n)); // 20
```

### Errors skip ahead to the nearest `.catch`

```js
Promise.resolve("start")
  .then(() => {
    throw new Error("boom");
  })
  .then(() => console.log("skipped")) // never runs
  .catch((err) => {
    console.log("caught:", err.message); // caught: boom
    return "recovered"; // returning a value RECOVERS the chain
  })
  .then((v) => console.log(v)); // recovered
```

### `.finally()`

Runs on success or failure, gets **no argument**, and its return value is **ignored** (the original value or error passes through).

```js
Promise.resolve("x")
  .finally(() => "ignored")
  .then((v) => console.log(v)); // x
```

Use it for cleanup, for example hiding a loading spinner.

## 6. From callbacks to promises

Callback style ("callback hell"):

```js
getUser(1, (user) => {
  getPosts(user.id, (posts) => {
    getComments(posts[0].id, (comments) => {
      console.log(comments); // pyramid of doom
    });
  });
});
```

Promise style (flat and readable):

```js
getUser(1)
  .then((user) => getPosts(user.id))
  .then((posts) => getComments(posts[0].id))
  .then((comments) => console.log(comments))
  .catch((err) => console.error(err)); // ONE catch handles any failure above
```

Wrapping an old callback API (**promisify**):

```js
function readFilePromise(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf8", (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}
```

## 7. Static helpers (quick overview)

| Method                      | Resolves when                            | Rejects when                      |
| --------------------------- | ---------------------------------------- | --------------------------------- |
| `Promise.resolve(x)`        | immediately with `x`                     | never                             |
| `Promise.reject(e)`         | never                                    | immediately with `e`              |
| `Promise.all([...])`        | **all** fulfil (array of values)         | **any** rejects (first rejection) |
| `Promise.allSettled([...])` | **all** settle (array of result objects) | never                             |
| `Promise.race([...])`       | **first** to settle fulfils              | first to settle rejects           |
| `Promise.any([...])`        | **first fulfilment**                     | **all** reject (`AggregateError`) |

Details and a hand-written `Promise.all` are in `08-interview-promise-all.md`.

## 8. Common mistakes

1. **Forgetting to `return` inside `.then`**: the next link gets `undefined` and doesn't wait.
   ```js
   getUser(1)
     .then((u) => {
       getPosts(u.id);
     }) // BUG: no return, chain doesn't wait
     .then((posts) => console.log(posts)); // undefined
   ```
2. **Nesting `.then` inside `.then`** instead of chaining (callback hell again).
3. **No `.catch`**: the rejection becomes an _unhandled rejection_ (crashes Node, logs an error in browsers).
4. **The `new Promise` anti-pattern**: wrapping something that already returns a promise.
   ```js
   // Bad
   const p = new Promise((resolve, reject) =>
     fetch(url).then(resolve).catch(reject),
   );
   // Good
   const p = fetch(url);
   ```
5. **Thinking a promise is lazy.** The executor runs the moment you create it, even if you never call `.then`.
6. **Rejecting with a string** instead of an `Error` (you lose the stack trace). Use `reject(new Error("..."))`.

## 9. Predict the output

**Q1**

```js
const p = new Promise((resolve) => {
  console.log("A");
  resolve("B");
  console.log("C");
});
p.then((v) => console.log(v));
console.log("D");
```

**Q2**

```js
Promise.resolve(1)
  .then((v) => v + 1)
  .then(() => {
    throw new Error("oops");
  })
  .then(() => console.log("skipped"))
  .catch((e) => console.log(e.message))
  .then(() => console.log("after catch"));
```

**Q3**

```js
Promise.resolve(1)
  .then(2)
  .then((v) => console.log(v));
```

**Q4**

```js
const p = Promise.reject(new Error("fail"));
p.catch(() => console.log("caught"));
p.then(() => console.log("then")).catch(() => console.log("caught2"));
```

**Q5**

```js
Promise.resolve("x")
  .finally(() => "ignored")
  .then((v) => console.log(v));
```

## 10. Answers

- **Q1:** `A`, `C`, `D`, `B`. The executor runs synchronously (A, then C, because `resolve` doesn't stop the function). `D` is the next sync line. The `.then` callback is queued as a microtask and runs after all sync code.
- **Q2:** `oops`, then `after catch`. The error skips the `then` that logs "skipped", and `.catch` returns normally, so the chain recovers.
- **Q3:** `1`. A non-function passed to `.then` is ignored and the value passes through.
- **Q4:** `caught`, then `caught2`. The first `.catch` handles `p`. The `.then` with no rejection handler passes the rejection along, and its own `.catch` handles it.
- **Q5:** `x`. The value returned from `.finally` is ignored.

## Recap

- A promise is `pending` -> `fulfilled` or `rejected`, and settles **once**.
- The executor runs synchronously; `.then/.catch/.finally` callbacks run **asynchronously** (as microtasks).
- `.then` returns a new promise, so chains work; **return** values/promises to pass them along.
- A thrown error or rejection skips to the next `.catch`; returning from `.catch` recovers.
- Always end a chain with `.catch` (or use `try/catch` with `async/await`).

## Checklist

- [ ] I can name the 3 states and explain "settled"
- [ ] I can explain what the executor runs synchronously
- [ ] I know what each kind of `.then` return value does to the chain
- [ ] I can write `sleep(ms)` from memory
- [ ] I got Q1 to Q5 right without looking
