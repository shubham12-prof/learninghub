# 07 - Interview: `useState`

> **Time to learn:** ~35 min | **Interview frequency:** Almost guaranteed
> Read `02-state.md` first. This file is about **how to answer**.

## 1. The 30-second answer (say this out loud)

> "`useState` is a hook that lets a function component remember a value between renders. It returns an array with the current value and a setter, and it takes the initial value, which is only used on the first render. Calling the setter schedules a re-render with the new value. State is a snapshot, so within one render the value never changes, and when the new state depends on the old one I use the functional form, `setX(prev => ...)`. State must be treated as immutable, so for objects and arrays I always create a new copy, otherwise React sees the same reference and skips the update."

## 2. Common interview questions and model answers

### Q1. What does `useState` return and why an array?

A pair: `[value, setValue]`. It's an array so you can **name the two items anything you like** with destructuring (`const [count, setCount] = useState(0)`). An object would force fixed names.

### Q2. Is the state update synchronous?

**No.** The setter **schedules** a re-render. The variable you already hold doesn't change during the current render (a snapshot), so reading state right after `setX(...)` gives the old value.

```jsx
function handleClick() {
  setCount(count + 5);
  console.log(count); // old value
}
```

If you really need the latest value, compute it first (`const next = count + 5; setCount(next); use(next);`) or read it in an effect/next render.

### Q3. Why does `setCount(count + 1)` three times add only 1?

All three calls read the **same snapshot** of `count`. Use the functional form so each call receives the latest queued value:

```jsx
setCount((c) => c + 1);
setCount((c) => c + 1);
setCount((c) => c + 1); // +3
```

### Q4. What is batching?

React groups multiple state updates made in the same event (and, since React 18, also inside timeouts, promises and native handlers) into **one re-render**.

### Q5. Why must state be immutable?

React decides whether to re-render by comparing the old and new value with `Object.is`. If you mutate and pass the **same reference**, React thinks nothing changed and **skips the update**. Immutability also makes `memo`, time-travel/debugging and effect dependency checks reliable.

### Q6. What is lazy initialisation?

Passing a **function** to `useState` so an expensive initial value is computed **only once**:
`useState(() => readFromStorage())` instead of `useState(readFromStorage())` (which calls `readFromStorage` on **every** render and ignores the result after the first).

### Q7. What happens if I call `setState` with the same value?

React **bails out**: it skips re-rendering the children and doesn't change the DOM (it may call the component once more before bailing out).

### Q8. What's the difference between state and props?

Props are **inputs from the parent** (read-only). State is **owned by the component** and changed through its setter. See the table in `01-props.md`.

### Q9. State vs `useRef`?

Both persist across renders. Changing **state re-renders**; changing **`ref.current` doesn't**. Use state for what's displayed, refs for timer ids and DOM nodes.

### Q10. When should I use `useReducer` instead?

When several values change together, when the next state depends on **actions** with different logic, or when update logic gets complicated. Also useful to pass a stable `dispatch` down.

### Q11. How do I reset a component's state?

Change its **`key`**: React creates a fresh instance with the initial state.

```jsx
<Profile key={userId} userId={userId} />
```

### Q12. Where should state live?

In the **closest common parent** of all components that need it ("lifting state up"). Not higher than necessary.

## 3. Classic traps

### 3.1 Stale state in a timer

```jsx
function Ticker() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCount(count + 1), 1000); // `count` is always 0 in this closure
    return () => clearInterval(id);
  }, []); // empty deps: the effect never re-runs

  return <p>{count}</p>;
}
// shows 1 forever
```

Fix with the functional update (no dependency on `count` at all):

```jsx
const id = setInterval(() => setCount((c) => c + 1), 1000); // counts 1, 2, 3, ...
```

(Closures from Day 1 and Day 2: the callback remembers the `count` from the render that created it.)

### 3.2 Storing a function in state

React treats a function passed to the setter as an **updater**:

```jsx
const [cb, setCb] = useState(() => () => "first"); // initialiser returns a function -> state is that function
setCb(() => "second"); // updater returns "second" -> state is now the STRING "second"
setCb(() => () => "third"); // to store a function, return it from an updater
```

### 3.3 Mutating state

```jsx
const [list, setList] = useState([1, 2]);
list.push(3); // mutates
setList(list); // same reference: no re-render
setList([...list, 3]); // correct
```

### 3.4 Duplicated state

```jsx
const [items, setItems] = useState([]);
const [count, setCount] = useState(0); // BAD: it's just items.length
const count2 = items.length; // GOOD: derived
```

### 3.5 Initialising state from a prop

```jsx
function Input({ initial }) {
  const [value, setValue] = useState(initial); // reads `initial` ONCE, ignores later changes
}
```

If the prop should reset the state, use a `key`, or don't copy it into state at all.

## 4. Predict the output

**Q1**

```jsx
function A() {
  const [n, setN] = useState(0);
  return (
    <button
      onClick={() => {
        setN(n + 1);
        setN(n + 1);
        setN(n + 1);
      }}
    >
      {n}
    </button>
  );
}
```

What does the button show after **one** click?

**Q2**

```jsx
function B() {
  const [n, setN] = useState(0);
  return (
    <button
      onClick={() => {
        setN((c) => c + 1);
        setN((c) => c + 1);
        setN((c) => c + 1);
      }}
    >
      {n}
    </button>
  );
}
```

After **one** click?

**Q3** (stale interval) After 3.5 seconds, what does each `Ticker` show?

```jsx
// Version 1
setInterval(() => setCount(count + 1), 1000); // with deps []
// Version 2
setInterval(() => setCount((c) => c + 1), 1000); // with deps []
```

**Q4** What is `cb` after the three lines run (assume they run in order, one render each)?

```jsx
const [cb, setCb] = useState(() => () => "first");
setCb(() => "second");
```

**Q5**

```jsx
function M() {
  const [u, setU] = useState({ name: "a" });
  return (
    <div>
      <button
        onClick={() => {
          u.name = "mutated";
          setU(u);
        }}
      >
        mut
      </button>
      <p>{u.name}</p>
    </div>
  );
}
```

What does `<p>` show after clicking "mut"?

**Q6** What do the first click's `console.log` and the UI show?

```jsx
function C() {
  const [n, setN] = useState(0);
  return (
    <button
      onClick={() => {
        setN(n + 5);
        console.log(n);
      }}
    >
      {n}
    </button>
  );
}
```

## 5. Answers

- **Q1:** `1`.
- **Q2:** `3`.
- **Q3:** Version 1 shows **`1`** (stale `count` is always 0, so it sets 1 repeatedly). Version 2 shows **`3`**.
- **Q4:** The **string `"second"`**, because `() => "second"` is treated as an updater function. To store a function you would write `setCb(() => () => "second")`.
- **Q5:** `a`. The same reference is passed, so React bails out and the UI is not updated (while the object is mutated underneath).
- **Q6:** logs **`0`** and the UI then shows **`5`**.

## 6. Follow-up questions to expect

- "Why not just use a normal variable?" It's reset every render and doesn't trigger one.
- "Can I call `setState` during render?" Only for the **same component, conditionally** (a rare pattern for derived state). Unconditionally it loops: "Too many re-renders".
- "How do you share state between siblings?" Lift it up to the parent.
- "How do you avoid prop drilling?" Composition, then context.
- "Does `setState` merge objects like class components did?" **No.** `useState` **replaces**. Spread the old object: `setUser({ ...user, name })`.

## Recap

- `useState(initial)` -> `[value, setValue]`; the setter **schedules** a re-render.
- State is a **snapshot**; use `setX(prev => ...)` when the next value depends on the previous.
- Updates are **batched**; state is **immutable** (new arrays/objects); `useState` doesn't merge.
- Lazy init for expensive initial values; `key` to reset; `useRef` for non-visual values.
- Watch for stale closures in timers and a function passed to the setter.

## Checklist

- [ ] I can say the 30-second answer without notes
- [ ] I can explain the +1 vs +3 example
- [ ] I can fix a stale-closure `setInterval`
- [ ] I can explain why mutating state doesn't update the UI
- [ ] I got Q1 to Q6 right without looking
