# Hoisting

## Explanation
Hoisting is JavaScript's behavior of moving declarations to the top of their scope *before* code runs.

- `var` declarations are hoisted and initialized as `undefined`. You can reference them before the line they're declared on, and you'll just get `undefined` instead of an error.
- `let` and `const` are also hoisted, but they land in a "temporal dead zone" (TDZ) — you cannot access them before their declaration line, you'll get a `ReferenceError`.
- Function declarations (`function foo() {}`) are fully hoisted — including their body — so you can call them before they appear in the code. Function expressions (`const foo = function(){}`) are not.

## Examples
```js
console.log(a); // undefined (not an error)
var a = 5;

console.log(b); // ReferenceError: Cannot access 'b' before initialization
let b = 5;

sayHi(); // works! "Hi"
function sayHi() { console.log("Hi"); }

sayBye(); // TypeError: sayBye is not a function
var sayBye = function() { console.log("Bye"); };
```

## Why it matters
Hoisting explains confusing bugs like a variable being `undefined` instead of throwing an error, or functions seeming to "work before they're defined." Knowing this helps you reason about *why* certain code order issues happen, and reinforces why `let`/`const` are safer than `var`.

## Questions
1. What value does a hoisted `var` have before its declaration line runs?
2. What is the "temporal dead zone" and which declarations does it apply to?
3. Why can you call a function declaration before it appears in the file, but not a function expression assigned to a `const`?
4. Predict the output:
```js
console.log(typeof x);
let x = 10;
```
5. Why is hoisting considered a common source of bugs for beginners?
