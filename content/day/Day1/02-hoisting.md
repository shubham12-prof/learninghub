# 02 - Hoisting

> **Time to learn:** ~25 min | **Level:** Fundamentals | **Interview frequency:** Very high

## 1. What is hoisting?

Before JavaScript runs your code, it scans the scope and **registers all declarations first**. This makes it *look like* declarations are "moved to the top". Nothing is physically moved. It is a side effect of the **creation phase** (see `05-execution-context.md`).

What gets hoisted depends on how you declare:

| Declaration | Hoisted? | Value before the line runs |
|---|---|---|
| `var x = 5` | Yes (declaration only) | `undefined` |
| `let x = 5` / `const x = 5` | Yes, but in the **Temporal Dead Zone** | Accessing throws `ReferenceError` |
| `function foo() {}` | Yes (whole function) | Fully usable |
| `var foo = function() {}` | Only the `var` part | `undefined` -> calling gives `TypeError` |
| `class A {}` | Yes, but in TDZ | Accessing throws `ReferenceError` |

## 2. Analogy

A teacher takes attendance **before** the lesson starts. Every student's name is written down first (declaration), but nobody has answered any questions yet (assignment). A `var` student is marked "present, no answer yet" (`undefined`). A `let/const` student is marked "arriving soon, don't talk to them until they walk in" (TDZ). A function declaration student arrives **with their homework already done** (fully usable).

## 3. Examples

### 3.1 `var` is hoisted and set to `undefined`

```js
console.log(a); // undefined
var a = 5;
console.log(a); // 5
```

JavaScript sees it like this:

```js
var a;           // declaration registered first
console.log(a);  // undefined
a = 5;           // assignment happens here
console.log(a);  // 5
```

### 3.2 `let` and `const`: Temporal Dead Zone (TDZ)

The **TDZ** is the time between entering the scope and reaching the line where the variable is declared.

```js
console.log(b); // ReferenceError: Cannot access 'b' before initialization
let b = 5;
```

Note the error message says *"before initialization"*, not *"is not defined"*. That proves `b` was hoisted (JavaScript knows it exists) but you cannot touch it yet.

### 3.3 Function declarations are fully hoisted

```js
greet(); // "Hello!"  -> works before the definition

function greet() {
  console.log("Hello!");
}
```

### 3.4 Function expressions are NOT fully hoisted

```js
sayHi(); // TypeError: sayHi is not a function

var sayHi = function () {
  console.log("Hi!");
};
```

Why `TypeError` and not `ReferenceError`? `sayHi` exists as `var` (value `undefined`), and calling `undefined()` is a type error.

With `let/const` you get a `ReferenceError` instead:

```js
sayHey(); // ReferenceError: Cannot access 'sayHey' before initialization
const sayHey = () => console.log("Hey!");
```

### 3.5 Function beats `var` during hoisting

```js
console.log(typeof foo); // "function"

var foo = 1;
function foo() {}

console.log(typeof foo); // "number"
```

During creation, the function declaration wins and `foo` is a function. Then at runtime `foo = 1` overwrites it.

### 3.6 Hoisting inside functions (the classic trap)

```js
var x = 1;

function f() {
  console.log(x); // undefined (NOT 1)
  var x = 2;
}

f();
```

Inside `f`, `var x` is hoisted to the top of `f`, so it **shadows** the global `x` and is still `undefined` at the `console.log`.

## 4. Common mistakes

1. Thinking `let/const` are *not* hoisted. They are hoisted, but protected by the TDZ.
2. Calling a function expression or arrow function before its definition.
3. Relying on `var` hoisting to "make code work". It hides bugs.
4. Forgetting that **only the declaration** is hoisted, never the assignment.

## 5. Predict the output

**Q1**
```js
console.log(a);
var a = 10;
```

**Q2**
```js
console.log(b);
let b = 10;
```

**Q3**
```js
foo();
function foo() {
  console.log("foo");
}
```

**Q4**
```js
bar();
var bar = function () {
  console.log("bar");
};
```

**Q5**
```js
var x = 1;
function test() {
  console.log(x);
  var x = 2;
  console.log(x);
}
test();
```

**Q6**
```js
console.log(typeof fn);
var fn = 5;
function fn() {}
console.log(typeof fn);
```

## 6. Answers

- **Q1:** `undefined`
- **Q2:** `ReferenceError: Cannot access 'b' before initialization`
- **Q3:** `foo`
- **Q4:** `TypeError: bar is not a function`
- **Q5:** `undefined` then `2`
- **Q6:** `"function"` then `"number"`

## Recap

- Hoisting = declarations are registered before code runs.
- `var` -> hoisted, initialised to `undefined`.
- `let` / `const` / `class` -> hoisted but in the **TDZ** (ReferenceError if used early).
- Function declarations -> fully hoisted. Function expressions -> only the variable name.
- Best practice: declare variables at the top, use `const`/`let`.

## Checklist

- [ ] I can explain the TDZ in one sentence
- [ ] I know why `var` + function expression gives `TypeError`
- [ ] I know why `let` + early access gives `ReferenceError`
- [ ] I got Q1 to Q6 right without looking
