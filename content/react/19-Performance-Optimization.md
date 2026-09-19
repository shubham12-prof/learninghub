# Performance Optimization

Common techniques and diagnostic tools for keeping a React app fast, roughly in order of "measure first, then act."

**1. Profile before optimizing** — use the React DevTools Profiler to identify which components re-render unnecessarily and how long renders take, rather than guessing.

**2. Prevent unnecessary re-renders:**

```jsx
const MemoizedChild = React.memo(Child); // skip re-render if props unchanged
const stableCallback = useCallback(() => {}, []); // stable function reference for memoized children
const stableValue = useMemo(() => computeExpensive(), [dep]); // avoid recomputation
```

**3. Virtualize long lists** — render only the visible rows instead of thousands of DOM nodes (libraries: `react-window`, `react-virtualized`):

```jsx
import { FixedSizeList } from "react-window";
<FixedSizeList height={400} itemCount={10000} itemSize={35}>
  {({ index, style }) => <div style={style}>Row {index}</div>}
</FixedSizeList>;
```

**4. Code-split and lazy-load** heavy routes/components (see Code Splitting / Lazy Loading files) to reduce initial bundle size.

**5. Avoid creating new objects/arrays/functions inline** where they'll defeat memoization:

```jsx
// ❌ new array reference every render
<List items={data.filter((x) => x.active)} />;
// ✅ memoized
const activeItems = useMemo(() => data.filter((x) => x.active), [data]);
```

**6. Key state appropriately** — keep state as local as possible; lifting state too high causes broad re-render cascades when only a small part of the tree actually needs the update.

**7. Use the Profiler's "why did this render" flame graph** to spot components re-rendering due to unstable props, unnecessary context subscriptions, or missing memoization.

**Interview note:** the single most common React performance question is "how would you optimize a slow list/component?" — a strong answer walks through: profile first → check for unstable props/inline objects → apply `React.memo`/`useMemo`/`useCallback` where it matters → consider virtualization for very long lists → consider code-splitting for route-level bundle size.
