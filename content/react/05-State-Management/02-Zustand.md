# Zustand

A minimal, unopinionated state management library — far less boilerplate than Redux, no Provider wrapping required, uses hooks directly.

```jsx
// store.js
import { create } from "zustand";

const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

// Component — just import and use the hook, no Provider needed
function Counter() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);
  return <button onClick={increment}>{count}</button>;
}
```

**Selecting only what you need avoids unnecessary re-renders** (component only re-renders when the selected slice changes):

```jsx
const count = useCounterStore((state) => state.count); // only re-renders on count change
```

**Async actions — no special middleware needed, just write async functions:**

```jsx
const useUserStore = create((set) => ({
  user: null,
  loading: false,
  fetchUser: async (id) => {
    set({ loading: true });
    const res = await fetch(`/api/users/${id}`);
    const user = await res.json();
    set({ user, loading: false });
  },
}));
```

**Redux Toolkit vs Zustand:**

|                      | Redux Toolkit                                                     | Zustand                                                 |
| -------------------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| Boilerplate          | moderate (slices, store setup)                                    | minimal                                                 |
| DevTools/time-travel | excellent, built-in                                               | possible via middleware                                 |
| Learning curve       | steeper                                                           | gentle                                                  |
| Best for             | large apps, complex state logic, teams needing strict conventions | small-to-medium apps, quick setup, simpler global state |

**Interview note:** Zustand state lives outside React's render tree in a plain JS store, so it can also be read/updated outside of components (e.g. in utility functions) — something plain Context/useState can't do as cleanly.
