# 09 - Interview: `var`, `let` and `const`

> **Time to learn:** ~30 min | **Interview frequency:** Almost guaranteed in every JavaScript interview

## 1. The 30-second answer (say this out loud)

> "`var`, `let` and `const` are three ways to declare variables. `var` is function scoped, can be redeclared and is hoisted with the value `undefined`. `let` and `const` were added in ES6, they are block scoped and hoisted but kept in the temporal dead zone, so using them before the declaration throws a ReferenceError. `let` can be reassigned, while `const` cannot be reassigned and must be initialised when declared. In modern code I use `const` by default, `let` when the value must change, and avoid `var`."

Practise it until it feels natural. Then use the sections below for the follow-up questions.

## 2. Comparison table

| Feature | `var` | `let` | `const` |
|---|---|---|---|
| Scope | **Function** (or global) | **Block** | **Block** |
| Hoisted? | Yes, initialised as `undefined` | Yes, but in the **TDZ** | Yes, but in the **TDZ** |
| Access before declaration | `undefined` | `ReferenceError` | `ReferenceError` |
| Redeclare in same scope | Allowed | `SyntaxError` | `SyntaxError` |
| Reassign | Allowed | Allowed | **Not allowed** (`TypeError`) |
| Must initialise at declaration | No | No | **Yes** |
| Becomes a property of `window`/`globalThis` at top level (scripts) | Yes | No | No |

## 3. Deeper explanation

### 3.1 Scope

```js
function demo() {
  if (true) {
    var a = 1;
    let b = 2;
    const c = 3;
  }
  console.log(a); // 1
  console.log(b); // ReferenceError: b is not defined
  console.log(c); // ReferenceError: c is not defined
}
```

### 3.2 Hoisting and the Temporal Dead Zone

```js
console.log(x); // undefined (var is hoisted and initialised)
var x = 1;

console.log(y); // ReferenceError: Cannot access 'y' before initialization
let y = 2;
```

The **TDZ** is the period from the start of the scope until the declaration line runs.

### 3.3 Redeclaration

```js
var n = 1;
var n = 2;        // fine, silently overwrites (can hide bugs)

let m = 1;
let m = 2;        // SyntaxError: Identifier 'm' has already been declared
```

### 3.4 Reassignment

```js
let count = 0;
count = 1;        // fine

const PI = 3.14;
PI = 3;           // TypeError: Assignment to constant variable.
```

### 3.5 `const` does NOT make a value immutable

`const` prevents **reassigning the variable**, not **changing the contents** of an object or array.

```js
const user = { name: "Asha" };
user.name = "Ravi";       // allowed: the object is changed
user.age = 25;            // allowed
user = {};                // TypeError: cannot reassign the variable

const list = [1, 2];
list.push(3);             // allowed -> [1, 2, 3]
```

To make an object (shallowly) immutable use `Object.freeze`:

```js
const config = Object.freeze({ theme: "dark" });
config.theme = "light";   // silently ignored (TypeError in strict mode)
console.log(config.theme); // "dark"
```

`Object.freeze` is **shallow**: nested objects can still be changed.

### 3.6 Global object property

```js
var a = 1;
let b = 2;
console.log(window.a); // 1          (in a browser classic script)
console.log(window.b); // undefined
```

### 3.7 `typeof` in the TDZ

```js
console.log(typeof notDeclared); // "undefined" (safe for undeclared names)

console.log(typeof tdz);         // ReferenceError!
let tdz = 1;
```

## 4. The classic loop question

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// 3 3 3

for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 0);
}
// 0 1 2
```

**Why?** `var` creates **one** variable shared by every iteration. `let` creates a **new binding for each iteration**, so each callback closes over its own `j`. (See `03-closures.md`.)

## 5. Follow-up questions interviewers ask

**Q: Are `let` and `const` hoisted?**
Yes. They are hoisted to the top of their block, but not initialised, so accessing them before the declaration throws `ReferenceError`. That uninitialised window is the temporal dead zone.

**Q: Why was `let` introduced?**
`var`'s function scope, silent redeclaration and `undefined` hoisting caused many bugs. `let` and `const` give predictable block scoping.

**Q: If `const` is "constant", why can I push into a `const` array?**
`const` locks the *binding* (the variable name -> value link). The array object itself is still mutable. Use `Object.freeze` or immutable patterns if you need immutability.

**Q: Which one should I use by default?**
`const` by default, `let` when you need to reassign, and don't use `var` in new code.

**Q: Can you declare a `const` without a value?**
No. `const x;` is a `SyntaxError: Missing initializer in const declaration`.

**Q: What happens with `const` inside a loop?**
```js
for (const item of [1, 2, 3]) {
  console.log(item);     // works: a new const is created each iteration
}

for (const i = 0; i < 3; i++) {} // TypeError: i++ tries to reassign
```

**Q: What's the difference between "not defined" and "undefined"?**
`undefined` is a value (the variable exists but has no value). "`x is not defined`" is a `ReferenceError` (the name doesn't exist in any reachable scope).

## 6. Trick questions: predict the output

**Q1**
```js
console.log(a);
var a = 5;
```

**Q2**
```js
console.log(b);
let b = 5;
```

**Q3**
```js
const obj = { x: 1 };
obj.x = 2;
console.log(obj.x);
```

**Q4**
```js
const arr = [1, 2];
arr = [3];
```

**Q5**
```js
var x = 1;
{
  var x = 2;
}
console.log(x);
```

**Q6**
```js
let y = 1;
{
  let y = 2;
}
console.log(y);
```

**Q7**
```js
function f() {
  console.log(v);
  var v = 1;
}
f();
```

**Q8**
```js
let a = 1;
let a = 2;
```

## 7. Answers

- **Q1:** `undefined`
- **Q2:** `ReferenceError: Cannot access 'b' before initialization`
- **Q3:** `2` (the object is mutated; the binding is unchanged)
- **Q4:** `TypeError: Assignment to constant variable.`
- **Q5:** `2` (`var` ignores the block, so it's the same variable)
- **Q6:** `1` (the inner `y` is a different variable)
- **Q7:** `undefined`
- **Q8:** `SyntaxError: Identifier 'a' has already been declared` (the whole script fails before running)

## Recap

- `var`: function scoped, hoisted as `undefined`, redeclarable.
- `let`: block scoped, TDZ, reassignable, not redeclarable.
- `const`: block scoped, TDZ, **not reassignable**, must be initialised. Objects stay mutable.
- Default to `const`, use `let` when needed, avoid `var`.

## Checklist

- [ ] I can say the 30-second answer without notes
- [ ] I can explain the TDZ
- [ ] I can explain why a `const` array can still be changed
- [ ] I can explain the `var` loop + `setTimeout` problem
- [ ] I got Q1 to Q8 right without looking
