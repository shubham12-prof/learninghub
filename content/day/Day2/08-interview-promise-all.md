# 08 - Interview: `Promise.all` (and its relatives)

> **Time to learn:** ~40 min | **Interview frequency:** Almost guaranteed
> Read `01-promises.md` first.

## 1. The 30-second answer (say this out loud)

> "`Promise.all` takes an iterable of promises and returns a single promise. It **fulfils with an array of all the results, in the same order as the input**, once **every** promise has fulfilled. If **any** promise rejects, it **rejects immediately** with that first reason (fail-fast). It runs the promises **in parallel**, so it's the way to do independent async work concurrently. If I need every outcome even when some fail, I use `Promise.allSettled`."

## 2. The four combinators side by side

|                  | **`Promise.all`**               | **`Promise.allSettled`**                        | **`Promise.race`**                   | **`Promise.any`**                  |
| ---------------- | ------------------------------- | ----------------------------------------------- | ------------------------------------ | ---------------------------------- |
| Fulfils when     | **all** fulfil                  | **all** settle                                  | the **first** settles _as fulfilled_ | the **first** fulfils              |
| Fulfilment value | array of values                 | array of `{status, value/reason}`               | that first value                     | that first value                   |
| Rejects when     | **any** rejects (first)         | **never**                                       | the first settles _as rejected_      | **all** reject (`AggregateError`)  |
| Empty `[]`       | fulfils with `[]`               | fulfils with `[]`                               | **never settles** (forever pending)  | rejects (`AggregateError`)         |
| Typical use      | load all data needed for a page | "run everything, report successes and failures" | timeouts, first response             | fastest of several mirrors/servers |

## 3. Analogy

Four friends going to the cinema:

- **`all`**: "We only go if **everybody** can come. If anyone cancels, we cancel immediately."
- **`allSettled`**: "Everyone replies yes or no. We wait for **every reply**, then decide."
- **`race`**: "Whoever **answers first**, yes or no, decides for the group."
- **`any`**: "We go with the **first person who says yes**. We only give up if **everyone** says no."

## 4. Examples

Helper used in all the examples:

```js
const sleep = (ms, value, fail = false) =>
  new Promise((resolve, reject) =>
    setTimeout(() => (fail ? reject(new Error(value)) : resolve(value)), ms),
  );
```

### 4.1 `Promise.all`: order is preserved, values can be non-promises

```js
Promise.all([sleep(30, "a"), sleep(10, "b"), 3]).then(console.log);
// [ 'a', 'b', 3 ]    <- same order as the input, NOT the order they finished
```

### 4.2 Fail-fast

```js
Promise.all([sleep(10, "x", true), sleep(20, "y")])
  .then((values) => console.log(values))
  .catch((err) => console.log("error:", err.message));
// error: x
```

The rejection arrives after 10 ms; `Promise.all` does **not wait** for the 20 ms one. But note: the other promise **is not cancelled**. It keeps running; its result is just ignored. Promises can't be cancelled (use `AbortController` for `fetch`).

### 4.3 `Promise.allSettled`

```js
const results = await Promise.allSettled([
  sleep(10, "ok"),
  sleep(5, "bad", true),
]);

console.log(results.map((r) => r.status));
// [ 'fulfilled', 'rejected' ]

for (const r of results) {
  if (r.status === "fulfilled") console.log("value:", r.value);
  else console.log("reason:", r.reason.message);
}
// value: ok
// reason: bad
```

### 4.4 `Promise.race`: a timeout

```js
const timeout = (ms) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), ms),
  );

Promise.race([fetch("/slow-api"), timeout(3000)])
  .then((res) => console.log("got response"))
  .catch((err) => console.log(err.message)); // "Timeout" if the fetch takes > 3s
```

### 4.5 `Promise.any`: the first success

```js
Promise.any([sleep(10, "e1", true), sleep(20, "ok")]).then(console.log);
// ok

Promise.any([
  Promise.reject(new Error("a")),
  Promise.reject(new Error("b")),
]).catch((e) => {
  console.log(e.constructor.name); // AggregateError
  console.log(e.errors.map((x) => x.message)); // [ 'a', 'b' ]
});
```

### 4.6 Sequential vs `Promise.all` (timings)

```js
// ~300ms
for (const ms of [100, 100, 100]) await sleep(ms);

// ~100ms
await Promise.all([100, 100, 100].map((ms) => sleep(ms)));
```

## 5. Implement `Promise.all` yourself (a very common coding question)

```js
function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable);
    const results = new Array(items.length); // keep results by INDEX to preserve order
    let remaining = items.length;

    if (remaining === 0) return resolve(results); // empty input -> resolve []

    items.forEach((item, index) => {
      Promise.resolve(item).then((value) => {
        // Promise.resolve handles plain values
        results[index] = value;
        remaining--;
        if (remaining === 0) resolve(results); // the LAST one to finish resolves
      }, reject); // first rejection wins (later calls are ignored)
    });
  });
}
```

Key points to say out loud:

1. Wrap each item with `Promise.resolve()` so non-promises work.
2. Store results **by index**, not by finish order.
3. Use a **counter** to know when everything is done.
4. `reject` is passed straight in: only the first rejection matters because a promise settles once.
5. Handle the **empty array** case.

### `allSettled` built on top of it

```js
function promiseAllSettled(iterable) {
  return promiseAll(
    Array.from(iterable, (item) =>
      Promise.resolve(item).then(
        (value) => ({ status: "fulfilled", value }),
        (reason) => ({ status: "rejected", reason }), // turn rejections into values -> never rejects
      ),
    ),
  );
}
```

### `race` and `any`

```js
function promiseRace(iterable) {
  return new Promise((resolve, reject) => {
    for (const item of iterable) {
      Promise.resolve(item).then(resolve, reject); // whichever settles first wins
    }
  });
}

function promiseAny(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable);
    const errors = new Array(items.length);
    let remaining = items.length;

    if (remaining === 0) {
      return reject(new AggregateError([], "All promises were rejected"));
    }

    items.forEach((item, index) => {
      Promise.resolve(item).then(resolve, (err) => {
        errors[index] = err;
        remaining--;
        if (remaining === 0)
          reject(new AggregateError(errors, "All promises were rejected"));
      });
    });
  });
}
```

## 6. Limit concurrency (the realistic follow-up)

`Promise.all(1000 requests)` fires 1000 requests at once, which can overload a server or hit rate limits. Process them with a **pool** of N workers:

```js
async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let next = 0; // shared index, thanks to the closure

  async function worker() {
    while (next < items.length) {
      const i = next++; // grab the next job (safe: JS is single-threaded)
      results[i] = await mapper(items[i], i);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

// at most 3 requests in flight at any time, results in input order
const users = await mapLimit([1, 2, 3, 4, 5, 6, 7, 8], 3, (id) =>
  fetchUser(id),
);
```

## 7. Follow-up questions interviewers ask

**Q: If one promise in `Promise.all` rejects, do the others stop?**
No. They keep running (promises can't be cancelled); `Promise.all` just rejects immediately and ignores their results.

**Q: Is the order of results the order they finished?**
No, it is the **order of the input array**, regardless of which finished first.

**Q: What does `Promise.all([])` return? And `Promise.race([])`?**
`Promise.all([])` fulfils with `[]` immediately. `Promise.race([])` **never settles**. `Promise.any([])` rejects with an `AggregateError`.

**Q: I want all results even if some fail. What do I use?**
`Promise.allSettled`, or `.catch` on each promise to convert failures to a value (`p.catch(() => null)`).

**Q: Does `Promise.all` run promises in parallel?**
The _work_ runs concurrently because the promises were already started when you created them. `Promise.all` only **waits** for them. (Single-threaded JS: the I/O such as network requests overlaps; CPU work doesn't.)

**Q: What if an item isn't a promise?**
It is treated as an already fulfilled value (`Promise.resolve(item)`).

**Q: `Promise.all` vs `await` in a `for` loop?**
`for` + `await` is sequential (sum of times). `Promise.all` is parallel (max of times). Use `Promise.all` when tasks are independent.

**Q: How do you handle errors from `Promise.all`?**
Wrap in `try/catch` when using `await`, or use `.catch()`. Remember the catch gets only the **first** rejection reason.

## 8. Predict the output

**Q1**

```js
Promise.all([sleep(30, "a"), sleep(10, "b"), 3]).then(console.log);
```

**Q2**

```js
Promise.all([sleep(10, "x", true), sleep(20, "y")])
  .then(console.log)
  .catch((e) => console.log("err", e.message));
```

**Q3**

```js
Promise.allSettled([sleep(10, "a"), sleep(5, "b", true)]).then((r) =>
  console.log(r.map((x) => x.status)),
);
```

**Q4**

```js
Promise.race([sleep(30, "slow"), sleep(10, "fast")]).then(console.log);
```

**Q5**

```js
Promise.any([sleep(10, "e1", true), sleep(20, "ok")]).then(console.log);
```

**Q6**

```js
Promise.all([]).then(console.log);
```

## 9. Answers

- **Q1:** `[ 'a', 'b', 3 ]`. Input order, and the plain `3` is fine.
- **Q2:** `err x`. Fail-fast: first rejection after 10 ms.
- **Q3:** `[ 'fulfilled', 'rejected' ]`. `allSettled` keeps input order and never rejects.
- **Q4:** `fast`.
- **Q5:** `ok`. `any` ignores rejections until one fulfils.
- **Q6:** `[]`.

## Recap

- `all`: all succeed -> array in input order; any fails -> reject immediately (others aren't cancelled).
- `allSettled`: wait for everything, never rejects, returns `{status, value | reason}`.
- `race`: first to settle wins (use for timeouts). `any`: first to **fulfil** wins, `AggregateError` if all fail.
- Know the empty-array behaviour: `all` -> `[]`, `race` -> pending forever, `any` -> rejects.
- You should be able to write `Promise.all` by hand: index-based results + counter + `Promise.resolve`.
- Use a concurrency limiter for large batches.

## Checklist

- [ ] I can say the 30-second answer without notes
- [ ] I can fill in the 4-way comparison table from memory
- [ ] I can implement `Promise.all` from scratch
- [ ] I can explain fail-fast and why other promises keep running
- [ ] I got Q1 to Q6 right without looking
