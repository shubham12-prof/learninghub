# useTransition

Marks a state update as a **non-urgent "transition"**, letting React keep the UI responsive (e.g., keep typing smooth) while a potentially slow re-render happens in the background — part of React's Concurrent Rendering features.

```jsx
import { useState, useTransition } from "react";

function SearchResults() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value); // urgent — updates the input immediately, stays responsive

    startTransition(() => {
      // non-urgent — can be interrupted/deprioritized if the user keeps typing
      setResults(expensiveSearch(value));
    });
  };

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <p>Updating results...</p>}
      <ResultsList results={results} />
    </>
  );
}
```

**Interview note:** `useTransition` doesn't make the underlying work faster — it changes _scheduling priority_, letting React interrupt a low-priority render (like a big list re-render) to handle high-priority updates (like keystrokes) first, keeping the UI feeling responsive.
