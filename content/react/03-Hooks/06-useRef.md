# useRef

Creates a mutable object (`{ current: value }`) that **persists across renders without causing a re-render when changed**. Two main uses: accessing DOM nodes, and storing mutable values that shouldn't trigger re-renders.

```jsx
import { useRef, useEffect } from "react";

// 1. DOM access
function TextInput() {
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current.focus(); // imperatively focus on mount
  }, []);
  return <input ref={inputRef} />;
}

// 2. Mutable value that persists but doesn't trigger re-render
function Timer() {
  const countRef = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      countRef.current += 1; // updates silently, no re-render
      console.log(countRef.current);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return <p>Check console for tick count</p>;
}
```

**useRef vs useState:**

|                                | useState                     | useRef                                 |
| ------------------------------ | ---------------------------- | -------------------------------------- |
| Triggers re-render on change?  | Yes                          | No                                     |
| Value persists across renders? | Yes                          | Yes                                    |
| Use for                        | data the UI needs to reflect | DOM refs, timers, "instance variables" |

**Interview note:** a very common gotcha — mutating `ref.current` does NOT cause a re-render, so if you need the UI to reflect a change, you need `useState`, not `useRef`.
