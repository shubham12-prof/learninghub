# Coding Challenges (with solutions)

### 1. Implement `debounce` (already covered in Optimization, but a favorite live-coding question)

```js
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
```

### 2. Flatten a nested array without using `.flat()`

```js
function flatten(arr) {
  return arr.reduce(
    (acc, item) => acc.concat(Array.isArray(item) ? flatten(item) : item),
    [],
  );
}
flatten([1, [2, [3, [4, 5]]]]); // [1,2,3,4,5]
```

### 3. Implement `Array.prototype.map` from scratch

```js
Array.prototype.myMap = function (callback) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    result.push(callback(this[i], i, this));
  }
  return result;
};
[1, 2, 3].myMap((n) => n * 2); // [2,4,6]
```

### 4. Curry a function

```js
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn(...args);
    return (...more) => curried(...args, ...more);
  };
}
const add3 = curry((a, b, c) => a + b + c);
add3(1)(2)(3); // 6
add3(1, 2)(3); // 6
add3(1, 2, 3); // 6
```

### 5. Deep clone an object (without `structuredClone`)

```js
function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  return Object.fromEntries(
    Object.entries(obj).map(([key, val]) => [key, deepClone(val)]),
  );
}
```

### 6. Implement a simple `Promise.all`

```js
function myPromiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let completed = 0;
    if (promises.length === 0) resolve([]);
    promises.forEach((p, i) => {
      Promise.resolve(p)
        .then((val) => {
          results[i] = val;
          completed++;
          if (completed === promises.length) resolve(results);
        })
        .catch(reject);
    });
  });
}
```

### 7. Find the first non-repeating character in a string

```js
function firstNonRepeating(str) {
  const counts = {};
  for (const ch of str) counts[ch] = (counts[ch] || 0) + 1;
  for (const ch of str) if (counts[ch] === 1) return ch;
  return null;
}
firstNonRepeating("swiss"); // "w"
```

### 8. Implement a basic EventEmitter (Observer pattern, covered in Design Patterns)

```js
class EventEmitter {
  listeners = {};
  on(event, cb) {
    (this.listeners[event] ??= []).push(cb);
  }
  emit(event, data) {
    (this.listeners[event] || []).forEach((cb) => cb(data));
  }
}
```

### 9. Check if a string has balanced parentheses

```js
function isBalanced(str) {
  const stack = [];
  const pairs = { ")": "(", "]": "[", "}": "{" };
  for (const ch of str) {
    if ("([{".includes(ch)) stack.push(ch);
    else if (")]}".includes(ch)) {
      if (stack.pop() !== pairs[ch]) return false;
    }
  }
  return stack.length === 0;
}
isBalanced("({[]})"); // true
isBalanced("({[})"); // false
```

### 10. Implement a simple pub/sub-based memoize with expiry (TTL cache)

```js
function memoizeWithTTL(fn, ttl) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.time < ttl) return cached.value;
    const value = fn(...args);
    cache.set(key, { value, time: Date.now() });
    return value;
  };
}
```
