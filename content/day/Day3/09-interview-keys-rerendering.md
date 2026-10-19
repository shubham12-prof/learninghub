# 09 - Interview: Keys and Re-rendering

> **Time to learn:** ~45 min | **Interview frequency:** Almost guaranteed
> Read `03-rendering.md` first.

## 1. The 30-second answers (say these out loud)

**Keys**

> "A key is a special prop that gives each item in a list a stable, unique identity among its siblings. React uses it during reconciliation to match elements between renders, so it can reorder, add or remove the right items and keep each item's state with the right element. I use a stable id from the data, not the array index, because with an index the identity follows the position: when the list is reordered, filtered or an item is removed, state like input text ends up on the wrong row."

**Re-rendering**

> "A component re-renders when its own state changes, when its parent re-renders, or when a context it uses changes. Re-rendering means React calls the function again and diffs the result, and only the differences reach the DOM. A child re-renders with its parent even if its props are the same, unless it's wrapped in `React.memo` and the props are referentially equal. I don't optimise until I measure; when needed I move state down, pass children, or use `memo` with `useCallback` and `useMemo`."

## 2. Keys in depth

### 2.1 The warning you've seen

```jsx
<ul>
  {names.map((n) => (
    <li>{n}</li>
  ))}
</ul>
```

> Warning: Each child in a list should have a unique "key" prop.

```jsx
<ul>
  {names.map((n) => (
    <li key={n}>{n}</li>
  ))}
</ul>
```

### 2.2 The rules

| Rule                                                                                                | Why                                                                                                     |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Unique among siblings** (not globally)                                                            | Two lists can reuse the same keys                                                                       |
| **Stable**: the same item has the same key on every render                                          | Identity must survive re-renders                                                                        |
| **Not generated during render** (`Math.random()`, `Date.now()`, `crypto.randomUUID()` inside `map`) | A new key every render means React **destroys and recreates** every item (state lost, focus lost, slow) |
| **Put it on the outermost element returned in `map`**                                               | `key` belongs to the item React compares                                                                |
| Use `<Fragment key={id}>` when you need a key on a fragment                                         | The short `<>...</>` can't take a key                                                                   |
| `key` isn't passed as a prop                                                                        | You can't read `props.key`; pass the id separately if needed                                            |

Where do good keys come from? **Database IDs**, or IDs you generate **once when you create the item** (`crypto.randomUUID()` in the "add" handler, not in render).

### 2.3 Why the array index is a bad key (when the list can change)

```jsx
function Row({ label }) {
  const [text, setText] = useState(""); // each row has its own state
  return (
    <li>
      {label} <input value={text} onChange={(e) => setText(e.target.value)} />
    </li>
  );
}

function List() {
  const [items, setItems] = useState(["A", "B", "C"]);
  return (
    <>
      <button onClick={() => setItems(items.slice(1))}>remove first</button>
      <ul>
        {items.map((it, i) => (
          <Row key={i} label={it} />
        ))}
      </ul>{" "}
      {/* key = index */}
    </>
  );
}
```

Type `typed-in-A` into row **A**, then click **remove first**.

| Key           | Result after removing A                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `key={index}` | Row **B** shows the text `typed-in-A` (bug!). Key 0 is "the same component" as before, so React reuses it, keeps its state and just changes the `label` prop |
| `key={id}`    | Rows B and C are empty, as expected. React sees that item "A" is gone and removes **its** component with its state                                           |

**Index keys are fine only when the list is static**: never reordered, filtered, inserted into, or removed from, and items have no state/inputs.

### 2.4 Keys to **reset** state

A key change means "this is a **different** component": React throws away the old instance and mounts a new one.

```jsx
function Host() {
  const [id, setId] = useState(1);
  return (
    <>
      <button onClick={() => setId(id + 1)}>next user</button>
      <Profile key={id} id={id} />{" "}
      {/* new key => fresh state, no useEffect needed to reset */}
    </>
  );
}
```

### 2.5 Random keys

```jsx
{
  items.map((it) => <Row key={Math.random()} label={it} />);
} // every render: all rows unmounted and remounted
```

Symptom: typing in a row's input **loses its text** whenever the parent re-renders, and focus jumps away.

## 3. Re-rendering in depth

### 3.1 The three causes

1. Own **state** changed (with a different value).
2. **Parent re-rendered** (default: all children re-render).
3. A consumed **context** value changed.

### 3.2 Not a cause

Props "changing" isn't a separate cause: new props only happen **because** the parent re-rendered. And changing a variable or `ref.current` does nothing.

### 3.3 Tools, in order of preference

1. **Don't worry**: re-rendering is cheap; React only touches the DOM where output differs.
2. **Move state down / lift content up**: keep state in the smallest component that needs it; pass big subtrees as `children`.
3. **`React.memo(Component)`**: skip re-rendering when props are shallow-equal.
4. **`useCallback` / `useMemo`**: keep function/object props **referentially stable** so `memo` works.
5. **React Compiler** (optional build plugin in React 19) adds these automatically.

Measured behaviour:

| Setup (parent re-renders once)                                    | Child renders                           |
| ----------------------------------------------------------------- | --------------------------------------- |
| Plain child                                                       | **re-renders**                          |
| `memo` child, no props                                            | skipped                                 |
| `memo` child, inline arrow function prop (`onClick={() => {}}`)   | **re-renders** (new function each time) |
| `memo` child, function from `useCallback(fn, [])`                 | skipped                                 |
| `memo` child, object from `useMemo(() => ({...}), [])`            | skipped                                 |
| Child passed as `children` from a component that didn't re-render | skipped                                 |

### 3.4 Context re-renders

Every component that reads a context re-renders when the provided `value` changes (by `Object.is`). A **new object literal** as the value changes every render of the provider:

```jsx
<AuthContext value={{ user, login }}>        {/* new object each render => all consumers re-render */}
```

Stabilise with `useMemo`, or split context into smaller ones.

## 4. Follow-up questions to expect

**Q: Why does React need keys at all?**
To identify which items changed, were added or removed between renders when diffing lists, so it can **move** DOM nodes and **preserve state** instead of rebuilding everything.

**Q: Is using the index as a key always wrong?**
No. It's fine for a **static, stateless** list that is never reordered or filtered. It's wrong when the order can change or items have state.

**Q: Can two siblings have the same key?**
No. React warns, and duplicate keys cause duplicated or omitted items on updates.

**Q: Do keys have to be globally unique?**
No, only **among siblings**.

**Q: Does a child re-render when its props don't change?**
Yes, if its parent re-renders, unless it's `memo`ized.

**Q: Does re-rendering mean the DOM updates?**
No. React compares outputs and only changes what differs.

**Q: How would you find which components re-render too often?**
React DevTools **Profiler** ("Highlight updates when components render", and "Why did this render?" in the profiler).

**Q: `useMemo` vs `React.memo` vs `useCallback`?**
`React.memo` skips re-rendering a **component**; `useMemo` caches a **value**; `useCallback` caches a **function** reference.

## 5. Common mistakes

1. `key={index}` on a list that gets sorted, filtered or edited.
2. Random or time-based keys generated during render.
3. Missing `key` entirely (and ignoring the warning).
4. Putting the key on the **inner** element instead of the one returned from `map`.
5. Wrapping everything in `memo` / `useCallback` without measuring.
6. Passing inline objects/functions to `memo` children and wondering why `memo` "doesn't work".
7. Creating components **inside** other components (new type each render => remount).
8. Using a new object as a context value each render.

## 6. Predict the output

**Q1** Type `typed-in-A` in row A (see section 2.3), then click "remove first". What do the remaining two rows contain with `key={i}`? With `key={it}`?

**Q2** What happens to the text typed in the `Reset` input after clicking "next"?

```jsx
function Reset() {
  const [t, setT] = useState("");
  return (
    <input aria-label="r" value={t} onChange={(e) => setT(e.target.value)} />
  );
}
function Host() {
  const [id, setId] = useState(1);
  return (
    <>
      <button onClick={() => setId(id + 1)}>next</button>
      <Reset key={id} />
    </>
  );
}
```

**Q3** What does this code print as a warning, and how do you fix it?

```jsx
<ul>
  {["a", "b"].map((x) => (
    <li>{x}</li>
  ))}
</ul>
```

**Q4** How many times does each child render in total (including the first render) after **two** clicks on the parent's button?

```jsx
let r1 = 0,
  r2 = 0,
  r3 = 0;
const C1 = memo(({ onClick }) => {
  r1++;
  return <i onClick={onClick} />;
});
const C2 = memo(({ onClick }) => {
  r2++;
  return <i onClick={onClick} />;
});
const C3 = memo(({ opts }) => {
  r3++;
  return <i />;
});

function P() {
  const [n, setN] = useState(0);
  const cb = useCallback(() => {}, []);
  const opts = useMemo(() => ({ a: 1 }), []);
  return (
    <div>
      <button onClick={() => setN(n + 1)}>p</button>
      <C1 onClick={() => {}} />
      <C2 onClick={cb} />
      <C3 opts={opts} />
    </div>
  );
}
```

**Q5** The parent holds a counter and renders rows with `key={Math.random()}`; each row has its own `useState` text. What happens to the typed text in a row when the parent's counter button is clicked?

## 7. Answers

- **Q1:** `key={i}` -> row B contains `typed-in-A` and C is empty. `key={it}` -> both rows are empty.
- **Q2:** It is **cleared**. A new `key` creates a new component instance with fresh state.
- **Q3:** `Each child in a list should have a unique "key" prop.` Fix: `<li key={x}>{x}</li>` (use a stable unique value).
- **Q4:** `C1` = **3** (inline function is new each time, so `memo` is defeated), `C2` = **1**, `C3` = **1**.
- **Q5:** The text is **lost** (cleared): every render creates new keys, so React unmounts all rows and mounts new ones with empty state.

## Recap

- **Keys** = stable identity among siblings, so React can match, move and preserve state for list items.
- Use **data ids**; avoid index for dynamic lists and **never** generate keys during render.
- Changing a `key` **resets** a component's state (a clean alternative to an effect).
- A re-render has three causes: own state, parent re-render, context change.
- Re-rendering isn't DOM updating. Optimise after measuring: state down, `children`, `memo` + stable props, or the compiler.

## Checklist

- [ ] I can say both 30-second answers without notes
- [ ] I can demonstrate the index-key bug from memory
- [ ] I can explain how to reset state with `key`
- [ ] I can explain why `memo` fails with inline functions/objects
- [ ] I got Q1 to Q5 right without looking
