# 05 - Execution Context

> **Time to learn:** ~30 min | **Level:** Core concept (ties everything together) | **Interview frequency:** High

## 1. What is an execution context?

An **execution context (EC)** is the environment where JavaScript code is evaluated and run. It holds everything the code needs: its variables, its scope chain and the value of `this`.

There are three types:

| Type | Created when | How many |
|---|---|---|
| **Global EC** | The script starts | Exactly 1 |
| **Function EC** | A function is **called** | One per call |
| **Eval EC** | `eval()` runs (avoid using it) | Rare |

## 2. The two phases

Every execution context goes through two phases.

### Phase 1: Creation (memory setup)

JavaScript scans the code and sets up:

1. **Variable Environment / Lexical Environment**: memory is reserved for variables and functions.
   - `var` -> `undefined`
   - `let` / `const` -> uninitialised (TDZ)
   - function declarations -> stored completely
2. **Scope chain**: a link to the outer environment.
3. **`this` binding**: decided here.

> This phase is **why hoisting exists** (see `02-hoisting.md`).

### Phase 2: Execution (code runs line by line)

Values are assigned, functions are called, and expressions are evaluated.

## 3. The call stack

JavaScript is **single-threaded**: it can do one thing at a time. It keeps track of execution contexts using a **call stack** (last in, first out).

- When a function is called, its EC is **pushed** onto the stack.
- When the function returns, its EC is **popped** off.
- The EC at the top of the stack is the one currently running.
- The Global EC sits at the bottom and is the last to go.

## 4. Analogy

Think of a stack of plates in a kitchen. You can only add or remove from the **top**. The global EC is the bottom plate. Each function call puts a new plate on top, and when the function finishes, that plate is removed and the one below continues.

## 5. Step-by-step walkthrough

```js
var n = 2;

function square(num) {
  var result = num * num;
  return result;
}

var sq = square(n);
console.log(sq);
```

**Creation phase of the Global EC**

| Name | Value |
|---|---|
| `n` | `undefined` |
| `square` | `function square(num) {...}` |
| `sq` | `undefined` |
| `this` | `globalThis` (or `{}` in a Node CommonJS file) |

**Execution phase of the Global EC**

1. `n = 2`
2. `square` is already stored, skip.
3. `square(n)` is called -> **a new Function EC is created and pushed to the stack**.

**Function EC for `square(2)`: Creation**

| Name | Value |
|---|---|
| `num` | `2` |
| `result` | `undefined` |
| `this` | global/undefined (plain call) |
| outer reference | Global EC |

**Function EC for `square(2)`: Execution**

1. `result = 2 * 2 = 4`
2. `return result` -> returns `4`, the EC is **popped** from the stack.

Back in the Global EC: `sq = 4`, then `console.log(4)` prints `4`.

### What the call stack looked like

```
Step 1: [ Global ]
Step 2: [ Global, square(2) ]      <- square is running
Step 3: [ Global ]                 <- square finished
Step 4: [ Global, console.log ]    <- briefly
Step 5: [ Global ]  ->  [ ]        <- script ends
```

## 6. Nested calls

```js
function first()  { console.log("first start");  second(); console.log("first end"); }
function second() { console.log("second start"); third();  console.log("second end"); }
function third()  { console.log("third"); }

first();
```

Output:

```
first start
second start
third
second end
first end
```

Stack at its deepest: `[ Global, first, second, third ]`.

## 7. Stack overflow

If functions keep calling themselves without stopping, the stack runs out of space:

```js
function forever() {
  forever();
}
forever(); // RangeError: Maximum call stack size exceeded
```

Always give recursive functions a **base case**.

## 8. How this connects to everything else

| Concept | Where it comes from in the EC |
|---|---|
| Hoisting | The **creation phase** sets up memory before execution |
| Scope / scope chain | Each EC holds a link to its **outer** environment |
| Closures | A function's EC keeps its link to the outer environment alive even after the outer EC is popped |
| `this` | Decided during the **creation phase**, based on how the function was called |

## 9. Bonus: async code and the event loop (just the idea)

`setTimeout` callbacks and promises don't run on the stack immediately. They wait in a queue, and the **event loop** moves them onto the call stack **only when the stack is empty**.

```js
console.log("A");
setTimeout(() => console.log("B"), 0);
console.log("C");
// Output: A C B
```

Even with `0` ms, `B` prints last, because `A` and `C` are on the stack and `B` must wait until the stack is empty.

## 10. Common mistakes

1. Thinking an EC is created when a function is **defined**. It's created when the function is **called**.
2. Forgetting that every call gets a fresh EC (recursion creates many).
3. Writing recursion with no base case.
4. Assuming `setTimeout(fn, 0)` runs immediately.

## 11. Predict the output

**Q1**
```js
var x = 1;
function a() {
  var x = 2;
  b();
}
function b() {
  console.log(x);
}
a();
```

**Q2**
```js
console.log(fn());
function fn() {
  return typeof inner;
  var inner = 1;
}
```

**Q3**
```js
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");
```

**Q4**: What is the maximum number of execution contexts on the stack at once?
```js
function a() { b(); }
function b() { c(); }
function c() {}
a();
```

## 12. Answers

- **Q1:** `1`. `b` was written in the global scope, so its outer scope is global (lexical scope), not `a`.
- **Q2:** `"undefined"`. `var inner` is hoisted inside `fn`, so `typeof inner` is `"undefined"`.
- **Q3:** `1 4 3 2`. Synchronous code first, then promise callbacks (microtasks), then timers (macrotasks).
- **Q4:** `4`: Global, `a`, `b`, `c`.

## Recap

- Execution context = environment in which code runs (variables, scope chain, `this`).
- Types: Global (1), Function (one per call).
- Two phases: **creation** (memory setup, hoisting, `this`) and **execution**.
- The **call stack** tracks contexts (LIFO). Too deep -> stack overflow.
- Hoisting, scope, closures and `this` all come from how execution contexts work.

## Checklist

- [ ] I can describe the creation vs execution phase
- [ ] I can draw the call stack for a nested function call
- [ ] I can explain why `setTimeout(fn, 0)` runs after synchronous code
- [ ] I got Q1 to Q4 right without looking
