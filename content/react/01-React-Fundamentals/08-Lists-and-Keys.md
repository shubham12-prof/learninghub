# Lists & Keys

Rendering arrays of data as elements, typically with `.map()`. Each item needs a unique **`key`** prop so React can efficiently track which items changed, were added, or removed during reconciliation.

```jsx
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.text}</li> // stable, unique id — NOT array index
      ))}
    </ul>
  );
}
```

**Why not use the array index as a key?** If the list can be reordered, filtered, or items inserted/removed, index-based keys cause React to misattribute state to the wrong DOM node — leading to bugs like input fields showing stale values after reordering.

```jsx
// ❌ Risky if list order can change
{
  todos.map((todo, index) => <li key={index}>{todo.text}</li>);
}

// ✅ Safe — stable identity independent of position
{
  todos.map((todo) => <li key={todo.id}>{todo.text}</li>);
}
```

Index keys are only "safe" for lists that are static and never reordered/filtered.

**Interview note:** `key` is not accessible as a regular prop inside the component (`props.key` is `undefined`) — it's used internally by React's reconciler only.
