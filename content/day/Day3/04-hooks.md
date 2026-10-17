# 04 - Hooks

> **Time to learn:** ~45 min | **Level:** Core concept | **Interview frequency:** Extremely high
> `useState` is covered in `02-state.md` and `useEffect` in depth in `08-interview-useeffect.md`. This file is the map of everything else.

## 1. What are hooks?

**Hooks are functions that let a function component "hook into" React features** (state, lifecycle, context, refs, ...). Their names start with **`use`**.

| Hook | Use it for |
|---|---|
| `useState` | remembered values that trigger re-renders |
| `useEffect` | synchronising with something **outside React** (network, timers, subscriptions, DOM APIs) |
| `useRef` | a mutable box that **doesn't** trigger renders; access to DOM elements |
| `useMemo` | caching an **expensive calculated value** |
| `useCallback` | caching a **function** reference |
| `useContext` | reading shared data without prop drilling |
| `useReducer` | state with many related updates (like a mini Redux) |
| Custom hooks | reusing stateful logic between components |

## 2. The two rules of hooks

1. **Only call hooks at the top level**: not inside `if`, loops, nested functions or after an early `return`.
2. **Only call hooks from React function components or from other hooks** (custom hooks), never from regular JS functions.

**Why?** React identifies each hook by the **order** it is called in. The order must be identical on every render.

```jsx
function Bad({ loggedIn }) {
  if (loggedIn) {
    const [name, setName] = useState("");   // WRONG: the hook order changes between renders
  }
  const [age, setAge] = useState(0);
}

function Good({ loggedIn }) {
  const [name, setName] = useState("");     // always called
  const [age, setAge] = useState(0);
  if (!loggedIn) return null;               // conditions go AFTER the hooks (or inside them)
  return <p>{name} {age}</p>;
}
```

What you see when you break the rule depends on the exact pattern: React may throw `Rendered fewer hooks than expected. This may be caused by an accidental early return statement.` or `Rendered more hooks than during the previous render.`, log `React has detected a change in the order of Hooks called by ...`, or in some shapes quietly misbehave. **Never rely on it not throwing.**

Install `eslint-plugin-react-hooks`; it catches both rules.

## 3. `useRef`

A ref is an object `{ current: value }` that **React keeps between renders**. Changing `ref.current` does **not** re-render.

### 3.1 Access a DOM element

```jsx
function SearchBox() {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();          // runs after the DOM exists
  }, []);

  return <input ref={inputRef} placeholder="Search" />;
}
```

### 3.2 Store a value that must survive renders but not display

```jsx
function Stopwatch() {
  const [seconds, setSeconds] = useState(0);
  const timerId = useRef(null);                 // not rendered, so not state

  const start = () => { timerId.current = setInterval(() => setSeconds((s) => s + 1), 1000); };
  const stop = () => clearInterval(timerId.current);

  return (<><p>{seconds}s</p><button onClick={start}>Start</button><button onClick={stop}>Stop</button></>);
}
```

| | `useState` | `useRef` |
|---|---|---|
| Changing it re-renders | **Yes** | **No** |
| Can I read it during render for UI? | Yes | Avoid (it may be stale in the UI) |
| Typical use | what's displayed | timer ids, DOM nodes, previous values |

## 4. `useMemo` and `useCallback`

Both **cache** something between renders and only recompute when a **dependency** changes.

```jsx
// useMemo: cache a VALUE
const visible = useMemo(
  () => items.filter((i) => i.name.includes(query)),
  [items, query]                    // recompute only when these change
);

// useCallback: cache a FUNCTION (it is useMemo(() => fn, deps))
const handleSelect = useCallback((id) => setSelectedId(id), []);
```

Use them when:

1. The calculation is **genuinely expensive** (measured), or
2. You pass the value/function to a **`memo`ized child** or into another hook's **dependency array**, and you need a **stable reference**.

Otherwise skip them. They are an optimisation, **not** a way to make code correct. (With the React Compiler you rarely write them by hand.)

## 5. `useContext`

Context lets a parent provide a value that **any descendant** can read, skipping the layers in between.

```jsx
import { createContext, useContext, useState } from "react";

const ThemeContext = createContext("light");              // default value

function App() {
  const [theme, setTheme] = useState("dark");
  return (
    <ThemeContext value={theme}>                          {/* React 19: <Context> works as the provider */}
      <Toolbar />
      <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>toggle</button>
    </ThemeContext>
  );
}

function Toolbar() {
  return <ThemedButton />;                                // no props needed
}

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>I am {theme}</button>;
}
```

(In React 18 and earlier you write `<ThemeContext.Provider value={theme}>`.) Every component that calls `useContext(ThemeContext)` **re-renders when the value changes**.

## 6. `useReducer`

When several state values change **together**, or the next state depends on **actions**, a reducer keeps the logic in one place.

```jsx
function reducer(state, action) {
  switch (action.type) {
    case "add":    return { ...state, items: [...state.items, action.item] };
    case "remove": return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case "clear":  return { ...state, items: [] };
    default:       throw new Error("Unknown action: " + action.type);
  }
}

function Cart() {
  const [state, dispatch] = useReducer(reducer, { items: [] });

  return (
    <>
      <button onClick={() => dispatch({ type: "add", item: { id: Date.now(), name: "Book" } })}>Add</button>
      <button onClick={() => dispatch({ type: "clear" })}>Clear</button>
      <p>{state.items.length} items</p>
    </>
  );
}
```

A reducer is a **pure function** `(state, action) => newState`: no mutation, no side effects. `dispatch` has a **stable identity**, so it's safe to pass down.

## 7. Custom hooks

A **custom hook** is a function whose name starts with `use` and that calls other hooks. It lets you **reuse logic**, not UI. Each component that calls it gets **its own separate state**.

```jsx
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  return [on, toggle];
}

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);                  // cleanup cancels the previous timer
  }, [value, delay]);

  return debounced;
}

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : initial;
    } catch {
      return initial;                               // storage blocked or corrupted JSON
    }
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }, [key, value]);

  return [value, setValue];
}
```

Usage:

```jsx
function Demo() {
  const [open, toggleOpen] = useToggle();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);      // only changes 300ms after typing stops
  const [name, setName] = useLocalStorage("name", "");
  // ...
}
```

`useDebounce` is the React version of the `debounce` closure you wrote on Day 2: the timer id lives in the effect's cleanup instead of a closure variable.

## 8. Quick look at newer hooks (React 19)

| Hook | Purpose |
|---|---|
| `useTransition` | mark a state update as **non-urgent** so typing stays responsive |
| `useDeferredValue` | a lagging copy of a value for expensive renders |
| `useId` | stable unique IDs for `htmlFor` / `aria-*` (SSR-safe) |
| `useActionState`, `useOptimistic`, `use` | form actions, optimistic UI, reading promises/context (React 19) |

You don't need these for the Day 3 target, but know they exist.

## 9. Common mistakes

1. Calling hooks conditionally or in loops.
2. Overusing `useMemo` / `useCallback` without a reason.
3. Missing or wrong dependency arrays (stale values or infinite loops).
4. Using `useRef` for something that must update the screen (use state).
5. Forgetting that **each call to a custom hook has its own state**; two components using `useToggle` don't share it.
6. Mutating state inside a reducer.

## 10. Predict the output

**Q1** What is wrong here, and what's the fix?
```jsx
function Profile({ user }) {
  if (!user) return null;
  const [editing, setEditing] = useState(false);
  return <p>{editing ? "editing" : user.name}</p>;
}
```

**Q2** How many times does the component re-render when the button is clicked (not counting the first render)?
```jsx
function R() {
  const r = useRef(0);
  return <button onClick={() => { r.current++; }}>ref</button>;
}
```

**Q3** What does `useDebounce` return if `query` changes from `"a"` to `"ab"` to `"abc"` within 100 ms, with `delay = 300`? (Assume no further changes.)

**Q4** What will the `count` text be after two clicks on "add"?
```jsx
function reducer(state, action) {
  if (action.type === "add") return { count: state.count + 1 };
  return state;
}
function C() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return <button onClick={() => dispatch({ type: "add" })}>count {state.count}</button>;
}
```

**Q5** Do two components that both call `useToggle()` share the same `on` value?

## 11. Answers

- **Q1:** The hook `useState` is called **after an early return**, so on renders where `user` is falsy it isn't called: the **number of hooks changes between renders**, which breaks the Rules of Hooks. `eslint-plugin-react-hooks` flags it. (For this exact shape React 19 may not throw, which makes it a sneaky bug; other shapes throw `Rendered fewer hooks than expected` or `Rendered more hooks than during the previous render`.) Fix: call the hook first, then return early.
  ```jsx
  const [editing, setEditing] = useState(false);
  if (!user) return null;
  ```
- **Q2:** **0**. Changing `ref.current` doesn't trigger a render.
- **Q3:** It keeps returning `"a"` until 300 ms after the last change, then returns `"abc"`. Each change cancels the previous timer through the effect cleanup, so intermediate values `"ab"`... are never returned.
- **Q4:** `count 2`.
- **Q5:** **No.** Each call creates its own state. To share state, lift it up or use context.

## Recap

- Hooks = functions starting with `use`; call them **at the top level**, in the **same order**, from components or custom hooks.
- `useRef` = a persistent mutable box (DOM nodes, timer ids) that **doesn't** re-render.
- `useMemo` / `useCallback` cache values / functions; use them for **stable references** or **measured** expensive work.
- `useContext` avoids prop drilling; `useReducer` organises complex state updates.
- Custom hooks (`useToggle`, `useDebounce`, `useLocalStorage`) reuse **logic**; each caller gets its own state.

## Checklist

- [ ] I can state both rules of hooks and explain why they exist
- [ ] I can explain `useState` vs `useRef`
- [ ] I can explain when `useMemo`/`useCallback` actually help
- [ ] I can write `useToggle` and `useDebounce` from memory
- [ ] I got Q1 to Q5 right without looking
