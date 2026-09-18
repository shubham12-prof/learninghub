## var vs let vs const

## Explanation

These are the three ways to declare a variable in JavaScript.

- **`var`** — the old way (pre-2015). Function-scoped, can be redeclared and updated, gets "hoisted" and initialized as `undefined`.
- **`let`** — modern way for values that will change. Block-scoped, can be updated but not redeclared in the same scope.
- **`const`** — modern way for values that won't be reassigned. Block-scoped, cannot be updated or redeclared. Note: for objects/arrays, `const` only prevents reassigning the variable itself — the contents can still be mutated.

## Examples

```js
var a = 1;
var a = 2; // allowed, redeclare
a = 3; // allowed, update

let b = 1;
// let b = 2; // Error: already declared
b = 2; // allowed, update

const c = 1;
// c = 2; // Error: cannot reassign

const arr = [1, 2];
arr.push(3); // allowed! we're mutating, not reassigning
console.log(arr); // [1, 2, 3]
```

### Scope difference

```js
if (true) {
  var x = 10;
  let y = 20;
}
console.log(x); // 10 (var leaks out of the block)
console.log(y); // Error: y is not defined (let stays inside the block)
```

## Why it matters

`var`'s function-scoping and hoisting behavior caused a lot of bugs in old JS code (variables "leaking" out of loops and if-blocks). Modern JS style: use `const` by default, use `let` only when you know the value will change, and avoid `var` entirely.

## Questions

1. What's the main scoping difference between `var` and `let`/`const`?
2. Can you reassign a `const` array's elements? Can you reassign the array itself to a new array?
3. Why do most style guides recommend avoiding `var` in modern code?
4. What happens if you try to redeclare a `let` variable in the same scope?
5. Predict the output:

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
```
