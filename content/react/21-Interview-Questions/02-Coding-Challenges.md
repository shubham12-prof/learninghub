# Coding Challenges

### 1. Build a custom `useDebounce` hook

```jsx
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // cancel if value changes before delay passes
  }, [value, delay]);
  return debounced;
}

// Usage — debounced search input
function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) fetchResults(debouncedQuery);
  }, [debouncedQuery]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

### 2. Implement a simple counter with `useReducer`

```jsx
function reducer(state, action) {
  switch (action.type) {
    case "inc":
      return { count: state.count + 1 };
    case "dec":
      return { count: state.count - 1 };
    default:
      return state;
  }
}
function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <>
      <button onClick={() => dispatch({ type: "dec" })}>-</button>
      {state.count}
      <button onClick={() => dispatch({ type: "inc" })}>+</button>
    </>
  );
}
```

### 3. Build a `useFetch` hook with loading/error handling

```jsx
function useFetch(url) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });
  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    fetch(url)
      .then((res) => res.json())
      .then(
        (data) => !cancelled && setState({ data, loading: false, error: null }),
      )
      .catch(
        (error) =>
          !cancelled && setState({ data: null, loading: false, error }),
      );
    return () => {
      cancelled = true;
    };
  }, [url]);
  return state;
}
```

### 4. Implement an accordion component (single item open at a time)

```jsx
function Accordion({ items }) {
  const [openIndex, setOpenIndex] = useState(null);
  return (
    <div>
      {items.map((item, i) => (
        <div key={item.id}>
          <button onClick={() => setOpenIndex(openIndex === i ? null : i)}>
            {item.title}
          </button>
          {openIndex === i && <p>{item.content}</p>}
        </div>
      ))}
    </div>
  );
}
```

### 5. Build a `usePrevious` hook (access a value from the previous render)

```jsx
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value; // updates AFTER render, so during render it still holds the old value
  }, [value]);
  return ref.current;
}

function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);
  return (
    <p>
      Now: {count}, Before: {prevCount}
    </p>
  );
}
```

### 6. Implement infinite scroll with `IntersectionObserver`

```jsx
function useInfiniteScroll(callback) {
  const observerRef = useRef();
  const lastElementRef = useCallback(
    (node) => {
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) callback();
      });
      if (node) observerRef.current.observe(node);
    },
    [callback],
  );
  return lastElementRef;
}

function List({ items, loadMore }) {
  const lastItemRef = useInfiniteScroll(loadMore);
  return items.map((item, i) => (
    <div key={item.id} ref={i === items.length - 1 ? lastItemRef : null}>
      {item.text}
    </div>
  ));
}
```

### 7. Fix the stale closure bug in this component

```jsx
// ❌ Buggy version
function Timer() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCount(count + 1), 1000); // always uses count=0
    return () => clearInterval(id);
  }, []); // empty deps -> closure captures count=0 forever
  return <p>{count}</p>;
}

// ✅ Fixed version — functional update doesn't rely on the closed-over value
function Timer() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCount((c) => c + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <p>{count}</p>;
}
```
