# Lexical Environment

Every time a function or block runs, JS creates a Lexical Environment: a structure holding variable bindings plus a reference to the **parent** lexical environment (based on where the code is _written_, not where it's called from). This chain is called the **scope chain**.

```js
function outer() {
  let a = 10;
  function inner() {
    console.log(a); // JS looks in inner's env -> not found -> outer's env -> found (10)
  }
  return inner;
}
outer()(); // 10
```

This is also the mechanism that powers **closures**.
