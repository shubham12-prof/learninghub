# useState

Adds local state to a function component. Returns a `[value, setter]` pair.

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0); // 0 = initial value

  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

**Functional updates** — use when the new state depends on the previous state, especially in loops/async callbacks, to avoid stale closures:

```jsx
setCount((prev) => prev + 1); // always correct, uses the latest state
```

**Lazy initialization** — pass a function instead of a value when the initial state is expensive to compute; it only runs once, on mount:

```jsx
const [data, setData] = useState(() => expensiveComputation());
```

**State with objects/arrays — always create a new reference, don't mutate:**

```jsx
const [user, setUser] = useState({ name: "Alice", age: 25 });
setUser((prev) => ({ ...prev, age: 26 })); // ✅ new object
// user.age = 26; setUser(user);           // ❌ mutation — won't trigger re-render reliably
```

**Interview note:** `useState` updates are asynchronous and batched within event handlers — the state variable in the current closure won't reflect the update until the next render.
