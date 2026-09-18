# Higher-Order Functions

## Explanation
A higher-order function is a function that does at least one of the following:
- Takes another function as an argument, **or**
- Returns a function as its result

Functions in JavaScript are "first-class citizens" — they can be stored in variables, passed around, and returned, just like any other value. This is what makes higher-order functions possible.

## Examples
```js
// Takes a function as an argument
function applyOperation(a, b, operation) {
  return operation(a, b);
}
const sum = applyOperation(3, 4, (x, y) => x + y); // 7

// Returns a function
function multiplyBy(factor) {
  return function (num) {
    return num * factor;
  };
}
const double = multiplyBy(2);
console.log(double(5)); // 10

// Built-in higher-order functions you already use
[1, 2, 3].map(n => n * 2);          // takes a function
[1, 2, 3].filter(n => n > 1);       // takes a function
document.addEventListener('click', handler); // takes a function
```

## Why it matters
Higher-order functions enable powerful, reusable, declarative patterns — instead of writing manual loops for every task, you compose small functions together. `map`, `filter`, `reduce`, `sort`, `bind`, `setTimeout`, and most of React's API are all built on this idea.

## Questions
1. What two things make a function "higher-order"?
2. Why is it necessary for functions to be "first-class citizens" for higher-order functions to work?
3. Give an example of a built-in JS method that is a higher-order function.
4. Write a higher-order function `repeat(fn, times)` that calls `fn` a given number of times.
5. What's the benefit of writing higher-order functions instead of duplicating logic in separate named functions?
