# 01 - Memoization and `React.memo`

> **Time to learn:** ~40 min | **Level:** Core concept | **Interview frequency:** Very high
> Read Day 3 `03-rendering.md` first (why components re-render). This file is about _skipping_ renders.

## 1. What is memoization?

**Memoization = remembering the result of a function for a given input, so you don't compute it again.** If the input is the same, return the saved result.

```js
function memoize(fn) {
  const cache = new Map();
  return function (n) {
    if (cache.has(n)) return cache.get(n); // same input: reuse
    const result = fn(n);
    cache.set(n, result);
    return result;
  };
}

let calls = 0;
const slowSquare = (n) => {
  calls++;
  return n * n;
};
const fastSquare = memoize(slowSquare);

fastSquare(9);
fastSquare(9);
fastSquare(9);
console.log(calls); // 1  (computed once, served from the cache twice)
```

It is a **closure** (Day 1) over a `cache`, the same idea as your Day 2 `debounce`.

## 2. Analogy

A cashier who has memorised "a coffee and a muffin = 7.50". When the same order comes in, she says the total without using the calculator. If the order is _different_, she must calculate. **Memoization saves work only when inputs repeat**, and it costs her a little memory and effort to remember the orders.

## 3. Memoization in React: three tools

| Tool                        | What it remembers                                      | Skips                                                          |
| --------------------------- | ------------------------------------------------------ | -------------------------------------------------------------- |
| **`React.memo(Component)`** | the **rendered output of a component** for given props | re-rendering that component                                    |
| **`useMemo(fn, deps)`**     | a **calculated value**                                 | recalculating it (`02-usememo-usecallback.md`)                 |
| **`useCallback(fn, deps)`** | a **function reference**                               | creating a new function identity (`02-usememo-usecallback.md`) |

The most important one for performance is `React.memo`. The other two mostly exist to **help `memo` work**.

## 4. `React.memo`

By default, when a parent re-renders, **all its children re-render**, even if their props are identical. `memo` changes that: React compares the **new props with the old props**, and if every prop is the same it **reuses the previous result and skips rendering**.

```jsx
import { memo } from "react";

const CourseCard = memo(function CourseCard({ title, hours }) {
  console.log("render", title);
  return (
    <li>
      {title} ({hours}h)
    </li>
  );
});

function Page() {
  const [note, setNote] = useState("");
  return (
    <>
      <input value={note} onChange={(e) => setNote(e.target.value)} />
      <ul>
        <CourseCard title="HTML" hours={4} />
        <CourseCard title="CSS" hours={6} />
      </ul>
    </>
  );
}
```

Typing in the input re-renders `Page` on every key, but `CourseCard` logs **nothing** after the first render: its props (`"HTML"`, `4`) are the same.

### How the comparison works: shallow, `Object.is`

For **each prop**, React asks `Object.is(oldProp, newProp)`:

| Prop type                 | Same value?                                                      | Result               |
| ------------------------- | ---------------------------------------------------------------- | -------------------- |
| string, number, boolean   | `"a"` vs `"a"` -> equal                                          | skip OK              |
| object / array / function | **compared by reference**, a new one every render is "different" | **memo is defeated** |

```jsx
<CourseCard course={{ title: "HTML" }} />          // new object every render -> re-renders every time
<CourseCard tags={["a", "b"]} />                   // new array every render -> re-renders every time
<CourseCard onSelect={() => select(1)} />          // new function every render -> re-renders every time
```

Two objects with the **same contents** are still **different references**: `{a:1} === {a:1}` is `false`. This is **referential equality**, and it is the reason `useMemo` and `useCallback` exist.

## 5. When `memo` does NOT skip the render

A memoized component **still re-renders** when:

1. **Its own state changes.** `memo` only guards against _parent-caused_ renders.
2. **A context it uses changes** (`useContext`), even if its props are the same.
3. **A prop changes by reference** (new object/array/function each render).
4. **`children` is passed as JSX.** `<Card><b>hi</b></Card>`: the `<b>` element is a **new object every parent render**, so `children` always "changed".

```jsx
const Box = memo(function Box({ children }) {
  /* ... */
});

<Box>
  <b>hi</b>
</Box>; // children = a brand-new React element each render -> memo is useless here
```

## 6. When memoization helps and when it doesn't

**Memoization pays off when ALL of these are true:**

1. The component (or calculation) is **actually slow or large** (hundreds of rows, charts, heavy markup).
2. It is **rendered often with the same props** (a parent with fast-changing state, like a text input).
3. The props are **stable** (primitives, or memoized objects/functions).

**It does NOT help (or hurts) when:**

| Situation                                           | Why                                              |
| --------------------------------------------------- | ------------------------------------------------ |
| The component is tiny (`<li>{title}</li>`)          | Rendering is cheaper than the comparison         |
| Props change on almost every render anyway          | You pay the comparison cost and still render     |
| An unstable prop (inline object/function) is passed | `memo` never skips, so it's pure overhead        |
| You wrap everything "just in case"                  | More code, more bugs (stale values), little gain |

Memoization is **not free**: it stores the previous props and result in memory, and runs a comparison on every render.

**Rule:** first **measure** (React DevTools Profiler, or a render counter), then optimise the slow part. And first try the **free fixes** below.

## 7. Fix it without memo first

Before reaching for `memo`, try changing the structure (see `03-composition.md`):

1. **Move state down**: put the fast-changing state (the input) into its own small component, so the expensive siblings are not its children at all.
2. **Lift content up (`children`)**: pass the expensive part as `children` from a parent that doesn't re-render.

These are free (no comparison, no stale closures).

## 8. The React Compiler

React 19 has an optional **React Compiler** (a build plugin) that adds `memo`/`useMemo`/`useCallback`-style caching **automatically**. With it you write fewer manual memoizations, but you still need to understand referential equality and _why_ something re-renders. It is an interview staple either way.

## 9. Common mistakes

1. Wrapping every component in `memo` without measuring.
2. Memoizing a component and then passing it an **inline function/object** (memo never skips).
3. Passing JSX `children` to a memoized component and expecting it to skip.
4. Thinking `memo` stops re-renders caused by the component's **own state or context**.
5. Putting a **side effect or a counter** in render to "prove" memoization and forgetting that StrictMode runs render twice in development.
6. Using `memo` to fix **correctness** (wrong output). It is only a performance optimisation: your app must be correct without it.
7. Using an **index or random value** as a key and blaming `memo` for resetting (that's a keys issue, Day 3 `09`).

## 10. Predict the output

All questions use this counter (it counts how many times a component function ran; **no StrictMode**):

```jsx
let renders = 0;
const Leaf = memo(function Leaf({ label, options, onPick, children }) {
  renders++;
  return (
    <i>
      {label}
      {children}
    </i>
  );
});
```

**Q1** After the first render and **one** click on "tick", what is `renders`?

```jsx
function P() {
  const [n, setN] = useState(0);
  return (
    <>
      <button onClick={() => setN(n + 1)}>tick</button>
      <Leaf label="a" />
    </>
  );
}
```

**Q2** Same, but the parent passes an object. What is `renders` after one click?

```jsx
function P() {
  const [n, setN] = useState(0);
  return (
    <>
      <button onClick={() => setN(n + 1)}>tick</button>
      <Leaf label="a" options={{ dense: true }} />
    </>
  );
}
```

**Q3** Same, but the parent passes JSX children. What is `renders` after one click?

```jsx
function P() {
  const [n, setN] = useState(0);
  return (
    <>
      <button onClick={() => setN(n + 1)}>tick</button>
      <Leaf label="a">
        <b>hi</b>
      </Leaf>
    </>
  );
}
```

**Q4** `Leaf` is rendered once and its parent **context value changes** from `"light"` to `"dark"`, but `Leaf` is a _memo_ component that **reads that context with `useContext`**. Does it re-render?

**Q5** What does `calls` print (use the `memoize` function from section 1)?

```js
const f = memoize((n) => {
  calls++;
  return n * 2;
});
f(1);
f(2);
f(1);
f(2);
f(3);
console.log(calls);
```

## 11. Answers

- **Q1:** `renders` = **1**. The parent re-rendered, but `label="a"` is unchanged, so `memo` skipped `Leaf`.
- **Q2:** `renders` = **2**. `{ dense: true }` is a new object on every parent render, so the shallow comparison fails.
- **Q3:** `renders` = **2**. `<b>hi</b>` is a new element each render, so `children` changed.
- **Q4:** **Yes.** `memo` only compares props. A component re-renders when a context it reads changes, regardless of `memo`.
- **Q5:** `calls` = **3** (only `1`, `2` and `3` are computed; the repeats of `1` and `2` come from the cache).

## Recap

- **Memoization** = cache a result by its inputs. Only helpful when inputs **repeat** and the work is **expensive**.
- **`React.memo`** skips re-rendering when all props are `Object.is`-equal. It does **not** stop re-renders from the component's own **state** or **context**.
- Objects, arrays, functions and JSX children created in render are **new references each time**, which defeats `memo`.
- It has a cost. **Measure first**, and try **moving state down / lifting content up** before `memo`.

## Checklist

- [ ] I can explain memoization with the `memoize` example
- [ ] I can say how `React.memo` compares props (shallow, `Object.is`)
- [ ] I can list 4 situations where a memoized component still re-renders
- [ ] I can explain why memoizing a tiny component is pointless
- [ ] I got Q1 to Q5 right without looking
