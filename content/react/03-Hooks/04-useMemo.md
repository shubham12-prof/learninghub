# useMemo

Memoizes the **result of an expensive calculation**, recomputing it only when its dependencies change — avoids redundant work on every render.

```jsx
import { useMemo } from "react";

function ProductList({ products, filter }) {
  const filteredProducts = useMemo(() => {
    console.log("Filtering..."); // only logs when products or filter changes
    return products.filter((p) => p.category === filter);
  }, [products, filter]);

  return (
    <ul>
      {filteredProducts.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}
```

**Also used to keep a stable object/array reference** (avoids unnecessarily re-triggering effects or child re-renders that depend on referential equality):

```jsx
const options = useMemo(() => ({ sort: "asc", limit: 10 }), []); // same reference across renders
```

**Interview note:** `useMemo` is a performance optimization, not a semantic guarantee — React _may_ discard the cached value in some cases (e.g., under memory pressure with concurrent features), so never rely on it for correctness, only for avoiding unnecessary recalculation. Don't overuse it — memoizing cheap calculations adds overhead without benefit.
