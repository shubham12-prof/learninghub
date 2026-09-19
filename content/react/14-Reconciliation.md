# Reconciliation

The algorithm React uses to compare a newly rendered Virtual DOM tree against the previous one, determining the minimal set of real DOM updates needed. Full tree diffing is normally O(n³) in computer science — React uses heuristics to bring this down to O(n).

**Two key heuristics React relies on:**

1. **Different element types produce different trees** — if an element changes type (`<div>` → `<span>`, or `ComponentA` → `ComponentB`), React tears down the old subtree completely and builds a new one from scratch (no attempt to diff children).

```jsx
// Before
<div><Counter /></div>
// After — Counter's entire state is DESTROYED and recreated, since the root type changed
<span><Counter /></span>
```

2. **Keys hint which list items are stable** across re-renders, letting React match elements between renders instead of recreating them (see the Lists & Keys file for detail).

```jsx
// Without stable keys, React may re-use DOM nodes for the wrong logical items,
// causing state (like input values) to appear attached to the wrong row.
{
  items.map((item) => <Row key={item.id} data={item} />);
}
```

**Same type, different props → React updates the existing DOM node in place** rather than recreating it:

```jsx
// Before: <div className="a" />  → After: <div className="b" />
// React keeps the same DOM node, just updates the className attribute
```

**Interview note:** reconciliation explains why changing a component's position in the tree (or its element type) resets its internal state — React isn't comparing "the same logical component," it's comparing tree positions and types.
