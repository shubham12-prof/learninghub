# Scope

## Explanation
Scope determines where in your code a variable is accessible. JavaScript has:

- **Global scope** — declared outside any function/block, accessible everywhere.
- **Function scope** — variables declared inside a function are only accessible inside that function (`var`, `let`, `const` all respect this).
- **Block scope** — variables declared with `let`/`const` inside `{ }` (if-blocks, loops, etc.) are only accessible inside that block. `var` ignores block scope.
- **Lexical scope** — a function can access variables from the scope it was *defined* in, not where it's *called* from. This is how closures work.

## Examples
```js
let globalVar = "I'm global";

function outer() {
  let outerVar = "I'm in outer";

  function inner() {
    let innerVar = "I'm in inner";
    console.log(globalVar); // accessible
    console.log(outerVar);  // accessible (lexical scope)
    console.log(innerVar);  // accessible
  }

  inner();
  console.log(innerVar); // Error: innerVar is not defined here
}
```

```js
if (true) {
  let blockScoped = "only visible in this block";
}
console.log(blockScoped); // Error
```

## Why it matters
Understanding scope prevents accidental variable overwrites, helps you avoid polluting the global scope (a common source of bugs in larger apps), and is the foundation for understanding closures.

## Questions
1. What's the difference between block scope and function scope?
2. Why can an inner function access variables from its outer function but not vice versa?
3. Is scope determined by where a function is called or where it's defined?
4. What problems can arise from overusing global variables?
5. Will this work? Why or why not?
```js
function test() {
  if (true) {
    var v = "var value";
  }
  console.log(v);
}
```
