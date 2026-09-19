# Output Prediction & Conceptual Questions

## Output-Prediction Questions

**Q1.**

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  const handleClick = () => {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  };
  return <button onClick={handleClick}>{count}</button>;
}
```

What happens to `count` after one click?

<details><summary>Answer</summary>

It becomes `1`, not `3`. All three calls close over the SAME `count` value from that render (stale closure), so each just sets it to `count + 1` (0+1). Using the functional form `setCount(c => c + 1)` three times would correctly yield `3`.

</details>

**Q2.**

```jsx
useEffect(() => {
  console.log("effect ran");
}, [count]);
```

When does this log run?

<details><summary>Answer</summary>

Once after the initial render (mount), and again after every render where `count`'s value changed compared to the previous render.

</details>

**Q3.**

```jsx
{
  items.length && <List items={items} />;
}
```

What renders on screen when `items` is an empty array?

<details><summary>Answer</summary>

The literal number `0` gets rendered, because `0` is falsy but React still renders numbers (unlike other falsy values like `false`/`null`/`undefined`, which render nothing). Fix: `items.length > 0 && ...`.

</details>

**Q4.**

```jsx
<div key={index}>...</div> // inside a reorderable list
```

Why might this cause bugs?

<details><summary>Answer</summary>

Using the array index as a key breaks React's ability to correctly match list items across re-renders once the list is reordered/filtered — leading to state (e.g. input values) appearing attached to the wrong row after reordering.

</details>

---

## Conceptual Questions

1. What is the difference between controlled and uncontrolled components?
2. Why does React batch state updates, and what changed about batching in React 18?
3. Explain the difference between `useMemo` and `useCallback`.
4. What's prop drilling, and how does Context API help solve it?
5. Why do Hooks have the "only call at the top level" rule?
6. What's the difference between the render phase and the commit phase?
7. When would you choose `useReducer` over `useState`?
8. What's the difference between Server Components and Client Components?
9. Why can't Error Boundaries catch errors from event handlers or async code?
10. Explain how the key prop affects reconciliation performance and correctness.
