# sort — sorts in place (mutates!), default is lexicographic (string) order

```js
[10, 1, 21].sort(); // [1, 10, 21] — WRONG for numbers by default!
[10, 1, 21].sort((a, b) => a - b); // [1, 10, 21] — correct ascending
[10, 1, 21].sort((a, b) => b - a); // [21, 10, 1] — descending
```

**Interview gotcha:** `sort()` converts elements to strings by default, so `[10, 2, 1].sort()` gives `[1, 10, 2]`. Always pass a comparator for numbers.
