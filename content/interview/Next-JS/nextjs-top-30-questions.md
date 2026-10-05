# Top 30 Next.js Interview Questions (Easy Explanation)

Based on the **App Router** (the modern way, `app/` folder). Examples are written for Next.js 15/16.

Each question has:

- **Simple answer** – say this in the interview
- **Code** – small example
- **How the code works** – step-by-step in easy words

> **Version note:** Next.js 16 (released Oct 2025) made some changes: `params` / `searchParams` / `cookies()` / `headers()` must be used with `await`, `middleware.ts` is replaced by `proxy.ts`, and caching is now explicit with `"use cache"`. These are explained below. Always check the official docs for the version you use.

---

## Q1. What is Next.js? Why use it?

**Simple answer:** Next.js is a **framework built on top of React**. React only gives you UI; Next.js adds everything else you need for a real app:

- File-based **routing**
- **Server-side rendering (SSR)**, **static generation (SSG)**
- **Server Components**
- Built-in **API routes**, image/font optimization, SEO tools
- Fast bundler (Turbopack), easy deployment

**Why use it:** better SEO, faster first load, less setup.

---

## Q2. React vs Next.js?

| React                            | Next.js                        |
| -------------------------------- | ------------------------------ |
| UI **library**                   | Full **framework** using React |
| Client-side rendering by default | Server + client rendering      |
| You add React Router yourself    | Routing is built in (folders)  |
| You set up SEO, bundling, API    | Built in                       |

**Easy way to remember:** React = engine. Next.js = the whole car.

---

## Q3. App Router vs Pages Router?

| Pages Router (old)                     | App Router (new, recommended)           |
| -------------------------------------- | --------------------------------------- |
| `pages/` folder                        | `app/` folder                           |
| `getServerSideProps`, `getStaticProps` | Fetch directly in **Server Components** |
| All components are client components   | Components are **server by default**    |
| `_app.js`, `_document.js`              | `layout.js`                             |

Both can still exist, but new projects should use the **App Router**.

---

## Q4. How does routing work in Next.js?

**Simple answer:** **Folders = URLs.** A folder inside `app/` becomes a route when it has a `page.js` file.

```
app/
├── page.js              →  /
├── about/
│   └── page.js          →  /about
└── blog/
    ├── page.js          →  /blog
    └── [slug]/
        └── page.js      →  /blog/anything
```

```jsx
// app/about/page.js
export default function About() {
  return <h1>About Us</h1>;
}
```

**How the code works:**

1. Create `app/about/page.js`.
2. Export a component as `default`.
3. Visit `/about` → it shows. No router setup needed.

---

## Q5. What is `layout.js`?

**Simple answer:** A layout is **shared UI** (navbar, footer, sidebar) that wraps pages. It **does not re-render** when you move between pages inside it, so state is preserved.

```jsx
// app/layout.js  (root layout – required)
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav>My Navbar</nav>
        {children}
        <footer>My Footer</footer>
      </body>
    </html>
  );
}
```

**How the code works:**

1. The root layout must contain `<html>` and `<body>`.
2. `{children}` is where the current page (or nested layout) appears.
3. Navbar and footer stay on every page.

---

## Q6. What are `page.js`, `loading.js`, `error.js`, `not-found.js`?

These are **special files** Next.js understands:

| File           | Purpose                         |
| -------------- | ------------------------------- |
| `page.js`      | The page UI for that URL        |
| `layout.js`    | Shared wrapper UI               |
| `loading.js`   | Shown **while** the page loads  |
| `error.js`     | Shown when an **error** happens |
| `not-found.js` | Shown for **404**               |
| `route.js`     | API endpoint (no UI)            |

(More on these in Q14–Q17.)

---

## Q7. What are dynamic routes?

**Simple answer:** Use **square brackets** in the folder name for a changing part of the URL.

```jsx
// app/blog/[slug]/page.js
export default async function BlogPost({ params }) {
  const { slug } = await params;
  return <h1>Post: {slug}</h1>;
}
```

**How the code works:**

1. Folder `[slug]` matches `/blog/hello`, `/blog/react-tips`, etc.
2. Next.js passes the value in `params`.
3. In the latest versions `params` is a **Promise**, so use `await params`.
4. Visiting `/blog/hello` shows "Post: hello".

**Other patterns:** `[...slug]` (catch-all), `[[...slug]]` (optional catch-all).

**Query strings** (`/products?sort=price`) come from `searchParams` (also `await`-ed):

```jsx
export default async function Products({ searchParams }) {
  const { sort } = await searchParams;
  return <p>Sorted by: {sort}</p>;
}
```

---

## Q8. How do you navigate between pages? (`Link` and `useRouter`)

```jsx
// Link – for normal clickable navigation
import Link from "next/link";

export default function Nav() {
  return <Link href="/about">Go to About</Link>;
}
```

```jsx
// useRouter – for navigating from code (needs "use client")
"use client";
import { useRouter } from "next/navigation";

export default function LoginButton() {
  const router = useRouter();

  function handleLogin() {
    // ...login logic
    router.push("/dashboard");
  }

  return <button onClick={handleLogin}>Login</button>;
}
```

**How the code works:**

1. `Link` changes the page **without a full reload** and **prefetches** the page for speed.
2. `useRouter().push("/path")` navigates after something happens (like login).
3. Import `useRouter` from **`next/navigation`** (not `next/router`) in the App Router.

---

## Q9. Server Components vs Client Components? ⭐ (Very important)

**Simple answer:**

| Server Component (default)                  | Client Component                                      |
| ------------------------------------------- | ----------------------------------------------------- |
| Runs on the **server only**                 | Runs in the **browser** (also pre-rendered on server) |
| Can use `async/await`, DB, secrets directly | Can use `useState`, `useEffect`, event handlers       |
| **No JavaScript sent** to browser → faster  | JavaScript is sent to the browser                     |
| ❌ No hooks, no `onClick`                   | ✅ Hooks, `onClick`, browser APIs (`window`)          |

**Rule of thumb:** Keep components **server** by default. Use **client** only when you need interactivity.

---

## Q10. What is `"use client"`?

**Simple answer:** A line at the **very top** of a file that tells Next.js "this component runs in the browser, it needs state or events".

```jsx
// app/components/LikeButton.js
"use client";

import { useState } from "react";

export default function LikeButton() {
  const [likes, setLikes] = useState(0);
  return <button onClick={() => setLikes(likes + 1)}>👍 {likes}</button>;
}
```

```jsx
// app/page.js  (Server Component – no directive needed)
import LikeButton from "./components/LikeButton";

export default async function Page() {
  return (
    <div>
      <h1>My Post</h1>
      <LikeButton />
    </div>
  );
}
```

**How the code works:**

1. `LikeButton` needs `useState` and `onClick` → needs `"use client"`.
2. `Page` stays a Server Component and simply uses `LikeButton` inside.
3. Only `LikeButton` (the small interactive part) is sent as JavaScript.

**Tip:** Put `"use client"` as **low in the tree as possible** (small components), so most of the page stays on the server.

---

## Q11. How do you fetch data in Next.js?

**Simple answer:** In the App Router, make the Server Component `async` and `await` your data directly. No `useEffect`, no loading state needed.

```jsx
// app/users/page.js
export default async function UsersPage() {
  const res = await fetch("https://jsonplaceholder.typicode.com/users");
  const users = await res.json();

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

**How the code works:**

1. The component is `async`, so we can use `await`.
2. Data is fetched **on the server** before the HTML is sent.
3. The user receives ready HTML (good for SEO and speed).

**You can also** query a database directly (e.g. Prisma) inside a Server Component, as the code never reaches the browser.

---

## Q12. CSR vs SSR vs SSG vs ISR?

| Type                                      | When HTML is created                   | Good for                                  |
| ----------------------------------------- | -------------------------------------- | ----------------------------------------- |
| **CSR** (Client-Side Rendering)           | In the **browser** after JS loads      | Dashboards, private pages                 |
| **SSR** (Server-Side Rendering)           | On the server for **every request**    | Personalized / always-fresh data          |
| **SSG** (Static Site Generation)          | At **build time**                      | Blogs, docs, marketing pages              |
| **ISR** (Incremental Static Regeneration) | Static, but **refreshed** after a time | Product pages, news that change sometimes |

**Easy example:**

- SSG = printed newspaper (made once).
- SSR = a fresh cooked meal for each customer.
- ISR = printed newspaper that gets reprinted every hour.
- CSR = you get a recipe and cook it yourself.

---

## Q13. How does caching and revalidation work?

**Simple answer:** Caching saves results so pages load faster. Revalidation = refreshing old cached data.

```jsx
// Time-based: refresh data at most every 60 seconds
const res = await fetch("https://api.example.com/posts", {
  next: { revalidate: 60 },
});

// Always fresh (no cache)
const res2 = await fetch("https://api.example.com/posts", {
  cache: "no-store",
});
```

```js
// On-demand: refresh after something changes (e.g. in a Server Action)
import { revalidatePath } from "next/cache";
revalidatePath("/posts");
```

**How the code works:**

1. `revalidate: 60` → use the saved data, but refetch if it's older than 60 seconds.
2. `no-store` → fetch fresh data every time.
3. `revalidatePath("/posts")` → manually throw away old data for that page after an update.

**Important changes (newer versions):**

- Since Next.js 15, `fetch` requests are **not cached by default** — you opt in.
- Next.js 16 introduces **Cache Components** with the `"use cache"` directive for explicit caching (you enable it in `next.config`). Mention this in interviews to show you're up to date; check the docs for exact setup.

---

## Q14. What is `loading.js`? (Streaming)

**Simple answer:** A file that shows a **loading UI instantly** while the page's data is being fetched. Next.js uses React **Suspense** behind the scenes.

```jsx
// app/dashboard/loading.js
export default function Loading() {
  return <p>Loading dashboard...</p>;
}
```

**How the code works:**

1. Put `loading.js` next to `page.js`.
2. While `page.js` is waiting for data, users see "Loading dashboard..." instead of a blank screen.
3. When data is ready, the real page replaces it.

**Manual way (for part of a page):**

```jsx
import { Suspense } from "react";

export default function Page() {
  return (
    <>
      <h1>Dashboard</h1>
      <Suspense fallback={<p>Loading chart...</p>}>
        <Chart /> {/* slow async Server Component */}
      </Suspense>
    </>
  );
}
```

The heading shows immediately; the chart streams in when ready.

---

## Q15. What is `error.js`?

**Simple answer:** A file that **catches errors** in that route and shows a friendly message. It must be a Client Component.

```jsx
// app/dashboard/error.js
"use client";

export default function Error({ error, reset }) {
  return (
    <div>
      <p>Something went wrong!</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

**How the code works:**

1. If anything inside `/dashboard` crashes, this shows instead of the page.
2. `reset()` tries to render the page again.
3. It must have `"use client"` because it uses interactivity.

---

## Q16. How do you create a 404 page?

```jsx
// app/not-found.js  (global 404)
export default function NotFound() {
  return <h1>404 - Page not found</h1>;
}
```

```jsx
// Trigger it manually
import { notFound } from "next/navigation";

export default async function Post({ params }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound(); // shows the not-found page
  return <h1>{post.title}</h1>;
}
```

**How the code works:** If the post doesn't exist, calling `notFound()` stops rendering and shows `not-found.js`.

---

## Q17. What are Route Handlers (API routes)?

**Simple answer:** Backend API endpoints inside your Next.js app. Create a `route.js` file and export functions named after HTTP methods.

```js
// app/api/hello/route.js
export async function GET() {
  return Response.json({ message: "Hello from API" });
}

export async function POST(request) {
  const body = await request.json();
  return Response.json({ received: body }, { status: 201 });
}
```

**How the code works:**

1. File path `app/api/hello/route.js` → URL `/api/hello`.
2. `GET` runs for GET requests, `POST` for POST requests.
3. `request.json()` reads the data sent by the client.
4. `Response.json(...)` sends a JSON response.

_(In the old Pages Router, this was `pages/api/hello.js`.)_

---

## Q18. What are Server Actions?

**Simple answer:** Functions that run **on the server** but you can call them directly from a form or button — **no need to write an API route**.

```jsx
// app/actions.js
"use server";

import { revalidatePath } from "next/cache";

export async function addTodo(formData) {
  const title = formData.get("title");
  await db.todo.create({ data: { title } }); // save in database
  revalidatePath("/todos"); // refresh the list
}
```

```jsx
// app/todos/page.js
import { addTodo } from "../actions";

export default function TodosPage() {
  return (
    <form action={addTodo}>
      <input name="title" placeholder="New todo" />
      <button type="submit">Add</button>
    </form>
  );
}
```

**How the code works:**

1. `"use server"` marks functions that run only on the server.
2. `<form action={addTodo}>` – when the form is submitted, Next.js calls `addTodo` on the server and passes the form data.
3. `formData.get("title")` reads the input with `name="title"`.
4. The data is saved, then `revalidatePath` refreshes the page so the new todo appears.

**Security tip:** Always validate input and check the user is allowed (logged in) inside Server Actions — treat them like public API endpoints.

---

## Q19. What is Middleware (now `proxy.ts`)?

**Simple answer:** Code that runs **before a request finishes** — used for redirects, authentication checks, adding headers, etc.

- Next.js 15 and earlier: file named `middleware.ts`
- **Next.js 16: renamed to `proxy.ts`** (`middleware.ts` still works but is deprecated)

```ts
// proxy.ts (in project root, next to the app folder)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

**How the code works:**

1. Runs for every request that matches `/dashboard/...`.
2. Checks if a `token` cookie exists.
3. No token → redirect to `/login`.
4. Token exists → `NextResponse.next()` lets the request continue.

_(In older versions the function was named `middleware` and the file `middleware.ts`.)_

---

## Q20. What is the `next/image` component?

**Simple answer:** An optimized replacement for `<img>`. It automatically **resizes, compresses, converts to modern formats (WebP/AVIF), lazy-loads**, and prevents layout shift.

```jsx
import Image from "next/image";

export default function Hero() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero banner"
      width={800}
      height={400}
      priority
    />
  );
}
```

**How the code works:**

1. `src="/hero.jpg"` → image from the `public/` folder.
2. `width` and `height` reserve space so the page doesn't jump while loading.
3. `alt` is needed for accessibility.
4. `priority` loads it immediately (use for above-the-fold images, like the main banner).
5. Remote images need their domain allowed in `next.config` (`images.remotePatterns`).

---

## Q21. What is `next/font`?

**Simple answer:** Loads fonts (e.g. Google Fonts) **at build time**, hosts them with your app, and prevents layout shift — no extra network request to Google.

```jsx
// app/layout.js
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

**How the code works:** `Inter(...)` loads the font, `inter.className` gives a CSS class that applies it to the whole app.

---

## Q22. How do you handle SEO and metadata?

**Simple answer:** Export a `metadata` object (static) or `generateMetadata` function (dynamic) from a page or layout. Next.js adds the `<title>` and `<meta>` tags.

```jsx
// Static
export const metadata = {
  title: "My Blog",
  description: "Articles about web development",
};
```

```jsx
// Dynamic – based on the page's data
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  return {
    title: post.title,
    description: post.summary,
  };
}
```

**How the code works:**

1. Static: same title for the page always.
2. Dynamic: title changes for each blog post (great for Google search results).
3. Metadata only works in **Server Components**.

---

## Q23. How do environment variables work?

**Simple answer:** Put them in `.env.local`.

```bash
# .env.local
DATABASE_URL=postgres://...        # server only (secret)
NEXT_PUBLIC_API_URL=https://api.example.com   # visible in browser
```

```jsx
const db = process.env.DATABASE_URL; // only on server
const api = process.env.NEXT_PUBLIC_API_URL; // server + browser
```

**Rule:** Variables **without** `NEXT_PUBLIC_` stay on the server (safe for secrets). Variables **with** `NEXT_PUBLIC_` are included in browser code — never put secrets there.

---

## Q24. What are route groups and private folders?

**Simple answer:**

- **Route group** `(name)` – organizes folders **without** changing the URL.
- **Private folder** `_name` – folder is **ignored** by routing.

```
app/
├── (marketing)/
│   ├── about/page.js      →  /about       (not /marketing/about)
│   └── layout.js          (layout only for marketing pages)
├── (shop)/
│   └── cart/page.js       →  /cart
└── _components/           (not a route; just for files)
```

**Why useful:** Different layouts for different sections (e.g. marketing vs app) without extra URL parts.

---

## Q25. What are parallel and intercepting routes? (Bonus)

**Simple answer:** Advanced routing features.

- **Parallel routes** (`@slot` folders) – show **multiple pages at the same time** in one layout (e.g. dashboard with `@analytics` and `@team` panels).
- **Intercepting routes** `(.)photo` – show a route **inside the current page** (like a photo opening in a **modal**, while a refresh shows the full page).

**Interview tip:** You only need to explain the idea. Common example: Instagram-style photo modal.

---

## Q26. Static vs Dynamic rendering?

**Simple answer:** Next.js decides for each route:

- **Static:** page is built once (fast, cached).
- **Dynamic:** page is built for each request.

A route becomes **dynamic** when it uses request-specific things:

- `cookies()`, `headers()`
- `searchParams`
- `fetch` with `cache: "no-store"`

```jsx
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies(); // makes the page dynamic
  const theme = cookieStore.get("theme")?.value ?? "light";
  return <p>Your theme: {theme}</p>;
}
```

**How the code works:** Reading cookies depends on who is requesting → Next.js must render the page **per request**. In current versions, `cookies()` is **async**, so use `await`.

---

## Q27. What is `generateStaticParams`?

**Simple answer:** Tells Next.js which dynamic pages to **build in advance (SSG)**.

```jsx
// app/blog/[slug]/page.js
export async function generateStaticParams() {
  const posts = await fetch("https://api.example.com/posts").then((r) =>
    r.json(),
  );
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function Post({ params }) {
  const { slug } = await params;
  return <h1>{slug}</h1>;
}
```

**How the code works:**

1. At build time, Next.js calls `generateStaticParams`.
2. It gets a list like `[{slug: "a"}, {slug: "b"}]`.
3. It builds `/blog/a` and `/blog/b` as static HTML → super fast.

_(This replaces `getStaticPaths` from the Pages Router.)_

---

## Q28. What is hydration? What is a hydration error?

**Simple answer:** The server sends **HTML** (page appears fast). Then React in the browser **"hydrates"** it — attaches event listeners so buttons and inputs start working.

**Hydration error** = HTML from the server **doesn't match** what React renders in the browser.

**Common causes:**

- Using `window`, `localStorage`, `Math.random()`, or `new Date()` while rendering
- Invalid HTML nesting (e.g. `<div>` inside `<p>`)
- Browser extensions changing the HTML

```jsx
"use client";
import { useState, useEffect } from "react";

export default function Safe() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null; // render browser-only stuff after mount
  return <p>Width: {window.innerWidth}</p>;
}
```

**How the code works:** `useEffect` runs only in the browser. We show browser-only content **after** mounting, so server and first client render match.

---

## Q29. How do you do authentication in Next.js?

**Simple answer (common approach):**

1. User logs in → server verifies → sets a **secure, `httpOnly` cookie** (session/JWT).
2. `proxy.ts` (or middleware) **redirects** unauthenticated users away from private routes.
3. Server Components / Server Actions **check the session again** before returning data.
4. Use a library like **Auth.js (NextAuth)**, Clerk, or Better Auth instead of building from scratch.

```tsx
// app/dashboard/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = (await cookies()).get("session");
  if (!session) redirect("/login");
  return <h1>Welcome to your dashboard</h1>;
}
```

**How the code works:** The server reads the cookie; if there's no session it redirects to login. Because this runs on the server, users can't skip the check.

**Important:** Don't rely only on proxy/middleware for security — check authorization close to the data too.

---

## Q30. How do you optimize a Next.js app? (Performance + what's new)

**Checklist:**

- Use **Server Components** by default; keep `"use client"` components small
- Use `next/image` and `next/font`
- Use **caching** and **revalidation** wisely (SSG/ISR for static content)
- **Streaming** with `loading.js` / `Suspense`
- **Dynamic imports** for heavy client components:
  ```jsx
  import dynamic from "next/dynamic";
  const Chart = dynamic(() => import("./Chart"), { ssr: false });
  ```
- Use `<Link>` (prefetching)
- Analyze bundle size (`@next/bundle-analyzer`)
- Use a CDN / deploy on Vercel or similar
- Measure with Lighthouse and Core Web Vitals

**What's new in Next.js 16 (good to mention):**

- **Turbopack** is the default bundler (faster dev/build)
- **`proxy.ts`** replaces `middleware.ts`
- **Cache Components / `"use cache"`** for explicit caching
- **Async** `params`, `searchParams`, `cookies()`, `headers()` (always `await` them)
- Needs **Node.js 20.9+**

---

# Quick Revision (one line each)

| Topic                     | One line                                            |
| ------------------------- | --------------------------------------------------- |
| Next.js                   | React framework with routing, SSR/SSG, and more     |
| App Router                | `app/` folder; folders = routes, `page.js` = UI     |
| Server Component          | Default; runs on server; can `await` data; no hooks |
| Client Component          | `"use client"`; hooks and events                    |
| `layout.js`               | Shared UI that wraps pages                          |
| `loading.js` / `error.js` | Loading UI / error UI                               |
| Dynamic route             | `[slug]` folder; read with `await params`           |
| Route Handler             | `route.js` with `GET`, `POST`...                    |
| Server Action             | `"use server"` function called from a form          |
| `proxy.ts`                | Runs before requests (was `middleware.ts`)          |
| SSG / SSR / ISR           | Build time / every request / refreshed static       |
| `next/image`              | Optimized images                                    |
| Hydration                 | Making server HTML interactive in the browser       |

Good luck! 🚀
