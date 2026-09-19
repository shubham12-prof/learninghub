# State

Data that's local to a component and can change over time, triggering a re-render when updated. Managed with the `useState` Hook in function components.

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0); // [currentValue, setterFunction]

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

**State updates are asynchronous & batched** — don't rely on the variable being updated immediately after calling the setter.

```jsx
function BuggyCounter() {
  const [count, setCount] = useState(0);
  const handleClick = () => {
    setCount(count + 1);
    setCount(count + 1); // ❌ still uses the OLD `count` from this render — only +1 total
  };
  const handleClickFixed = () => {
    setCount((prev) => prev + 1); // ✅ functional update — always uses latest state
    setCount((prev) => prev + 1); // +2 total
  };
}
```

**State vs Props:**

|          | State                   | Props                     |
| -------- | ----------------------- | ------------------------- |
| Owned by | the component itself    | parent component          |
| Mutable? | yes (via setter)        | no (read-only)            |
| Purpose  | internal, changing data | configuration passed down |

**Interview note:** state should hold the minimal data needed to describe the UI — derive everything else during render instead of duplicating it into more state (avoids sync bugs).
