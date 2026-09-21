# Functions

```js
// Declaration — hoisted fully, can be called before defined
function add(a, b) {
  return a + b;
}

// Expression — not hoisted the same way
const subtract = function (a, b) {
  return a - b;
};

// IIFE (Immediately Invoked Function Expression)
(function () {
  console.log("runs immediately");
})();
```
