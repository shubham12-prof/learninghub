# Suspense

A component that lets you declaratively show a fallback UI while its children aren't ready yet (e.g. waiting for lazily-loaded code, or — with supporting libraries/frameworks — waiting for data).

```jsx
import { lazy, Suspense } from "react";

const ProfilePage = lazy(() => import("./ProfilePage"));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <ProfilePage />
    </Suspense>
  );
}
```

**Multiple Suspense boundaries let different parts of the UI load independently** rather than blocking the whole page on the slowest piece:

```jsx
function Dashboard() {
  return (
    <div>
      <Suspense fallback={<p>Loading nav...</p>}>
        <Nav />
      </Suspense>
      <Suspense fallback={<p>Loading widgets...</p>}>
        <Widgets />
      </Suspense>
    </div>
  );
}
```

**Data fetching with Suspense** is supported by frameworks/libraries built to integrate with it (e.g., Relay, Next.js App Router with async Server Components, or React Query's experimental `useSuspenseQuery`) — plain `fetch` inside `useEffect` does NOT integrate with Suspense automatically; the fetching mechanism must be built to "throw a promise" that Suspense catches.

**Interview note:** Suspense only handles the _loading_ state declaratively — it doesn't handle errors. Pair it with an **Error Boundary** (see its own file) around the Suspense boundary to handle failed loads gracefully.
