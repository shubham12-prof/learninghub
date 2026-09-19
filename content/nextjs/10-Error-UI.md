# Error UI

A special `error.tsx` file that automatically wraps a route segment in a React Error Boundary — catching rendering errors within that segment (and its children) and showing a recovery UI instead of crashing the whole app.

```tsx
// app/dashboard/error.tsx — MUST be a Client Component
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void; // attempts to re-render the segment that errored
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

**`error.tsx` must be a Client Component** — Error Boundaries rely on React class component lifecycle methods (`getDerivedStateFromError`/`componentDidCatch`) under the hood, which only work on the client.

**Nested error boundaries** — like `loading.tsx`, each segment can have its own `error.tsx`, so an error in a deeply nested route only breaks that segment, while parent layouts stay intact and usable:

```
app/dashboard/
├── layout.tsx           # stays rendered even if a child errors
├── error.tsx                # catches errors from page.tsx and anything below it
└── page.tsx
```

**Global errors — `global-error.tsx` catches errors in the ROOT layout itself** (which regular `error.tsx` files can't catch, since they're rendered inside the root layout):

```tsx
// app/global-error.tsx — replaces the ENTIRE page, including <html>/<body>
"use client";
export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Something went seriously wrong</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
```

**Interview note:** `error.tsx` doesn't catch errors from event handlers or code running outside of rendering (same limitation as regular React Error Boundaries, see the React section) — it only catches errors thrown DURING rendering of the segment it wraps, so manual `try/catch` is still needed for things like a button's `onClick` handler.
