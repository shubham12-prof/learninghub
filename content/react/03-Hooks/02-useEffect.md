# useEffect

Runs side effects (data fetching, subscriptions, manual DOM changes) after render, synchronizing the component with an external system.

```jsx
import { useEffect, useState } from "react";

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchUser(userId).then((data) => {
      if (!cancelled) setUser(data); // guard against setting state after unmount
    });
    return () => {
      cancelled = true;
    }; // cleanup
  }, [userId]); // re-runs only when userId changes

  return <div>{user?.name}</div>;
}
```

**Dependency array behavior:**

```jsx
useEffect(() => {
  /* ... */
}); // runs after EVERY render
useEffect(() => {
  /* ... */
}, []); // runs once, after initial mount only
useEffect(() => {
  /* ... */
}, [a, b]); // runs on mount + whenever a or b changes
```

**Cleanup function** — returned from the effect, runs before the next effect execution and on unmount. Essential for subscriptions/timers/listeners:

```jsx
useEffect(() => {
  const id = setInterval(() => console.log("tick"), 1000);
  return () => clearInterval(id); // prevents leaks / duplicate timers
}, []);
```

**Interview note:** the "exhaustive-deps" ESLint rule flags missing dependencies because stale closures are a very common React bug — if your effect uses a variable from render scope, it belongs in the dependency array.
