# useCallback

Memoizes a **function reference** itself (not its result), so the same function identity is preserved across renders unless its dependencies change. Essentially `useMemo(() => fn, deps)`.

```jsx
import { useCallback, useState } from "react";

function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log("Clicked");
  }, []); // same function reference every render

  return <MemoizedChild onClick={handleClick} />;
}

const MemoizedChild = React.memo(function Child({ onClick }) {
  console.log("Child rendered");
  return <button onClick={onClick}>Click</button>;
});
```

**Why it matters:** without `useCallback`, a new function is created on every render, so a `React.memo`-wrapped child receiving it as a prop would re-render every time (since the prop "changed" by reference), defeating the memoization.

```jsx
// ❌ new function every render — breaks React.memo on Child
<MemoizedChild onClick={() => doSomething()} />;

// ✅ stable reference — Child only re-renders when truly needed
const stableFn = useCallback(() => doSomething(), []);
<MemoizedChild onClick={stableFn} />;
```

**Interview note:** `useCallback(fn, deps)` is functionally equivalent to `useMemo(() => fn, deps)` — it exists as a more readable/intent-revealing shorthand specifically for memoizing functions.
