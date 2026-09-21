# Closures

A closure is when a function "remembers" the variables from its lexical scope even after the outer function has finished executing.

```js
function makeCounter() {
  let count = 0;
  return function () {
    count++;
    return count;
  };
}
const counter = makeCounter();
counter(); // 1
counter(); // 2
counter(); // 3 — `count` persists between calls
```

**Practical use — private variables / data hiding:**

```js
function createBankAccount(balance) {
  return {
    deposit(amount) {
      balance += amount;
      return balance;
    },
    withdraw(amount) {
      balance -= amount;
      return balance;
    },
    getBalance() {
      return balance;
    },
  };
}
const account = createBankAccount(100);
account.deposit(50); // 150
// `balance` cannot be accessed directly from outside
```

**Classic loop gotcha (interview favorite):**

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// 3 3 3 — var is function-scoped, all callbacks share the same `i`

for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 0);
}
// 0 1 2 — let creates a new binding per iteration
```
