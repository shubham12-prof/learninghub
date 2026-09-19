# Data Fetching

In the App Router, Server Components can fetch data directly with `async`/`await` in the component body — no `useEffect`, no loading state boilerplate, no client-side waterfall by default.

```tsx
async function getUser(id: string) {
  const res = await fetch(`https://api.example.com/users/${id}`);
  return res.json();
}

export default async function UserPage({ params }: { params: { id: string } }) {
  const user = await getUser(params.id); // runs on the SERVER, before any HTML is sent
  return <h1>{user.name}</h1>;
}
```

**Parallel data fetching — avoid accidental request waterfalls:**

```tsx
// ❌ Sequential — the second fetch doesn't start until the first finishes
async function Page() {
  const user = await getUser();
  const posts = await getPosts(); // waits unnecessarily for `user` first
}

// ✅ Parallel — both requests start at the same time
async function Page() {
  const userPromise = getUser(); // not awaited yet — starts the request
  const postsPromise = getPosts(); // starts immediately too, in parallel
  const [user, posts] = await Promise.all([userPromise, postsPromise]);
}
```

**Fetching directly from a database (no API layer needed, since this runs on the server):**

```tsx
import { db } from "@/lib/db";

export default async function ProductsPage() {
  const products = await db.product.findMany(); // direct DB query, safe — never reaches the client
  return <ProductList products={products} />;
}
```

**Client-side data fetching still has its place** — for data that changes based on user interaction after the initial load (e.g., a live search), use a Client Component with `useEffect`/`fetch`, or a library like TanStack Query (see the React section).

**Interview note:** the biggest shift from traditional React data fetching is that Server Components eliminate the "fetch-on-mount" `useEffect` pattern entirely for initial page data — data is fetched during server rendering, so the HTML sent to the browser already contains the real content (better for SEO and perceived performance), rather than showing a loading spinner that later fills in.
