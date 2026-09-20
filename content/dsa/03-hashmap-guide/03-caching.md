# Caching

Using a hash map to store previously computed results so you never redo the same expensive work twice. This is the foundation of **memoization**.

## Example — memoized Fibonacci

```javascript
function fib(n, memo = new Map()) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n); // cache hit

  const result = fib(n - 1, memo) + fib(n - 2, memo);
  memo.set(n, result); // cache the result
  return result;
}

console.log(fib(40)); // fast, thanks to caching — naive recursion would be very slow
```

## Generic memoize wrapper

```javascript
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
  for (let i = 0; i < 1e8; i++);
  return n * n;
};
const fastSquare = memoize(slowSquare);

fastSquare(5); // slow the first time
fastSquare(5); // instant — served from cache
```

## LRU Cache concept (common interview question)

A cache with a size limit that evicts the _Least Recently Used_ item when full. Typically built with a `Map` (which preserves insertion order in JS) plus re-inserting on access to mark it "recently used."

```javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value); // move to "most recently used" end
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) this.cache.delete(key);
    else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey); // evict least recently used
    }
    this.cache.set(key, value);
  }
}
```

## Complexity

O(1) average time per cache read/write. Trades memory (O(n) space) for speed.

## Where it shows up

Memoized recursion (Fibonacci, climbing stairs), dynamic programming, API response caching, LRU/LFU cache design questions.
