# useReducer

An alternative to `useState` for managing more complex state logic — especially when the next state depends on the previous one via well-defined actions, or when multiple sub-values update together. Same pattern as Redux reducers.

```jsx
import { useReducer } from "react";

function reducer(state, action) {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    case "decrement":
      return { count: state.count - 1 };
    case "reset":
      return { count: 0 };
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  return (
    <div>
      <p>{state.count}</p>
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
      <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
    </div>
  );
}
```

**Lazy initialization (third argument):**

```jsx
function init(initialCount) {
  return { count: initialCount };
}
const [state, dispatch] = useReducer(reducer, 10, init); // init(10) runs once
```

**When to prefer useReducer over useState:**

- State transitions are complex, with many sub-values that change together
- The next state logically depends on the action taken, not just a raw value
- You want to test state transition logic independently of components (reducers are pure functions, easy to unit test)

**Interview note:** `useReducer` doesn't replace Redux — it's a local, component-scoped state tool. Combine it with `useContext` to share reducer-based state across a subtree without a full state management library.
