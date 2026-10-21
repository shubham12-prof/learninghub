# 05 - API Routes (Route Handlers) and Data Fetching

> **Time to learn:** ~45 min | **Level:** Core concept | **Interview frequency:** High
> Verified with Next.js 16.4.2 by calling the real endpoints with `curl`.

## 1. What is an API route?

An **API route** is a server-side endpoint inside your Next.js app that returns **data (usually JSON)** instead of a page. In the App Router they're called **Route Handlers**: a file named **`route.ts`** that exports a function per HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`).

You write front-end and back-end in one project: handy for forms, webhooks, a small backend for your own UI, or a thin layer over a database or third-party API (hiding secret keys).

## 2. Analogy

The **order window** of a restaurant (`/api/...`). The dining room (pages) is for people; the window is for other programs: send a request in a known format and get data back.

## 3. Your first handler

```ts
// app/api/hello/route.ts      ->  GET /api/hello
export async function GET() {
  return Response.json({ hello: "world", at: new Date().toISOString() });
}
```

```bash
$ curl localhost:3000/api/hello
{"hello":"world","at":"2026-10-19T05:25:09.495Z"}
```

It uses the standard Web **`Request`** and **`Response`** objects (the same ones as `fetch`). `NextRequest` / `NextResponse` add conveniences (`nextUrl`, cookies helpers).

## 4. Query strings, JSON bodies, status codes

```ts
// app/api/courses/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { COURSES } from "@/lib/courses";
import type { Course, Level } from "@/lib/types";

// GET /api/courses?level=Beginner&q=react
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const level = searchParams.get("level"); // string | null
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  const result = COURSES.filter(
    (c) =>
      (level === null || c.level === level) &&
      c.title.toLowerCase().includes(q),
  );
  return NextResponse.json(result); // 200 by default
}

// POST /api/courses   with JSON body
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json(); // may throw on invalid JSON
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isNewCourse(body)) {
    return NextResponse.json({ error: "Invalid course" }, { status: 422 });
  }

  const created: Course = { id: Date.now(), ...body };
  return NextResponse.json(created, { status: 201 }); // 201 Created
}

type NewCourse = Omit<Course, "id">;

function isNewCourse(value: unknown): value is NewCourse {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.slug === "string" &&
    typeof v.title === "string" &&
    typeof v.hours === "number" &&
    typeof v.free === "boolean" &&
    (v.level === "Beginner" ||
      v.level === "Intermediate" ||
      v.level === "Advanced") &&
    typeof v.category === "string"
  );
}
```

Notice: the body is typed **`unknown`** and **validated** with a type guard, because the client can send anything. For bigger apps use **Zod** (`schema.safeParse(body)`).

### Status codes to know

| Code          | Meaning                     | Use                                    |
| ------------- | --------------------------- | -------------------------------------- |
| `200`         | OK                          | successful GET                         |
| `201`         | Created                     | successful POST that created something |
| `204`         | No Content                  | successful DELETE                      |
| `400`         | Bad Request                 | malformed JSON / bad syntax            |
| `401` / `403` | Unauthenticated / Forbidden | not logged in / not allowed            |
| `404`         | Not Found                   | resource doesn't exist                 |
| `422`         | Unprocessable Content       | JSON is valid but the data isn't       |
| `500`         | Server Error                | unexpected failure                     |

## 5. Dynamic route handlers

```ts
// app/api/courses/[slug]/route.ts     ->  GET /api/courses/react-fundamentals
import { NextResponse, type NextRequest } from "next/server";
import { COURSES } from "@/lib/courses";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ slug: string }> }, // params is a Promise here too
) {
  const { slug } = await ctx.params;
  const course = COURSES.find((c) => c.slug === slug);
  if (!course)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(course);
}
```

## 6. Headers, cookies and CORS

```ts
import { cookies } from "next/headers";

export async function GET() {
  const jar = await cookies(); // async in Next.js 15+
  const theme = jar.get("theme")?.value ?? "light";
  return Response.json({ theme }, { headers: { "Cache-Control": "no-store" } });
}
```

Requests from **other origins** need **CORS** headers (`Access-Control-Allow-Origin`) and an `OPTIONS` handler; requests from your own pages (same origin) don't.

## 7. Caching behaviour

In Next.js 15 and 16, a **`GET` Route Handler is not cached by default** (it ran on every request in my test: two calls gave two timestamps, and `next build` marks it `ƒ`). You can opt in to static output with `export const dynamic = "force-static"`.

## 8. Pages Router comparison (older projects)

```ts
// pages/api/hello.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ hello: string }>,
) {
  if (req.method !== "GET") return res.status(405).end();
  res.status(200).json({ hello: "world" });
}
```

|          | Pages Router `pages/api`                                | App Router `route.ts`                    |
| -------- | ------------------------------------------------------- | ---------------------------------------- |
| One file | one default `handler(req, res)`, you check `req.method` | one **named export per method**          |
| Objects  | Node-style `req`/`res`                                  | Web `Request`/`Response`                 |
| URL      | `pages/api/hello.ts` -> `/api/hello`                    | `app/api/hello/route.ts` -> `/api/hello` |

## 9. When to use a Route Handler (and when not)

| Use a Route Handler for                                                        | Don't                                                                                                                |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Public JSON API for other clients (mobile app, third parties)                  | Fetching data **for your own Server Components**: just call the function/DB directly (an extra HTTP hop for nothing) |
| Webhooks (Stripe, GitHub)                                                      | Mutations triggered by **your own forms/buttons**: prefer **Server Actions** (`"use server"`)                        |
| Client-side fetches from a Client Component (`useEffect`, SWR, TanStack Query) | Putting secrets in client code (route handlers are the right place to hold them)                                     |
| Proxying a third-party API to hide a key                                       |                                                                                                                      |

```tsx
// Good: Server Component calls the data layer directly
import { getCourses } from "@/lib/courses";
export default async function Page() {
  const courses = await getCourses(); /* ... */
}

// Avoid: server calling its own API over HTTP
// const res = await fetch("http://localhost:3000/api/courses");
```

## 10. Calling an API route from the client, typed

```ts
export async function fetchJson<T>(
  url: string,
  guard: (v: unknown) => v is T,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`); // fetch doesn't reject on 404/500 (Day 2)
  const data: unknown = await res.json();
  if (!guard(data)) throw new Error("Unexpected response shape");
  return data;
}
```

## 11. Common mistakes

1. Forgetting `await` on `request.json()` or on `ctx.params`.
2. Trusting the request body type (`as Course`) without validation.
3. Returning the wrong status code (200 for an error, 500 for bad input).
4. **Not handling invalid JSON**: `request.json()` throws.
5. Expecting `GET` handlers to be cached (they aren't by default in 15/16) or mixing up with static output.
6. Fetching your own `/api` from a Server Component.
7. Using `pages/api` style (`req`, `res`) inside `app/`.
8. Exporting unsupported names from `route.ts` (only HTTP methods and route config like `dynamic` are allowed).
9. Storing state in a module-level variable and expecting it to persist in production (serverless instances and restarts reset it). Use a database.
10. Both `app/x/page.tsx` and `app/x/route.ts` in the same folder (conflict).

## 12. Predict the output

Using the `app/api/courses/route.ts` and `[slug]/route.ts` above with 12 seed courses.

**Q1** What status code and body does `GET /api/courses/does-not-exist` return?

**Q2** `POST /api/courses` with the body `{not json`. What status?

**Q3** `POST /api/courses` with body `{"title": "X"}` (valid JSON). What status?

**Q4** `GET /api/courses?level=Beginner` returns which courses (by title)? How many?

**Q5** Is `GET /api/courses` served from a cache? How can you tell from `next build`?

## 13. Answers

- **Q1:** **404** with `{"error":"Not found"}`.
- **Q2:** **400** `{"error":"Invalid JSON"}`.
- **Q3:** **422** `{"error":"Invalid course"}` (valid JSON but missing fields).
- **Q4:** The courses whose `level` is `"Beginner"`; with the seed data from `06-coding-typed-component.md` that's **5** (HTML Foundations, CSS Layout with Flexbox and Grid, JavaScript Essentials, React Fundamentals, Git and GitHub Basics).
- **Q5:** **No.** The build output shows `ƒ /api/courses` (Dynamic: server-rendered on demand), and repeated calls return fresh results.

## Recap

- A Route Handler is `app/**/route.ts` exporting `GET`/`POST`/... using Web `Request`/`Response`.
- Read the URL with `request.nextUrl.searchParams`, the body with `await request.json()` (**validate it**), the dynamic part with `await ctx.params`.
- Return the right **status code** with `NextResponse.json(data, { status })`.
- `GET` handlers aren't cached by default in Next.js 15/16.
- For your own pages, call data functions directly; for your own mutations, use Server Actions; use Route Handlers for external clients, webhooks and client-side fetching.

## Checklist

- [ ] I can write GET and POST handlers with correct status codes
- [ ] I can explain why the request body is `unknown` and must be validated
- [ ] I can explain Route Handler vs Server Action vs direct data access
- [ ] I can compare `pages/api` and `route.ts`
- [ ] I got Q1 to Q5 right without looking
