# Promise Methods

```js
// Promise.all — waits for ALL to resolve; rejects fast if ANY rejects
Promise.all([p1, p2, p3]).then((results) => console.log(results));

// Promise.allSettled — waits for ALL, regardless of outcome
Promise.allSettled([p1, p2, p3]).then((results) => {
  // [{status:'fulfilled', value}, {status:'rejected', reason}, ...]
});

// Promise.race — settles as soon as the FIRST promise settles (resolve or reject)
Promise.race([p1, p2]).then((first) => console.log(first));

// Promise.any — settles as soon as the FIRST promise FULFILLS; rejects only if ALL reject
Promise.any([p1, p2]).then((firstSuccess) => console.log(firstSuccess));
```

| Method     | Resolves when          | Rejects when            |
| ---------- | ---------------------- | ----------------------- |
| all        | all resolve            | any one rejects         |
| allSettled | all settle (always)    | never                   |
| race       | first settles (either) | first settles as reject |
| any        | first fulfills         | all reject              |
