# React.memo

A higher-order component that memoizes a component, skipping re-render if its props haven't changed (shallow comparison by default).

```jsx
const UserCard = React.memo(function UserCard({ name, age }) {
  console.log("Rendering UserCard");
  return (
    <div>
      {name}, {age}
    </div>
  );
});

function App() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Increment: {count}</button>
      <UserCard name="Alice" age={25} />{" "}
      {/* won't re-render when count changes */}
    </div>
  );
}
```

**Custom comparison function (second argument):**

```jsx
const UserCard = React.memo(
  function UserCard({ user }) {
    /* ... */
  },
  (prevProps, nextProps) => prevProps.user.id === nextProps.user.id, // custom equality
);
```

**Common pitfall — memo is defeated by new object/function/array props on every render:**

```jsx
// ❌ new object literal every render -> React.memo's shallow comparison always sees a "change"
<UserCard style={{ color: "red" }} />;

// ✅ stable reference (hoisted, or memoized with useMemo/useCallback)
const style = useMemo(() => ({ color: "red" }), []);
<UserCard style={style} />;
```

**Interview note:** `React.memo` only prevents re-renders caused by the **parent** re-rendering with the same props — it does nothing to prevent re-renders triggered by the component's own internal state or context changes.
