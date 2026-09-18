# Promise.all / allSettled / race / any

## Explanation
These are static helper methods for working with *multiple* Promises at once.

- **`Promise.all(promises)`** — waits for ALL to succeed. Resolves with an array of results, in order. If ANY one rejects, the whole thing rejects immediately (fail-fast).
- **`Promise.allSettled(promises)`** — waits for ALL to finish, regardless of success/failure. Resolves with an array of `{status, value/reason}` objects — never rejects.
- **`Promise.race(promises)`** — resolves or rejects as soon as the FIRST promise settles (whichever finishes first, win or lose).
- **`Promise.any(promises)`** — resolves as soon as the FIRST one succeeds. Only rejects if ALL of them fail.

## Examples
```js
const p1 = fetch("/api/user");
const p2 = fetch("/api/posts");
const p3 = fetch("/api/comments");

// all: fastest way to run independent requests in parallel
const [user, posts, comments] = await Promise.all([p1, p2, p3]);
// If ANY fails, the whole thing throws immediately

// allSettled: get results even if some fail
const results = await Promise.allSettled([p1, p2, p3]);
results.forEach(r => {
  if (r.status === "fulfilled") console.log(r.value);
  else console.log("Failed:", r.reason);
});

// race: useful for timeouts
const timeout = new Promise((_, reject) =>
  setTimeout(() => reject(new Error("Timeout!")), 5000)
);
const result = await Promise.race([fetch("/api/slow"), timeout]);

// any: get the first SUCCESSFUL result, ignore failures unless all fail
const fastestSuccess = await Promise.any([p1, p2, p3]);
```

## Why it matters
Running requests in parallel with `Promise.all` instead of awaiting them one by one is a common performance improvement. `allSettled` is great for "best effort" operations where partial failure is okay. `race` is the standard pattern for implementing timeouts.

## Questions
1. What happens to `Promise.all` if just one of the input promises rejects?
2. How does `Promise.allSettled` differ from `Promise.all` in terms of failure handling?
3. Give a practical use case for `Promise.race`.
4. What's the difference between `Promise.race` and `Promise.any`?
5. You need to fetch data from 3 independent APIs and want the app to keep working even if one fails. Which method should you use and why?
