# Module Pattern

Uses closures (or ES modules) to create private state and expose only a public API — encapsulation before ES6 classes/modules existed.

```js
const CounterModule = (function () {
  let count = 0; // private — inaccessible from outside

  function increment() {
    count++;
    return count;
  }
  function reset() {
    count = 0;
  }
  function getCount() {
    return count;
  }

  return { increment, reset, getCount }; // public API
})();

CounterModule.increment(); // 1
CounterModule.increment(); // 2
CounterModule.count; // undefined — truly private
```

Modern equivalent with ES modules (each file has its own private scope automatically):

```js
// counter.js
let count = 0;
export function increment() {
  return ++count;
}
export function getCount() {
  return count;
}
```
