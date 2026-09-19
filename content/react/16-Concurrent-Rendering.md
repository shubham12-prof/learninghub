# Concurrent Rendering

A set of React capabilities (enabled by the Fiber architecture) that let React work on multiple UI updates at once, prioritizing urgent ones (typing, clicking) over less urgent ones (a big list re-render), and even prepare multiple versions of the UI in the background before committing.

**Core capabilities this unlocks:**

- **Interruptible rendering** — a low-priority render can be paused mid-way to handle an urgent update, then resumed or discarded.
- **`useTransition` / `startTransition`** — explicitly mark updates as non-urgent.
- **`useDeferredValue`** — defer using a value in a lower-priority render.
- **Automatic batching** — multiple state updates (even across timeouts, promises, and native event handlers) are batched into a single re-render by default (React 18+), reducing unnecessary renders.

```jsx
function handleClick() {
  setTimeout(() => {
    setCount((c) => c + 1); // React 18: these are batched into ONE re-render
    setFlag((f) => !f); // even though they're inside a setTimeout callback
  }, 0);
}
```

**Enabling concurrent features (React 18+) — via `createRoot`:**

```jsx
import { createRoot } from "react-dom/client";
const root = createRoot(document.getElementById("root"));
root.render(<App />); // enables concurrent features (vs. legacy ReactDOM.render)
```

**Interview note:** "Concurrent" does not mean multi-threaded — JS remains single-threaded. It means React can **interleave** rendering work with other tasks by yielding control back to the browser between units of work, rather than blocking the main thread with one long synchronous render pass.
