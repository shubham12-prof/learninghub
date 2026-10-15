# 10 - Interview: Closures

> **Time to learn:** ~35 min | **Interview frequency:** Almost guaranteed
> Read `03-closures.md` first. This file is about **how to answer** in an interview.

## 1. The 30-second answer (say this out loud)

> "A closure is a function that remembers the variables from the scope where it was created, even after that outer function has finished executing. This happens because functions in JavaScript carry a reference to their lexical environment. I use closures for things like private state, function factories, memoization, debounce and event handlers. One thing to watch is that closures keep their outer variables alive, so they can cause memory leaks if misused."

## 2. The 2-minute answer with an example

Use this structure: **definition -> tiny example -> why it works -> real use**.

```js
function makeCounter() {
  let count = 0; // lives in makeCounter's scope
  return function () {
    count++;
    return count;
  };
}

const counter = makeCounter();
counter(); // 1
counter(); // 2
```

Say:

> "`makeCounter` has already returned, so normally `count` would be gone. But the inner function still references it, so JavaScript keeps `count` alive. Each call to `makeCounter()` creates a new independent `count`. This is how we get private data in JavaScript, because nothing outside can access `count` directly."

## 3. Common interview questions and model answers

### Q1. What is a closure?

See the 30-second answer above.

### Q2. What is lexical scope and how is it related?

Lexical scope means a function's accessible variables are determined by **where it is written** in the code. A closure is what makes that possible even after the function is passed around or returned: the function carries a link to its lexical environment.

### Q3. Is every function a closure?

Technically yes, every function keeps a reference to its outer environment. But we usually only call it a closure when it **uses variables from an outer function and is used outside of / after that function's execution** (returned, passed as a callback, stored).

### Q4. What are practical uses of closures?

- **Data privacy / encapsulation** (module pattern, counters)
- **Function factories** (`multiplier(2)`)
- **Callbacks and event handlers** that remember state
- **Memoization / caching**
- **`once`, debounce and throttle**
- **Currying and partial application**
- **React hooks** (state is kept via closures)

### Q5. Do closures copy values or reference variables?

They hold a **reference to the variable**, not a snapshot. If the variable changes later, the closure sees the new value.

```js
function make() {
  let n = 1;
  const show = () => console.log(n);
  n = 2;
  return show;
}
make()(); // 2
```

### Q6. What are the downsides of closures?

**Memory.** Variables referenced by a closure can't be garbage collected while the closure is reachable. Big objects captured by long-lived closures (event listeners never removed, timers never cleared) can leak memory. Fix: remove listeners, clear timers, set references to `null` when finished.

### Q7. Explain the `var` + `setTimeout` loop problem and fix it.

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// 3 3 3
```

> "`var` is function scoped so there's a single `i` shared by all callbacks. By the time the timers fire, the loop has finished and `i` is 3. Fix 1: use `let`, which creates a new binding per iteration. Fix 2: wrap in an IIFE that receives `i` as a parameter. Fix 3: use `setTimeout`'s extra argument: `setTimeout(console.log, 100, i)`."

```js
// Fix 1
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i), 100);

// Fix 2
for (var i = 0; i < 3; i++) {
  ((j) => setTimeout(() => console.log(j), 100))(i);
}

// Fix 3
for (var i = 0; i < 3; i++) setTimeout(console.log, 100, i);
```

### Q8. How would you create private variables in JavaScript?

Using a closure (module pattern):

```js
function createBankAccount(initial) {
  let balance = initial; // private

  return {
    deposit(amount) {
      if (amount <= 0) throw new Error("Invalid amount");
      balance += amount;
      return balance;
    },
    withdraw(amount) {
      if (amount > balance) throw new Error("Insufficient funds");
      balance -= amount;
      return balance;
    },
    getBalance: () => balance,
  };
}

const acc = createBankAccount(100);
acc.deposit(50); // 150
acc.balance; // undefined (private)
```

(Modern alternative: class private fields `#balance`.)

### Q9. Write a function that can only be called once.

```js
function once(fn) {
  let called = false;
  let result;
  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}
```

### Q10. Write a debounce function.

```js
function debounce(fn, delay) {
  let timerId; // remembered by the closure
  return function (...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Usage: run the search only after the user stops typing for 300ms
const onType = debounce((text) => console.log("Search:", text), 300);
```

This is a very common real-world closure question, and it's a good one for your LearningHub project (e.g. a course search box).

### Q11. Write a function `add(a)(b)(c)` (currying).

```js
const add = (a) => (b) => (c) => a + b + c;
add(1)(2)(3); // 6
```

### Q12. Write a function that remembers how many times it was called.

```js
function trackCalls(fn) {
  let calls = 0;
  const wrapped = (...args) => {
    calls++;
    return fn(...args);
  };
  wrapped.getCalls = () => calls;
  return wrapped;
}
```

## 4. Output prediction questions

**Q1**

```js
function outer() {
  let a = 1;
  function inner() {
    a++;
    console.log(a);
  }
  return inner;
}
const fn = outer();
fn();
fn();
const fn2 = outer();
fn2();
```

**Q2**

```js
var funcs = [];
for (var i = 0; i < 3; i++) {
  funcs.push(function () {
    return i;
  });
}
console.log(funcs[0](), funcs[1](), funcs[2]());
```

**Q3**

```js
var funcs = [];
for (let i = 0; i < 3; i++) {
  funcs.push(function () {
    return i;
  });
}
console.log(funcs[0](), funcs[1](), funcs[2]());
```

**Q4**

```js
function counter() {
  let c = 0;
  return {
    inc: () => ++c,
    get: () => c,
  };
}
const a = counter();
const b = counter();
a.inc();
a.inc();
b.inc();
console.log(a.get(), b.get());
```

**Q5**

```js
let x = "global";
function show() {
  console.log(x);
}
function run() {
  let x = "local";
  show();
}
run();
```

## 5. Answers

- **Q1:** `2`, `3`, `2`. `fn` shares one `a`; `fn2` gets a brand new `a`.
- **Q2:** `3 3 3`
- **Q3:** `0 1 2`
- **Q4:** `2 1`
- **Q5:** `"global"`. `show` closes over the scope where it was **defined**, not where it was called.

## 6. Tips for the interview

- Start with the **definition in one sentence**, then give a **small example**. Don't ramble.
- Always mention **lexical scope**: it shows you understand _why_ closures work.
- Mention **one real use** from your own work (for LearningHub: debounce on search, a "mark complete" counter, a once-only init).
- Mention the **memory** downside to show depth.
- If asked to code, **talk while you code**: "this `count` is captured by the returned function...".

## Recap

- Closure = function + remembered lexical environment.
- Holds references, not copies.
- Uses: privacy, factories, callbacks, memoize, once, debounce, currying.
- Downside: possible memory retention.
- Classic bug: `var` in loops with async callbacks.

## Checklist

- [ ] I can say the 30-second answer without notes
- [ ] I can write counter, `once` and `debounce` from memory
- [ ] I can fix the loop problem in 3 ways
- [ ] I can explain the memory trade-off
- [ ] I got Q1 to Q5 right without looking
