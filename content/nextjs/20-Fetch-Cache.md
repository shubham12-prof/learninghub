# Fetch Cache

Next.js extends the native `fetch()` API with automatic caching — by default, `fetch` requests inside Server Components are cached and deduplicated, so the SAME request across your component tree only hits the network once.

```tsx
// Default behavior — cached indefinitely (like static data), until manually revalidated
const res = await fetch("https://api.example.com/data");

// Explicitly opt out of caching — always fetch fresh data (like traditional SSR)
const res = await fetch("https://api.example.com/data", { cache: "no-store" });

// Time-based revalidation — cache the response, but refresh after N seconds (ISR-style)
const res = await fetch("https://api.example.com/data", {
  next: { revalidate: 60 },
});
```

**Automatic request deduplication — multiple components fetching the SAME URL during one render pass only trigger ONE actual network request:**

```tsx
// Header.tsx
async function Header() {
  const user = await fetch("https://api.example.com/user").then((r) =>
    r.json(),
  );
  return <h1>Hi, {user.name}</h1>;
}

// Sidebar.tsx — fetches the SAME URL
async function Sidebar() {
  const user = await fetch("https://api.example.com/user").then((r) =>
    r.json(),
  );
  return <p>{user.email}</p>;
}
// Even though both components call fetch() independently, Next.js deduplicates
// identical requests made during the same render, so only ONE network call happens.
```

**Cache options summary:**

| Option                           | Behavior                                                              |
| -------------------------------- | --------------------------------------------------------------------- |
| `cache: "force-cache"` (default) | cached indefinitely, like static data                                 |
| `cache: "no-store"`              | never cached, fresh data every request (dynamic rendering)            |
| `next: { revalidate: N }`        | cached, but automatically revalidated after N seconds                 |
| `next: { tags: [...] }`          | cached, and can be manually invalidated on demand via `revalidateTag` |

**Interview note:** this extended `fetch` caching is what lets Next.js blend SSG/ISR/SSR behavior at the level of INDIVIDUAL fetch calls, rather than the older Pages Router model where an entire page had to pick ONE strategy (`getStaticProps` vs `getServerSideProps`) — different fetches on the same page can now have completely different caching behavior.
