# Spread Operator

Expands an iterable into individual elements — the opposite of rest.

```js
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5]; // [1,2,3,4,5]

const obj1 = { a: 1 };
const obj2 = { ...obj1, b: 2 }; // {a:1, b:2}

function max(...args) {
  return Math.max(...args);
}
max(...[4, 8, 2]); // 8

// Shallow clone
const clonedArr = [...arr1];
const clonedObj = { ...obj1 };
```
