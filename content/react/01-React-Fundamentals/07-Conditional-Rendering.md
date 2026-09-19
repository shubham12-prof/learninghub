# Conditional Rendering

Rendering different UI based on some condition — done with plain JavaScript, not a special templating syntax.

```jsx
// if/else (outside JSX, before the return)
function Greeting({ isLoggedIn }) {
  if (isLoggedIn) return <h1>Welcome back!</h1>;
  return <h1>Please sign in</h1>;
}

// Ternary (inline in JSX)
function Greeting({ isLoggedIn }) {
  return <h1>{isLoggedIn ? "Welcome back!" : "Please sign in"}</h1>;
}

// Logical && (render something or nothing)
function Notification({ count }) {
  return <div>{count > 0 && <span className="badge">{count}</span>}</div>;
}

// Guard clause — return null to render nothing
function Modal({ isOpen, children }) {
  if (!isOpen) return null;
  return <div className="modal">{children}</div>;
}
```

**Gotcha with `&&`:** if the left side is `0`, React renders the literal `0` on screen (since `0` is falsy but still a renderable value).

```jsx
{
  items.length && <List items={items} />;
} // ❌ renders "0" when items.length is 0
{
  items.length > 0 && <List items={items} />;
} // ✅ renders nothing, condition is a real boolean
```
