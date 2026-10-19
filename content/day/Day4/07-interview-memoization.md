# 07 - Interview: When Memoization Helps (and When It Doesn't)

> **Time to learn:** ~50 min | **Interview frequency:** Almost guaranteed for React roles
> Read `01-memoization.md`, `02-usememo-usecallback.md` and `03-composition.md` first.
> **Target:** answer the 5 core questions out loud in under 2 minutes each.

## 1. The 30-second answer (say this out loud)

> "Memoization means caching a result so I don't redo work when the inputs haven't changed. In React that's `React.memo` for components, `useMemo` for values and `useCallback` for functions. It helps when something is **actually expensive** and **re-renders often with the same props**, for example a big list under a parent with fast-changing state like a text input. It doesn't help, and can even hurt, when the component is cheap, when the props change on every render anyway, or when I pass unstable props like inline objects and functions, because the shallow comparison fails every time. So I don't memoize by default: I **measure first** with the Profiler, try the free fixes like moving state down or passing `children`, and only then add `memo` with stable props. And with the React Compiler a lot of this is automatic."

## 2. The 5 core questions with model answers

### Q1. What does `React.memo` do, and how does it decide to skip a render?

`React.memo` wraps a component so that when the **parent re-renders**, React compares the **new props to the previous props** with a **shallow comparison** (`Object.is` on each prop). If every prop is equal, React **reuses the last result** and doesn't call the component again. If any prop differs, it renders normally.

**Follow-up:** _"Does `memo` stop all re-renders?"_ No: the component still re-renders when its **own state** changes or a **context** it reads changes.

### Q2. When does memoization help?

All three should be true:

1. The component or calculation is **expensive** (large lists, charts, heavy computation), measured, not guessed.
2. It is **rendered often with the same inputs** (a parent with frequently changing, unrelated state).
3. The inputs are **stable references** (primitives, or objects/functions kept stable with `useMemo`/`useCallback`).

Typical good examples: rows in a big table, cards in a large grid, a chart component, a `useMemo` for sorting/filtering thousands of items.

### Q3. When does it NOT help?

| Situation                                                                          | Why it doesn't help                                    |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Tiny, cheap component                                                              | Comparing props costs about as much as rendering       |
| Props change on almost every render                                                | Comparison always fails, you pay for both              |
| Inline `{}`, `[]`, `() => {}` or JSX `children` passed to a memo component         | New reference each render, so `memo` never skips       |
| `useCallback` for a function passed to a plain DOM element or a non-memo component | Nothing compares the identity, so nothing is saved     |
| `useMemo` around `a + b`                                                           | The memo bookkeeping is more work than the calculation |
| The slowness is elsewhere (network, layout, huge DOM)                              | Memoizing the wrong thing                              |

Also: memoization adds **memory use and complexity**, and wrong dependency arrays create **stale-value bugs**.

### Q4. A component is wrapped in `memo` but still re-renders. Why?

Checklist, in order of likelihood:

1. **An unstable prop**: object, array or function created during the parent's render (`options={{...}}`, `onClick={() => ...}`).
2. **`children` is JSX**: `<Memo><b>x</b></Memo>` creates a new element every time.
3. **Its own state** changed.
4. **A context** it reads changed.
5. A **custom comparison** returns false (or a dependency in a memoized value changed).
6. **`key` changed**: that's a remount, not a re-render.

How I'd find out: the React DevTools Profiler -> "Why did this render?", or log the props and compare with `Object.is`.

### Q5. How would you find and fix a slow, re-rendering component?

1. **Reproduce and measure**: React DevTools Profiler (record the interaction), "Highlight updates", or a render counter. Don't guess.
2. **Find the cause** (who re-rendered and why).
3. **Cheapest fixes first**: **move state down** into a small component, **lift content up** via `children`, remove **derived state** stored in effects.
4. **Then memoize**: `memo` on the expensive child + **stable props** (`useCallback` with functional updates, `useMemo` for objects, pass primitives instead of whole arrays).
5. **Heavy lists:** virtualize (`react-window`), paginate, or defer (`useDeferredValue`, `useTransition`).
6. **Measure again** to confirm it actually got faster.

## 3. Cheat table: which tool for which problem

| Problem                                                       | Tool                                             |
| ------------------------------------------------------------- | ------------------------------------------------ |
| Typing in an input re-renders a huge sibling                  | Move state down / `children`                     |
| Memo child re-renders with an inline function                 | `useCallback` (with a **memo** child)            |
| Memo child re-renders with an inline object                   | `useMemo` or pass primitives                     |
| An expensive calculation runs on unrelated updates            | `useMemo`                                        |
| An effect runs every render because of an object/function dep | depend on primitives, or `useMemo`/`useCallback` |
| A long list is slow even when memoized                        | virtualization                                   |
| A slow update makes typing feel laggy                         | `useDeferredValue` / `useTransition`             |
| You don't want to hand-write any of this                      | React Compiler                                   |

## 4. Follow-up questions to expect

**Q: What is referential equality?**
Two values are "the same" if they are the **same object in memory** (`===` / `Object.is`), not if they have the same contents. `{a:1} === {a:1}` is `false`. `memo`, `useMemo`, `useCallback` and effect dependency arrays all use it.

**Q: Why does `useCallback(fn, [])` sometimes give a stale value?**
The cached function **closes over the variables of the render it was created in**. With `[]` it never updates. Use the right dependencies, or a functional update (`setX(prev => ...)`).

**Q: Is `useMemo` a guarantee that the calculation won't run again?**
No. It's a **performance hint**; React may discard the cache. The code must be correct without it.

**Q: Should I wrap everything in `memo`?**
No. Premature optimisation. Measure first, and many fixes (state placement, `children`) are free.

**Q: `useMemo` vs `useCallback`?**
`useMemo` caches the **result** of calling a function; `useCallback` caches the **function itself** (`useCallback(fn, d)` = `useMemo(() => fn, d)`).

**Q: What does the React Compiler change?**
It analyses components at build time and adds memoization for you, so manual `memo`/`useMemo`/`useCallback` become rarer. You still need to know **why** things re-render.

**Q: Can a custom comparison function go wrong?**
Yes: `memo(Comp, (prev, next) => prev.id === next.id)` ignores every other prop, so if `label` changes the component shows a **stale label**. Compare all props that affect output, or don't write one.

**Q: Does `memo` prevent re-renders caused by context?**
No. A component that calls `useContext` re-renders when that context value changes, regardless of `memo`.

## 5. Predict the output

Counters (no StrictMode unless stated):

**P1** What does the child show after clicking "next" once?

```jsx
const Child = memo(
  function Child({ id, label }) {
    return <p>{label}</p>;
  },
  (prev, next) => prev.id === next.id, // custom comparison
);
function Parent() {
  const [n, setN] = useState(0);
  return (
    <>
      <button onClick={() => setN(n + 1)}>next</button>
      <Child id={1} label={"label " + n} />
    </>
  );
}
```

**P2** `calc` counts runs of the `useMemo` callback. What is `calc` after the first render and 2 clicks on "go"?

```jsx
function C() {
  const [n, setN] = useState(0);
  const ids = [1, 2]; // new array each render
  const total = useMemo(() => {
    calc++;
    return ids.length;
  }, [ids]);
  return <button onClick={() => setN(n + 1)}>go {total}</button>;
}
```

**P3** What does the badge show after 3 clicks on "inc"?

```jsx
function C() {
  const [count, setCount] = useState(0);
  const label = useMemo(() => "count=" + count, []); // empty deps
  return (
    <>
      <button onClick={() => setCount(count + 1)}>inc</button>
      <span>{label}</span>
    </>
  );
}
```

**P4** `calc` counts runs of the `useMemo` callback. In a **`<StrictMode>` development build**, what is `calc` after the first mount?

```jsx
function C() {
  const v = useMemo(() => {
    calc++;
    return 42;
  }, []);
  return <p>{v}</p>;
}
```

**P5** `Child` is `memo` and counts its renders. After the first render and **4 clicks** on "inc", how many times has `Child` rendered?

```jsx
const Child = memo(function Child({ page }) {
  renders++;
  return <i>{page}</i>;
});
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount(count + 1)}>inc</button>
      <Child page={Math.floor(count / 2)} />
    </>
  );
}
```

## 6. Answers

- **P1:** **`label 0`** (stale!). The custom comparison only checks `id`, which didn't change, so React skipped the render even though `label` did.
- **P2:** **3**. The `[ids]` dependency is a new array on every render, so the memo is recomputed every time (first render + 2 re-renders).
- **P3:** **`count=0`**. With `[]` the value is computed once; it never updates. The dependency should be `[count]` (or just compute it directly: it's cheap).
- **P4:** **2**. In development StrictMode React deliberately calls the `useMemo` function twice to check that it is pure (and uses the result of one of them). It's once in production.
- **P5:** **3**. `page` goes 0, 0, 1, 1, 2: it changes only on clicks 2 and 4. Renders: first render + click 2 + click 4. `memo` compares the derived **primitive**, which is why passing primitives works so well.

## Recap

- Memoization = skip work when inputs are unchanged. Useful for **expensive + frequently re-rendered + stable inputs**; harmful or useless otherwise.
- `memo` needs **stable props**; inline objects/functions/JSX children defeat it; own state and context still re-render it.
- Order of attack: **measure -> move state down / children -> memo + stable props -> virtualize/defer -> (compiler)**.
- Correctness never depends on memoization.

## Checklist

- [ ] I can say the 30-second answer without notes
- [ ] I can list 3 conditions where memoization helps and 4 where it doesn't
- [ ] I can give 5 reasons a memoized component still re-renders
- [ ] I can describe my profiling workflow in 5 steps
- [ ] I got P1 to P5 right without looking
