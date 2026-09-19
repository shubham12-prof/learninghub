# App Router

The routing system introduced in Next.js 13, based in the `app/` directory, built around React Server Components, nested layouts, and colocated route-specific files (loading, error, metadata) — the current recommended approach for new Next.js projects.

```
app/
├── layout.tsx        # root layout — wraps EVERY page
├── page.tsx             # the home page ("/")
├── about/
│   └── page.tsx             # "/about"
├── blog/
│   ├── layout.tsx              # layout specific to all /blog/* routes
│   ├── page.tsx                    # "/blog"
│   └── [slug]/
│       └── page.tsx                  # "/blog/:slug" — dynamic route
```

**Special files the App Router recognizes automatically, in any route folder:**

| File            | Purpose                                                                           |
| --------------- | --------------------------------------------------------------------------------- |
| `page.tsx`      | makes a route segment publicly accessible (the actual UI)                         |
| `layout.tsx`    | shared UI wrapping this segment + its children, preserves state across navigation |
| `template.tsx`  | like layout, but re-mounts on every navigation (see Templates file)               |
| `loading.tsx`   | automatic loading UI (wraps the segment in a Suspense boundary)                   |
| `error.tsx`     | automatic error boundary UI for this segment                                      |
| `not-found.tsx` | UI shown when `notFound()` is called or a route doesn't match                     |
| `route.ts`      | defines an API endpoint for this segment (see API Routes file)                    |

```tsx
// app/page.tsx — Server Component by default, no "use client" needed
export default function HomePage() {
  return <h1>Welcome</h1>;
}
```

**Everything in `app/` is a Server Component by default** (see the Server Components file) — you explicitly opt into client-side interactivity with `"use client"` at the top of a file.

**Interview note:** the App Router's biggest conceptual shift from the older Pages Router is that routing is now built on **nested layouts + React Server Components**, meaning data fetching, loading states, and error boundaries can be colocated per-route-segment rather than centralized in one `_app.tsx`/`getInitialProps` pattern.
