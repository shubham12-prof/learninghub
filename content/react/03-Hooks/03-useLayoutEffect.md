# useLayoutEffect

Identical API to `useEffect`, but fires **synchronously after DOM mutations, before the browser paints** the screen. `useEffect` fires asynchronously, after paint.

```jsx
import { useLayoutEffect, useRef, useState } from "react";

function Tooltip() {
  const ref = useRef();
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    // Measure DOM synchronously before the browser paints —
    // avoids a visible flicker that useEffect could cause here.
    const rect = ref.current.getBoundingClientRect();
    setHeight(rect.height);
  }, []);

  return <div ref={ref}>Tooltip content</div>;
}
```

**When to use which:**

|                          | useEffect                                       | useLayoutEffect                                                          |
| ------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------ |
| Timing                   | after paint (async)                             | before paint (sync)                                                      |
| Blocks browser painting? | No                                              | Yes                                                                      |
| Use for                  | data fetching, subscriptions, most side effects | DOM measurements that must be read/adjusted before the user sees a flash |

**Interview note:** default to `useEffect` — it's non-blocking and better for performance. Reach for `useLayoutEffect` only when you specifically need to read layout and synchronously re-render before the browser paints (e.g., avoiding visual flicker from a measured tooltip position).
