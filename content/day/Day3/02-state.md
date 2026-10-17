# 02 - State

> **Time to learn:** ~40 min | **Level:** Core concept | **Interview frequency:** Extremely high

## 1. What is state?

**State** is **data that a component remembers between renders** and that, when changed, makes React **re-render** the component.

A normal variable can't do this:

```jsx
function Broken() {
  let count = 0;                        // reset to 0 on EVERY render, and changing it doesn't re-render
  return <button onClick={() => { count++; }}>{count}</button>;   // always shows 0
}
```

`useState` gives you two things: a value that **survives** renders, and a **setter** that **schedules a re-render**.

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);      // [current value, setter]; 0 = initial value
  return <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>;
}
```

## 2. Analogy

A component is like a **whiteboard that gets wiped and redrawn on every render**. A normal variable is something you scribble on the board: gone at the next redraw. **State is a note React keeps in its own pocket** and hands back to you each time, and when you give React a new note (the setter), it redraws the board.

## 3. State is a snapshot (the most important idea)

Inside one render, **the state value never changes**. It is a **snapshot** of the value at the time of that render. Calling the setter doesn't change the variable you already have, it **asks React to render again with a new snapshot**.

```jsx
function Demo() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 5);
    console.log(count);        // still 0! this render's snapshot
  }

  return <button onClick={handleClick}>{count}</button>;
}
```

First click: logs `0`, then the UI shows `5`.

The same applies to timers and async code: they see the **snapshot from the render that created them**.

```jsx
function handleClick() {
  setCount(count + 5);
  setTimeout(() => console.log(count), 100);   // logs 0, not 5
}
```

## 4. Updating state based on the previous state (functional updates)

```jsx
function handleClick() {
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);       // all three use the SAME snapshot (0): result is 1, not 3
}
```

```jsx
function handleClick() {
  setCount((c) => c + 1);
  setCount((c) => c + 1);
  setCount((c) => c + 1);    // each receives the latest queued value: result is 3
}
```

**Rule:** if the new state depends on the previous state, use the **updater function** `setX(prev => ...)`.

## 5. Batching

React **groups several state updates from the same event into one re-render** (since React 18 this also applies inside timeouts, promises and native events):

```jsx
function handleClick() {
  setA(1);
  setB(2);
  setC(3);        // ONE re-render, not three
}
```

## 6. Never mutate state: always create a new value

React decides whether to re-render by comparing the **old and new value with `Object.is`** (same reference = "nothing changed"). If you mutate the existing object/array and pass the same reference, **nothing happens**.

```jsx
const [user, setUser] = useState({ name: "Asha", age: 20 });

// WRONG: same reference, React skips the update
user.name = "Ravi";
setUser(user);

// RIGHT: a new object
setUser({ ...user, name: "Ravi" });
```

Cheat sheet for arrays and objects:

| Goal | Don't (mutates) | Do (new value) |
|---|---|---|
| Add to array | `arr.push(x)` | `[...arr, x]` |
| Remove from array | `arr.splice(i, 1)` | `arr.filter((item) => item.id !== id)` |
| Replace an item | `arr[i] = x` | `arr.map((item) => item.id === id ? { ...item, done: true } : item)` |
| Sort / reverse | `arr.sort()` / `arr.reverse()` | `[...arr].sort(...)` or `arr.toSorted(...)` |
| Update object field | `obj.a = 1` | `{ ...obj, a: 1 }` |
| Update nested field | `obj.a.b = 1` | `{ ...obj, a: { ...obj.a, b: 1 } }` |

Example: a todo list.

```jsx
function Todos() {
  const [todos, setTodos] = useState([{ id: 1, text: "Learn React", done: false }]);

  const add = (text) => setTodos((prev) => [...prev, { id: crypto.randomUUID(), text, done: false }]);
  const toggle = (id) => setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id) => setTodos((prev) => prev.filter((t) => t.id !== id));
  // ...
}
```

## 7. Lazy initial state

`useState(initial)` uses `initial` **only on the first render**, but the expression is **evaluated on every render**. For expensive work, pass a **function** so it only runs once:

```jsx
const [data, setData] = useState(readHugeThingFromStorage());     // runs every render (result ignored after the 1st)
const [data, setData] = useState(() => readHugeThingFromStorage()); // runs once
```

## 8. Don't store what you can calculate (derived state)

If a value can be **computed from props or other state**, calculate it during render instead of storing it in another state variable. Two copies of the same truth get out of sync.

```jsx
// BAD: filtered is a second source of truth, you must remember to update it
const [items, setItems] = useState(allItems);
const [query, setQuery] = useState("");
const [filtered, setFiltered] = useState(allItems);

// GOOD: calculate it
const [query, setQuery] = useState("");
const filtered = allItems.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()));
```

This is exactly how the searchable list in `06-coding-searchable-list.md` works.

## 9. Lifting state up

When **two components need the same data**, move the state to their **closest common parent** and pass it down as props (plus callbacks to change it).

```jsx
function Parent() {
  const [query, setQuery] = useState("");
  return (
    <>
      <SearchBox value={query} onChange={setQuery} />   // changes it
      <Results query={query} />                          // reads it
    </>
  );
}
```

## 10. What should be state?

Ask: does it **change over time**, is it **not passed in as a prop**, and **can't it be calculated** from something else? If yes to all, it's state.

| Use `useState` | Don't |
|---|---|
| Input text, toggles, selected tab, fetched data, form values | Values derived from other state/props |
| | Values that must **not** trigger a render (timer IDs, previous values): use `useRef` |
| | Constants: keep them outside the component |

## 11. Common mistakes

1. **Mutating state** (`arr.push`, `obj.x = ...`) and wondering why nothing updates.
2. **Reading state right after setting it** and expecting the new value (snapshot!).
3. **`setCount(count + 1)` several times** in a row expecting +N. Use the updater form.
4. **Duplicating props or derived values in state.**
5. **Calling hooks conditionally** or inside loops (see `04-hooks.md`).
6. **Setting state during render** unconditionally (infinite loop: "Too many re-renders").
7. **Using the array index or random values as identity** in a list of stateful rows (see keys in `09`).

## 12. Predict the output

**Q1** What does the button show after **one** click?
```jsx
function A() {
  const [n, setN] = useState(0);
  return <button onClick={() => { setN(n + 1); setN(n + 1); setN(n + 1); }}>{n}</button>;
}
```

**Q2** And this one?
```jsx
function B() {
  const [n, setN] = useState(0);
  return <button onClick={() => { setN((c) => c + 1); setN((c) => c + 1); setN((c) => c + 1); }}>{n}</button>;
}
```

**Q3** What is logged by the timeout after one click, and what does the button show later?
```jsx
function C() {
  const [n, setN] = useState(0);
  return (
    <button onClick={() => { setN(n + 5); setTimeout(() => console.log(n), 100); }}>{n}</button>
  );
}
```

**Q4** What does `<p>` show after clicking "mut", and then "copy"?
```jsx
function M() {
  const [u, setU] = useState({ name: "a" });
  return (
    <div>
      <button onClick={() => { u.name = "mutated"; setU(u); }}>mut</button>
      <button onClick={() => setU({ ...u, name: "copied" })}>copy</button>
      <p>{u.name}</p>
    </div>
  );
}
```

**Q5** How many times is `expensive()` called after the component has rendered **3 times** in total?
```jsx
let calls = 0;
const expensive = () => { calls++; return 42; };

function D() {
  const [n, setN] = useState(expensive());
  const [m] = useState(() => expensive());
  return <button onClick={() => setN(n + 1)}>{n}{m}</button>;
}
```

## 13. Answers

- **Q1:** `1`. All three calls use the same snapshot (`n = 0`), so each sets the value to `1`.
- **Q2:** `3`. Each updater receives the result of the previous one.
- **Q3:** The timeout logs `0` (the snapshot of the render that created it), and the button shows `5`.
- **Q4:** After "mut": still `a` (same reference, React bails out, and the object is silently corrupted). After "copy": `copied`.
- **Q5:** `4`. The eager `useState(expensive())` runs on **every** render (3 times, result ignored after the first), the lazy form runs **once**.

## Recap

- State = remembered data that triggers a re-render when changed (`const [x, setX] = useState(initial)`).
- Each render sees a **snapshot**; the setter schedules a new render, it doesn't change the current value.
- Depend on the previous value? Use **`setX(prev => ...)`**.
- Updates are **batched**. State must be treated as **immutable**: always create new arrays/objects.
- Don't store derived values; **lift state up** when siblings share it.
- Use the lazy initialiser `useState(() => ...)` for expensive starts.

## Checklist

- [ ] I can explain "state is a snapshot" with the `setCount(count + 1)` x3 example
- [ ] I can add, remove and update items in an array without mutating
- [ ] I can explain why mutating state doesn't re-render
- [ ] I know when to use `useRef` instead of `useState`
- [ ] I got Q1 to Q5 right without looking
