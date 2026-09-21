# TDZ (Temporal Dead Zone)

The period between entering a scope and the actual declaration line, during which `let`/`const` variables exist but cannot be accessed.

```js
{
  console.log(x); // ReferenceError: Cannot access 'x' before initialization
  let x = 5;
}
```

`var` doesn't have a TDZ — it's initialized to `undefined` immediately, which is why it silently returns `undefined` instead of throwing.
