# Closures

## Explanation
A closure is when a function "remembers" the variables from the scope it was created in, even after that outer scope has finished running. This happens because of lexical scoping — functions keep a reference to their surrounding variables, not a snapshot of their values at one point in time.

## Examples
```js
function makeCounter() {
  let count = 0; // this variable is "enclosed"
  return function () {
    count++;
    return count;
  };
}

const counter = makeCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3
```
Even though `makeCounter()` has finished running, the returned function still has access to `count` — that's the closure.

### Practical use: private variables
```js
function createBankAccount(balance) {
  return {
    deposit(amount) { balance += amount; return balance; },
    withdraw(amount) { balance -= amount; return balance; },
    getBalance() { return balance; }
  };
}

const account = createBankAccount(100);
account.deposit(50);
console.log(account.getBalance()); // 150
// balance itself is not directly accessible — it's "private"
```

## Why it matters
Closures are the foundation of many JS patterns: private data, function factories, memoization, callbacks with saved state, and the module pattern. They're also one of the most commonly asked interview topics.

## Questions
1. In your own words, what is a closure?
2. Why does the `counter` function in the first example keep incrementing instead of always returning 1?
3. How do closures let you simulate "private" variables in JavaScript?
4. Predict the output:
```js
function outer() {
  let msg = "hello";
  function inner() { console.log(msg); }
  msg = "changed";
  return inner;
}
outer()(); // ?
```
5. Give a real-world use case where a closure would be genuinely useful (not just a toy example).
