# Introduction

Next.js is a React framework that adds production-grade features on top of React: routing, server-side rendering, static site generation, API routes, image/font optimization, and more — built by Vercel.

**Why use a framework instead of plain React?** Plain React (via Vite/CRA) only handles client-side rendering and component logic out of the box — you'd need to hand-assemble routing (React Router), a build pipeline, SSR support, code splitting, and SEO handling yourself. Next.js provides an opinionated, integrated solution for all of this.

**Key features Next.js adds on top of React:**

- **File-based routing** — folder/file structure in `app/` (or `pages/`) automatically defines routes, no manual router config.
- **Multiple rendering strategies** — Server-Side Rendering (SSR), Static Site Generation (SSG), Incremental Static Regeneration (ISR), and client-side rendering, chosen per-route/per-component.
- **Server Components & Server Actions** — run component logic and mutations directly on the server, reducing client JS bundle size.
- **Built-in optimizations** — automatic image optimization, font optimization, code splitting, and script loading strategies.
- **API Routes** — build backend endpoints in the same project, no separate server needed for simple APIs.
- **Middleware** — run logic (auth checks, redirects, A/B tests) before a request completes, at the edge.

```bash
npx create-next-app@latest my-app
cd my-app
npm run dev  # starts the dev server, typically at http://localhost:3000
```

**Two routing systems exist in Next.js:**

- **App Router** (`app/` directory) — the modern, recommended approach since Next.js 13, built on React Server Components.
- **Pages Router** (`pages/` directory) — the original, still-supported approach, simpler mental model but fewer capabilities (no Server Components/Server Actions).

**Interview note:** most modern Next.js interview questions assume the **App Router**, since it's the current recommended default for new projects — but it's worth knowing the Pages Router exists, since a lot of production code (and interview questions at some companies) still uses it.
