# 01 - Next.js Routing (App Router)

> **Time to learn:** ~45 min | **Level:** Core concept | **Interview frequency:** Very high
> Verified with **Next.js 16.4.2**, React 19, TypeScript. (`npx create-next-app@latest` gives you the App Router, TypeScript, Tailwind and ESLint by default.)

## 1. What is Next.js?

**Next.js is a React framework** that adds what plain React (Vite) doesn't give you: **file-based routing, server rendering, data fetching on the server, API endpoints, image/font optimisation and a build/deploy pipeline**. React renders components; Next.js decides **where** (server or browser) and **when** (build time or request time) they render.

## 2. Analogy

Plain React is a kitchen: you can cook anything but you set up the restaurant yourself. Next.js is a restaurant franchise: **the folder structure is the menu** (every folder becomes a URL), the kitchen is on the server by default, and the building is already wired for delivery (deploying).

## 3. File-based routing

In the **App Router** (`app/` folder) **a folder is a route segment** and a special file inside it makes it public:

```
app/
  layout.tsx            -> root layout (wraps EVERY page, must contain <html> and <body>)
  page.tsx              -> URL  /
  about/
    page.tsx            -> URL  /about
  courses/
    page.tsx            -> URL  /courses
    loading.tsx         -> shown while /courses is loading (Suspense fallback)
    error.tsx           -> shown if /courses throws (must be a Client Component)
    [slug]/
      page.tsx          -> URL  /courses/react-fundamentals   (dynamic segment)
  api/
    courses/
      route.ts          -> URL  /api/courses   (an API endpoint, see 05-api-routes.md)
```

**A folder without `page.tsx` or `route.ts` is not a URL.** (You can put components next to pages safely: colocation.)

### Special files

| File | Purpose |
|---|---|
| `page.tsx` | the UI of a route (makes the URL public) |
| `layout.tsx` | UI shared by a segment and everything below it; **keeps state and doesn't re-render on navigation** |
| `template.tsx` | like a layout but **re-mounts** on every navigation |
| `loading.tsx` | instant loading UI (a Suspense boundary around the page) |
| `error.tsx` | error boundary for the segment (`"use client"`, gets `error` and `reset`) |
| `not-found.tsx` | UI for `notFound()` / unknown URLs |
| `route.ts` | an HTTP endpoint (GET, POST, ...) instead of UI |
| `proxy.ts` (root) | runs before a request is completed (redirects, rewrites, auth checks). **Next.js 16 renamed `middleware.ts` to `proxy.ts`** |

## 4. Layouts

```tsx
// app/layout.tsx  (root layout)
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>LearningHub</header>
        {children}
      </body>
    </html>
  );
}
```

Layouts **nest**: `app/courses/layout.tsx` wraps every page under `/courses` and is itself wrapped by the root layout. When you navigate between pages that share a layout, the layout **is not re-rendered** and keeps its state (a sidebar's scroll position, an open menu).

## 5. Dynamic routes

| Folder | Matches | `params` |
|---|---|---|
| `[slug]` | `/courses/react` | `{ slug: "react" }` |
| `[...slug]` (catch-all) | `/docs/a/b/c` | `{ slug: ["a", "b", "c"] }` |
| `[[...slug]]` (optional catch-all) | `/docs` **and** `/docs/a/b` | `{ slug: undefined }` or `{ slug: ["a","b"] }` |

### `params` is a Promise (Next.js 15+, required in 16)

```tsx
// app/courses/[slug]/page.tsx
import { notFound } from "next/navigation";
import { COURSES } from "@/lib/courses";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;                       // must await
  const course = COURSES.find((c) => c.slug === slug);
  if (!course) notFound();                             // renders not-found.tsx with a 404
  return <h1>{course.title}</h1>;
}
```

`searchParams` (`/courses?level=Beginner`) is also a **Promise** and is only available in **pages** (not layouts):

```tsx
export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; q?: string }>;
}) {
  const { level, q } = await searchParams;
  // ...
}
```

> Reading `searchParams` (or `cookies()` / `headers()`) makes the page **dynamic**: it is rendered on every request (see `03-rendering-strategies.md`).

## 6. Navigation

```tsx
import Link from "next/link";

<Link href="/courses">All courses</Link>
<Link href={`/courses/${course.slug}`}>{course.title}</Link>
```

`<Link>` does **client-side navigation** (no full page reload) and **prefetches** the linked page when the link is visible.

In a **Client Component** you can navigate imperatively and read the URL:

```tsx
"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function LevelFilter() {
  const router = useRouter();
  const pathname = usePathname();                 // "/courses"
  const searchParams = useSearchParams();         // URLSearchParams (read-only)

  function setLevel(level: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("level", level);
    router.push(`${pathname}?${params.toString()}`);
  }

  return <button onClick={() => setLevel("Beginner")}>Beginner</button>;
}
```

On the **server**, use `redirect("/login")` and `notFound()` from `next/navigation`.

| API | Where | Use |
|---|---|---|
| `<Link>` | anywhere | navigation links |
| `useRouter()`, `usePathname()`, `useSearchParams()` | Client Components | imperative navigation, read URL |
| `redirect(url)`, `notFound()` | Server (and handlers) | redirect / 404 |
| `await params`, `await searchParams` | page/layout/route | read dynamic route data |

## 7. Organising routes without changing URLs

| Convention | Example | Effect |
|---|---|---|
| **Route group** `(name)` | `app/(marketing)/about/page.tsx` | folder name **not** in the URL (`/about`); group routes under a shared layout |
| **Private folder** `_name` | `app/_components/Button.tsx` | opted out of routing |
| **Parallel routes** `@slot` | `app/@modal/...` | render several pages in one layout (advanced) |
| **Intercepting routes** `(.)photo` | modal that shows a route over the current page | advanced |

## 8. Metadata (SEO)

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Courses | LearningHub", description: "Browse all courses" };

// dynamic version
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${slug} | LearningHub` };
}
```

## 9. App Router vs Pages Router

You will meet both in real codebases.

| | **App Router** (`app/`, current) | **Pages Router** (`pages/`, older) |
|---|---|---|
| Component default | **Server Component** | Client (React on the server for SSR, then hydrated) |
| Routing file | `app/x/page.tsx` | `pages/x.tsx` |
| Data fetching | `async` components, `fetch`, direct DB calls | `getServerSideProps`, `getStaticProps`, `getStaticPaths` |
| Layouts | nested `layout.tsx` | `_app.tsx`, `_document.tsx` |
| API | `app/api/**/route.ts` | `pages/api/**.ts` (`req`, `res`) |
| Loading/error UI | `loading.tsx`, `error.tsx` | manual |

## 10. Common mistakes

1. Forgetting `page.tsx`: the folder isn't a URL (404).
2. **Not awaiting `params` / `searchParams`**: they are Promises (TypeScript catches it).
3. Putting `<html>`/`<body>` in anything but the root layout.
4. Using `<a href>` for internal links (full page reload) instead of `<Link>`.
5. Importing `useRouter` from `next/router` (Pages Router) instead of **`next/navigation`**.
6. Reading `searchParams` in a layout (not available; use a page or a Client Component `useSearchParams`).
7. Expecting `layout.tsx` to re-render (or re-fetch) on navigation.
8. Case/typo in special file names (`Page.tsx`, `loading.ts`).
9. Using `error.tsx` without `"use client"`.
10. Still creating `middleware.ts` in Next.js 16 projects (use `proxy.ts`).

## 11. Predict the output

**Q1** Which URL does each file create (if any)?
```
app/page.tsx
app/pricing/page.tsx
app/(marketing)/about/page.tsx
app/_components/Hero.tsx
app/courses/[slug]/page.tsx
app/courses/data.ts
```

**Q2** What is `params` for each request with `app/docs/[...slug]/page.tsx`?
`/docs/intro` and `/docs/api/hooks/use-state`. And what happens for `/docs`?

**Q3** Same request, but the folder is `app/docs/[[...slug]]/page.tsx`. What is `slug` for `/docs`?

**Q4** What does the user see for `/courses/zzz`?
```tsx
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = COURSES.find((c) => c.slug === slug);
  if (!course) notFound();
  return <h1>{course.title}</h1>;
}
```

**Q5** `layout.tsx` has `const [open, setOpen] = useState(false)` in a client wrapper (a menu). The user opens the menu and navigates from `/courses` to `/courses/react`. Is the menu still open? What if it was in `template.tsx`?

## 12. Answers

- **Q1:** `/` , `/pricing`, `/about` (group name dropped), **none** (`_components` is private), `/courses/<slug>`, **none** (`data.ts` isn't a page).
- **Q2:** `{ slug: ["intro"] }` and `{ slug: ["api","hooks","use-state"] }`. `/docs` returns a **404** (a required catch-all needs at least one segment).
- **Q3:** `slug` is **`undefined`** (the optional catch-all also matches `/docs`).
- **Q4:** The **404** page (`not-found.tsx` or Next's default) with a 404 HTTP status.
- **Q5:** In a **layout**: **yes, still open** (layouts persist and keep state across navigation). In a **template**: **no**, it re-mounts and state resets.

## Recap

- **Folder = URL segment; `page.tsx` makes it public**; `route.ts` makes it an endpoint.
- Special files: `layout`, `template`, `loading`, `error`, `not-found`, `proxy.ts` (was `middleware.ts`).
- Dynamic segments `[slug]`, `[...slug]`, `[[...slug]]`; **`params` and `searchParams` are Promises: `await` them**.
- `<Link>` for navigation, `next/navigation` hooks in Client Components, `redirect`/`notFound` on the server.
- Layouts persist across navigation; templates re-mount.

## Checklist

- [ ] I can map a folder tree to URLs
- [ ] I can write a dynamic page that awaits `params` and calls `notFound()`
- [ ] I can explain layout vs template and `loading.tsx` / `error.tsx`
- [ ] I can name 3 differences between the App Router and the Pages Router
- [ ] I got Q1 to Q5 right without looking
