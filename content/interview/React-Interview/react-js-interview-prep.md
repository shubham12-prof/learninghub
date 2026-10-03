# React.js & JavaScript Interview Prep Guide (0 – 2 Years Experience)

A merged, beginner-to-intermediate guide covering what is most commonly asked in **Round 1 (fundamentals / machine-coding / output-based)** and **Round 2 (deep-dive / practical scenarios / project discussion)**.

**Difficulty tags used throughout**

- 🟢 **Beginner** — must know (0–1 year)
- 🟡 **Intermediate** — expected at ~2 years
- 🔴 **Bonus** — asked occasionally; shows depth

---

## Table of Contents

### Part 1 — JavaScript

- [1. JS Core Fundamentals](#1-js-core-fundamentals)
- [2. Functions, Scope, Closures & `this`](#2-functions-scope-closures--this)
- [3. Objects, Arrays & Modern ES6+ Syntax](#3-objects-arrays--modern-es6-syntax)
- [4. Async JS: Event Loop, Promises, async/await](#4-async-js-event-loop-promises-asyncawait)
- [5. Browser & DOM Concepts](#5-browser--dom-concepts)
- [6. JS Utility Functions Asked in Interviews](#6-js-utility-functions-asked-in-interviews)

### Part 2 — React

- [7. React Basics](#7-react-basics)
- [8. Components, Props & State](#8-components-props--state)
- [9. Component Communication](#9-component-communication)
- [10. Hooks (Deep Dive)](#10-hooks-deep-dive)
- [11. Lists, Forms & Events](#11-lists-forms--events)
- [12. Performance Optimization](#12-performance-optimization)
- [13. State Management & Context](#13-state-management--context)
- [14. Routing, API Integration & Data Fetching](#14-routing-api-integration--data-fetching)
- [15. Advanced React Concepts](#15-advanced-react-concepts)
- [16. React 18 / 19 & Modern Ecosystem](#16-react-18--19--modern-ecosystem)

### Part 3 — Practice

- [17. Output-Based Questions (with Answers)](#17-output-based-questions-with-answers)
- [18. Practical Scenarios](#18-practical-scenarios)
- [19. Machine Coding Tasks](#19-machine-coding-tasks)

### Part 4 — Supporting Topics

- [20. HTML & CSS Quick Hits](#20-html--css-quick-hits)
- [21. TypeScript, Git & Tooling Basics](#21-typescript-git--tooling-basics)
- [22. Project / Behavioral Questions (2-Year Level)](#22-project--behavioral-questions-2-year-level)
- [23. Quick Revision Cheat Sheet & Study Plan](#23-quick-revision-cheat-sheet--study-plan)

---

# PART 1 — JAVASCRIPT

## 1. JS Core Fundamentals

### 🟢 Q1. What are the data types in JavaScript?

- **Primitives (7):** `string`, `number`, `boolean`, `undefined`, `null`, `symbol`, `bigint`
- **Non-primitive:** `object` (includes arrays, functions, dates, etc.)

Primitives are copied **by value**; objects are copied **by reference**.

### 🟢 Q2. `var` vs `let` vs `const`

|         | Scope    | Hoisting                        | Re-declare | Re-assign                                |
| ------- | -------- | ------------------------------- | ---------- | ---------------------------------------- |
| `var`   | Function | Yes, initialized as `undefined` | Yes        | Yes                                      |
| `let`   | Block    | Yes, but in TDZ until declared  | No         | Yes                                      |
| `const` | Block    | Yes, but in TDZ until declared  | No         | No (object/array contents still mutable) |

**TDZ (Temporal Dead Zone):** the period between entering a scope and the line where `let`/`const` is declared. Accessing the variable there throws a `ReferenceError`.

### 🟢 Q3. What is hoisting?

JavaScript moves declarations to the top of their scope during the creation phase.

- `var` → hoisted and initialized with `undefined`
- Function declarations → hoisted **with** their body
- `let` / `const` / `class` → hoisted but not initialized (TDZ)
- Function expressions / arrow functions assigned to `var` → only the variable is hoisted (as `undefined`)

```js
console.log(a); // undefined
var a = 5;

console.log(b); // ReferenceError
let b = 5;

sayHi(); // works
function sayHi() {
  console.log("hi");
}

sayBye(); // TypeError: sayBye is not a function
var sayBye = function () {};
```

### 🟢 Q4. `==` vs `===`

`==` performs **type coercion** before comparing; `===` compares value **and** type. Always prefer `===`.

```js
0 == "0"; // true
0 === "0"; // false
null == undefined; // true
null === undefined; // false
NaN == NaN; // false  (use Number.isNaN)
```

### 🟢 Q5. What are truthy and falsy values?

**Falsy (8):** `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`. Everything else is truthy (including `[]`, `{}`, `"0"`, `"false"`).

### 🟢 Q6. `null` vs `undefined`

- `undefined` → a variable declared but not assigned (JS default)
- `null` → an intentional "no value" assigned by the developer
- `typeof null === "object"` (a long-standing JS bug), `typeof undefined === "undefined"`

### 🟢 Q7. What is type coercion? Give examples.

Automatic (implicit) conversion of one type to another.

```js
"5" + 1; // "51"  (number → string)
"5" - 1; // 4     (string → number)
true + 1; // 2
[] + []; // ""
[] + {}; // "[object Object]"
```

### 🟢 Q8. Pass by value vs pass by reference

Primitives are copied by value. Objects/arrays hold a reference, so two variables can point to the same object.

```js
let a = { x: 1 };
let b = a;
b.x = 99;
console.log(a.x); // 99 — same reference
```

### 🟡 Q9. Shallow copy vs deep copy

```js
const obj = { a: 1, nested: { b: 2 } };

const shallow = { ...obj }; // or Object.assign({}, obj)
shallow.nested.b = 99; // ALSO changes obj.nested.b

const deep = structuredClone(obj); // modern, preferred
// JSON.parse(JSON.stringify(obj)) → loses functions, Date, undefined, Map/Set
```

**Why it matters in React:** state must be updated immutably; mutating nested state won't trigger a re-render because the reference doesn't change.

### 🟡 Q10. What is `Object.freeze` vs `const`?

`const` prevents **re-assignment** of the variable. `Object.freeze` prevents **mutation** of the object's properties (shallow only).

---

## 2. Functions, Scope, Closures & `this`

### 🟢 Q11. Function declaration vs expression vs arrow function

|                               | Declaration | Expression | Arrow               |
| ----------------------------- | ----------- | ---------- | ------------------- |
| Hoisted with body             | ✅          | ❌         | ❌                  |
| Own `this`                    | ✅          | ✅         | ❌ (lexical `this`) |
| Own `arguments`               | ✅          | ✅         | ❌                  |
| Usable as constructor (`new`) | ✅          | ✅         | ❌                  |

### 🟢 Q12. What is scope? Types of scope?

Scope determines where variables are accessible: **global**, **function**, and **block** scope. Inner scopes can access outer scopes (**scope chain**), never the reverse.

### 🟢 Q13. What is a closure?

A closure is a function that **remembers variables from its outer (lexical) scope** even after that outer function has finished executing.

```js
function makeCounter() {
  let count = 0;
  return function () {
    count++;
    return count;
  };
}
const counter = makeCounter();
counter(); // 1
counter(); // 2
```

**Use cases:** data privacy/encapsulation, memoization, debounce/throttle, function factories, callbacks that keep state.

**Classic trap:**

```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 100);
// 3 3 3  → var is function-scoped, one shared binding

for (let i = 0; i < 3; i++) setTimeout(() => console.log(i), 100);
// 0 1 2  → let creates a new binding per iteration
```

### 🟡 Q14. How does `this` work?

`this` depends on **how a function is called**:

| Call style                | `this` value                                 |
| ------------------------- | -------------------------------------------- |
| Plain function call       | `undefined` (strict) / `window` (sloppy)     |
| Method call `obj.fn()`    | `obj`                                        |
| `new Fn()`                | the new object                               |
| `call` / `apply` / `bind` | the explicitly provided value                |
| Arrow function            | inherited from the enclosing scope (lexical) |

```js
const user = {
  name: "Sam",
  regular() {
    return this.name;
  },
  arrow: () => this.name,
};
user.regular(); // "Sam"
user.arrow(); // undefined — arrow doesn't get its own `this`
```

### 🟡 Q15. `call`, `apply`, `bind`

```js
function greet(greeting, punct) {
  return `${greeting}, ${this.name}${punct}`;
}
const p = { name: "Sam" };

greet.call(p, "Hi", "!"); // args one by one
greet.apply(p, ["Hi", "!"]); // args as array
const fn = greet.bind(p, "Hi"); // returns a NEW function, doesn't invoke
fn("!");
```

### 🟡 Q16. What is a higher-order function?

A function that takes a function as an argument and/or returns a function. Examples: `map`, `filter`, `reduce`, `setTimeout`, and React HOCs.

### 🟡 Q17. What is a pure function?

Same input → same output, with **no side effects** (no mutation of outside state, no network calls, no randomness). React components and reducers should be pure.

### 🟡 Q18. What is currying?

Transforming `f(a, b, c)` into `f(a)(b)(c)`.

```js
const add = (a) => (b) => a + b;
add(2)(3); // 5
```

### 🟡 Q19. What is an IIFE?

Immediately Invoked Function Expression — runs right after it's defined, creating a private scope.

```js
(function () {
  console.log("runs once");
})();
```

### 🔴 Q20. What is memoization?

Caching the result of a function call based on its arguments.

```js
function memoize(fn) {
  const cache = {};
  return (...args) => {
    const key = JSON.stringify(args);
    if (!(key in cache)) cache[key] = fn(...args);
    return cache[key];
  };
}
```

---

## 3. Objects, Arrays & Modern ES6+ Syntax

### 🟢 Q21. Common array methods — what do they return?

| Method                               | Purpose                   | Returns         | Mutates original? |
| ------------------------------------ | ------------------------- | --------------- | ----------------- |
| `map`                                | transform each item       | new array       | No                |
| `filter`                             | keep items that pass test | new array       | No                |
| `reduce`                             | accumulate into one value | single value    | No                |
| `forEach`                            | iterate                   | `undefined`     | No                |
| `find` / `findIndex`                 | first match               | item / index    | No                |
| `some` / `every`                     | any / all pass test       | boolean         | No                |
| `push` / `pop` / `shift` / `unshift` | add/remove                | length / item   | **Yes**           |
| `splice`                             | add/remove at index       | removed items   | **Yes**           |
| `slice`                              | copy a portion            | new array       | No                |
| `sort` / `reverse`                   | reorder                   | same array      | **Yes**           |
| `includes` / `indexOf`               | search                    | boolean / index | No                |
| `flat` / `flatMap`                   | flatten                   | new array       | No                |

```js
[1, 2, 3].map((x) => x * 2); // [2, 4, 6]
[1, 2, 3, 4].filter((x) => x % 2 === 0); // [2, 4]
[1, 2, 3].reduce((acc, x) => acc + x, 0); // 6
```

### 🟢 Q22. `map` vs `forEach`

`map` returns a new array (chainable); `forEach` returns `undefined`. Use `map` when you need the transformed result (e.g., rendering lists in JSX).

### 🟢 Q23. Destructuring, spread and rest

```js
const { name, age = 18 } = user; // object destructuring + default
const [first, , third] = arr; // array destructuring

const merged = { ...a, ...b }; // spread objects
const copy = [...arr, 4]; // spread arrays

function sum(...nums) {
  return nums.reduce((a, b) => a + b, 0);
} // rest
```

### 🟢 Q24. Template literals, optional chaining, nullish coalescing

```js
`Hello ${name}`;
user?.address?.city; // undefined instead of throwing
const port = config.port ?? 3000; // only null/undefined trigger fallback
const port2 = config.port || 3000; // ANY falsy triggers fallback (0 → 3000!)
```

### 🟡 Q25. `for...in` vs `for...of`

- `for...in` → iterates **keys** (enumerable properties) — use for objects
- `for...of` → iterates **values** of iterables (arrays, strings, Map, Set)

### 🟡 Q26. `Map` / `Set` vs `Object` / `Array`

- `Set` → unique values. `[...new Set(arr)]` removes duplicates.
- `Map` → key-value with **any** type as key, preserves insertion order, has `.size`.

### 🟡 Q27. What are ES modules?

`import` / `export` (named and default). Static, tree-shakeable, strict mode by default.

```js
export const a = 1; // named
export default function () {} // default
import fn, { a } from "./file";
```

### 🟡 Q28. What is the prototype chain? (and how do classes work?)

Every object has an internal `[[Prototype]]` link. When a property isn't found on an object, JS walks up the chain until it finds it or reaches `null`. ES6 `class` is syntactic sugar over prototype-based inheritance.

### 🟡 Q29. How do you remove duplicates / reverse a string / find max?

```js
[...new Set(arr)];
str.split("").reverse().join("");
Math.max(...arr);
```

---

## 4. Async JS: Event Loop, Promises, async/await

### 🟢 Q30. Synchronous vs asynchronous?

Synchronous code runs line by line, blocking. Asynchronous code (timers, network, I/O) is handed off, and its callback runs later without blocking the main thread.

### 🟢 Q31. What is a Promise? What are its states?

An object representing the eventual result of an async operation. States: **pending → fulfilled** or **rejected**. Consumed via `.then()`, `.catch()`, `.finally()`.

### 🟢 Q32. async/await

Syntactic sugar over Promises. `await` pauses **the async function** (not the thread) until the promise settles.

```js
async function getData() {
  try {
    const res = await fetch("/api/data");
    if (!res.ok) throw new Error("Request failed");
    return await res.json();
  } catch (err) {
    console.error(err);
  } finally {
    console.log("done");
  }
}
```

### 🟡 Q33. Explain the Event Loop

JS is single-threaded. Order: **Call Stack → all Microtasks → one Macrotask → repeat.**

- **Microtasks:** Promise `.then/.catch/.finally`, `queueMicrotask`, code after `await`
- **Macrotasks:** `setTimeout`, `setInterval`, I/O, UI events

All queued microtasks run **before** the next macrotask — that's why Promises "jump ahead" of `setTimeout(fn, 0)`.

```js
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");
// 1, 4, 3, 2
```

### 🟡 Q34. `Promise.all` vs `allSettled` vs `race` vs `any`

| Method               | Resolves when                               | Rejects when                  |
| -------------------- | ------------------------------------------- | ----------------------------- |
| `Promise.all`        | **all** fulfill (array of results)          | **any** rejects (fail-fast)   |
| `Promise.allSettled` | all settle (status + value/reason for each) | never                         |
| `Promise.race`       | first one settles (either way)              | first settles as rejected     |
| `Promise.any`        | first one **fulfills**                      | all reject (`AggregateError`) |

### 🟡 Q35. Callback hell and how to avoid it

Deeply nested callbacks become unreadable. Fix with Promises chaining or `async/await`.

### 🟡 Q36. Sequential vs parallel API calls

```js
// Sequential (slower)
const a = await getA();
const b = await getB();

// Parallel (faster, independent calls)
const [a, b] = await Promise.all([getA(), getB()]);
```

### 🟡 Q37. Debouncing vs Throttling

|          | Debounce                                             | Throttle                          |
| -------- | ---------------------------------------------------- | --------------------------------- |
| Behavior | Waits until calls **stop** for X ms, then fires once | Fires **at most once** every X ms |
| Use case | Search input, window resize end, autosave            | Scroll, mousemove, button spam    |

(Implementations are in [Section 6](#6-js-utility-functions-asked-in-interviews).)

---

## 5. Browser & DOM Concepts

### 🟢 Q38. `localStorage` vs `sessionStorage` vs cookies

|                              | localStorage  | sessionStorage   | Cookies                 |
| ---------------------------- | ------------- | ---------------- | ----------------------- |
| Lifetime                     | Until cleared | Until tab closes | Until expiry            |
| Size                         | ~5–10 MB      | ~5 MB            | ~4 KB                   |
| Sent to server automatically | No            | No               | **Yes** (every request) |
| Accessible by JS             | Yes           | Yes              | Yes (unless `HttpOnly`) |

**Security note:** don't store sensitive tokens in `localStorage` (XSS risk). `HttpOnly` cookies are safer for auth tokens.

### 🟡 Q39. Event bubbling, capturing, and delegation

- **Capturing:** event travels from `window` down to the target.
- **Bubbling:** event travels from the target back up to `window` (default).
- **Delegation:** attach one listener on a parent and use `event.target` to handle child events (efficient for large/dynamic lists).
- `event.stopPropagation()` stops propagation; `event.preventDefault()` stops the default action (e.g., form submit).

### 🟡 Q40. What is CORS?

A browser security mechanism that blocks requests from one origin to another unless the server sends proper headers (`Access-Control-Allow-Origin`). Fixed on the **server** (or via a dev proxy), not in React.

### 🟡 Q41. What is the difference between `defer` and `async` on script tags?

Both download in parallel. `async` executes as soon as it's downloaded (order not guaranteed); `defer` executes after HTML parsing, in order.

### 🔴 Q42. What is XSS and how does React help?

Cross-Site Scripting — injecting malicious scripts. React escapes values rendered in JSX by default. Danger: `dangerouslySetInnerHTML` and unsanitized URLs.

---

## 6. JS Utility Functions Asked in Interviews

```js
// Debounce
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Throttle
function throttle(fn, limit) {
  let inThrottle = false;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Flatten nested array
const flatten = (arr) =>
  arr.reduce((acc, x) => acc.concat(Array.isArray(x) ? flatten(x) : x), []);

// Palindrome
const isPalindrome = (s) => {
  const c = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return c === [...c].reverse().join("");
};

// Count character frequency
const freq = (s) => [...s].reduce((m, c) => ((m[c] = (m[c] || 0) + 1), m), {});

// Polyfill: Array.prototype.map
Array.prototype.myMap = function (cb) {
  const result = [];
  for (let i = 0; i < this.length; i++) result.push(cb(this[i], i, this));
  return result;
};

// Polyfill: Function.prototype.bind
Function.prototype.myBind = function (ctx, ...bound) {
  const fn = this;
  return function (...args) {
    return fn.apply(ctx, [...bound, ...args]);
  };
};

// Fibonacci (memoized)
const fib = (n, memo = {}) =>
  n <= 1 ? n : (memo[n] ?? (memo[n] = fib(n - 1, memo) + fib(n - 2, memo)));
```

---

# PART 2 — REACT

## 7. React Basics

### 🟢 Q43. What is React?

An open-source JavaScript **library** (not a full framework) for building user interfaces. It is **component-based**, **declarative**, and uses a **Virtual DOM** for efficient updates.

### 🟢 Q44. Main features of React

Component-based architecture, Virtual DOM, JSX, one-way data flow, Hooks, reusable logic, huge ecosystem.

### 🟢 Q45. What is JSX?

A syntax extension that lets you write HTML-like markup in JavaScript. It's compiled by Babel/SWC into `React.createElement()` calls (or the newer `jsx()` runtime).

```jsx
const el = <h1 className="title">Hello, {name}</h1>;
```

**JSX rules:** one root element (or Fragment), `className` instead of `class`, `htmlFor` instead of `for`, camelCase attributes, close all tags, JS expressions go inside `{}`.

### 🟢 Q46. What is the Virtual DOM?

A lightweight in-memory JavaScript representation of the real DOM. On state change:

1. React builds a new Virtual DOM tree.
2. It **diffs** it against the previous tree (**reconciliation**).
3. Only the minimal changes are committed to the real DOM.

### 🟢 Q47. Real DOM vs Virtual DOM

| Real DOM                     | Virtual DOM                         |
| ---------------------------- | ----------------------------------- |
| Updating is slow/expensive   | Updating the JS object is fast      |
| Re-paints/reflows frequently | Batches and applies minimal changes |
| Browser-level                | React-level (JS objects)            |

### 🟢 Q48. What is reconciliation and how do `key`s help?

Reconciliation is React's diffing algorithm. Two heuristics: (1) different element types → different trees; (2) `key` props identify which list items are stable across renders.

### 🟢 Q49. Why are `key`s needed in lists?

Keys let React track items between renders so it can reorder/add/remove efficiently and keep component state attached to the correct item.

```jsx
{
  items.map((item) => <Item key={item.id} {...item} />);
} // ✅ stable id
{
  items.map((item, i) => <Item key={i} {...item} />);
} // ⚠️ risky if list reorders/filters
```

**Never use the array index as key** if the list can be reordered, filtered, or have items inserted — it causes wrong state/input association and bugs.

### 🟢 Q50. What are Fragments?

Group multiple elements without adding an extra DOM node: `<>...</>` or `<React.Fragment key={...}>`.

### 🟢 Q51. Element vs Component?

An **element** is a plain object describing UI (`<div />`). A **component** is a function (or class) that returns elements.

### 🟢 Q52. Why can't browsers read JSX?

Browsers only understand JavaScript. JSX must be transpiled (Babel/SWC/esbuild) to regular JS.

### 🟢 Q53. What is a SPA?

Single Page Application — loads one HTML page and dynamically updates content using JavaScript, without full page reloads.

### 🟢 Q54. How do you create a React app today?

**Vite** (`npm create vite@latest`) is the common choice; frameworks like **Next.js** / Remix are used for SSR. Create React App (CRA) is deprecated and no longer recommended.

---

## 8. Components, Props & State

### 🟢 Q55. Functional vs Class components

| Functional       | Class                                                 |
| ---------------- | ----------------------------------------------------- |
| Plain functions  | ES6 classes extending `React.Component`               |
| Use Hooks        | Use `this.state` + lifecycle methods                  |
| Less boilerplate | More verbose, `this` binding issues                   |
| Standard today   | Legacy (still supported; needed for Error Boundaries) |

### 🟢 Q56. Props vs State

|                     | Props                              | State                          |
| ------------------- | ---------------------------------- | ------------------------------ |
| Owned by            | Parent, passed down                | Component itself               |
| Mutable?            | Read-only (immutable inside child) | Mutable via setter             |
| Purpose             | Configure a component from outside | Manage internal, changing data |
| Triggers re-render? | Yes, when parent passes new value  | Yes, when updated              |

```jsx
// Props
function Greeting({ name }) {
  return <h1>Hello, {name}</h1>;
}

// State
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Key point:** Props flow down (parent → child); state is local and private. A component can't modify its own props — that would break one-way data flow.

### 🟢 Q57. What is `props.children`?

Content passed between a component's opening and closing tags — enables composition (layouts, cards, modals).

```jsx
function Card({ children }) {
  return <div className="card">{children}</div>;
}
<Card>
  <p>Hi</p>
</Card>;
```

### 🟢 Q58. Default props

```jsx
function Button({ label = "Click", size = "md" }) {
  /* ... */
}
```

(`defaultProps` on function components is deprecated in favor of default parameters.)

### 🟢 Q59. Why shouldn't we mutate state directly?

React detects changes by **reference**. Mutating directly won't trigger a re-render and can cause stale UI bugs. Create new references:

```jsx
setUser((prev) => ({ ...prev, name: "Sam" })); // object
setItems((prev) => [...prev, newItem]); // add
setItems((prev) => prev.filter((i) => i.id !== id)); // remove
setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: true } : i))); // update
```

### 🟢 Q60. Is `setState` synchronous?

No. Updates are **batched** and applied on the next render. The state variable in the current render never changes mid-render.

```jsx
function Example() {
  const [count, setCount] = useState(0);
  const handleClick = () => {
    setCount(count + 1);
    console.log(count); // logs OLD value — closure captured at render time
  };
  return <button onClick={handleClick}>{count}</button>;
}
```

Use the **functional updater** when new state depends on previous state:

```jsx
setCount((c) => c + 1);
```

### 🟡 Q61. Automatic batching (React 18)

Multiple `setState` calls in the same tick — including inside promises, timeouts and native events (not just React handlers) — are batched into **one** re-render.

### 🟡 Q62. What is "lifting state up"?

Moving shared state to the closest common parent so multiple children can read/update it via props and callbacks.

### 🟡 Q63. Controlled vs Uncontrolled components

- **Controlled:** form value driven by React state (`value` + `onChange`).
- **Uncontrolled:** DOM keeps its own value; read with a `ref` (`defaultValue`, `ref.current.value`).

```jsx
<input value={name} onChange={e => setName(e.target.value)} />  // controlled
<input defaultValue="x" ref={inputRef} />                        // uncontrolled
```

### 🟡 Q64. What are the lifecycle phases?

**Mounting → Updating → Unmounting** (plus error handling). Class methods: `constructor`, `render`, `componentDidMount`, `componentDidUpdate`, `componentWillUnmount`.

With Hooks:

```jsx
useEffect(() => {
  /* componentDidMount */
}, []);
useEffect(() => {
  /* componentDidUpdate for dep */
}, [dep]);
useEffect(
  () => () => {
    /* componentWillUnmount */
  },
  [],
);
```

### 🟡 Q65. What causes a component to re-render?

1. Its **own state** changes
2. Its **props** change
3. Its **parent re-renders** (even if props are identical, unless memoized)
4. A **Context** value it consumes changes

### 🟡 Q66. HOC vs Render Props vs Custom Hooks

- **HOC:** function that takes a component, returns an enhanced component (`withAuth(Component)`).
- **Render props:** a prop whose value is a function returning JSX.
- **Custom Hooks:** reuse stateful logic — the **modern, preferred** approach.

### 🟡 Q67. What is prop drilling? How do you avoid it?

Passing props through many intermediate components that don't use them. Avoid with **Context API**, **state libraries** (Redux, Zustand), or **component composition** (passing children / elements).

---

## 9. Component Communication

| Pattern              | Direction | Mechanism                                            |
| -------------------- | --------- | ---------------------------------------------------- |
| Parent → Child       | Down      | Props                                                |
| Child → Parent       | Up        | Callback function passed as a prop                   |
| Sibling ↔ Sibling    | Across    | Lift state up to the common parent                   |
| Deeply nested        | Any       | Context API (avoids prop drilling)                   |
| Unrelated components | Any       | State management (Redux, Zustand, Context + reducer) |

```jsx
// Child → Parent
function Parent() {
  const handleChildData = (data) => console.log(data);
  return <Child onSend={handleChildData} />;
}
function Child({ onSend }) {
  return <button onClick={() => onSend("hello")}>Send</button>;
}
```

**Parent calling a child's method:** use `ref` + `forwardRef` + `useImperativeHandle` (use sparingly).

---

## 10. Hooks (Deep Dive)

### 🟢 Q68. What are Hooks and what are the Rules of Hooks?

Hooks let function components use state and other React features.

1. Call Hooks **only at the top level** (not inside loops, conditions, or nested functions).
2. Call Hooks **only from React function components or custom Hooks**.

_Why?_ React relies on the **order** of Hook calls to associate state with each Hook between renders.

### 🟢 Q69. `useState`

```jsx
const [count, setCount] = useState(0);
const [data, setData] = useState(() => expensiveInit()); // lazy initializer, runs once
```

### 🟢 Q70. `useEffect`

Runs **side effects** after render: data fetching, subscriptions, timers, DOM manipulation.

```jsx
useEffect(() => {
  const sub = subscribe();
  return () => sub.unsubscribe(); // cleanup: runs before next effect & on unmount
}, [dependency]);
```

| Dependency array | Runs                                                              |
| ---------------- | ----------------------------------------------------------------- |
| Omitted          | After **every** render                                            |
| `[]`             | Once, after initial mount only                                    |
| `[a, b]`         | After mount + whenever `a` or `b` changes (compared by reference) |

### 🟡 Q71. Common `useEffect` pitfalls

- **Missing dependency** → stale closure bugs (effect sees old values)
- **Object/array/function dependency recreated each render** → effect runs every render (memoize it or move it inside the effect)
- **Forgetting cleanup** → memory leaks, duplicate listeners/intervals
- **Infinite loop:** setting state that is also a dependency without a guard
- **Strict Mode (dev only)** double-invokes effects on mount to surface missing cleanups — not an issue in production

### 🟡 Q72. `useEffect` vs `useLayoutEffect`

|         | useEffect                             | useLayoutEffect                             |
| ------- | ------------------------------------- | ------------------------------------------- |
| Timing  | After paint (async)                   | After DOM mutation, **before paint** (sync) |
| Use for | Data fetching, subscriptions, logging | DOM measurements, preventing visual flicker |

### 🟢 Q73. `useRef`

Returns a mutable `{ current }` object that **persists across renders** and **doesn't trigger re-renders** when changed. Uses: access DOM nodes, store timers/previous values, any mutable value that shouldn't cause render.

```jsx
const inputRef = useRef(null);
<input ref={inputRef} />;
inputRef.current.focus();
```

### 🟡 Q74. `useRef` vs `useState`

Changing `ref.current` does **not** re-render; changing state does. Use state for values shown in the UI, ref for values that don't affect rendering.

### 🟡 Q75. `useMemo` vs `useCallback` vs `React.memo`

| API                     | Memoizes                          | Use for                                      |
| ----------------------- | --------------------------------- | -------------------------------------------- |
| `useMemo(fn, deps)`     | A **computed value**              | Expensive calculations                       |
| `useCallback(fn, deps)` | A **function reference**          | Stable callbacks passed to memoized children |
| `React.memo(Component)` | The **component's render output** | Skip re-render if props are shallowly equal  |

```jsx
const expensive = useMemo(() => computeHeavy(data), [data]);
const stableFn = useCallback(() => doSomething(id), [id]);
const MemoChild = React.memo(Child);
```

**Caution:** don't wrap everything — memoization has its own cost. Measure first.

### 🟡 Q76. `useContext`

Reads a Context value without a Consumer wrapper.

```jsx
const ThemeContext = createContext("light");
<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>;
const theme = useContext(ThemeContext);
```

### 🟡 Q77. `useReducer` — when to use over `useState`?

When state logic is complex, has multiple sub-values, or the next state depends on the previous via named actions.

```jsx
function reducer(state, action) {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    case "decrement":
      return { count: state.count - 1 };
    default:
      return state;
  }
}
const [state, dispatch] = useReducer(reducer, { count: 0 });
dispatch({ type: "increment" });
```

### 🟡 Q78. What is a custom Hook?

A function whose name starts with `use` and which composes other Hooks to reuse logic.

```jsx
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? initial;
    } catch {
      return initial;
    }
  });
  useEffect(
    () => localStorage.setItem(key, JSON.stringify(value)),
    [key, value],
  );
  return [value, setValue];
}
```

### 🔴 Q79. Other Hooks worth knowing

- `useImperativeHandle` — customize what a parent sees through a `ref`
- `useId` — stable unique IDs (SSR-safe)
- `useTransition` — mark updates as non-urgent
- `useDeferredValue` — defer re-rendering a non-critical value
- `useSyncExternalStore` — subscribe to external stores (used by libs)
- `useDebugValue` — label custom Hooks in DevTools

### 🟡 Q80. "You might not need an Effect"

Don't use `useEffect` for: deriving values from props/state (compute during render), responding to user events (use event handlers), or resetting state on prop change (use `key`).

---

## 11. Lists, Forms & Events

### 🟢 Q81. Conditional rendering

```jsx
{
  isLoggedIn ? <Dashboard /> : <Login />;
}
{
  items.length > 0 && <List items={items} />;
} // careful: `0 && ...` renders 0!
if (loading) return <Spinner />; // early return
```

### 🟢 Q82. Rendering lists

```jsx
<ul>
  {users.map((u) => (
    <li key={u.id}>{u.name}</li>
  ))}
</ul>
```

### 🟢 Q83. How are events handled in React?

Through **Synthetic Events** — a cross-browser wrapper around native events, using event delegation at the root. Handlers use camelCase and receive a function (not a string).

```jsx
<button onClick={handleClick}>Click</button>      // ✅ pass reference
<button onClick={handleClick()}>Click</button>    // ❌ calls immediately on render
<button onClick={() => handleClick(id)}>Click</button> // ✅ with args
```

### 🟢 Q84. How do you handle forms?

Controlled inputs with state, or libraries like **React Hook Form** / **Formik** with validation (**Yup**, **Zod**).

```jsx
function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" value={form.email} onChange={handleChange} />
      <input
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

---

## 12. Performance Optimization

### 🟡 Q85. How do you optimize a React app?

- `React.memo`, `useMemo`, `useCallback` (where measured to help)
- **Code splitting** with `React.lazy` + `Suspense`
- **List virtualization** (`react-window`, `react-virtualized`)
- Stable, unique `key`s
- Avoid creating new objects/arrays/functions inline when passed to memoized children
- **Debounce/throttle** expensive handlers
- Move state **down** (colocate) so fewer components re-render
- Lazy-load images, optimize bundle size (tree shaking, analyzing with bundle analyzer)
- Use the **React DevTools Profiler** to measure before optimizing

### 🟡 Q86. Code splitting

```jsx
const Dashboard = React.lazy(() => import("./Dashboard"));

<Suspense fallback={<Spinner />}>
  <Dashboard />
</Suspense>;
```

Commonly applied per-route.

### 🟡 Q87. Causes of unnecessary re-renders

1. Parent re-renders → all children re-render by default (unless memoized)
2. New object/array/function literals passed as props each render
3. Context where any consumer re-renders on any value change
4. Unstable `key` values
5. Storing derived data in state instead of computing during render

**Fixes:** `React.memo`, `useMemo`, `useCallback`, splitting context, colocating state.

### 🟡 Q88. What is windowing/virtualization?

Rendering only the visible rows of a long list (plus a small buffer) instead of all of them — drastically reduces DOM nodes.

---

## 13. State Management & Context

### 🟡 Q89. Context API — and its drawback

Shares data (theme, auth, locale) without prop drilling. **Drawback:** every consumer re-renders when the Context value changes — avoid putting rapidly changing values in one big Context; split contexts or memoize the value.

### 🟡 Q90. Context vs Redux

| Context                                      | Redux (Toolkit)                                         |
| -------------------------------------------- | ------------------------------------------------------- |
| Built into React                             | External library                                        |
| Best for low-frequency updates (theme, auth) | Best for large, complex, frequently updated state       |
| No middleware / devtools by default          | Middleware, DevTools, time-travel, predictable patterns |

### 🟡 Q91. Redux core concepts

- **Store** — single source of truth
- **Action** — plain object describing what happened (`{ type, payload }`)
- **Reducer** — pure function `(state, action) => newState`
- **Dispatch** — sends actions to the store
- Modern usage: **Redux Toolkit** (`configureStore`, `createSlice`, `createAsyncThunk`, RTK Query) — uses Immer so you can "mutate" safely in reducers.

```jsx
const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
  },
});
// const dispatch = useDispatch(); const value = useSelector(s => s.counter.value);
```

### 🟡 Q92. Redux alternatives

Zustand, Jotai, Recoil, MobX, and **TanStack Query** / SWR for server state.

### 🟡 Q93. Server state vs client state

- **Server state:** remote data that is fetched, cached, and synced → TanStack Query / SWR / RTK Query
- **Client state:** UI-only state (modals, form inputs, theme) → `useState`, Context, Zustand

---

## 14. Routing, API Integration & Data Fetching

### 🟢 Q94. How does routing work? (React Router v6)

```jsx
<BrowserRouter>
  <nav>
    <Link to="/">Home</Link>
  </nav>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/users/:id" element={<User />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>;

// In a component
const { id } = useParams();
const navigate = useNavigate();
navigate("/dashboard");
```

Also know: `useLocation`, `useSearchParams`, nested routes with `<Outlet />`, `NavLink`.

### 🟡 Q95. How do you protect routes?

```jsx
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
```

### 🟢 Q96. REST API integration in React (full example)

```jsx
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function fetchUsers() {
      try {
        const res = await fetch("https://jsonplaceholder.typicode.com/users");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (!ignore) setUsers(data);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchUsers();
    return () => {
      ignore = true;
    }; // avoid setting state after unmount / stale responses
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}
```

**Talking points interviewers look for:**

- Handling **loading / error / success** states
- Using `key` correctly in lists
- **Cleanup** to avoid "setState on unmounted component" and race conditions
- `try/catch/finally` with `async/await`
- Checking `res.ok` (`fetch` doesn't reject on 404/500)

### 🟡 Q97. `fetch` vs `axios`

| fetch                                          | axios                                     |
| ---------------------------------------------- | ----------------------------------------- |
| Built-in                                       | External library                          |
| Doesn't reject on HTTP errors (check `res.ok`) | Rejects on non-2xx                        |
| Manual `res.json()`                            | Auto JSON parsing                         |
| No interceptors                                | Interceptors (auth tokens, global errors) |

### 🟡 Q98. How do you handle authentication (JWT) in React?

Store the token (preferably in an `HttpOnly` cookie; commonly in memory/localStorage for simple apps), attach it via an axios interceptor / `Authorization: Bearer` header, protect routes, and handle token expiry/refresh and 401 responses by redirecting to login.

### 🟡 Q99. Why use TanStack Query / SWR?

Built-in caching, deduplication, background refetching, retries, loading/error states, pagination, and automatic race-condition handling — less boilerplate than `useEffect` + `useState`.

---

## 15. Advanced React Concepts

### 🟡 Q100. Error Boundaries

Class components implementing `getDerivedStateFromError` / `componentDidCatch` that catch **rendering** errors in their child tree and show fallback UI. They do **not** catch errors in event handlers, async code, or server-side rendering. (Libraries like `react-error-boundary` provide a hook-friendly wrapper.)

### 🟡 Q101. Portals

Render children into a DOM node outside the parent hierarchy — used for modals, tooltips, dropdowns.

```jsx
ReactDOM.createPortal(<Modal />, document.getElementById("modal-root"));
```

### 🟡 Q102. `forwardRef`

Lets a component pass a `ref` down to a child DOM element or component. (In React 19, `ref` can be passed as a normal prop for function components.)

### 🟡 Q103. `StrictMode`

Development-only wrapper that highlights potential problems — double-invokes component bodies and effects to catch impure renders and missing cleanups. Has **no effect** in production builds.

### 🟡 Q104. Suspense

Lets components "wait" for something (lazy-loaded code, or data in Suspense-enabled libraries/frameworks) while showing a fallback.

### 🔴 Q105. What is hydration?

Attaching event listeners and React state to server-rendered HTML on the client.

### 🔴 Q106. CSR vs SSR vs SSG vs ISR

- **CSR:** rendered in the browser (SPA)
- **SSR:** rendered on the server for each request (better SEO / first paint)
- **SSG:** pre-rendered at build time
- **ISR:** static pages regenerated incrementally after deployment (Next.js)

### 🔴 Q107. What is React Fiber?

React's reconciliation engine (since v16) that enables incremental rendering, work prioritization, and pausing/resuming — the foundation for concurrent features.

### 🟡 Q108. How do you test React components?

**Jest** (or Vitest) + **React Testing Library** for unit/integration tests; **Cypress / Playwright** for end-to-end tests. Test **behavior as the user sees it**, not implementation details.

### 🟡 Q109. Styling approaches in React

CSS Modules, plain CSS/SASS, styled-components/Emotion (CSS-in-JS), Tailwind CSS, and component libraries (MUI, Chakra UI, shadcn/ui, Ant Design).

### 🟡 Q110. Accessibility (a11y) basics

Semantic HTML, `alt` text, labels linked to inputs (`htmlFor`), keyboard navigation, focus management in modals, ARIA attributes only when native semantics aren't enough, sufficient color contrast.

### 🟡 Q111. Best practices for structure & code quality

Feature-based folders, small reusable components, custom Hooks for logic, TypeScript, ESLint + Prettier, meaningful naming, avoid prop drilling, handle loading/error states, write tests.

---

## 16. React 18 / 19 & Modern Ecosystem

### 🟡 Q112. What's new in React 18?

- **Automatic batching**
- **Concurrent rendering** (interruptible rendering)
- `useTransition`, `useDeferredValue`
- `createRoot` API (`ReactDOM.createRoot(...).render(<App />)`)
- **Streaming SSR** with Suspense

### 🔴 Q113. What is concurrent rendering?

React can pause, interrupt, and prioritize rendering work so urgent updates (typing, clicking) stay responsive while less urgent updates (big list filtering) happen in the background.

### 🔴 Q114. React Server Components (RSC)

Components rendered on the **server** that ship no JavaScript to the client, can access backend resources directly, and reduce bundle size. Components needing interactivity are marked `"use client"`. Commonly used via Next.js App Router.

### 🔴 Q115. Notable React 19 additions

- **Actions** and `useActionState` for form/async mutations
- `useOptimistic` for optimistic UI
- `use` API for reading promises/context
- `ref` as a regular prop (less need for `forwardRef`)
- Built-in support for document metadata (`<title>`, `<meta>`)
- `useFormStatus` for form submit state

### 🔴 Q116. What is the React Compiler?

A build-time compiler that automatically memoizes components/values, reducing the need to manually write `useMemo` / `useCallback` / `React.memo`.

### 🟡 Q117. React vs Next.js

React is a UI library; **Next.js** is a framework built on React that adds routing, SSR/SSG/ISR, server components, API routes, image optimization, and more.

### 🟡 Q118. React vs Angular vs Vue (quick answer)

React: library, flexible, JSX, large ecosystem. Angular: full framework, TypeScript-first, opinionated, two-way binding. Vue: progressive framework, template-based, gentle learning curve.

---

# PART 3 — PRACTICE

## 17. Output-Based Questions (with Answers)

### How to approach them

1. **Separate sync vs async** — sync code runs first, top to bottom.
2. **Microtasks (Promises) before macrotasks (`setTimeout`).**
3. **Trace state updates** — `console.log` right after `setState` shows the **old** value (closure captured at render).
4. **Count renders** — a component re-renders when its state/props change or its parent re-renders (unless memoized).
5. **Count effect runs** — once on mount, then once per dependency change; Strict Mode double-invokes in dev only.

### JavaScript outputs

**Q1.**

```js
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");
```

**Answer:** `1, 4, 3, 2` — sync (1, 4) → microtask (3) → macrotask (2).

**Q2.**

```js
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
(async () => {
  console.log("D");
  await null;
  console.log("E");
})();
console.log("F");
```

**Answer:** `A, D, F, C, E, B` — the async function runs synchronously until `await`; the code after `await` is a microtask.

**Q3.**

```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);
```

**Answer:** `3 3 3` (single shared `var`). With `let` → `0 1 2`.

**Q4.**

```js
console.log(typeof null); // "object"
console.log(typeof undefined); // "undefined"
console.log(typeof NaN); // "number"
console.log(0.1 + 0.2 === 0.3); // false (floating point)
console.log([] == false); // true
console.log([1, 2, 3] + [4, 5]); // "1,2,34,5"
```

**Q5.**

```js
const obj = {
  name: "A",
  regular() {
    return this.name;
  },
  arrow: () => this.name,
};
console.log(obj.regular()); // "A"
console.log(obj.arrow()); // undefined
```

**Q6.**

```js
console.log(a); // undefined
var a = 1;
console.log(b); // ReferenceError (TDZ)
let b = 2;
```

### React outputs

**Q7. State is not updated immediately**

```jsx
const [count, setCount] = useState(0);
const handleClick = () => {
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);
};
```

**Answer:** After one click `count` becomes **1** (all three use the same stale `count = 0`). With `setCount(c => c + 1)` ×3 → **3**.

**Q8. Render count with children**

```jsx
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
      <Child />
    </>
  );
}
```

**Answer:** `Child` re-renders every time `Parent` renders, unless wrapped in `React.memo`.

**Q9. Effect ordering**

```jsx
function Child() {
  useEffect(() => console.log("child effect"), []);
  console.log("child render");
  return null;
}
function Parent() {
  useEffect(() => console.log("parent effect"), []);
  console.log("parent render");
  return <Child />;
}
```

**Answer:** `parent render → child render → child effect → parent effect` (render top-down; effects run **child first**).

**Q10. Stale closure in interval**

```jsx
function Timer() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCount(count + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <p>{count}</p>;
}
```

**Answer:** Count stops at **1** — the callback captured `count = 0` forever. Fix: `setCount(c => c + 1)` or add `count` to dependencies.

**Q11. Object in dependency array**

```jsx
const options = { page: 1 }; // new object every render
useEffect(() => fetchData(options), [options]);
```

**Answer:** Runs on **every** render (new reference each time). Fix: depend on primitives (`options.page`), `useMemo`, or move the object inside the effect.

**Q12. Does mutating state re-render?**

```jsx
const [list, setList] = useState([1, 2]);
list.push(3);
setList(list);
```

**Answer:** No re-render — same reference. Use `setList([...list, 3])`.

**Q13. Conditional `&&` pitfall**

```jsx
{
  count && <p>Items: {count}</p>;
} // when count = 0 → renders "0"
```

**Fix:** `{count > 0 && ...}`.

---

## 18. Practical Scenarios

### Scenario 1 — Optimize a search API called on every keystroke

- **Debounce** the input (~300–500 ms)
- **Cancel** in-flight requests when a new one starts (`AbortController`)
- Add a **minimum character** threshold
- Optionally cache results / use TanStack Query

```jsx
function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then(setResults)
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      });
    return () => controller.abort();
  }, [debouncedQuery]);

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul>
        {results.map((r) => (
          <li key={r.id}>{r.name}</li>
        ))}
      </ul>
    </>
  );
}
```

### Scenario 2 — Prevent stale API responses (race conditions)

**Problem:** user types "a" then "ab"; the response for "a" arrives _after_ "ab" and overwrites newer results.

**Solutions:**

- `AbortController` to cancel the previous request
- `ignore` / `isCurrent` flag in `useEffect` cleanup
- Track a request ID and apply only the latest
- Use React Query / SWR (handles this automatically)

### Scenario 3 — Page rendering thousands of records is slow

- **Virtualization** (`react-window`)
- **Pagination** or **infinite scroll** (load incrementally)
- `React.memo` on row components + stable props (`useCallback`/`useMemo`)
- Move heavy filtering/sorting into `useMemo` (or a Web Worker)
- Stable, unique `key`s
- Server-side pagination/filtering when the dataset is very large

### Scenario 4 — Debug unnecessary re-renders

- **React DevTools Profiler** — record, and use "why did this render"
- `console.log` inside components to count renders
- Check for: inline object/array/function props, Context consumers re-rendering, missing `React.memo`, parent state changes affecting big subtrees
- Fix incrementally: memoize, split context, colocate/lift state appropriately

### Scenario 5 — Handle loading, error and empty states

Always render distinct UI for **loading**, **error (with retry)**, **empty**, and **success**. Show skeletons/spinners, never leave users with a blank screen.

### Scenario 6 — Memory leak warnings / "state update on unmounted component"

Clean up subscriptions, timers, listeners, and in-flight requests in the `useEffect` return function.

### Scenario 7 — A component re-renders in an infinite loop

Usual causes: setting state during render, `useEffect` with no/incorrect dependency array that sets state, a dependency that changes every render (new object/function). Fix by correcting dependencies, memoizing, or moving logic out of the effect.

### Scenario 8 — Share data between unrelated components

Lift state up → Context → global store (Zustand/Redux), based on how many components and how often it updates.

### Scenario 9 — How would you structure a large React project?

Feature-based folders (`features/auth`, `features/cart`), shared `components/`, `hooks/`, `services/` (API layer), `utils/`, route-level code splitting, consistent naming, and absolute imports.

### Scenario 10 — Improve initial page load time

Code splitting, lazy loading routes/images, compress/optimize assets, remove unused dependencies, caching/CDN, SSR/SSG where appropriate, prefetch critical data, analyze bundle size.

---

## 19. Machine Coding Tasks

> Practice writing these **from scratch in 20–30 minutes**. Interviewers love them.

### 🟢 Counter

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <>
      <p>{count}</p>
      <button onClick={() => setCount((c) => c - 1)}>-</button>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </>
  );
}
```

### 🟢 Todo List (add / delete / toggle)

```jsx
function Todos() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");

  const add = () => {
    if (!text.trim()) return;
    setTodos((t) => [...t, { id: crypto.randomUUID(), text, done: false }]);
    setText("");
  };
  const toggle = (id) =>
    setTodos((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  const remove = (id) => setTodos((t) => t.filter((x) => x.id !== id));

  return (
    <>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={add}>Add</button>
      <ul>
        {todos.map((t) => (
          <li key={t.id}>
            <span
              onClick={() => toggle(t.id)}
              style={{ textDecoration: t.done ? "line-through" : "none" }}
            >
              {t.text}
            </span>
            <button onClick={() => remove(t.id)}>x</button>
          </li>
        ))}
      </ul>
    </>
  );
}
```

### 🟢 Toggle (show/hide, dark mode)

```jsx
const [show, setShow] = useState(false);
<button onClick={() => setShow((s) => !s)}>Toggle</button>;
{
  show && <p>Visible</p>;
}
```

### 🟡 Search / Filter list

```jsx
function FilterList({ items }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase())),
    [items, q],
  );
  return (
    <>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search..."
      />
      <ul>
        {filtered.map((i) => (
          <li key={i.id}>{i.name}</li>
        ))}
      </ul>
    </>
  );
}
```

### 🟡 Accordion

```jsx
function Accordion({ items }) {
  const [open, setOpen] = useState(null);
  return items.map((item, i) => (
    <div key={item.id}>
      <button onClick={() => setOpen(open === i ? null : i)}>
        {item.title}
      </button>
      {open === i && <p>{item.content}</p>}
    </div>
  ));
}
```

### 🟡 Tabs

```jsx
function Tabs({ tabs }) {
  const [active, setActive] = useState(0);
  return (
    <>
      {tabs.map((t, i) => (
        <button
          key={t.label}
          onClick={() => setActive(i)}
          style={{ fontWeight: active === i ? "bold" : "normal" }}
        >
          {t.label}
        </button>
      ))}
      <div>{tabs[active].content}</div>
    </>
  );
}
```

### 🟡 Star Rating

```jsx
function StarRating({ total = 5 }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  return [...Array(total)].map((_, i) => {
    const val = i + 1;
    return (
      <span
        key={val}
        onClick={() => setRating(val)}
        onMouseEnter={() => setHover(val)}
        onMouseLeave={() => setHover(0)}
        style={{
          cursor: "pointer",
          color: val <= (hover || rating) ? "gold" : "gray",
        }}
      >
        ★
      </span>
    );
  });
}
```

### 🟡 Fetch & display API data with pagination

```jsx
function Posts() {
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(
      `https://jsonplaceholder.typicode.com/posts?_page=${page}&_limit=10`,
      { signal: controller.signal },
    )
      .then((r) => r.json())
      .then(setPosts)
      .catch((e) => e.name !== "AbortError" && console.error(e))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [page]);

  return (
    <>
      {loading ? (
        <p>Loading...</p>
      ) : (
        posts.map((p) => <p key={p.id}>{p.title}</p>)
      )}
      <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
        Prev
      </button>
      <button onClick={() => setPage((p) => p + 1)}>Next</button>
    </>
  );
}
```

### 🟡 Modal with Portal (+ close on Escape)

```jsx
function Modal({ open, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
```

### 🟡 Custom hooks to practice

`useDebounce`, `useLocalStorage`, `useFetch`, `usePrevious`, `useToggle`, `useOnClickOutside`, `useWindowSize`.

```jsx
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((o) => !o), []);
  return [on, toggle];
}
```

### 🟡 Infinite scroll (idea)

Use `IntersectionObserver` on a sentinel element at the bottom of the list; when it's visible, load the next page and append.

### More tasks to practice

- Form with validation (email/password) and error messages
- Progress bar / stepper / multi-step form
- Image carousel / slider
- Tic-Tac-Toe / Memory game
- Nested comments / file explorer (recursion)
- Autocomplete / typeahead
- Debounced search with highlighting
- Dropdown with click-outside to close
- Cart with add/remove/quantity and total
- Stopwatch / countdown timer

---

# PART 4 — SUPPORTING TOPICS

## 20. HTML & CSS Quick Hits

### 🟢 Q1. Semantic HTML?

Using meaningful tags (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`) — better for SEO and accessibility.

### 🟢 Q2. CSS Box Model?

Every element = **content + padding + border + margin**. `box-sizing: border-box` includes padding and border in the declared width/height.

### 🟢 Q3. `display: none` vs `visibility: hidden` vs `opacity: 0`

- `display: none` → removed from layout
- `visibility: hidden` → hidden but **takes space**
- `opacity: 0` → invisible but takes space and **still receives events**

### 🟢 Q4. Flexbox vs Grid

Flexbox → **one-dimensional** layout (row or column). Grid → **two-dimensional** (rows and columns together).

### 🟢 Q5. `position` values

`static` (default), `relative`, `absolute` (relative to nearest positioned ancestor), `fixed` (relative to viewport), `sticky` (toggles between relative and fixed on scroll).

### 🟡 Q6. CSS specificity

Inline styles > IDs > classes/attributes/pseudo-classes > elements. `!important` overrides all (avoid).

### 🟡 Q7. `em` vs `rem` vs `px` vs `%` vs `vh/vw`

`rem` → relative to root font size; `em` → relative to parent font size; `vh/vw` → viewport percentage.

### 🟡 Q8. How do you make a site responsive?

Fluid layouts (flex/grid, `%`, `rem`), media queries (`@media (max-width: 768px)`), mobile-first approach, responsive images, viewport meta tag.

### 🟡 Q9. How do you center a div?

```css
.parent {
  display: flex;
  justify-content: center;
  align-items: center;
}
/* or */
.parent {
  display: grid;
  place-items: center;
}
```

---

## 21. TypeScript, Git & Tooling Basics

### 🟡 TypeScript (increasingly expected)

- **Why TS?** Static typing, fewer runtime bugs, better IDE support.
- `interface` vs `type` — both describe shapes; `interface` is extendable/mergeable, `type` supports unions/intersections/primitives.
- **Typing props & state:**

```tsx
interface ButtonProps {
  label: string;
  onClick?: () => void;
}
const Button = ({ label, onClick }: ButtonProps) => (
  <button onClick={onClick}>{label}</button>
);

const [user, setUser] = useState<User | null>(null);
```

- `any` vs `unknown`, generics, union types, optional properties, `Partial`, `Pick`, `Omit`.

### 🟢 Git basics

- `git clone`, `add`, `commit`, `push`, `pull`, `branch`, `checkout/switch`, `merge`, `rebase`, `stash`, `log`, `diff`
- **Merge vs rebase:** merge keeps history with a merge commit; rebase rewrites history into a linear sequence (don't rebase shared branches).
- **How do you resolve merge conflicts?** Open conflicted files, choose/combine changes, remove markers, `git add`, then commit.
- `git fetch` vs `git pull` (`pull` = `fetch` + `merge`).

### 🟢 Tooling

- **npm / yarn / pnpm**, `package.json` vs `package-lock.json`, `dependencies` vs `devDependencies`
- **Vite / Webpack** — bundlers; **Babel / SWC** — transpilers; **ESLint / Prettier** — linting/formatting
- **Environment variables** (`import.meta.env.VITE_*` in Vite, `process.env.NEXT_PUBLIC_*` in Next.js)
- **Browser DevTools:** Network tab, Console, Elements, Performance, React DevTools

---

## 22. Project / Behavioral Questions (2-Year Level)

At 2 years, expect **roughly 30–40% of the interview to be about your actual project work.** Prepare concrete answers.

### Project questions

1. Walk me through your current/last project — architecture, tech stack, your role.
2. What was the **most challenging bug or feature** you worked on? How did you solve it?
3. How did you **structure state management** and why did you choose that approach?
4. How do you **integrate APIs**, handle errors, and manage authentication?
5. How did you **optimize performance** in your project? (Give a measurable result if possible.)
6. How do you handle **code reviews** — giving and receiving feedback?
7. What does your **Git workflow** look like (branches, PRs, CI/CD)?
8. How did you **test** your code? (Unit, integration, manual.)
9. How do you handle **responsive design / cross-browser** issues?
10. Describe a time you **disagreed** with a teammate or a design decision.
11. How do you **estimate** tasks and handle deadlines?
12. What would you **improve** in your project if you had more time?

### Answering framework — **STAR**

**S**ituation → **T**ask → **A**ction → **R**esult (use numbers where possible: "reduced load time by 35%").

### Common HR / general questions

- Tell me about yourself _(2 minutes: background → skills → recent project → why this role)_
- Why do you want to leave your current job / why this company?
- Strengths and weaknesses
- Where do you see yourself in 3–5 years?
- Notice period, expected CTC, relocation/remote preferences
- Do you have any questions for us? _(Ask about team structure, tech stack, code review process, growth)_

### Beginner-specific (0 years / fresher)

- Walk through your **academic / personal projects** (be ready to explain every line of code)
- Why React? How did you learn it?
- What's the last thing you learned, and how?
- Have you contributed to open source or built something deployed (Netlify/Vercel)?

---

## 23. Quick Revision Cheat Sheet & Study Plan

### Things interviewers LOVE to test

- Predicting `console.log` order with mixed sync / Promise / `setTimeout` / `async-await`
- Whether `setState` is synchronous (it's **not** — batched; closures capture old values)
- Why array **index as `key`** can cause bugs
- **Mutating state** vs creating a new reference
- Why **`useEffect` cleanup** matters (leaks, stale subscriptions, race conditions)
- **Controlled vs uncontrolled** components
- **Lifting state up** vs Context vs state library
- **`useMemo` vs `useCallback` vs `React.memo`** — and when _not_ to use them
- **Closures** and the `var` vs `let` loop trap
- **`this`** in arrow vs regular functions
- **Debounce vs throttle**
- **Promise.all vs allSettled**, and sequential vs parallel `await`
- **Event loop**: microtasks before macrotasks

### One-line answers to memorize

| Topic         | One-liner                                                          |
| ------------- | ------------------------------------------------------------------ |
| Virtual DOM   | In-memory tree React diffs to update the real DOM minimally        |
| Props         | Read-only inputs passed down from parent                           |
| State         | Component's private, changeable data; changing it re-renders       |
| `useEffect`   | Side effects after render; cleanup runs before next effect/unmount |
| `useMemo`     | Cache a computed value                                             |
| `useCallback` | Cache a function reference                                         |
| `React.memo`  | Skip re-render if props are shallow-equal                          |
| `useRef`      | Mutable box that survives renders without re-rendering             |
| Context       | Avoid prop drilling; all consumers re-render on value change       |
| Key           | Identity of a list item for reconciliation                         |
| Closure       | Function + its remembered outer scope                              |
| Event loop    | Stack → all microtasks → one macrotask → repeat                    |

### Suggested study plan

**Week 1 — JavaScript core**
Scope, hoisting, closures, `this`, array methods, destructuring/spread, shallow vs deep copy. Solve output-based questions daily.

**Week 2 — Async JS + React fundamentals**
Event loop, Promises, async/await, `fetch`. React: JSX, components, props, state, lists, forms, events.

**Week 3 — Hooks & patterns**
`useEffect` (all pitfalls), `useRef`, `useMemo`/`useCallback`, `useContext`, `useReducer`, custom hooks, performance basics.

**Week 4 — Ecosystem & practice**
React Router, API integration, Redux Toolkit/Zustand, TanStack Query, code splitting, TypeScript basics. Build 3–4 machine-coding tasks from scratch.

**Week 5 — Mock & polish**
Mock interviews, project walkthrough (STAR), system-design-lite for the frontend (e.g., "design a news feed / autocomplete"), revise this document.

### Final tips

- Explain the **why**, not just the **what**.
- **Think out loud** during coding rounds; clarify requirements first.
- Handle **edge cases** (empty list, loading, errors) — it separates good from great.
- Know **trade-offs** (Context vs Redux, CSR vs SSR, cost of memoization).
- If you don't know something, say so honestly and reason through it.

**Good luck with your interviews! 🚀**
