# Scope

Scope determines where a variable is accessible.

```js
let globalVar = "I'm global";

function outer() {
  let outerVar = "I'm in outer";

  function inner() {
    let innerVar = "I'm in inner";
    console.log(globalVar, outerVar, innerVar); // all accessible
  }
  inner();
  // console.log(innerVar); // ReferenceError — not accessible here
}
```

Three kinds: **global scope**, **function scope**, **block scope** (`{}` — only for `let`/`const`).
