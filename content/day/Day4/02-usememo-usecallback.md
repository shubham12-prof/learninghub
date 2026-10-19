# 02 - `useMemo` and `useCallback`

> **Time to learn:** ~45 min | **Level:** Core concept | **Interview frequency:** Very high
> Read `01-memoization.md` first (referential equality and `React.memo`).

## 1. The one-line difference

| Hook                             | Caches                               | Returns                                     |
| -------------------------------- | ------------------------------------ | ------------------------------------------- |
| `useMemo(() => compute(), deps)` | the **result** of calling a function | a **value** (number, array, object, JSX...) |
| `useCallback(fn, deps)`          | the **function itself**              | a **function**                              |

`useCallback(fn, deps)` is exactly `useMemo(() => fn, deps)`. Both:

1. Run on the first render and store the result.
2. On later renders, compare `deps` with the previous ones using `Object.is`.
3. If **nothing changed** return the **stored** thing; otherwise recompute and store the new one.

## 2. Analogy

`useMemo` = a **saved answer** on a sticky note ("42"). Re-read the note unless the question changed.
`useCallback` = a **saved recipe card** (the instructions themselves). You keep the _same card_ instead of writing a new, identical one every day. That matters only if someone is comparing cards by identity (a memoized child).

## 3. `useMemo`: caching an expensive value

```jsx
function CourseList({ courses, query }) {
  const [dark, setDark] = useState(false);

  // Recomputed ONLY when `courses` or `query` changes, not when `dark` toggles
  const visible = useMemo(
    () =>
      courses.filter((c) =>
        c.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [courses, query],
  );

  return (
    <div className={dark ? "dark" : ""}>
      <button onClick={() => setDark(!dark)}>theme</button>
      <ul>
        {visible.map((c) => (
          <li key={c.id}>{c.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

Use `useMemo` for:

1. **A genuinely slow calculation** (filtering/sorting thousands of items, heavy maths). Measure it: `console.time` or the Profiler.
2. **Keeping an object/array reference stable** so a `memo` child or another hook's dependency array doesn't see it as "changed".

```jsx
const style = useMemo(
  () => ({ color: theme.color, size }),
  [theme.color, size],
);
<MemoChart style={style} />;
```

**Don't** use it for a cheap expression:

```jsx
const total = useMemo(() => a + b, [a, b]); // pointless: the comparison costs about the same as a + b
const total = a + b; // better
```

> `useMemo` is a **performance hint, not a guarantee**. React may throw the cache away (for example to free memory). Your code must still be correct if the function runs again.

## 4. `useCallback`: a stable function

A function declared in the component body is **new on every render**:

```jsx
function Parent() {
  const [n, setN] = useState(0);
  const pick = (id) => console.log(id); // new function identity every render
  return <MemoRow onPick={pick} />; // MemoRow re-renders every time: memo defeated
}
```

`useCallback` returns the **same function** until its dependencies change:

```jsx
const pick = useCallback((id) => console.log(id), []); // same identity across renders
return <MemoRow onPick={pick} />; // now memo can skip
```

**`useCallback` only helps when the function goes to:**

1. a **`memo`-wrapped child** (so the child can skip), or
2. another hook's **dependency array** (`useEffect`, `useMemo`) so it doesn't re-run each render.

If neither is true, `useCallback` is **pure overhead**.

```jsx
// Pointless: a plain DOM <button> doesn't care about function identity
const onClick = useCallback(() => setOpen(true), []);
<button onClick={onClick}>open</button>;
```

## 5. The dependency array and stale closures

The cached function **remembers the variables from the render it was created in** (a closure, Day 1). If you omit a dependency, the function keeps using an **old value**:

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  const logStale = useCallback(() => console.log(count), []); // BUG: always logs 0
  const logFresh = useCallback(() => console.log(count), [count]); // new function when count changes

  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### The functional-update trick: keep the dependency array empty AND correct

If the callback only needs the **previous state** to compute the next one, use the functional form. Then it doesn't read `count` at all, so no dependency is needed:

```jsx
const increment = useCallback(() => setCount((c) => c + 1), []); // stable AND never stale
```

The same trick keeps list-toggle callbacks stable:

```jsx
const toggleFavorite = useCallback((id) => {
  setFavorites((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
  );
}, []);
```

**Rule:** list **every reactive value** the function reads (`eslint-plugin-react-hooks` checks this). Don't remove a dependency to "make it stable"; restructure instead (functional updates, `useRef`, moving the value out).

## 6. Putting it together: `memo` + `useCallback` + `useMemo`

All three must cooperate for the skip to work. One missing piece and the child re-renders:

```jsx
const Row = memo(function Row({ item, onPick }) {
  // 1. child is memoized
  return <li onClick={() => onPick(item.id)}>{item.name}</li>;
});

function List({ items }) {
  const [note, setNote] = useState(""); // unrelated, fast-changing state
  const onPick = useCallback((id) => {
    /* ... */
  }, []); // 2. stable function

  return (
    <>
      <input value={note} onChange={(e) => setNote(e.target.value)} />
      <ul>
        {items.map((item) => (
          <Row key={item.id} item={item} onPick={onPick} />
        ))}
      </ul>{" "}
      {/* 3. stable item objects from props */}
    </>
  );
}
```

If you replace `onPick` with an inline arrow function, or build `item` inline, `Row` re-renders again on every keystroke.

## 7. `useMemo` / `useCallback` as an effect dependency

```jsx
function Search({ filters }) {
  const params = { q: filters.q, page: 1 }; // new object every render
  useEffect(() => {
    load(params);
  }, [params]); // runs after EVERY render
}

// Fix 1: depend on primitives
useEffect(() => {
  load({ q: filters.q, page: 1 });
}, [filters.q]);

// Fix 2: memoize the object
const params = useMemo(() => ({ q: filters.q, page: 1 }), [filters.q]);
useEffect(() => {
  load(params);
}, [params]);
```

Fix 1 is usually the cleanest.

## 8. Decision guide

```
Is something slow or re-rendering too often?  --no--> do nothing
        | yes (measured)
Can you move state down / lift children up?   --yes--> do that (free)
        | no
Is it an expensive VALUE?   -> useMemo
Is it a FUNCTION passed to a memo child / effect deps?  -> useCallback (+ memo on the child)
Is it a whole COMPONENT that re-renders with the same props?  -> React.memo
```

## 9. Common mistakes

1. **`useCallback` without `memo` on the child**: nothing is skipped; you only added overhead.
2. **`memo` without `useCallback`/`useMemo`** for object/function props: `memo` is defeated.
3. **Missing dependencies** -> **stale closure** (`console.log(count)` always prints the first value).
4. **Wrong deps to "fix" re-renders** (removing a dependency the function actually uses).
5. **Memoizing cheap work** (`a + b`, a short `.map`).
6. **Mutating** the memoized value or its inputs (the cache won't notice a mutation: new reference is required).
7. Believing `useMemo` is a **guarantee**. It can recompute; don't put side effects in it.
8. Calling the function immediately: `useCallback(fn(), [])` caches the **result of calling it**; you wanted `useCallback(fn, [])`.

## 10. Predict the output

**Q1** `compute` counts how many times the filter runs. After the first render, then typing "ab" into the input (2 key presses, `query` stays unchanged, only `note` changes), what is `compute`?

```jsx
let compute = 0;
function C({ items }) {
  const [note, setNote] = useState("");
  const [query] = useState("a");
  const visible = useMemo(() => {
    compute++;
    return items.filter((i) => i.includes(query));
  }, [items, query]);
  return <input value={note} onChange={(e) => setNote(e.target.value)} />;
}
// parent renders <C items={["apple", "bob"]} /> once with a constant array defined outside
```

**Q2** What does it log after clicking the button **three times** and then clicking "log"?

```jsx
function C() {
  const [count, setCount] = useState(0);
  const log = useCallback(() => console.log("count is", count), []);
  return (
    <>
      <button onClick={() => setCount(count + 1)}>inc</button>
      <button onClick={log}>log</button>
    </>
  );
}
```

**Q3** What does it log after three clicks on "inc" and then "log"?

```jsx
function C() {
  const [count, setCount] = useState(0);
  const inc = useCallback(() => setCount((c) => c + 1), []);
  const log = useCallback(() => console.log("count is", count), [count]);
  return (
    <>
      <button onClick={inc}>inc</button>
      <button onClick={log}>log</button>
    </>
  );
}
```

**Q4** `Row` is `memo`. The parent has `note` state and renders `<Row onPick={useCallback(fn, [note])} />`. How many times does `Row` render after the first render and typing 2 characters into the `note` input?

**Q5** How many times does the effect run (first render + 2 clicks on "go")?

```jsx
function C() {
  const [n, setN] = useState(0);
  const options = { page: 1 };
  useEffect(() => {
    runs++;
  }, [options]);
  return <button onClick={() => setN(n + 1)}>go</button>;
}
```

## 11. Answers

- **Q1:** `compute` = **1**. `items` and `query` never change, so the stored result is reused when `note` changes.
- **Q2:** `count is 0`. The `[]` dependency array froze the closure from the first render (**stale closure**).
- **Q3:** `count is 3`. `log` is recreated whenever `count` changes (`[count]`); `inc` is stable thanks to the functional update.
- **Q4:** **3** (first render + one for each keystroke), because `note` is in the dependency array so `onPick` is a new function every time `note` changes. `useCallback` and `memo` skipped nothing. Fix: use a functional update / `useRef` so `note` isn't needed, or don't list it if the function doesn't use it.
- **Q5:** **3**. `options` is a new object on every render, so the effect runs after each render.

## Recap

- `useMemo` caches a **value**; `useCallback` caches a **function** (`useMemo(() => fn, deps)`).
- They give you **stable references** (so `memo` children and effect deps work) or avoid **expensive recalculation**.
- Dependencies are compared with `Object.is`; **missing dependencies cause stale closures**.
- Functional state updates (`setX(prev => ...)`) let you keep callbacks stable **and** correct.
- Only use them when you have a reason; they are optimisations, never correctness tools.

## Checklist

- [ ] I can explain `useMemo` vs `useCallback` in one sentence
- [ ] I can explain why `useCallback` alone does nothing without `memo`
- [ ] I can fix a stale closure and explain the functional-update trick
- [ ] I can name 2 cases where I should NOT use `useMemo`
- [ ] I got Q1 to Q5 right without looking
