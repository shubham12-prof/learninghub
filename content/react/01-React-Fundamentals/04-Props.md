# Props

Short for "properties" — the mechanism for passing data from a parent component down to a child. Props are **read-only** (immutable from the child's perspective) — a component must never mutate its own props.

```jsx
function UserCard({ name, age, isAdmin = false }) {
  // destructuring + default value
  return (
    <div>
      <h3>{name}</h3>
      <p>Age: {age}</p>
      {isAdmin && <span>Admin</span>}
    </div>
  );
}

<UserCard name="Alice" age={25} isAdmin />;
```

```jsx
// Passing functions as props (common pattern for child -> parent communication)
function Parent() {
  const handleClick = () => console.log("Clicked!");
  return <Child onButtonClick={handleClick} />;
}
function Child({ onButtonClick }) {
  return <button onClick={onButtonClick}>Click me</button>;
}

// children prop — anything nested between opening/closing tags
function Wrapper({ children }) {
  return <div className="wrapper">{children}</div>;
}
```

**Prop drilling:** passing props down through many intermediate components that don't need them, just to reach a deeply nested child. Solved with Context API or state management libraries (see those files).

**Interview note:** "Why are props read-only?" — Enforcing one-way data flow (parent → child) makes UI state predictable and easier to debug; if children could mutate props directly, data flow would become untraceable.
