# Virtual DOM

The Virtual DOM (VDOM) is a lightweight, in-memory JavaScript representation of the real DOM. Instead of directly mutating the actual DOM (which is slow), React updates this virtual copy first, then figures out the minimal set of real DOM changes needed.

**How it works:**

1. State changes → React builds a new Virtual DOM tree.
2. React **diffs** the new tree against the previous tree (the "reconciliation" algorithm).
3. React computes the minimal set of changes (the "patch").
4. React applies only those changes to the real DOM (batched, efficient).

```jsx
// Every render, React creates a NEW virtual tree in memory
function Counter({ count }) {
  return <div>Count: {count}</div>;
  // Internally becomes: React.createElement('div', null, 'Count: ', count)
}
```

```js
// Simplified idea of what JSX compiles to (no VDOM library involved yet)
const element = React.createElement(
  "div",
  { className: "count" },
  `Count: ${count}`,
);
// This is a plain JS object describing what should be on screen — the "virtual" node
```

**Why it's fast:** direct DOM manipulation triggers expensive browser work (layout, reflow, repaint) on every change. Diffing in-memory JS objects is cheap, so React batches and minimizes actual DOM writes.

**Interview note:** the Virtual DOM isn't inherently "faster than the DOM" in every case — it's about _avoiding unnecessary, unbatched DOM writes_ through an efficient diffing + batching strategy. Modern React (Fiber) builds on this idea with even more scheduling control.
