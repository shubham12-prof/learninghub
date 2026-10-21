# Day 5: Next.js and TypeScript

> **Goal of the day:** understand how Next.js (App Router) decides _where_ and _when_ things render, and write typed React/Next code that the compiler can check.
> **Time:** about 7 to 8 hours at a steady pace.
> **Versions used to verify everything:** Next.js 16.4.2, React 19.3, TypeScript 7.0.2, Node 22.

## Daily target: 1 typed feature + 5 answers

| Target              | Where                                 | Done when                                                                                                       |
| ------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **1 typed feature** | `06-coding-typed-component.md`        | a typed `CourseBoard` (grouping, filtering, sorting, saving) compiles with `strict: true` and its 16 tests pass |
| **5 answers**       | `07-interview-rendering-and-types.md` | you can answer SSR, SSG, CSR, type inference and API routes aloud, 30 to 60 seconds each                        |
| **Bonus: project**  | `08-project-typed-data-fetching.md`   | an untyped component converted to TS, plus a typed data-fetching feature with an API route                      |

## Files (one topic per file)

| #   | File                                  | Type                                                                       | Time    |
| --- | ------------------------------------- | -------------------------------------------------------------------------- | ------- |
| 01  | `01-routing.md`                       | Theory: App Router, layouts, dynamic routes, navigation                    | 45 min  |
| 02  | `02-server-client-components.md`      | Theory: Server vs Client Components, `"use client"` boundary               | 50 min  |
| 03  | `03-rendering-strategies.md`          | Theory: CSR, SSR, SSG, ISR, streaming                                      | 55 min  |
| 04  | `04-typescript-types.md`              | Theory: types, interfaces, unions, generics, inference, React + Next types | 70 min  |
| 05  | `05-api-routes.md`                    | Theory: Route Handlers (API routes), status codes, validation              | 45 min  |
| 06  | `06-coding-typed-component.md`        | Coding: typed component + array/object transformations                     | 90 min  |
| 07  | `07-interview-rendering-and-types.md` | Interview: SSR, SSG, CSR, inference, API routes                            | 60 min  |
| 08  | `08-project-typed-data-fetching.md`   | Project: add types + typed data fetching                                   | 100 min |

## Suggested study order

1. **Theory (about 4 h):** 01 -> 02 -> 03 (Next.js), then 04 (TypeScript), then 05 (API routes). Answer each **Predict the output** before reading the answers.
2. **Coding (90 min):** `06`. Create the project, then write each helper yourself before reading mine.
3. **Interview (60 min):** `07`. Say the 5 answers aloud without notes.
4. **Project (100 min):** `08`. Part A first (types), then Part B (data fetching), then Part C (debug).
5. **Last 15 min:** the cheat sheet below.

## Setup

```bash
npx create-next-app@latest learninghub --ts --app --eslint --no-tailwind --src-dir=false --import-alias "@/*"
cd learninghub
npm i -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm run dev          # http://localhost:3000
```

Always verify rendering behaviour with a **production** build: `npm run build && npm start`. (`next dev` behaves differently.)

Type-check anytime: `npx tsc --noEmit`. `next build` also type-checks and fails on errors.

## Cheat sheet

**Routing:** folder = URL, `page.tsx` makes it public, `layout.tsx` persists, `loading.tsx` / `error.tsx` / `not-found.tsx`, `route.ts` = endpoint, `proxy.ts` (was `middleware.ts`). Dynamic: `[slug]`, `[...slug]`, `[[...slug]]`. **`await params` and `await searchParams`.**

**Server vs Client:** Server Components by default (async, data, secrets, zero JS). `"use client"` only for state, effects, handlers, browser APIs. Pass Server Components into Client ones as `children`. Props across the boundary must be serializable.

**Rendering:** static by default (`○`), `generateStaticParams` (`●`), `revalidate = N` (ISR), request data (`cookies`, `headers`, `searchParams`) or `force-dynamic` (`ƒ`). Stream slow parts with `<Suspense>`. Fetch in parallel.

|            | CSR     | SSR                | SSG             | ISR                        |
| ---------- | ------- | ------------------ | --------------- | -------------------------- |
| HTML built | browser | server per request | server at build | build + background refresh |

**TypeScript:** `interface` for extendable object shapes, `type` for unions/tuples/utilities. Unions + discriminated unions + narrowing. Generics. `Partial` `Required` `Pick` `Omit` `Record` `ReturnType` `Awaited` `keyof` `typeof`. `const` keeps literals; `as const`; `satisfies`. Annotate parameters, public APIs and empty state (`useState<T[]>([])`). `unknown` over `any`. Types vanish at runtime: validate external data.

**API routes:** `route.ts` exports `GET`/`POST`/...; `request.nextUrl.searchParams`; `await request.json()` as `unknown` then validate; `NextResponse.json(data, { status })`: 200, 201, 400, 404, 422. `GET` isn't cached by default. Server Components call data functions directly; own mutations use Server Actions.

## Final checklist for the day

- [ ] I can map a folder tree to URLs and explain layouts vs templates
- [ ] I can explain Server vs Client Components and the `"use client"` boundary
- [ ] I can define CSR, SSR, SSG, ISR and say what triggers each in the App Router
- [ ] I can model loading/error/success with a discriminated union
- [ ] I can write a typed route handler with correct status codes
- [ ] `npx tsc --noEmit` and my tests pass on the Day 5 project
