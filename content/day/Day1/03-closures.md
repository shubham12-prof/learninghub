# 03 - Closures

> **Time to learn:** ~35 min | **Level:** Core concept | **Interview frequency:** Extremely high

## 1. What is a closure?

A **closure** is a function that **remembers the variables from the place where it was created**, even after that outer function has finished running.

Formally: a closure = a function + a reference to its surrounding (lexical) environment.

Every function in JavaScript forms a closure. It becomes *interesting* when you return an inner function or pass it somewhere else, and it still uses the outer variables.

## 2. Analogy

Imagine you leave your hometown for a new city, but you carry a **backpack** with things from home. Even though you are far away, you can still use what is in the backpack. The function is you, the backpack is the closure, and the hometown is the outer function that already finished.

## 3. Examples

### 3.1 The basic closure

```js
function outer() {
  const message = "Hello from outer";

  function inner() {
    console.log(message);
  }

  return inner;
}

const fn = outer(); // outer() has finished running
fn();               // "Hello from outer"  -> inner still remembers `message`
```

### 3.2 A counter with private data

```js
function createCounter() {
  let count = 0;          // private: nobody outside can touch it directly

  return {
    increment() { count++; return count; },
    decrement() { count--; return count; },
    get()       { return count; }
  };
}

const counter = createCounter();
console.log(counter.increment()); // 1
console.log(counter.increment()); // 2
console.log(counter.decrement()); // 1
console.log(counter.count);       // undefined -> `count` is truly private
```

Each call to `createCounter()` makes a **new, separate** `count`:

```js
const a = createCounter();
const b = createCounter();
a.increment();
a.increment();
console.log(a.get()); // 2
console.log(b.get()); // 0
```

### 3.3 The classic loop problem (interview favourite)

```js
for (var i = 0; i < 3; i++) {
  setTimeout(function () {
    console.log(i);
  }, 100);
}
// Output: 3 3 3
```

**Why?** `var` is function scoped, so there is only **one** `i` shared by all three callbacks. By the time the timers fire, the loop is done and `i` is `3`.

**Fix 1: use `let`** (new `i` per iteration)

```js
for (let i = 0; i < 3; i++) {
  setTimeout(function () {
    console.log(i);
  }, 100);
}
// Output: 0 1 2
```

**Fix 2: use an IIFE** (the old-school way; creates a new scope per iteration)

```js
for (var i = 0; i < 3; i++) {
  (function (j) {
    setTimeout(function () {
      console.log(j);
    }, 100);
  })(i);
}
// Output: 0 1 2
```

### 3.4 Function factory

```js
function multiplier(factor) {
  return function (number) {
    return number * factor;
  };
}

const double = multiplier(2);
const triple = multiplier(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15
```

### 3.5 Run something only once

```js
function once(fn) {
  let called = false;
  let result;

  return function (...args) {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
}

const init = once(() => {
  console.log("Initialised!");
  return 42;
});

console.log(init()); // logs "Initialised!" then 42
console.log(init()); // 42 (does not run again)
```

### 3.6 Memoization (cache results)

```js
function memoize(fn) {
  const cache = {};

  return function (n) {
    if (n in cache) return cache[n];
    cache[n] = fn(n);
    return cache[n];
  };
}

const slowSquare = (n) => n * n;
const fastSquare = memoize(slowSquare);

console.log(fastSquare(9)); // 81 (computed)
console.log(fastSquare(9)); // 81 (from cache)
```

## 4. Where closures are used in real projects

- **Data privacy** (module pattern, counters, private state)
- **Event handlers** that need to remember data
- **Callbacks / timers** (`setTimeout`, `fetch().then`)
- **Function factories** and **currying**
- **Debounce / throttle**, `once`, `memoize`
- **React hooks** (`useState` relies on closures)

## 5. Common mistakes

1. Using `var` in loops with async callbacks (the 3-3-3 problem).
2. **Memory leaks:** a closure keeps its outer variables alive. If it holds large objects you no longer need, they cannot be garbage collected. Clean up listeners and set references to `null` when done.
3. Thinking the closure copies the value. It keeps a **reference to the variable**, so it sees later changes:
   ```js
   function make() {
     let n = 1;
     const show = () => console.log(n);
     n = 2;
     return show;
   }
   make()(); // 2, not 1
   ```

## 6. Predict the output

**Q1**
```js
function outer() {
  let x = 10;
  return function () {
    x++;
    return x;
  };
}
const f = outer();
console.log(f());
console.log(f());
```

**Q2**
```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
```

**Q3**
```js
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
```

**Q4**
```js
function make() {
  let n = 1;
  const show = () => console.log(n);
  n = 2;
  return show;
}
make()();
```

**Q5**
```js
const a = (function () {
  let c = 0;
  return () => ++c;
})();
const b = (function () {
  let c = 0;
  return () => ++c;
})();
console.log(a(), a(), b());
```

## 7. Answers

- **Q1:** `11` then `12`. The same `x` is remembered between calls.
- **Q2:** `3 3 3`
- **Q3:** `0 1 2`
- **Q4:** `2`. The closure sees the variable, not a snapshot.
- **Q5:** `1 2 1`. Each IIFE created its own `c`.

## Recap

- Closure = function + its remembered outer variables.
- It keeps a **live reference**, not a copy.
- Great for private state, factories, callbacks, memoization.
- `var` in loops + async = classic bug. Fix with `let` or an IIFE.
- Be careful about memory held by long-lived closures.

## Checklist

- [ ] I can explain closure in 30 seconds without code
- [ ] I can write the counter example from memory
- [ ] I can explain and fix the 3-3-3 loop problem two ways
- [ ] I got Q1 to Q5 right without looking
