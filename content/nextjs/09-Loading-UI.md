# Loading UI

A special `loading.tsx` file that Next.js automatically wraps around a route segment's content in a React `<Suspense>` boundary — shown instantly while the actual page (often an async Server Component) is still fetching data.

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <div className="spinner">Loading dashboard...</div>;
}
```

```tsx
// app/dashboard/page.tsx — this Server Component can be async and fetch data directly
export default async function DashboardPage() {
  const data = await getDashboardData(); // Next.js shows loading.tsx while this resolves
  return <div>{data.summary}</div>;
}
```

**What Next.js generates behind the scenes** (conceptually):

```tsx
<Suspense fallback={<Loading />}>
  <DashboardPage />
</Suspense>
```

**Instant navigation feel:** because `loading.tsx` shows immediately (it's already loaded, no network request needed), users get instant visual feedback on navigation instead of a blank screen or frozen UI while the next page's data streams in.

**Nested loading states** — each route segment can have its own `loading.tsx`, so a slow child segment shows its own loading indicator while parent layouts (already rendered) stay visible and interactive:

```
app/dashboard/
├── layout.tsx        # renders immediately (sidebar, header)
├── loading.tsx           # shown while dashboard/page.tsx's data is fetching
└── page.tsx
```

**Interview note:** `loading.tsx` is essentially syntactic sugar over wrapping the page in a `<Suspense>` boundary automatically — it works because Server Components can be `async` and "suspend" while awaiting data, letting React (and Next.js's routing) show the fallback until the actual content is ready to stream in.
