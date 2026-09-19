# Rendering Process

The end-to-end sequence React follows to get a component's output onto the screen.

**High-level flow:**

1. **Trigger** — something schedules a render: initial mount, a `setState` call, a context value change, or a parent re-rendering.
2. **Render phase** — React calls your component function(s), building a new Virtual DOM tree. This phase is pure — no DOM mutations happen yet, and (with concurrent features) it can be paused/aborted.
3. **Reconciliation** — React diffs the new tree against the previous committed tree, computing the minimal set of changes needed (see the Reconciliation file).
4. **Commit phase** — React applies the computed changes to the real DOM, synchronously and in one pass, so the user never sees a half-updated UI. `useLayoutEffect` callbacks run here, before the browser paints.
5. **Browser paint** — the browser paints the updated DOM to the screen.
6. **Passive effects** — `useEffect` callbacks run asynchronously, after paint.

```jsx
function Example() {
  console.log("render phase"); // runs during step 2

  useLayoutEffect(() => {
    console.log("commit phase — before paint"); // step 4
  });

  useEffect(() => {
    console.log("after paint"); // step 6
  });

  return <div>Hello</div>;
}
// Console order: "render phase" -> "commit phase — before paint" -> (browser paints) -> "after paint"
```

**Interview note:** understanding this order explains several common gotchas — e.g., why reading `ref.current` inside the render phase can be unreliable (DOM isn't updated yet), and why `useLayoutEffect` can measure/adjust the DOM before the user sees a visual flash, while `useEffect` cannot.
