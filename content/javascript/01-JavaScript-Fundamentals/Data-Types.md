# Data Types

JS has 8 data types — 7 primitives + `object`.

**Primitives:** `string`, `number`, `boolean`, `undefined`, `null`, `bigint`, `symbol`
**Non-primitive:** `object` (includes arrays, functions, dates, etc.)

```js
typeof "hello"; // "string"
typeof 42; // "number"
typeof true; // "boolean"
typeof undefined; // "undefined"
typeof null; // "object" (famous JS bug, kept for legacy reasons)
typeof 10n; // "bigint"
typeof Symbol("id"); // "symbol"
typeof {}; // "object"
typeof []; // "object"
typeof function () {}; // "function"
```

Primitives are stored **by value**; objects are stored **by reference**.

```js
let x = 10;
let y = x;
y = 20;
console.log(x); // 10 — unaffected

let obj1 = { val: 10 };
let obj2 = obj1;
obj2.val = 20;
console.log(obj1.val); // 20 — same reference
```
