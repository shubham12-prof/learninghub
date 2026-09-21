# React.js & JavaScript Interview Prep — Round 1 & Round 2

---

## 1. Props vs State

|                     | Props                              | State                             |
| ------------------- | ---------------------------------- | --------------------------------- |
| Owned by            | Parent, passed down                | Component itself                  |
| Mutable?            | Read-only (immutable inside child) | Mutable via `setState`/`useState` |
| Purpose             | Configure a component from outside | Manage internal, changing data    |
| Triggers re-render? | Yes, when parent passes new value  | Yes, when updated                 |

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

**Key point:** Props flow down (parent → child), state is local and private. A component can't modify its own props — that would break the one-way data flow React relies on.

---

## 2. React Hooks & useEffect

Hooks let function components use state/lifecycle features without classes.

- `useState` — local state
- `useEffect` — side effects (data fetching, subscriptions, DOM manipulation, timers)
- `useContext`, `useRef`, `useMemo`, `useCallback`, `useReducer`, `useLayoutEffect`

```jsx
useEffect(() => {
  // runs after render
  const sub = subscribe();
  return () => sub.unsubscribe(); // cleanup — runs before next effect & on unmount
}, [dependency]);
```

### Dependency array behavior

| Dependency array | Runs                                                               |
| ---------------- | ------------------------------------------------------------------ |
| Omitted          | After **every** render                                             |
| `[]`             | Once, after initial mount only                                     |
| `[a, b]`         | After mount + whenever `a` or `b` changes (reference/value change) |

**Rules of Hooks:**

1. Only call hooks at the top level (not inside loops/conditions/nested functions).
2. Only call hooks from React function components or custom hooks.

---

## 3. Component Communication

| Pattern              | Direction | Mechanism                                            |
| -------------------- | --------- | ---------------------------------------------------- |
| Parent → Child       | Down      | Props                                                |
| Child → Parent       | Up        | Callback function passed as prop                     |
| Sibling → Sibling    | Across    | Lift state up to common parent                       |
| Deeply nested        | Any       | Context API (avoid prop drilling)                    |
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

---

## 4. JavaScript Fundamentals (quick hits)

- **Hoisting:** `var` and function declarations are hoisted (initialized as `undefined`); `let`/`const` are hoisted but stay in the "temporal dead zone" until declared.
- **`this` binding:** depends on how a function is called (regular function vs arrow function, which inherits `this` lexically).
- **Equality:** `==` does type coercion, `===` does not — always prefer `===`.
- **Array methods:** `map` (transform), `filter` (select), `reduce` (accumulate), `forEach` (iterate, no return).
- **Truthy/falsy:** `0, '', null, undefined, NaN, false` are falsy; everything else is truthy.

---

## 5. REST API Integration in React

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
    }; // avoid setting state after unmount
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

- Handling loading/error/success states
- Using `key` correctly in lists
- Cleanup to avoid "setState on unmounted component" warnings / race conditions
- `try/catch/finally` with `async/await`

---

# (JS + React Deep Dive)

## JavaScript

### 1. Closures & Lexical Scope

A closure is a function that "remembers" the variables from its enclosing scope even after that scope has finished executing.

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
counter(); // 2 — count persists between calls (closure)
```

**Common interview trap:**

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 3 3 3  (var is function-scoped, shared single binding)

for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 0 1 2  (let creates a new binding per iteration)
```

### 2. var vs let vs const

|         | Scope    | Hoisting                            | Re-declare | Re-assign                              |
| ------- | -------- | ----------------------------------- | ---------- | -------------------------------------- |
| `var`   | Function | Yes, initialized `undefined`        | Yes        | Yes                                    |
| `let`   | Block    | Yes, TDZ (no access before declare) | No         | Yes                                    |
| `const` | Block    | Yes, TDZ                            | No         | No (but object/array contents mutable) |

### 3. Event Loop & Execution Order

JS is single-threaded. Execution order: **Call Stack → Microtasks (all of them) → one Macrotask → repeat**.

- **Microtasks:** Promise `.then/.catch/.finally`, `queueMicrotask`, `async/await` continuations
- **Macrotasks:** `setTimeout`, `setInterval`, I/O, UI rendering

```js
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");

// Output: 1, 4, 3, 2
// Sync code first (1, 4) → microtask queue (3) → macrotask queue (2)
```

### 4. Promises & async/await

```js
async function fetchData() {
  try {
    const res = await fetch("/api/data");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(err);
  }
}
```

`async/await` is syntactic sugar over Promises — it doesn't block the thread; it pauses the async function and lets other code run via the microtask queue.

### 5. Microtasks vs Macrotasks

All queued microtasks run to completion **before** the next macrotask, even if new microtasks are added during that draining. This is why Promises "jump ahead" of `setTimeout(fn, 0)`.

### 6. Debouncing vs Throttling

|          | Debounce                                         | Throttle                                                    |
| -------- | ------------------------------------------------ | ----------------------------------------------------------- |
| Behavior | Waits until calls stop for X ms, then fires once | Fires at most once every X ms, regardless of call frequency |
| Use case | Search input, resize end                         | Scroll handler, button spam prevention                      |

```js
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

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
```

### 7. Shallow vs Deep Copy

```js
const obj = { a: 1, nested: { b: 2 } };

// Shallow copy — nested objects still shared by reference
const shallow = { ...obj };
shallow.nested.b = 99; // also mutates obj.nested.b!

// Deep copy
const deep = structuredClone(obj); // modern, preferred
// or: JSON.parse(JSON.stringify(obj)) — loses functions, dates, undefined
```

This matters hugely in React because **state updates must be immutable** — mutating nested state directly won't trigger a re-render since the reference doesn't change.

---

## React.js

### 1. Reconciliation & Keys

React's diffing algorithm compares the new virtual DOM tree to the previous one and updates only what changed. `key` helps React identify which items changed/added/removed in a list, especially when order changes.

**Never use array index as key if the list can reorder/filter** — it causes incorrect state association between items.

```jsx
{
  items.map((item) => <Item key={item.id} {...item} />);
} // ✅ stable id
{
  items.map((item, i) => <Item key={i} {...item} />);
} // ⚠️ risky if list reorders
```

### 2. useMemo vs useCallback vs React.memo

| Hook/API                | Memoizes                          | Use for                                                             |
| ----------------------- | --------------------------------- | ------------------------------------------------------------------- |
| `useMemo(fn, deps)`     | A **computed value**              | Expensive calculations                                              |
| `useCallback(fn, deps)` | A **function reference**          | Passing stable callbacks to children (avoids breaking `React.memo`) |
| `React.memo(Component)` | The **component's render output** | Skip re-render if props are shallowly equal                         |

```jsx
const expensiveValue = useMemo(() => computeHeavy(data), [data]);
const stableFn = useCallback(() => doSomething(id), [id]);
const MemoChild = React.memo(Child); // only re-renders if props change
```

### 3. State Updates & Batching

React batches multiple `setState` calls within the same event handler (and, since React 18, inside promises/timeouts/native events too) into a single re-render.

```jsx
function handleClick() {
  setCount((c) => c + 1);
  setFlag((f) => !f);
  // Only ONE re-render, not two (React 18 automatic batching)
}
```

Use the **functional updater form** (`setCount(c => c + 1)`) when the new state depends on the previous state, to avoid stale closures.

### 4. useEffect Dependency Array

- Missing a dependency → stale values ("stale closure" bugs)
- Object/array/function dependencies that are recreated every render → effect runs every render unless memoized

```jsx
useEffect(() => {
  console.log(count);
}, [count]); // re-runs only when count changes
```

### 5. useEffect vs useLayoutEffect

|         | useEffect                             | useLayoutEffect                             |
| ------- | ------------------------------------- | ------------------------------------------- |
| Timing  | After paint (async)                   | Before paint (sync, blocks browser)         |
| Use for | Data fetching, subscriptions, logging | DOM measurements, preventing visual flicker |

### 6. Causes of Unnecessary Re-renders

1. Parent re-renders → all children re-render by default (unless memoized)
2. Passing new object/array/function literals as props each render
3. Using Context where any consumer re-renders on any context value change
4. Unstable `key` values
5. Deriving state instead of computing during render

**Fixes:** `React.memo`, `useMemo`, `useCallback`, splitting context, moving state down closer to where it's used.

### 7. Custom Hooks

A custom hook is just a function starting with `use` that composes other hooks — for reusable logic.

```jsx
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

---

## Output-Based Questions — How to Approach Them

When shown a code snippet, work through it in this order:

1. **Identify sync vs async code** — sync runs first, top to bottom.
2. **Separate microtasks (Promises) from macrotasks (setTimeout).**
3. **Trace state updates** — remember React batches updates in the same render cycle; `console.log` right after `setState` still shows the _old_ value (closures capture the value at render time).
4. **Count renders**: a component re-renders when its own state changes, its props change, or its parent re-renders (unless memoized).
5. **Count effect runs**: mount always runs once; then once per dependency change; strict mode in dev double-invokes effects (React 18 dev-only, not in production).

### Example: state closures

```jsx
function Example() {
  const [count, setCount] = useState(0);
  const handleClick = () => {
    setCount(count + 1);
    console.log(count); // logs OLD value — setCount is async/batched,
    // and `count` here is the value from this render's closure
  };
  return <button onClick={handleClick}>{count}</button>;
}
```

### Example: render count with children

```jsx
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
      <Child />{" "}
      {/* re-renders every time Parent renders, unless wrapped in React.memo */}
    </>
  );
}
```

---

## Practical Scenarios

### 1. Optimize a search API called on every keystroke

- **Debounce** the input (wait ~300-500ms after the user stops typing before firing the request).
- Optionally combine with **throttling** for extremely long typing bursts.
- Cancel in-flight requests when a new one starts (see stale response handling below).
- Consider a minimum character threshold before searching.

```jsx
function SearchBox() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (!debouncedQuery) return;
    const controller = new AbortController();
    fetch(`/api/search?q=${debouncedQuery}`, { signal: controller.signal })
      .then((res) => res.json())
      .then(setResults)
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      });
    return () => controller.abort();
  }, [debouncedQuery]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

### 2. Prevent stale API responses (race conditions)

Problem: user types "a", then "ab" — request for "a" might resolve _after_ the request for "ab", overwriting newer results with older ones.

**Solutions:**

- `AbortController` to cancel the previous fetch when a new one starts.
- An `ignore`/`isCurrent` flag in `useEffect` cleanup (shown in the Round 1 example above).
- Track a request ID/sequence number and only apply the response if it matches the latest request.
- Libraries like React Query / SWR handle this automatically.

### 3. Optimize a page rendering thousands of records

- **Virtualization/windowing** — render only visible rows (`react-window` or `react-virtualized`).
- **Pagination** or **infinite scroll** with incremental loading instead of loading everything at once.
- **Memoize row components** (`React.memo`) so unrelated state changes don't re-render every row.
- Avoid inline function/object props to row components (use `useCallback`/`useMemo`).
- Move heavy computation (filtering/sorting) to `useMemo` or a web worker.
- Use stable, unique `key`s.

### 4. Debug unnecessary React re-renders

- **React DevTools Profiler** — record and see which components rendered and why ("why did this render" highlighting).
- Add `console.log` in the component body to confirm and count renders.
- Check for:
  - New object/array/function literals created inline as props each render
  - Context consumers re-rendering on unrelated value changes
  - Missing `React.memo` on pure child components
  - Parent state changes causing full subtree re-renders unnecessarily
- Fix incrementally: wrap components in `React.memo`, memoize props with `useMemo`/`useCallback`, split context providers, or lift/colocate state so it only affects what actually needs it.

---

## Quick Reference: Things Interviewers Love to Test

- Predicting `console.log` order with mixed sync/Promise/setTimeout code
- Whether `setState` is synchronous (it's not — it's batched and async in event handlers)
- Why array index as `key` can cause bugs
- The difference between mutating state vs creating a new reference
- Why `useEffect` cleanup functions matter (avoiding memory leaks, stale subscriptions, race conditions)
- The difference between controlled and uncontrolled components
- What "lifting state up" means and when to do it vs use Context vs use a state library
