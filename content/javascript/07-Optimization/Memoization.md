# Memoization

Caches the result of expensive function calls, returning the cached result for the same inputs instead of recomputing.

```js
function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

const slowSquare = (n) => {
  for (let i = 0; i < 1e8; i++) {} // simulate expensive work
  return n * n;
};
const fastSquare = memoize(slowSquare);
fastSquare(5); // slow first time
fastSquare(5); // instant — cached
```

Classic use case: memoized Fibonacci.

```js
const fib = memoize((n) => (n <= 1 ? n : fib(n - 1) + fib(n - 2)));
fib(40); // fast, thanks to caching sub-results
```
