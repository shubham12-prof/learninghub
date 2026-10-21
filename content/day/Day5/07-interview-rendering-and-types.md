# 07 - Interview: SSR, SSG, CSR, Type Inference and API Routes

> **Time to learn:** ~60 min | **Interview frequency:** Almost guaranteed for Next.js + TypeScript roles
> Read `03-rendering-strategies.md`, `04-typescript-types.md` and `05-api-routes.md` first.
> **Target:** 5 answers (SSR, SSG, CSR, type inference, API routes), each in about 30 to 60 seconds, out loud.

## 1. The 5 answers (say them out loud)

### Answer 1: What is SSR?

> "**Server-Side Rendering** means the HTML for a page is generated **on the server for every request**. The browser gets a complete page with the data already in it, so the first paint is fast and it's good for SEO, and then React **hydrates** it so it becomes interactive. The page is always fresh and can depend on the user (cookies, headers), but every request costs server time, so it's slower than serving a pre-built file and needs a server. In the Next.js App Router I get it when a route uses request-time data like `cookies()`, `headers()` or `searchParams`, or when I set `dynamic = 'force-dynamic'`. In `next build` that route shows as `ƒ` Dynamic."

**Follow-ups:** _What is hydration?_ Attaching event handlers to server-rendered HTML. _Downside?_ Server load and slower TTFB than static. _How do you speed up SSR?_ Stream with `<Suspense>`, cache data, fetch in parallel, use a CDN for static parts.

### Answer 2: What is SSG?

> "**Static Site Generation** means the HTML is generated **once at build time** and served as a static file, usually from a CDN. It's the fastest and cheapest option and great for SEO, but the content is **as old as the last build**, so it suits content that is the same for everyone and rarely changes: blogs, docs, marketing pages. In the App Router it's the default: a route that uses no request-time data is static (`○` in the build output). For dynamic URLs like `/courses/[slug]` I add `generateStaticParams` to pre-build each page (`●`). To keep static pages fresh I use **ISR**: `export const revalidate = 60` or on-demand `revalidatePath`, which re-generates in the background with stale-while-revalidate."

**Follow-ups:** _What happens for a slug not returned by `generateStaticParams`?_ Rendered on demand and cached (or 404 with `dynamicParams = false`). _How does ISR work?_ Serve the cached page; after the window, the next request still gets the old page and triggers a rebuild; later requests get the new one. _Can SSG pages have dynamic parts?_ Yes: client-side fetching, or a static shell with streamed dynamic parts (Cache Components/PPR).

### Answer 3: What is CSR?

> "**Client-Side Rendering** means the server sends a nearly empty HTML shell and a JavaScript bundle, and the **browser** builds the UI and fetches the data after load, for example with `useEffect` + `fetch`, SWR or TanStack Query. It makes navigation within an app feel instant and keeps server load low, and it's fine for private, highly interactive pages like dashboards where SEO doesn't matter. The cost is a **slower first meaningful paint** (download, run JS, then fetch, so a loading spinner), weaker SEO, and more JavaScript for the user's device. In Next.js, a Client Component (`'use client'`) is still pre-rendered on the server for the first HTML, but any data it fetches in the browser is CSR."

**Follow-ups:** _When would you choose CSR over SSR?_ Private, personalised, constantly changing, interaction-heavy UI. _What problem does CSR have with SEO?_ Crawlers may see only the shell. _What's a waterfall?_ Request B starts only after A finishes (JS, then data, then child data); avoid by fetching in parallel or on the server.

### Answer 4: What is type inference?

> "**Type inference** is TypeScript working out types **from the values and context** so I don't have to write them. `const n = 5` is the literal type `5`, `let n = 5` widens to `number`, `[1, 2]` is `number[]`, and a function's **return type** is inferred from its `return` statements. It also works from context: in `items.map((x) => x.length)`, `x` is inferred from the array's element type, and generics infer from arguments: `first(['a'])` gives `string | undefined`. So I **annotate function parameters, exported APIs and empty initial values** (like `useState<Course[]>([])`, otherwise it's `never[]`) and **let it infer everything else**, which keeps code short while staying type-safe. Inference has limits: it can't know what comes from outside at runtime, so I validate API data, and I use `as const` or `satisfies` when I want literal types preserved."

**Follow-ups:** _`const` vs `let`?_ `const` keeps the literal (`"x"`), `let` widens (`string`). _When would you annotate a return type?_ Public functions, recursive ones, or when you want the compiler to check the body against the intended contract. _What does `satisfies` do?_ Checks a value against a type without widening it to that type. _Why `unknown` over `any`?_ `unknown` forces you to narrow before use; `any` disables checking.

### Answer 5: What are API routes?

> "An **API route** is a server-side endpoint inside the Next.js app that returns data, usually JSON. In the App Router it's a **Route Handler**: a `route.ts` file under `app/api/...` that exports a function per HTTP method (`GET`, `POST`, ...) using the standard Web `Request`/`Response`. I read the query with `request.nextUrl.searchParams`, the body with `await request.json()` (typed as `unknown` and **validated**, because the client can send anything), the dynamic part with `await ctx.params`, and I return `NextResponse.json(data, { status })` with the right code: 201 created, 400 bad JSON, 404 not found, 422 invalid data. `GET` handlers aren't cached by default. I use them for public APIs, webhooks and client-side fetches or for hiding third-party keys; for my own Server Components I call the data function **directly**, and for my own form mutations I prefer **Server Actions**. The older Pages Router has `pages/api/*.ts` with one default `(req, res)` handler."

**Follow-ups:** _Route Handler vs Server Action?_ Handler = HTTP endpoint for any client; Action = function the framework wires to your own forms/buttons. _How do you secure it?_ Authenticate (cookies/sessions/tokens), authorise, validate input, rate-limit, never trust the body. _Where can it run?_ Node.js runtime by default (Edge optionally). _Why not call `fetch('/api/x')` from a Server Component?_ An unnecessary network hop; import the function instead.

## 2. Comparison table (memorise this)

|                            | CSR                                     | SSR                                                          | SSG                                                             | ISR                                     |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------- | --------------------------------------- |
| HTML generated             | in the browser                          | server, per request                                          | server, at build                                                | build, then refreshed in the background |
| Fresh data                 | yes (after load)                        | **always**                                                   | no (as of last build)                                           | within the revalidate window            |
| First load speed           | slowest                                 | medium                                                       | **fastest**                                                     | **fastest**                             |
| SEO                        | weak                                    | good                                                         | good                                                            | good                                    |
| Needs a server per request | no                                      | **yes**                                                      | no                                                              | rarely                                  |
| Next.js App Router trigger | Client Component + fetch in the browser | `cookies()` / `headers()` / `searchParams` / `force-dynamic` | default for routes with no request data; `generateStaticParams` | `export const revalidate = N`           |
| Build output symbol        | n/a                                     | `ƒ`                                                          | `○` / `●`                                                       | `○` + Revalidate column                 |

## 3. Quick-fire questions

| Question                                | Short answer                                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Are Server Components the same as SSR?  | No. Server Components can be rendered at build time (static) or per request; SSR is _when_ HTML is produced. |
| What does "hydration" mean?             | React attaches event handlers to server-rendered HTML in the browser.                                        |
| What is streaming?                      | Sending HTML in chunks so the shell appears before slow parts finish (`<Suspense>`, `loading.tsx`).          |
| `getServerSideProps` in the App Router? | Gone: async Server Components + dynamic APIs. It still exists in the Pages Router.                           |
| Where does `useEffect` run?             | Only in the browser, after hydration.                                                                        |
| Do types exist at runtime?              | No, they're erased. Validate external data.                                                                  |
| `interface` vs `type`?                  | Interfaces merge and extend; types can be unions/tuples/mapped. Both describe object shapes.                 |
| What do you put in `NEXT_PUBLIC_`?      | Only values safe to expose to the browser.                                                                   |

## 4. Predict the output (type inference)

Each type below was checked with the compiler (TypeScript 7.0.2, `strict`).

**Q1** What is the type of `x`?

```ts
const x = [1, "a", true];
```

**Q2** What is the return type of `f`?

```ts
function f(n: number) {
  return n > 0 ? "pos" : 0;
}
```

**Q3** What is the type of `o`, and is `o.a = 2` allowed?

```ts
const o = { a: 1 } as const;
```

**Q4** What is the type of `arr` at the end?

```ts
const arr = [];
arr.push(1);
```

**Q5** What is `Courses`?

```ts
import { COURSES } from "@/lib/courses"; // readonly Course[]
async function getCourses() {
  return COURSES;
}
type Courses = Awaited<ReturnType<typeof getCourses>>;
```

## 5. Answers

- **Q1:** `(string | number | boolean)[]`.
- **Q2:** `"pos" | 0` (a union of the two literal types).
- **Q3:** `{ readonly a: 1 }`. **No**, `o.a = 2` is an error: `a` is `readonly` and its type is the literal `1`.
- **Q4:** `number[]`. With `noImplicitAny` an empty array literal starts as an "evolving" array type, and TypeScript infers the element type from what you push.
- **Q5:** `readonly Course[]` (`Awaited` unwraps the Promise that the `async` function returns).

## Recap

- **SSR** = HTML per request (fresh, costs server time) - **SSG** = HTML at build (fastest, can be stale) - **ISR** = SSG that refreshes in the background - **CSR** = HTML built in the browser (interactive, weaker SEO).
- Next.js App Router: static by default; request data or `force-dynamic` => dynamic; `generateStaticParams` => SSG for dynamic routes; `revalidate` => ISR.
- **Inference**: `const` keeps literals, `let` widens; return types, generics and callbacks are inferred. Annotate parameters, public APIs and empty initial values.
- **API routes** = `route.ts` exporting `GET`/`POST`...; validate input, return correct status codes, call data functions directly from Server Components.

## Checklist

- [ ] I can say each of the 5 answers in under a minute without notes
- [ ] I can fill in the comparison table from memory
- [ ] I can explain hydration, streaming and stale-while-revalidate
- [ ] I can explain when to annotate and when to let TypeScript infer
- [ ] I got Q1 to Q5 right without looking
