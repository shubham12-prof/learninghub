# Variables

JS has three ways to declare a variable: `var`, `let`, `const`.

```js
var a = 10; // function-scoped, hoisted, can be redeclared
let b = 20; // block-scoped, can be reassigned, not redeclared in same scope
const c = 30; // block-scoped, cannot be reassigned (but object contents can mutate)

const obj = { x: 1 };
obj.x = 2; // ✅ allowed — we're not reassigning `obj`, just mutating it
// obj = {};   // ❌ TypeError: Assignment to constant variable
```

**Key differences**

| Feature   | var                              | let          | const        |
| --------- | -------------------------------- | ------------ | ------------ |
| Scope     | function                         | block        | block        |
| Hoisted   | yes (initialized as `undefined`) | yes (in TDZ) | yes (in TDZ) |
| Redeclare | yes                              | no           | no           |
| Reassign  | yes                              | yes          | no           |

**Interview tip:** `var` inside a loop leaks out of the block; `let`/`const` don't.

```js
for (var i = 0; i < 3; i++) {}
console.log(i); // 3 — leaked

for (let j = 0; j < 3; j++) {}
console.log(j); // ReferenceError — j is block scoped
```
