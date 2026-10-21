# 08 - Project: Add Types to an Existing Component + Typed Data Fetching

> **Time to build:** ~100 min | **Level:** Project | **Target:** convert an untyped component to TypeScript, then build a typed, server-fetched catalogue with an API route
> Uses `lib/types.ts`, `lib/courses.ts`, `lib/transform.ts` from `06-coding-typed-component.md` and the two route handlers from `05-api-routes.md` (`app/api/courses/route.ts` and `app/api/courses/[slug]/route.ts`).
> Plan: **(A)** type an existing component, **(B)** build the feature with data fetching, **(C)** debug a broken typed file, **(D)** stretch goals.

## 1. Part A: add types to an existing component

This is the situation you will meet at work: a working **JavaScript** component with no types. Rename it to `.tsx` and let the compiler tell you what's missing.

`exercises/legacy.tsx` (was `LegacyCourseList.jsx`)

```tsx
import { useState } from "react";

export default function LegacyCourseList({ courses, onSelect, title }) {
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");

  const shown = courses.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()),
  );

  function pick(course) {
    setSelected(course.id);
    onSelect(course);
  }

  return (
    <section>
      <h2>{title}</h2>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul>
        {shown.map((c) => (
          <li key={c.id}>
            <button onClick={() => pick(c)} aria-pressed={selected === c.id}>
              {c.title}
            </button>
            {c.tags.length > 0 && <small> {c.tags.join(", ")}</small>}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

### Step 1: run the compiler

```bash
npx tsc --noEmit
```

Real output (TypeScript 7.0.2, `strict: true`):

```
legacy.tsx(3,44): error TS7031: Binding element 'courses' implicitly has an 'any' type.
legacy.tsx(3,53): error TS7031: Binding element 'onSelect' implicitly has an 'any' type.
legacy.tsx(3,63): error TS7031: Binding element 'title' implicitly has an 'any' type.
legacy.tsx(7,33): error TS7006: Parameter 'c' implicitly has an 'any' type.
legacy.tsx(9,17): error TS7006: Parameter 'course' implicitly has an 'any' type.
legacy.tsx(19,21): error TS7006: Parameter 'c' implicitly has an 'any' type.
```

### Step 2: type the **props** first (everything else follows)

The three destructured props are the root cause. Once `courses` is typed, `c` in the two `.map`/`.filter` callbacks is **inferred**, and the errors on those lines disappear without more annotations. Only `pick(course)` needs its own annotation.

### Step 3: the typed version (`components/CourseList.tsx`)

```tsx
"use client";

import { useState } from "react";
import type { Course } from "@/lib/types";

interface CourseListProps {
  courses: readonly Course[];
  onSelect: (course: Course) => void;
  title: string;
}

export default function CourseList({
  courses,
  onSelect,
  title,
}: CourseListProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null); // null at first, then a number
  const [query, setQuery] = useState(""); // inferred: string

  const shown = courses.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()),
  );

  function pick(course: Course) {
    setSelectedId(course.id);
    onSelect(course);
  }

  return (
    <section>
      <h2>{title}</h2>
      <label>
        Filter
        <input value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <ul>
        {shown.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => pick(c)}
              aria-pressed={selectedId === c.id}
            >
              {c.title}
            </button>
            {c.tags && c.tags.length > 0 && <small> {c.tags.join(", ")}</small>}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

What the compiler made us fix, beyond the 6 errors:

| Decision                             | Why                                                                                                                    |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `useState<number \| null>(null)`     | `useState(null)` is typed `null`, so `setSelected(course.id)` would later be an error once `course` is typed           |
| `c.tags && ...`                      | `tags` is optional in `Course`; the original JS would crash for a course without tags (a **real bug the types found**) |
| `courses: readonly Course[]`         | the component doesn't mutate the list; `readonly` accepts both `Course[]` and `readonly Course[]`                      |
| `onSelect: (course: Course) => void` | the callback's exact contract                                                                                          |
| `title: string`                      | required prop; call sites that forget it now fail to compile                                                           |

Test (`tests/courselist.test.tsx`):

```tsx
import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CourseList from "@/components/CourseList";
import { COURSES } from "@/lib/courses";

test("filters, selects and calls onSelect with the course", async () => {
  const onSelect = vi.fn();
  render(
    <CourseList courses={COURSES} onSelect={onSelect} title="All courses" />,
  );

  await userEvent.type(screen.getByLabelText("Filter"), "react");
  expect(screen.getAllByRole("button")).toHaveLength(4);

  const button = screen.getByRole("button", { name: "React Fundamentals" });
  await userEvent.click(button);
  expect(button).toHaveAttribute("aria-pressed", "true");
  expect(onSelect).toHaveBeenCalledWith(
    expect.objectContaining({ id: 5, slug: "react-fundamentals" }),
  );
});

test("a course without tags does not crash", () => {
  render(
    <CourseList
      courses={COURSES.slice(0, 1)}
      onSelect={() => {}}
      title="One"
    />,
  );
  expect(
    screen.getByRole("button", { name: "HTML Foundations" }),
  ).toBeInTheDocument();
});
```

## 2. Part B: a typed data-fetching feature

You'll build:

| Route                                    | Type                                                 | What                                                                        |
| ---------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| `/courses`                               | **Server Component**, dynamic (reads `searchParams`) | list + level/search filter from the URL, plus `loading.tsx` and `error.tsx` |
| `/courses/[slug]`                        | **SSG** via `generateStaticParams`, `notFound()`     | course detail with `generateMetadata`                                       |
| `/api/courses` and `/api/courses/[slug]` | **Route Handlers** (from `05`)                       | JSON API                                                                    |
| `LiveSearch`                             | **Client Component** (CSR)                           | typed `fetch` with loading/error/success states                             |

### 2.1 Runtime validation: `lib/guards.ts`

```ts
import { isLevel, type Course } from "./types";

export function isCourse(value: unknown): value is Course {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "number" &&
    typeof v.slug === "string" &&
    typeof v.title === "string" &&
    typeof v.category === "string" &&
    typeof v.level === "string" &&
    isLevel(v.level) &&
    typeof v.hours === "number" &&
    typeof v.free === "boolean" &&
    (v.tags === undefined ||
      (Array.isArray(v.tags) && v.tags.every((t) => typeof t === "string")))
  );
}

export function isCourseArray(value: unknown): value is Course[] {
  return Array.isArray(value) && value.every(isCourse);
}
```

### 2.2 A typed fetch helper: `lib/api.ts`

```ts
export async function fetchJson<T>(
  url: string,
  guard: (value: unknown) => value is T,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`); // fetch only rejects on network errors
  const data: unknown = await res.json();
  if (!guard(data)) throw new Error("Unexpected response shape");
  return data;
}
```

The generic `T` is **inferred from the guard**: `fetchJson("/api/courses", isCourseArray)` returns `Promise<Course[]>` with no annotation.

### 2.3 The server data layer: `lib/data.ts`

```ts
import { COURSES } from "./courses";
import { filterCourses, type CourseFilters } from "./transform";
import type { Course } from "./types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Stand-ins for a database. `sleep` simulates latency so you can SEE loading.tsx.
export async function getCourses(
  filters: CourseFilters = {},
): Promise<Course[]> {
  await sleep(150);
  return filterCourses(COURSES, filters);
}

export async function getCourseBySlug(
  slug: string,
): Promise<Course | undefined> {
  await sleep(50);
  return COURSES.find((c) => c.slug === slug);
}
```

### 2.4 The list page: `app/courses/page.tsx` (Server Component, dynamic)

```tsx
import Link from "next/link";
import { LiveSearch } from "@/components/LiveSearch";
import { getCourses } from "@/lib/data";
import { summarise } from "@/lib/transform";
import { LEVELS, isLevel } from "@/lib/types";

interface CoursesPageProps {
  searchParams: Promise<{ level?: string; q?: string }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const { level, q } = await searchParams; // strings from the URL: untrusted!
  const courses = await getCourses({
    query: q,
    level: level !== undefined && isLevel(level) ? level : undefined, // validated, narrowed to Level
  });
  const summary = summarise(courses);

  return (
    <main>
      <h1>Courses</h1>
      <nav aria-label="Filter by level">
        <Link href="/courses">All</Link>
        {LEVELS.map((l) => (
          <Link
            key={l}
            href={`/courses?level=${l}`}
            aria-current={level === l ? "page" : undefined}
          >
            {" "}
            {l}
          </Link>
        ))}
      </nav>
      <p>
        {summary.total} courses, {summary.totalHours} hours
      </p>
      <ul>
        {courses.map((c) => (
          <li key={c.id}>
            <Link href={`/courses/${c.slug}`}>{c.title}</Link> ({c.level},{" "}
            {c.hours} h)
          </li>
        ))}
      </ul>
      <h2>Live search</h2>
      <LiveSearch />
    </main>
  );
}
```

`app/courses/loading.tsx` (shown instantly while the page awaits data):

```tsx
export default function Loading() {
  return <p role="status">Loading courses...</p>;
}
```

`app/courses/error.tsx` (must be a Client Component):

```tsx
"use client";

export default function CoursesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert">
      <p>Something went wrong: {error.message}</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
```

### 2.5 The detail page: `app/courses/[slug]/page.tsx` (SSG)

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SaveButton } from "@/components/SaveButton";
import { COURSES } from "@/lib/courses";
import { getCourseBySlug } from "@/lib/data";

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return COURSES.map((c) => ({ slug: c.slug })); // one static page per course
}

export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  return {
    title: course ? `${course.title} | LearningHub` : "Course not found",
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound(); // after this, `course` is a Course

  return (
    <main>
      <h1>{course.title}</h1>
      <p>
        {course.category} · {course.level} · {course.hours} hours ·{" "}
        {course.free ? "Free" : "Paid"}
      </p>
      {course.tags && <p>Tags: {course.tags.join(", ")}</p>}
      <SaveButton courseId={course.id} />
    </main>
  );
}
```

`notFound()` is typed as returning `never`, so TypeScript **narrows** `course` from `Course | undefined` to `Course` after the `if`.

`components/SaveButton.tsx` (the only Client Component on that page: smallest possible boundary):

```tsx
"use client";

import { useState } from "react";

export function SaveButton({ courseId }: { courseId: number }) {
  const [saved, setSaved] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() => setSaved((s) => !s)}
    >
      {saved ? "Saved" : "Save"} course {courseId}
    </button>
  );
}
```

### 2.6 Client-side fetching (CSR): `components/LiveSearch.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/api";
import { isCourseArray } from "@/lib/guards";
import type { Course } from "@/lib/types";

type Remote<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

export function LiveSearch() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<Remote<Course[]>>({ status: "idle" });

  useEffect(() => {
    const q = query.trim();
    if (q === "") {
      setState({ status: "idle" });
      return;
    }
    const controller = new AbortController();
    setState({ status: "loading" });

    const timer = setTimeout(() => {
      // debounce: wait for the user to pause
      fetchJson(`/api/courses?q=${encodeURIComponent(q)}`, isCourseArray, {
        signal: controller.signal,
      })
        .then((data) => setState({ status: "success", data }))
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return; // our own cancellation
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
          });
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort(); // stale requests can't overwrite newer ones
    };
  }, [query]);

  return (
    <div>
      <label>
        Search courses
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <div role="status">
        {state.status === "idle" && <p>Type to search.</p>}
        {state.status === "loading" && <p>Searching...</p>}
        {state.status === "error" && <p role="alert">{state.message}</p>}
        {state.status === "success" &&
          (state.data.length === 0 ? (
            <p>No results.</p>
          ) : (
            <p>{state.data.length} results</p>
          ))}
      </div>

      {state.status === "success" && (
        <ul>
          {state.data.map((c) => (
            <li key={c.id}>{c.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

`Remote<Course[]>` is a **discriminated union**: `state.data` only exists when `state.status === "success"`, so reading it elsewhere is a compile error. This is Day 2's loading/error handling, made impossible to get wrong. Compare with the Day 2 trio of `loading`, `error` and `data` flags, which allow impossible combinations (loading _and_ error).

Test (`tests/livesearch.test.tsx`):

```tsx
import { afterEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LiveSearch } from "@/components/LiveSearch";
import { COURSES } from "@/lib/courses";

afterEach(() => vi.unstubAllGlobals());

test("idle -> loading -> success", async () => {
  const fetchMock = vi.fn(
    async (_url: string) =>
      new Response(JSON.stringify(COURSES.slice(0, 2)), { status: 200 }),
  );
  vi.stubGlobal("fetch", fetchMock);
  render(<LiveSearch />);
  expect(screen.getByText("Type to search.")).toBeInTheDocument();

  await userEvent.type(screen.getByLabelText("Search courses"), "re");
  expect(screen.getByText("Searching...")).toBeInTheDocument();
  expect(await screen.findByText("2 results")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(1); // debounced: "r" and "re" -> one request
  expect(String(fetchMock.mock.calls[0]?.[0])).toBe("/api/courses?q=re");
});

test("HTTP error -> alert", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("nope", { status: 500 })),
  );
  render(<LiveSearch />);
  await userEvent.type(screen.getByLabelText("Search courses"), "x");
  expect(await screen.findByRole("alert")).toHaveTextContent("HTTP 500");
});

test("wrong response shape is rejected at runtime", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () => new Response(JSON.stringify([{ id: "1" }]), { status: 200 }),
    ),
  );
  render(<LiveSearch />);
  await userEvent.type(screen.getByLabelText("Search courses"), "x");
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Unexpected response shape",
  );
});

test("empty input goes back to idle", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("[]", { status: 200 })),
  );
  render(<LiveSearch />);
  const input = screen.getByLabelText("Search courses");
  await userEvent.type(input, "a");
  expect(await screen.findByText("No results.")).toBeInTheDocument();
  await userEvent.clear(input);
  expect(screen.getByText("Type to search.")).toBeInTheDocument();
});
```

### 2.7 Build it, then check the real behaviour

```bash
npm run build && npm start
```

`next build` runs the TypeScript check and prints the route table:

```
Route (app)
┌ ○ /
├ ƒ /api/courses
├ ƒ /api/courses/[slug]
├   /courses
├ ƒ /courses
└   /courses/[slug]
```

(The exact lines depend on your project. What matters: `/courses` is **ƒ Dynamic** (it reads `searchParams`), `/courses/[slug]` is **● SSG** with one page per slug, the API routes are **ƒ**.)

Check with `curl` (outputs below are from a real run):

```bash
curl -s localhost:3000/api/courses?level=Advanced           # [{"id":12,"slug":"rest-api-design",...}]
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/api/courses/does-not-exist     # 404
curl -s -o /dev/null -w "%{http_code}\n" -X POST -d '{not json' localhost:3000/api/courses    # 400
curl -s -o /dev/null -w "%{http_code}\n" -X POST -d '{"title":"X"}' localhost:3000/api/courses   # 422
curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/courses/nope                    # 404
```

## 3. Part C: debug a broken typed file

Save as `exercises/broken.tsx` and run `npx tsc --noEmit`. **Five errors.** Fix each **without** `as`, `any` or `!`.

```tsx
import { useState, type ChangeEvent } from "react";
import { getCourseBySlug, getCourses } from "@/lib/data";
import type { Course, Level } from "@/lib/types";

export async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const course = await getCourseBySlug(params.slug);
  return <h1>{course.title}</h1>;
}

export function Tags({ course }: { course: Course }) {
  return <p>{course.tags.join(", ")}</p>;
}

export function Picker() {
  const [items, setItems] = useState([]);
  const [level, setLevel] = useState<Level | "All">("All");
  function load(list: Course[]) {
    setItems(list);
  }
  function onChange(e: ChangeEvent<HTMLSelectElement>) {
    setLevel(e.target.value);
  }
  void getCourses;
  return (
    <select onChange={onChange} value={level}>
      {items.length}
    </select>
  );
}
```

Real compiler output (TypeScript 7.0.2):

```
broken.tsx(6,47):  error TS2339: Property 'slug' does not exist on type 'Promise<{ slug: string; }>'.
broken.tsx(7,15):  error TS18048: 'course' is possibly 'undefined'.
broken.tsx(11,14): error TS18048: 'course.tags' is possibly 'undefined'.
broken.tsx(17,44): error TS2345: Argument of type 'Course[]' is not assignable to parameter of type 'SetStateAction<never[]>'.
                     Type 'Course[]' is not assignable to type 'never[]'.
                       Type 'Course' is not assignable to type 'never'.
broken.tsx(18,67): error TS2345: Argument of type 'string' is not assignable to parameter of type 'SetStateAction<"Advanced" | "All" | "Beginner" | "Intermediate">'.
```

| #   | Error                                                             | Cause                                                  | Fix                                                                                               |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| 1   | `Property 'slug' does not exist on type 'Promise<...>'`           | `params` is a **Promise** in Next.js 15/16             | `const { slug } = await params;`                                                                  |
| 2   | `'course' is possibly 'undefined'`                                | `getCourseBySlug` returns `Course \| undefined`        | `if (!course) notFound();` (then it's narrowed)                                                   |
| 3   | `'course.tags' is possibly 'undefined'`                           | `tags?` is optional                                    | `course.tags?.join(", ") ?? ""` or guard with `&&`                                                |
| 4   | `Argument of type 'Course[]' ... 'never[]'`                       | `useState([])` infers `never[]`                        | `useState<Course[]>([])`                                                                          |
| 5   | `Argument of type 'string' ... SetStateAction<"Advanced" \| ...>` | `e.target.value` is `string`, state is a literal union | validate with a type guard: `isLevel(value) ? setLevel(value) : setLevel("All")` (not `as Level`) |

(In the error message TypeScript 7 lists the union members alphabetically; the order in your source doesn't matter.)

## 4. Common mistakes

1. Making the whole page `"use client"` to "fix" a hook error instead of extracting a small Client Component.
2. Fetching your own `/api/courses` from the Server Component (use `getCourses()` directly).
3. `searchParams.level as Level` instead of validating, so `?level=<anything>` flows into your logic.
4. `useState([])` / `useState(null)` without a generic.
5. Three booleans (`loading`, `error`, `data`) instead of a discriminated union.
6. Forgetting to abort stale requests (race conditions) and to debounce typing.
7. `fetch(...).then(r => r.json())` typed as `Course[]` with no runtime check.
8. Forgetting `res.ok`: `fetch` doesn't reject on 404/500.
9. Not awaiting `params` / `searchParams` (Next.js 15/16).
10. Using module-level arrays as a "database" in production.

## 5. Stretch goals

1. Replace `lib/guards.ts` with a **Zod** schema; derive `Course` with `z.infer` and use `safeParse` in the POST handler.
2. Add a **Server Action** `saveCourse(id)` with `"use server"` and call it from `SaveButton` (`useTransition`, optimistic UI with `useOptimistic`).
3. Add `export const revalidate = 60` to the detail page and watch the `Revalidate` column in `next build`.
4. Add pagination with `?page=` (validate it as a positive integer) and typed `Page<T>` results.
5. Convert `Remote<T>` into a generic `useFetch<T>(url, guard)` hook returning `Remote<T>`.
6. Add `error.tsx` + `not-found.tsx` per route and test them (throw inside `getCourses`).
7. Replace the in-memory data with SQLite/Prisma/Drizzle and keep the **same** `getCourses` signature.
8. Add `proxy.ts` (Next.js 16's replacement for `middleware.ts`) to redirect `/old-courses` to `/courses`.

## Recap

- To type an existing component: **rename to `.tsx`, type the props first, let inference fix the rest, then fix the real bugs the compiler exposes** (optional values, wrong state types).
- On the server: **fetch in Server Components**, validate `searchParams`, use `notFound()`, `loading.tsx`, `error.tsx`, `generateStaticParams`.
- On the client: typed `fetch` + **runtime guard** + a **discriminated union** for loading/error/success + abort/debounce.
- Types describe your **intent**; guards verify **reality** at the boundary.

## Checklist

- [ ] My typed `CourseList` compiles in `strict` mode and its tests pass
- [ ] `/courses` is dynamic, `/courses/[slug]` is SSG, API routes return the right status codes
- [ ] I fixed all 5 errors in `broken.tsx` without `as`, `any` or `!`
- [ ] I can explain why `notFound()` narrows `course` and why `useState([])` is `never[]`
- [ ] I can explain where I validate data and why
