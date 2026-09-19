# Memoization (in React)

The general performance technique of caching a computed result and reusing it when the same inputs occur again, avoiding redundant work. React exposes three memoization tools, each for a different target:

| Tool          | Memoizes                                | Typical use                                            |
| ------------- | --------------------------------------- | ------------------------------------------------------ |
| `useMemo`     | a computed **value**                    | expensive calculations, stable object/array references |
| `useCallback` | a **function** reference                | stable callbacks passed to memoized children           |
| `React.memo`  | an entire **component's render output** | skip re-rendering when props are unchanged             |

```jsx
function ProductList({ products, filter }) {
  // Memoize an expensive computation
  const filtered = useMemo(
    () => products.filter((p) => p.category === filter),
    [products, filter],
  );

  // Memoize a function passed down to a memoized child
  const handleSelect = useCallback((id) => console.log("Selected:", id), []);

  return filtered.map((p) => (
    <MemoizedProductCard key={p.id} product={p} onSelect={handleSelect} />
  ));
}

const MemoizedProductCard = React.memo(ProductCard); // skips re-render if props unchanged
```

**When memoization helps vs hurts:**

- Helps: expensive computations (large lists, complex derived data), preventing cascading re-renders in large component trees, stabilizing references passed to memoized children.
- Hurts (adds overhead for no benefit): trivial calculations, components that re-render cheaply anyway, or premature optimization before profiling shows an actual bottleneck.

**Interview note:** always profile first (React DevTools Profiler) before reaching for memoization — over-memoizing adds complexity and its own (small) performance cost (comparing dependencies every render) without guaranteed payoff.
