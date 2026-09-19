# useDeferredValue

Returns a "deferred" copy of a value that lags behind the real value during urgent updates, letting React prioritize more important rendering work first — similar goal to `useTransition`, but for a value you receive (often as a prop) rather than a state setter you control.

```jsx
import { useState, useDeferredValue, useMemo } from "react";

function SearchPage() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query); // may lag behind `query` briefly

  const results = useMemo(
    () => expensiveSearch(deferredQuery),
    [deferredQuery],
  );

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ResultsList results={results} />
    </>
  );
}
```

While the deferred value is "stale" compared to the latest input, you can show a visual cue:

```jsx
const isStale = query !== deferredQuery;
<div style={{ opacity: isStale ? 0.6 : 1 }}>
  <ResultsList results={results} />
</div>;
```

**useTransition vs useDeferredValue:**

|          | useTransition                  | useDeferredValue                                                     |
| -------- | ------------------------------ | -------------------------------------------------------------------- |
| Wraps    | a state **update** you trigger | a **value** you already have                                         |
| Use when | you control the setState call  | you receive a value (e.g. a prop) and want to defer work based on it |

**Interview note:** both are concurrent-rendering tools for the same underlying problem — keeping urgent UI (typing, clicking) responsive while expensive re-renders happen at lower priority.
