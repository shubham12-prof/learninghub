# Spread & Rest Operators (`...`)

## Explanation
Both use the same `...` syntax but do opposite things, and the meaning depends on context:

- **Spread** — "expands" an array/object into individual elements. Used when *calling* a function, building a new array/object, or passing arguments.
- **Rest** — "collects" multiple elements into a single array. Used in function parameters or destructuring, to gather "the rest" of the values.

## Examples

### Spread
```js
// copying/merging arrays
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5]; // [1, 2, 3, 4, 5]

// copying/merging objects
const obj1 = { a: 1, b: 2 };
const obj2 = { ...obj1, c: 3 }; // { a: 1, b: 2, c: 3 }

// overriding a property while copying
const updated = { ...obj1, b: 99 }; // { a: 1, b: 99 }

// spreading into function arguments
function sum3(a, b, c) { return a + b + c; }
const nums = [1, 2, 3];
sum3(...nums); // 6
```

### Rest
```js
// gathering remaining function arguments
function sum(...numbers) {
  return numbers.reduce((total, n) => total + n, 0);
}
sum(1, 2, 3, 4); // 10

// gathering remaining array items
const [first, ...rest] = [1, 2, 3, 4];
console.log(first, rest); // 1 [2, 3, 4]

// gathering remaining object properties
const { a, ...others } = { a: 1, b: 2, c: 3 };
console.log(a, others); // 1 { b: 2, c: 3 }
```

## Why it matters
Spread is the standard modern way to copy/merge arrays and objects without mutating the originals (important for React state updates!). Rest is essential for writing flexible functions that accept any number of arguments.

## Questions
1. How can you tell whether `...` is being used as spread or rest in a given line of code?
2. Write a one-liner to merge two objects `{a: 1}` and `{b: 2}` into a new object.
3. Why is spreading an array/object into a copy considered safer than mutating the original directly?
4. Predict the output:
```js
function logAll(first, ...others) {
  console.log(first, others);
}
logAll(1, 2, 3, 4);
```
5. What would happen if you used rest parameters anywhere other than the *last* parameter in a function?
