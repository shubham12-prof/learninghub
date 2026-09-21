# Operators

```js
// Arithmetic
+ - * / % **

// Comparison
== // loose equality (coerces types)
=== // strict equality (no coercion) — always prefer this
!= !==
< > <= >=

// Logical
&& || !
5 == "5";   // true  (coercion)
5 === "5";  // false

null == undefined;  // true
null === undefined; // false

// Nullish/short-circuit
a ?? b;    // returns b only if a is null/undefined
a || b;    // returns b if a is any falsy value
a && b;    // returns b if a is truthy
```
