# Execution Context

The environment in which JS code is evaluated and executed. Every context has:

1. **Memory (Variable Environment)** — where variables/functions are stored (hoisting phase)
2. **Code (Thread of Execution)** — where code runs line by line
3. A reference to `this`

Types:

- **Global Execution Context (GEC)** — created once, when the script starts
- **Function Execution Context (FEC)** — created every time a function is invoked
- **Eval Execution Context** — for code inside `eval()` (rare)

```js
function multiply(a, b) {
  return a * b;
}
function square(n) {
  return multiply(n, n);
}
console.log(square(5)); // 25
```

Execution order: GEC created → `square(5)` called → new FEC for `square` pushed → `multiply` called inside → new FEC for `multiply` pushed → returns → popped → `square`'s FEC popped.
