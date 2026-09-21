# throw

Manually raise an error — can throw any value, but conventionally an `Error` object (gives you `.message`, `.stack`, `.name`).

```js
function divide(a, b) {
  if (b === 0) {
    throw new Error("Division by zero is not allowed");
  }
  return a / b;
}

try {
  divide(10, 0);
} catch (e) {
  console.log(e.message); // "Division by zero is not allowed"
  console.log(e.name); // "Error"
  console.log(e.stack); // stack trace
}
```

Built-in error types: `Error`, `TypeError`, `RangeError`, `SyntaxError`, `ReferenceError`, `URIError`, `EvalError`.

```js
null.foo; // TypeError
new Array(-1); // RangeError
undeclaredVar; // ReferenceError
JSON.parse("{bad}"); // SyntaxError
```
