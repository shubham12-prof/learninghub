# Hoisting

JS moves variable/function **declarations** to the top of their scope during the compile phase (memory creation phase), before code runs.

```js
console.log(a); // undefined (not ReferenceError!) — var is hoisted & initialized
var a = 5;

console.log(sayHi()); // works — function declarations are fully hoisted
function sayHi() {
  return "hi";
}

console.log(b); // ReferenceError — TDZ
let b = 10;
```

**Function expressions and arrow functions are NOT hoisted the same way** — only the variable name is hoisted (as `undefined` for `var`), not the assignment.

```js
console.log(greet); // undefined
var greet = function () {
  console.log("hi");
};
```
