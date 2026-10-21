# 03 - Rendering Strategies: CSR, SSR, SSG, ISR (and Streaming)

> **Time to learn:** ~55 min | **Level:** Core concept | **Interview frequency:** Almost guaranteed
> Read `02-server-client-components.md` first. Verified with Next.js 16.4.2 (`next build` output and real HTTP requests).

## 1. The question every strategy answers

> **Where** is the HTML produced (browser or server) and **when** (at build time or on each request)?

## 2. Analogy

A bakery. **CSR**: you get flour and a recipe and bake at home. **SSR**: the baker bakes a fresh loaf when you order (always fresh, you wait). **SSG**: loaves baked at dawn and put on the shelf (instant, maybe slightly old). **ISR**: shelf loaves that are replaced by fresh ones every hour in the background.

## 3. The four strategies

|                       | **CSR** Client-Side Rendering                       | **SSR** Server-Side Rendering             | **SSG** Static Site Generation   | **ISR** Incremental Static Regeneration                    |
| --------------------- | --------------------------------------------------- | ----------------------------------------- | -------------------------------- | ---------------------------------------------------------- |
| HTML built            | in the **browser**                                  | on the server, **per request**            | on the server, **at build time** | at build, then **re-built in the background** after a time |
| First response        | near-empty HTML + JS bundle                         | full HTML                                 | full HTML (from a CDN)           | full HTML (from cache)                                     |
| Data freshness        | fresh (fetched after load)                          | **always fresh**                          | as old as the last build         | as old as the revalidate window                            |
| Time to first content | slow (JS download + fetch)                          | medium (server work per request)          | **fastest**                      | **fastest**                                                |
| SEO                   | weak (content appears after JS)                     | good                                      | good                             | good                                                       |
| Server load           | low                                                 | **high**                                  | none per request                 | low                                                        |
| Best for              | dashboards behind login, highly interactive widgets | personalised or frequently changing pages | blogs, docs, marketing pages     | product catalogues, news, course lists                     |

### Hydration

For SSR/SSG/ISR the server sends **HTML**, and then React in the browser **hydrates** it: it attaches event handlers to the existing HTML (no re-creation). Until hydration finishes the page looks ready but buttons don't respond yet.

## 4. How the App Router picks a strategy

You don't write `getServerSideProps` any more. **Next.js decides per route from what your code does:**

| Your route...                                                                                                                       | Result                                                                                               | Symbol in `next build`         |
| ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------ |
| uses no request-time data                                                                                                           | **Static** (SSG): rendered once at build                                                             | `○`                            |
| has `generateStaticParams` (dynamic segment)                                                                                        | **SSG** for those params                                                                             | `●`                            |
| has `export const revalidate = 60`                                                                                                  | **ISR**                                                                                              | `○` with a `Revalidate` column |
| reads `cookies()`, `headers()`, `searchParams`, or `export const dynamic = "force-dynamic"`, or `fetch(..., { cache: "no-store" })` | **Dynamic** (SSR): rendered on **every request**                                                     | `ƒ`                            |
| is a Client Component                                                                                                               | pre-rendered (static or dynamic by the route), then hydrated; data fetched in the browser is **CSR** | n/a                            |

Real output of `next build` for a small test app:

```
Route (app)        Revalidate  Expire
┌ ○ /
├ ○ /_not-found
├ ƒ /api/hello
├ ƒ /cookiepage
├ ƒ /dyn
├ ○ /isr                   5s      1y
├   /posts/[slug]
│ ├ ● /posts/a
│ └ ● /posts/b
└ ○ /static

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand
```

## 5. Each strategy in code

### 5.1 SSG: the default

```tsx
// app/static/page.tsx
export default function Page() {
  return <p>built at {new Date().toISOString()}</p>; // timestamp from the BUILD; never changes after
}
```

I requested this page three times against `next start`: the timestamp stayed the same.

### 5.2 SSG for dynamic routes: `generateStaticParams`

```tsx
// app/courses/[slug]/page.tsx
import { COURSES } from "@/lib/courses";

export function generateStaticParams() {
  return COURSES.map((c) => ({ slug: c.slug })); // one HTML file per course, built in advance
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <h1>{slug}</h1>;
}
```

A slug **not** in the list (`/courses/new-one`) is rendered **on first request and then cached** (default `dynamicParams = true`). Set `export const dynamicParams = false` to return 404 instead.

### 5.3 ISR: `revalidate`

```tsx
export const revalidate = 60; // seconds

export default async function Page() {
  /* ... */
}
```

How it behaved in my test (`revalidate = 5`): requests inside the window returned the **same** page; **the first request after the window still got the old page** (and triggered a background rebuild); the **next** request got the new page. That is **stale-while-revalidate**: nobody waits for the rebuild.

On demand: `revalidatePath("/courses")` or `revalidateTag("courses", "max")` from a Server Action or Route Handler after a change (Next.js 16: `revalidateTag` takes a second `cacheLife` profile argument).

### 5.4 SSR: opt in by using request data (or force it)

```tsx
import { headers } from "next/headers";

export default async function Page() {
  const h = await headers(); // request-time API -> the page becomes dynamic
  return (
    <p>
      {new Date().toISOString()} {h.get("user-agent")}
    </p>
  ); // different on every request
}

// or, explicitly
export const dynamic = "force-dynamic";
```

Two requests to `/dyn` returned two different timestamps.

### 5.5 CSR: fetch in the browser

```tsx
"use client";
import { useEffect, useState } from "react";

export function LiveCount() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/count")
      .then((r) => r.json())
      .then((d: { count: number }) => setCount(d.count));
  }, []);
  return <p>{count === null ? "Loading..." : count}</p>;
}
```

The server HTML contains "Loading...". The number appears **after** hydration and the fetch. Use CSR for private, highly interactive or frequently updating UI where SEO doesn't matter (dashboards, live widgets). Libraries such as TanStack Query or SWR help.

## 6. Data fetching rules (Next.js 16)

1. `fetch` in a Server Component is **not cached by default**; whether the page is built once or per request depends on the route. I tested three pages that fetch from a local server (build output and two requests each):

| `fetch` call                                           | Build symbol             | Result                                                      |
| ------------------------------------------------------ | ------------------------ | ----------------------------------------------------------- |
| `fetch(url)` (no options), no request data in the page | `○` Static               | data fetched **once at build**, same value on every request |
| `fetch(url, { cache: "no-store" })`                    | `ƒ` Dynamic              | fetched again on **every request**                          |
| `fetch(url, { next: { revalidate: 60 } })`             | `○` with `Revalidate 1m` | ISR: built once, refreshed after 60 s                       |

2. Opt in per request: `{ next: { revalidate: 60 } }` (ISR-style) or `{ cache: "force-cache" }`; opt out with `{ cache: "no-store" }`.
3. Identical `fetch` calls (same URL/options) inside **one render** are **de-duplicated** (request memoization), so several components can fetch the same data without duplicate requests.
4. Fetch **in parallel**, not in a waterfall:

```tsx
const [course, reviews] = await Promise.all([
  getCourse(slug),
  getReviews(slug),
]); // parallel
// vs: const course = await getCourse(slug); const reviews = await getReviews(slug);  // waterfall
```

5. Don't `fetch("/api/...")` your own Route Handler from a Server Component; call the **function** that gets the data directly (see `05-api-routes.md`).

## 7. Streaming and `loading.tsx`

For a dynamic route you don't have to wait for the slowest piece before showing anything. Wrap slow parts in `<Suspense>` (or add `loading.tsx`) and Next.js **streams** the HTML in chunks: the shell appears immediately, the slow section fills in when ready.

```tsx
import { Suspense } from "react";

export default function Page() {
  return (
    <>
      <h1>Dashboard</h1> {/* sent immediately */}
      <Suspense fallback={<p>Loading stats...</p>}>
        <SlowStats /> {/* async Server Component, streamed later */}
      </Suspense>
    </>
  );
}
```

## 8. Cache Components (opt-in in Next.js 16)

Next.js 16 introduces **Cache Components** (`cacheComponents: true` in `next.config.ts`): all code is dynamic by default, and you **opt in to caching** with the `"use cache"` directive on a page, component or function. It builds on **Partial Prerendering (PPR)**: a static shell served instantly with dynamic holes (in `<Suspense>`) streamed in. It replaces the old experimental `ppr` and `dynamicIO` flags. You can pick this up later; for the interview, know the **idea**: _static shell + streamed dynamic parts_.

## 9. How to choose

```
Same content for everyone and rarely changes?       -> SSG
Same for everyone but changes every few minutes?    -> ISR (revalidate) or on-demand revalidation
Depends on the user / cookies / must be live?       -> SSR (dynamic)
Private, highly interactive, SEO irrelevant?        -> CSR (Client Component + fetch)
A mix on one page?                                  -> static shell + <Suspense> streaming
```

## 10. Common mistakes

1. Thinking "Server Component" = SSR. A Server Component can be **static** (rendered at build).
2. Using `useEffect` + `fetch` for data that could be fetched on the server (slower, worse SEO).
3. Reading `cookies()`/`searchParams` in a page that should be static, silently making it **dynamic**.
4. Forgetting `generateStaticParams`, so dynamic pages are rendered on demand when you wanted them built ahead.
5. Expecting ISR to update **immediately** (the first visitor after the window sees the old page).
6. Sequential `await`s (waterfalls) instead of `Promise.all`.
7. Calling your own `/api` route from a Server Component.
8. Assuming dev (`next dev`) behaves like production. **Always check with `next build && next start`.**
9. Putting user-specific data in a statically generated or cached page (leaks between users).

## 11. Predict the output

**Q1** The page has no request-time APIs and prints `new Date().toISOString()`. You run `next build && next start`, refresh 3 times. What happens? Which symbol appears in the build output?

**Q2** Same page, but it calls `await headers()`. What happens when you refresh 3 times? Which symbol?

**Q3** `export const revalidate = 5;` The page was built at 10:00:00. A user visits at 10:00:02 and again at 10:00:08. What does each user see, and what does a third visit at 10:00:09 see?

**Q4** `generateStaticParams` returns `a` and `b`. A user visits `/posts/zzz`. What happens (default settings)? And with `dynamicParams = false`?

**Q5** Which strategy is each? (a) a marketing page (b) a user's account page using `cookies()` (c) a course catalogue refreshed every 10 minutes (d) a client-side live notification count.

## 12. Answers

- **Q1:** The **same** timestamp every time: rendered once at **build** (SSG). Symbol `○` (Static).
- **Q2:** A **different** timestamp each refresh: SSR on every request. Symbol `ƒ` (Dynamic).
- **Q3:** 10:00:02 sees the **build-time** page (inside the window). 10:00:08 is after the window, so the user **still sees the old page** while a background re-render starts. The visit at 10:00:09 sees the **new** page (stale-while-revalidate).
- **Q4:** The page is rendered **on demand** (200) and then cached for later visits. With `dynamicParams = false` it returns a **404**.
- **Q5:** (a) **SSG** (b) **SSR** (dynamic) (c) **ISR** (`revalidate = 600`) (d) **CSR**.

## Recap

- **CSR** = browser builds HTML; **SSR** = server per request; **SSG** = server at build; **ISR** = SSG that refreshes in the background.
- In the App Router, you don't pick a function: **static by default; using request data (`cookies`, `headers`, `searchParams`) or `force-dynamic` makes it dynamic**; `generateStaticParams` pre-builds dynamic routes; `revalidate` enables ISR.
- `next build` shows the result: `○` static, `●` SSG, `ƒ` dynamic.
- Stream slow parts with `<Suspense>` / `loading.tsx`. Fetch in parallel. Test with a production build.

## Checklist

- [ ] I can define CSR, SSR, SSG and ISR in one sentence each and give a use case
- [ ] I can say what turns a static page into a dynamic one
- [ ] I can explain stale-while-revalidate (ISR) with a timeline
- [ ] I can explain hydration and streaming
- [ ] I got Q1 to Q5 right without looking
