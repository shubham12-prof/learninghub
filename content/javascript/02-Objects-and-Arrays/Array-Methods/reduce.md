# reduce — accumulates values into a single result

```js
const sum = nums.reduce((acc, n) => acc + n, 0); // 6

// Common interview task: count occurrences
const words = ["a", "b", "a", "c", "b", "a"];
const counts = words.reduce((acc, w) => {
  acc[w] = (acc[w] || 0) + 1;
  return acc;
}, {}); // {a:3, b:2, c:1}
```
