# Custom Hooks

Functions starting with `use` that extract and reuse stateful logic across components — built by composing built-in Hooks. They don't share state between components (each call gets its own independent state), they share the _logic_.

```jsx
// Custom hook: fetch data with loading/error state
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, loading, error };
}

// Usage — clean, reusable, testable in isolation
function UserProfile({ userId }) {
  const { data: user, loading, error } = useFetch(`/api/users/${userId}`);
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error!</p>;
  return <p>{user.name}</p>;
}
```

```jsx
// Another common example: useLocalStorage
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
```

**Rules of Hooks (apply to custom Hooks too):**

- Only call Hooks at the top level (never inside loops, conditions, or nested functions)
- Only call Hooks from React function components or other custom Hooks

**Interview note:** the biggest value of custom Hooks is separating _logic_ from _markup_ — the same `useFetch` logic can power completely different UI in different components, and can be unit-tested independently of any rendered output.
