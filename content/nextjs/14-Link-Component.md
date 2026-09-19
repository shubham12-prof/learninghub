# Link Component

`next/link` provides client-side navigation between routes — renders an actual `<a>` tag (good for SEO/accessibility) but intercepts clicks to avoid a full page reload, and automatically prefetches linked pages for instant navigation.

```tsx
import Link from "next/link";

export default function Nav() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
    </nav>
  );
}
```

**Automatic prefetching:** in production, `<Link>` automatically prefetches the linked page's code (and, for static routes, its data) when it scrolls into the viewport — so by the time a user actually clicks, the navigation feels instant.

```tsx
<Link href="/dashboard" prefetch={false}>
  Dashboard
</Link> // opt out of prefetching if needed
```

**Passing query parameters or dynamic hrefs with an object:**

```tsx
<Link href={{ pathname: "/search", query: { q: "shoes" } }}>Search shoes</Link>
// navigates to "/search?q=shoes"
```

**Replacing history instead of pushing (like `replaceState` vs `pushState`):**

```tsx
<Link href="/login" replace>
  Login
</Link> // doesn't add a new browser history entry
```

**Why not just use a plain `<a>` tag?** A plain anchor triggers a full page reload — re-downloading the entire app, losing all client-side state, and re-running the whole render process. `<Link>` avoids this by fetching only what's needed and updating the DOM via client-side routing, keeping layouts/state intact.

**Interview note:** `next/link`'s automatic viewport-based prefetching (and its interaction with the App Router's caching) is often what makes Next.js apps FEEL faster than plain SPA routing — pages are frequently already loaded by the time a user clicks, rather than starting the fetch only after the click.
