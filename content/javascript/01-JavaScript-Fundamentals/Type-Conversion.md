# Type Conversion

**Implicit (coercion)** happens automatically; **explicit** is done manually.

```js
// Implicit
"5" + 1; // "51"  (number converted to string)
"5" - 1; // 4     (string converted to number)
true + 1; // 2
[] + []; // ""
[] + {}; // "[object Object]"

// Explicit
Number("42"); // 42
String(42); // "42"
Boolean(0); // false
Boolean(""); // false
Boolean("0"); // true  (non-empty string is truthy!)
parseInt("42px"); // 42
parseFloat("3.14m"); // 3.14
```

**Falsy values in JS:** `false, 0, -0, 0n, "", null, undefined, NaN`. Everything else (including `[]` and `{}`) is truthy.
