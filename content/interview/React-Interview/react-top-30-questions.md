# Top 30 React Interview Questions (Easy Explanation)

Each question has:

- **Simple answer** – say this in the interview
- **Code** – small example
- **How the code works** – step-by-step in easy words

---

## Q1. What is React?

**Simple answer:** React is a JavaScript **library** for building user interfaces (UI). You break the screen into small reusable pieces called **components**, and React updates only the parts of the page that change.

**Why it's popular:** reusable components, fast updates (Virtual DOM), big community.

---

## Q2. What is JSX?

**Simple answer:** JSX lets you write HTML-like code inside JavaScript. Browsers can't read it directly, so tools like Babel/Vite convert it to normal JavaScript.

```jsx
function Welcome() {
  const name = "Sam";
  return <h1 className="title">Hello, {name}!</h1>;
}
```

**How the code works:**

1. `const name = "Sam"` is a normal JS variable.
2. `{name}` – curly braces let you put any JavaScript value inside JSX.
3. `className` is used instead of `class` (because `class` is a reserved word in JS).
4. The function **returns** what should appear on screen.

**JSX rules to remember:** return one parent element (or use `<>...</>`), close all tags, use camelCase (`onClick`, `className`).

---

## Q3. What is the Virtual DOM?

**Simple answer:** The Virtual DOM is a **copy of the real DOM kept in memory** (as JavaScript objects). When something changes:

1. React makes a **new** virtual copy.
2. It **compares** new vs old (this is called _diffing / reconciliation_).
3. It updates **only the changed parts** in the real DOM.

**Real-life example:** Instead of repainting the whole wall, you repaint only the small spot that changed. That's faster.

---

## Q4. What is a component? Types of components?

**Simple answer:** A component is a reusable piece of UI. It is a function that returns JSX.

- **Functional components** (modern, use Hooks) ✅
- **Class components** (old style, still supported)

```jsx
function Button() {
  return <button>Click me</button>;
}

function App() {
  return (
    <div>
      <Button />
      <Button />
    </div>
  );
}
```

**How the code works:**

1. `Button` is a component (name starts with a **capital letter** – required).
2. `App` uses `<Button />` twice → two buttons appear. That's reuse.

---

## Q5. What are props?

**Simple answer:** Props (properties) are **inputs passed from a parent to a child** component. They are **read-only** – a child must not change them.

```jsx
function Greeting({ name, age }) {
  return (
    <p>
      {name} is {age} years old
    </p>
  );
}

function App() {
  return <Greeting name="Sam" age={25} />;
}
```

**How the code works:**

1. `App` passes `name` and `age` to `Greeting` like HTML attributes.
2. `Greeting` receives them as an object and **destructures** it: `{ name, age }`.
3. It displays them.
4. Strings use quotes (`"Sam"`), everything else uses curly braces (`{25}`).

---

## Q6. What is state?

**Simple answer:** State is **data that belongs to a component and can change over time**. When state changes, React **re-renders** the component.

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Add</button>
    </div>
  );
}
```

**How the code works:**

1. `useState(0)` creates state with starting value `0`.
2. It returns a pair: `count` (current value) and `setCount` (function to change it).
3. Clicking the button calls `setCount(count + 1)`.
4. React sees the state changed → runs `Counter` again → screen shows the new number.

---

## Q7. Props vs State?

| Props                         | State                             |
| ----------------------------- | --------------------------------- |
| Come from the **parent**      | Owned by the **component itself** |
| **Read-only**                 | Can be **changed** (using setter) |
| Used to configure a component | Used to store changing data       |

**Easy way to remember:** Props = function **arguments**. State = variables **inside** the function that React remembers.

---

## Q8. Why should we never change state directly?

**Simple answer:** React checks if the **reference** changed. If you mutate (change) the same object/array, the reference is the same, so React **doesn't re-render**.

```jsx
// ❌ Wrong
user.name = "Ravi";
setUser(user);

// ✅ Correct – make a NEW object
setUser({ ...user, name: "Ravi" });

// Arrays
setItems([...items, newItem]); // add
setItems(items.filter((i) => i.id !== id)); // remove
setItems(items.map((i) => (i.id === id ? { ...i, done: true } : i))); // update
```

**How the code works:**

1. `{ ...user }` copies all properties of `user` into a new object.
2. `name: "Ravi"` after it overrides just the name.
3. A **new object** is passed to `setUser` → React notices → re-renders.

---

## Q9. Is `setState` instant? What is the functional update?

**Simple answer:** No. React **batches** updates and applies them after the function finishes. The `count` variable doesn't change in the middle of the function.

```jsx
function Demo() {
  const [count, setCount] = useState(0);

  const wrong = () => {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
    console.log(count); // still the OLD value
  }; // final result: +1 only

  const right = () => {
    setCount((c) => c + 1);
    setCount((c) => c + 1);
    setCount((c) => c + 1);
  }; // final result: +3
}
```

**How the code works:**

1. In `wrong`, `count` is `0` for the whole function, so all three lines say "set to 1".
2. In `right`, `c => c + 1` receives the **latest** value each time → 0→1→2→3.

**Rule:** If the new state depends on the old state, use `setX(prev => ...)`.

---

## Q10. Why do we need `key` in lists?

**Simple answer:** `key` helps React identify **which item is which** when the list changes, so it updates correctly and efficiently. Use a **unique, stable ID**. Avoid array index if the list can reorder, add, or delete.

```jsx
function UserList({ users }) {
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

**How the code works:**

1. `.map()` turns every user into an `<li>`.
2. `key={user.id}` gives each `<li>` a unique tag.
3. If the list is reordered, React uses keys to move items instead of rebuilding them (and keeps typed input in the right row).

---

## Q11. How do you do conditional rendering?

```jsx
function Profile({ isLoggedIn, items }) {
  if (!isLoggedIn) return <p>Please login</p>; // 1. early return

  return (
    <div>
      {isLoggedIn ? <p>Welcome!</p> : <p>Guest</p>} {/* 2. ternary */}
      {items.length > 0 && <p>You have items</p>} {/* 3. && */}
    </div>
  );
}
```

**How the code works:**

1. **Early return** – stop and show something else.
2. **Ternary** `a ? b : c` – choose between two things.
3. **`&&`** – show only if the left side is true.

⚠️ Careful: `{count && <p>..</p>}` shows `0` on screen when `count` is 0. Use `count > 0 && ...`.

---

## Q12. How do you handle events?

```jsx
function Form() {
  const handleClick = () => alert("Clicked!");
  const handleDelete = (id) => console.log("Delete", id);

  return (
    <>
      <button onClick={handleClick}>Good</button>
      <button onClick={() => handleDelete(5)}>Good with argument</button>
      <button onClick={handleClick()}>Bad ❌</button>
    </>
  );
}
```

**How the code works:**

1. `onClick={handleClick}` – **passes** the function; React calls it on click.
2. `onClick={() => handleDelete(5)}` – wrapper function, used when you need to pass arguments.
3. `onClick={handleClick()}` – calls the function **immediately while rendering**. Wrong!

---

## Q13. Controlled vs Uncontrolled components?

**Simple answer:**

- **Controlled:** React state controls the input value (most common).
- **Uncontrolled:** The browser (DOM) keeps the value; you read it with a `ref`.

```jsx
// Controlled
function Controlled() {
  const [name, setName] = useState("");
  return <input value={name} onChange={(e) => setName(e.target.value)} />;
}

// Uncontrolled
function Uncontrolled() {
  const ref = useRef();
  return (
    <>
      <input ref={ref} defaultValue="hi" />
      <button onClick={() => alert(ref.current.value)}>Show</button>
    </>
  );
}
```

**How the code works:**

1. Controlled: typing → `onChange` → `setName` → state updates → input shows the new value. React is the "single source of truth".
2. Uncontrolled: the input manages itself; we only read `ref.current.value` when needed.

---

## Q14. What is `useState`? What are the Rules of Hooks?

**Simple answer:** `useState` gives a function component its own memory (state).

```jsx
const [value, setValue] = useState(initialValue);
```

**Rules of Hooks:**

1. Call Hooks **only at the top level** of the component (not inside `if`, loops, or nested functions).
2. Call Hooks **only in React components or custom Hooks**.

**Why?** React remembers state by the **order** of Hook calls. Changing the order breaks it.

---

## Q15. What is `useEffect`?

**Simple answer:** `useEffect` runs code **after the component renders**. Use it for side effects: API calls, timers, event listeners, updating the page title.

```jsx
function Title() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);

  return <button onClick={() => setCount(count + 1)}>Click {count}</button>;
}
```

**How the code works:**

1. Component renders first.
2. After rendering, React runs the effect and sets the browser tab title.
3. `[count]` means "run again only when `count` changes".

---

## Q16. What does the dependency array do?

| Dependency array | When the effect runs                       |
| ---------------- | ------------------------------------------ |
| Not written      | After **every** render                     |
| `[]`             | **Only once** (after first render)         |
| `[a, b]`         | First render + whenever `a` or `b` changes |

```jsx
useEffect(() => {
  console.log("every render");
});
useEffect(() => {
  console.log("only on mount");
}, []);
useEffect(() => {
  console.log("when id changes");
}, [id]);
```

**Common mistake:** forgetting a variable in the array → effect uses an old (**stale**) value.

---

## Q17. What is the cleanup function in `useEffect`?

**Simple answer:** The function you **return** from `useEffect`. It runs before the effect runs again and when the component is removed. Use it to stop timers, remove listeners, cancel requests → **prevents memory leaks**.

```jsx
function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id); // cleanup
  }, []);

  return <p>{time.toLocaleTimeString()}</p>;
}
```

**How the code works:**

1. On mount, start a timer that updates time every second.
2. When `Clock` is removed from the screen, `clearInterval` stops the timer.
3. Without cleanup, the timer keeps running forever (a leak).

---

## Q18. What is `useRef`?

**Simple answer:** `useRef` gives you a box (`ref.current`) that:

1. can point to a **DOM element**, and
2. can **store a value that survives re-renders without causing a re-render**.

```jsx
function FocusInput() {
  const inputRef = useRef(null);

  return (
    <>
      <input ref={inputRef} />
      <button onClick={() => inputRef.current.focus()}>Focus</button>
    </>
  );
}
```

**How the code works:**

1. `ref={inputRef}` connects the ref to the input element.
2. `inputRef.current` is now the real DOM input.
3. Button click calls `.focus()` on it.

**useRef vs useState:** changing `ref.current` does **not** re-render; changing state **does**.

---

## Q19. What is `useMemo`?

**Simple answer:** `useMemo` **remembers (caches) a calculated value** so React doesn't recalculate it on every render. It recalculates only when dependencies change.

```jsx
function ProductList({ products, search }) {
  const filtered = useMemo(() => {
    return products.filter((p) => p.name.includes(search));
  }, [products, search]);

  return (
    <ul>
      {filtered.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}
```

**How the code works:**

1. Filtering is done once and stored.
2. If the component re-renders for another reason, React reuses the stored result.
3. If `products` or `search` changes, it filters again.

**Tip:** Use only for **expensive** work. Don't wrap everything.

---

## Q20. What is `useCallback`?

**Simple answer:** `useCallback` **remembers a function** so its reference stays the same between renders. Normally a new function is created every render. It's useful when passing functions to memoized child components.

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log("clicked");
  }, []);

  return (
    <>
      <button onClick={() => setCount(count + 1)}>{count}</button>
      <Child onClick={handleClick} />
    </>
  );
}
```

**How the code works:**

1. `handleClick` is created once and reused.
2. Because the function reference doesn't change, a `React.memo` child won't re-render needlessly.

**Remember:** `useMemo` → remembers a **value**. `useCallback` → remembers a **function**.

---

## Q21. What is `React.memo`?

**Simple answer:** `React.memo` wraps a component so it **skips re-rendering if its props haven't changed**.

```jsx
const Child = React.memo(function Child({ name }) {
  console.log("Child rendered");
  return <p>{name}</p>;
});

function Parent() {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount(count + 1)}>{count}</button>
      <Child name="Sam" />
    </>
  );
}
```

**How the code works:**

1. Clicking the button re-renders `Parent`.
2. `name="Sam"` didn't change → `Child` is **skipped** (no log).
3. Without `memo`, `Child` re-renders every time the parent does.

---

## Q22. What is `useContext`?

**Simple answer:** Context lets you share data (theme, logged-in user, language) with **any component** without passing props through every level.

```jsx
const ThemeContext = createContext("light");

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Page />
    </ThemeContext.Provider>
  );
}

function Page() {
  return <Button />;
}

function Button() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Theme: {theme}</button>;
}
```

**How the code works:**

1. `createContext` makes a "shared box".
2. `Provider` puts a value (`"dark"`) in the box for everything inside it.
3. `useContext` lets `Button` read it directly, even though `Page` never passed it.

⚠️ Every component using the context re-renders when its value changes.

---

## Q23. What is prop drilling? How to avoid it?

**Simple answer:** Passing props through many components that don't need them, just to reach a deep child.

```
App → Layout → Sidebar → Menu → UserName   (user passed through all)
```

**Solutions:** Context API, state libraries (Redux, Zustand), or component composition (passing `children`).

---

## Q24. What is `useReducer`?

**Simple answer:** An alternative to `useState` for **complex state** with many actions. You send an **action**, and a **reducer** function decides the new state.

```jsx
function reducer(state, action) {
  switch (action.type) {
    case "add":
      return { count: state.count + 1 };
    case "remove":
      return { count: state.count - 1 };
    case "reset":
      return { count: 0 };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  return (
    <>
      <p>{state.count}</p>
      <button onClick={() => dispatch({ type: "add" })}>+</button>
      <button onClick={() => dispatch({ type: "remove" })}>-</button>
      <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
    </>
  );
}
```

**How the code works:**

1. `dispatch({ type: "add" })` sends an action.
2. React calls `reducer(currentState, action)`.
3. The returned object becomes the new state → re-render.

---

## Q25. What is a custom hook?

**Simple answer:** A function whose name starts with `use` and which uses other hooks. It lets you **reuse logic** between components.

```jsx
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = () => setOn((prev) => !prev);
  return [on, toggle];
}

function Menu() {
  const [open, toggleOpen] = useToggle();
  return (
    <>
      <button onClick={toggleOpen}>Menu</button>
      {open && (
        <ul>
          <li>Home</li>
        </ul>
      )}
    </>
  );
}
```

**How the code works:**

1. `useToggle` holds the true/false state and a `toggle` function.
2. Any component can call `useToggle()` and gets **its own separate copy** of that state.

---

## Q26. What is "lifting state up"?

**Simple answer:** If two sibling components need the same data, **move the state to their closest common parent** and pass it down via props.

```jsx
function Parent() {
  const [text, setText] = useState("");
  return (
    <>
      <Input text={text} onChange={setText} />
      <Preview text={text} />
    </>
  );
}

function Input({ text, onChange }) {
  return <input value={text} onChange={(e) => onChange(e.target.value)} />;
}

function Preview({ text }) {
  return <p>You typed: {text}</p>;
}
```

**How the code works:**

1. State lives in `Parent`.
2. `Input` gets the value and a function to change it.
3. `Preview` gets the same value → both stay in sync.

---

## Q27. How do you fetch data from an API?

```jsx
function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch("https://jsonplaceholder.typicode.com/users");
        if (!res.ok) throw new Error("Something went wrong");
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
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

**How the code works:**

1. Three states: `users` (data), `loading`, `error`.
2. `useEffect` with `[]` runs once after the first render.
3. `fetch` gets data; `res.ok` checks the status (fetch doesn't throw on 404/500 by itself).
4. `try/catch/finally` handles success, error, and "done" in all cases.
5. UI shows Loading → Error → or the list.

**Bonus:** libraries like **TanStack Query** or **SWR** do this with less code (caching, retries, etc.).

---

## Q28. How does routing work in React?

**Simple answer:** React itself has no routing. Use **React Router** to show different components for different URLs without reloading the page.

```jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
} from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Link to="/">Home</Link> | <Link to="/users/5">User 5</Link>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/users/:id" element={<User />} />
        <Route path="*" element={<p>Page not found</p>} />
      </Routes>
    </BrowserRouter>
  );
}

function User() {
  const { id } = useParams();
  return <h1>User ID: {id}</h1>;
}
```

**How the code works:**

1. `BrowserRouter` enables routing.
2. `Link` changes the URL without a full page reload.
3. `Route` maps a URL path to a component.
4. `:id` is a dynamic part; `useParams()` reads it.
5. `path="*"` catches unknown URLs (404).

---

## Q29. What is code splitting / lazy loading?

**Simple answer:** Instead of loading the **whole app at once**, load a component's code **only when needed**. This makes the first page load faster.

```jsx
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./Dashboard"));

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Dashboard />
    </Suspense>
  );
}
```

**How the code works:**

1. `lazy(() => import(...))` downloads `Dashboard` only when it's about to be shown.
2. `Suspense` shows the `fallback` while it downloads.

---

## Q30. What makes a component re-render? How do you reduce re-renders?

**A component re-renders when:**

1. Its own **state** changes
2. Its **props** change
3. Its **parent** re-renders (even if props are the same)
4. A **context** it uses changes

**How to reduce unnecessary re-renders:**

- `React.memo` for components
- `useMemo` / `useCallback` for values / functions passed as props
- Keep state **close** to where it's used (don't put everything at the top)
- Split big contexts
- Use `key` correctly, avoid creating new objects/arrays inline for memoized children
- Measure with **React DevTools Profiler** before optimizing

---

# Quick Revision (one line each)

| Topic            | One line                                                       |
| ---------------- | -------------------------------------------------------------- |
| Virtual DOM      | Memory copy of DOM; React updates only what changed            |
| Props            | Read-only data from parent                                     |
| State            | Changeable data inside component; change → re-render           |
| useEffect        | Run side effects after render; cleanup by returning a function |
| useRef           | Reference to DOM / value that doesn't cause re-render          |
| useMemo          | Cache a value                                                  |
| useCallback      | Cache a function                                               |
| React.memo       | Skip re-render if props same                                   |
| Context          | Share data without prop drilling                               |
| key              | Unique ID for list items                                       |
| Controlled input | Value comes from state                                         |

Good luck! 🚀
