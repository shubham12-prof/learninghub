# 06 - Coding: A Typed Component + Array/Object Transformations

> **Time to build:** ~90 min | **Level:** Practice | **Target:** 1 typed feature = a `CourseBoard` component whose data logic is fully typed and tested
> Everything below was compiled with `tsc --noEmit` (`strict: true`) and tested with Vitest. Copy the files in order.

## 1. The feature

A **Course Board** for LearningHub (a Client Component inside a Next.js page):

- search by title, filter by level (and "free only")
- courses **grouped by level** (Beginner, Intermediate, Advanced) and **sorted by title**
- a **Save** toggle per course and a summary: "7 of 12 courses, 49 hours"
- all data work done by small, **pure, generic, typed** functions you can test without React

## 2. Setup

```bash
npx create-next-app@latest learninghub --ts --app --eslint --no-tailwind --src-dir=false --import-alias "@/*"
cd learninghub
npm i -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

`vitest.config.mts`:

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
});
```

`tests/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Check `tsconfig.json` contains `"strict": true` (create-next-app sets it).

## 3. The types: `lib/types.ts`

```ts
export const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
export type Level = (typeof LEVELS)[number]; // "Beginner" | "Intermediate" | "Advanced"

export interface Course {
  id: number;
  slug: string;
  title: string;
  category: string;
  level: Level;
  hours: number;
  free: boolean;
  tags?: string[];
}

export function isLevel(value: string): value is Level {
  return (LEVELS as readonly string[]).includes(value);
}
```

One source of truth: `LEVELS` is a runtime array **and** the source of the `Level` type (`as const` + `typeof` + indexed access).

## 4. The data: `lib/courses.ts`

```ts
import type { Course } from "./types";

export const COURSES: readonly Course[] = [
  {
    id: 1,
    slug: "html-foundations",
    title: "HTML Foundations",
    category: "Web",
    level: "Beginner",
    hours: 4,
    free: true,
  },
  {
    id: 2,
    slug: "css-layout",
    title: "CSS Layout with Flexbox and Grid",
    category: "Web",
    level: "Beginner",
    hours: 6,
    free: true,
  },
  {
    id: 3,
    slug: "javascript-essentials",
    title: "JavaScript Essentials",
    category: "JavaScript",
    level: "Beginner",
    hours: 10,
    free: true,
    tags: ["es6", "basics"],
  },
  {
    id: 4,
    slug: "async-javascript",
    title: "Async JavaScript",
    category: "JavaScript",
    level: "Intermediate",
    hours: 8,
    free: false,
  },
  {
    id: 5,
    slug: "react-fundamentals",
    title: "React Fundamentals",
    category: "React",
    level: "Beginner",
    hours: 9,
    free: true,
    tags: ["hooks"],
  },
  {
    id: 6,
    slug: "react-performance",
    title: "React Performance",
    category: "React",
    level: "Intermediate",
    hours: 7,
    free: false,
  },
  {
    id: 7,
    slug: "accessible-ui-design",
    title: "Accessible UI Design",
    category: "Web",
    level: "Intermediate",
    hours: 5,
    free: true,
  },
  {
    id: 8,
    slug: "typescript-for-react",
    title: "TypeScript for React",
    category: "TypeScript",
    level: "Intermediate",
    hours: 8,
    free: false,
  },
  {
    id: 9,
    slug: "node-and-express",
    title: "Node.js and Express",
    category: "Backend",
    level: "Intermediate",
    hours: 12,
    free: false,
  },
  {
    id: 10,
    slug: "testing-react-components",
    title: "Testing React Components",
    category: "React",
    level: "Intermediate",
    hours: 6,
    free: true,
  },
  {
    id: 11,
    slug: "git-and-github",
    title: "Git and GitHub Basics",
    category: "Tools",
    level: "Beginner",
    hours: 3,
    free: true,
  },
  {
    id: 12,
    slug: "rest-api-design",
    title: "REST API Design",
    category: "Backend",
    level: "Advanced",
    hours: 8,
    free: false,
  },
];
```

## 5. Part 1: typed transformations: `lib/transform.ts`

Each function is **pure** (no mutation, no side effects) and **generic** (works for any item type, not only `Course`).

```ts
import type { Course, Level } from "./types";

/** Group items by a key: { Beginner: [...], Intermediate: [...] }. Keys with no items are absent. */
export function groupBy<T, K extends string>(
  items: readonly T[],
  getKey: (item: T) => K,
): Partial<Record<K, T[]>> {
  const result: Partial<Record<K, T[]>> = {};
  for (const item of items) {
    const key = getKey(item);
    const bucket = result[key];
    if (bucket) bucket.push(item);
    else result[key] = [item];
  }
  return result;
}

/** Count items per key: { Web: 3, React: 3, ... } */
export function countBy<T, K extends string>(
  items: readonly T[],
  getKey: (item: T) => K,
): Partial<Record<K, number>> {
  const result: Partial<Record<K, number>> = {};
  for (const item of items) {
    const key = getKey(item);
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}

/** Turn a list into a lookup object by a unique key. Later duplicates win. */
export function indexBy<T, K extends string | number>(
  items: readonly T[],
  getKey: (item: T) => K,
): Record<K, T> {
  return Object.fromEntries(
    items.map((item) => [getKey(item), item]),
  ) as Record<K, T>;
}

/** Sorted COPY (never mutates the input). Strings and numbers both work. */
export function sortBy<T>(
  items: readonly T[],
  getValue: (item: T) => number | string,
  direction: "asc" | "desc" = "asc",
): T[] {
  const sign = direction === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const x = getValue(a);
    const y = getValue(b);
    return (x < y ? -1 : x > y ? 1 : 0) * sign;
  });
}

/** Keep the first item for each key. */
export function uniqueBy<T, K>(
  items: readonly T[],
  getKey: (item: T) => K,
): T[] {
  const seen = new Set<K>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Object transformations */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) result[key] = obj[key];
  return result;
}

export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Omit<T, K> {
  const drop = new Set<PropertyKey>(keys);
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !drop.has(key)),
  ) as Omit<T, K>;
}

export function mapValues<V, U>(
  obj: Record<string, V>,
  fn: (value: V, key: string) => U,
): Record<string, U> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, fn(value, key)]),
  );
}

/** Immutable list updates (React state needs NEW arrays) */
export function toggleId(ids: readonly number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

export function updateById<T extends { id: number }>(
  items: readonly T[],
  id: number,
  patch: Partial<Omit<T, "id">>,
): T[] {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

/** Course-specific logic built on the generic helpers */
export interface CourseFilters {
  query?: string;
  level?: Level;
  category?: string;
  freeOnly?: boolean;
}

export function filterCourses(
  courses: readonly Course[],
  filters: CourseFilters = {},
): Course[] {
  const q = filters.query?.trim().toLowerCase() ?? "";
  return courses.filter(
    (c) =>
      (q === "" || c.title.toLowerCase().includes(q)) &&
      (filters.level === undefined || c.level === filters.level) &&
      (filters.category === undefined || c.category === filters.category) &&
      (!filters.freeOnly || c.free),
  );
}

export interface CourseSummary {
  total: number;
  totalHours: number;
  freeCount: number;
  byLevel: Record<Level, number>;
}

export function summarise(courses: readonly Course[]): CourseSummary {
  const byLevel: Record<Level, number> = {
    Beginner: 0,
    Intermediate: 0,
    Advanced: 0,
  };
  let totalHours = 0;
  let freeCount = 0;
  for (const c of courses) {
    byLevel[c.level] += 1;
    totalHours += c.hours;
    if (c.free) freeCount += 1;
  }
  return { total: courses.length, totalHours, freeCount, byLevel };
}
```

### The transformation patterns

| Goal                    | Tool                                          | Example                                        |
| ----------------------- | --------------------------------------------- | ---------------------------------------------- |
| Keep some items         | `filter`                                      | `courses.filter((c) => c.free)`                |
| Change each item        | `map`                                         | `courses.map((c) => c.title)`                  |
| Many -> one value       | `reduce` / a loop                             | `courses.reduce((sum, c) => sum + c.hours, 0)` |
| List -> object          | `Object.fromEntries(list.map(x => [key, x]))` | `indexBy`                                      |
| Object -> list          | `Object.entries(obj)` / `Object.values(obj)`  | `Object.entries(groupBy(...))`                 |
| Copy + change one field | spread `{ ...obj, field }`                    | `updateById`                                   |
| Sort without mutating   | `[...items].sort(...)` (or `toSorted`)        | `sortBy`                                       |
| Remove duplicates       | `Set` / `Map`                                 | `uniqueBy`                                     |

### Examples (input -> output)

```ts
import { COURSES } from "@/lib/courses";
import {
  groupBy,
  countBy,
  indexBy,
  sortBy,
  pick,
  omit,
  summarise,
} from "@/lib/transform";

groupBy(COURSES, (c) => c.level);
// { Beginner: [5 courses], Intermediate: [6 courses], Advanced: [1 course] }

countBy(COURSES, (c) => c.category);
// { Web: 3, JavaScript: 2, React: 3, TypeScript: 1, Backend: 2, Tools: 1 }

indexBy(COURSES, (c) => c.slug)["react-fundamentals"].title; // "React Fundamentals"

sortBy(COURSES, (c) => c.hours, "desc")
  .slice(0, 3)
  .map((c) => c.title);
// ["Node.js and Express", "JavaScript Essentials", "React Fundamentals"]

pick(COURSES[0], ["id", "title"]); // { id: 1, title: "HTML Foundations" }
omit(COURSES[0], ["id", "slug"]); // the rest of the fields

summarise(COURSES);
// { total: 12, totalHours: 86, freeCount: 7, byLevel: { Beginner: 5, Intermediate: 6, Advanced: 1 } }
```

## 6. Part 2: typed components

### `components/List.tsx`: a generic component

```tsx
import type { ReactNode } from "react";

interface ListProps<T> {
  items: readonly T[];
  getKey: (item: T) => string | number;
  renderItem: (item: T) => ReactNode;
  empty?: ReactNode;
}

export function List<T>({
  items,
  getKey,
  renderItem,
  empty = <p>Nothing to show.</p>,
}: ListProps<T>) {
  if (items.length === 0) return <>{empty}</>;
  return (
    <ul>
      {items.map((item) => (
        <li key={getKey(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

`T` is **inferred** from `items`, so `renderItem`'s argument is fully typed without you writing it.

### `components/CourseCard.tsx`

```tsx
"use client";

import type { Course } from "@/lib/types";

interface CourseCardProps {
  course: Course;
  isSaved?: boolean;
  onToggleSave?: (id: number) => void;
}

export function CourseCard({
  course,
  isSaved = false,
  onToggleSave,
}: CourseCardProps) {
  return (
    <article>
      <h4>{course.title}</h4>
      <p>
        {course.category} · {course.hours} h · {course.free ? "Free" : "Paid"}
      </p>
      {course.tags && course.tags.length > 0 && (
        <p>Tags: {course.tags.join(", ")}</p>
      )}
      <button
        type="button"
        aria-pressed={isSaved}
        aria-label={`Save ${course.title}`}
        onClick={() => onToggleSave?.(course.id)}
      >
        {isSaved ? "Saved" : "Save"}
      </button>
    </article>
  );
}
```

`tags` is optional, so we guard it (`course.tags && ...`). Remove the guard and `tsc` fails: `'course.tags' is possibly 'undefined'.`

### `components/CourseBoard.tsx`

```tsx
"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { CourseCard } from "@/components/CourseCard";
import { List } from "@/components/List";
import { LEVELS, isLevel, type Course, type Level } from "@/lib/types";
import {
  filterCourses,
  groupBy,
  sortBy,
  summarise,
  toggleId,
} from "@/lib/transform";

interface CourseBoardProps {
  courses: readonly Course[];
}

type LevelFilter = Level | "All";

export function CourseBoard({ courses }: CourseBoardProps) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<LevelFilter>("All");
  const [freeOnly, setFreeOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<number[]>([]); // generic: [] alone would be never[]

  const visible = useMemo(
    () =>
      sortBy(
        filterCourses(courses, {
          query,
          level: level === "All" ? undefined : level,
          freeOnly,
        }),
        (c) => c.title,
      ),
    [courses, query, level, freeOnly],
  );

  const groups = useMemo(() => groupBy(visible, (c) => c.level), [visible]);
  const summary = useMemo(() => summarise(visible), [visible]);

  function handleLevelChange(e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value; // string
    setLevel(value === "All" || isLevel(value) ? value : "All"); // narrowed by the type guard, no `as`
  }

  return (
    <section aria-labelledby="board-title">
      <h2 id="board-title">Course board</h2>

      <div>
        <label>
          Search
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Level
          <select value={level} onChange={handleLevelChange}>
            <option value="All">All</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={freeOnly}
            onChange={(e) => setFreeOnly(e.target.checked)}
          />
          Free only
        </label>
      </div>

      <p role="status">
        {summary.total} of {courses.length} courses, {summary.totalHours} hours,{" "}
        {savedIds.length} saved
      </p>

      {visible.length === 0 && <p>No courses match your filters.</p>}

      {LEVELS.map((lvl) => {
        const inLevel = groups[lvl]; // Course[] | undefined
        if (!inLevel) return null;
        return (
          <section key={lvl} aria-label={`${lvl} courses`}>
            <h3>{lvl}</h3>
            <List
              items={inLevel}
              getKey={(c) => c.id}
              renderItem={(c) => (
                <CourseCard
                  course={c}
                  isSaved={savedIds.includes(c.id)}
                  onToggleSave={(id) =>
                    setSavedIds((prev) => toggleId(prev, id))
                  }
                />
              )}
            />
          </section>
        );
      })}
    </section>
  );
}
```

`app/board/page.tsx` (a **Server Component** page that renders the **Client Component** and passes plain data):

```tsx
import { CourseBoard } from "@/components/CourseBoard";
import { COURSES } from "@/lib/courses";

export default function BoardPage() {
  return (
    <main>
      <h1>LearningHub</h1>
      <CourseBoard courses={COURSES} />
    </main>
  );
}
```

### Where the types helped (read this slowly)

1. `useState<LevelFilter>("All")`: `setLevel("Expert")` is a **compile error**.
2. `handleLevelChange`: `e.target.value` is a plain `string`. `isLevel` (a type guard) narrows it to `Level` **with runtime validation**, so no `as` cast is needed.
3. `groups[lvl]` is `Course[] | undefined` (`Partial<Record<...>>`), so TypeScript forces the `if (!inLevel) return null` check.
4. `List`'s `renderItem={(c) => ...}`: `c` is inferred as `Course` (no annotation).
5. `LEVELS.map(...)`: the levels list and the `Level` type can never drift apart.

## 7. Tests

`tests/transform.test.ts`

```ts
import { describe, expect, test } from "vitest";
import { COURSES } from "@/lib/courses";
import {
  countBy,
  filterCourses,
  groupBy,
  indexBy,
  mapValues,
  omit,
  pick,
  sortBy,
  summarise,
  toggleId,
  uniqueBy,
  updateById,
} from "@/lib/transform";

describe("transform helpers", () => {
  test("groupBy level", () => {
    const g = groupBy(COURSES, (c) => c.level);
    expect(g.Beginner).toHaveLength(5);
    expect(g.Intermediate).toHaveLength(6);
    expect(g.Advanced).toHaveLength(1);
  });

  test("groupBy leaves empty keys absent and does not mutate", () => {
    const only = COURSES.filter((c) => c.level === "Beginner");
    expect(Object.keys(groupBy(only, (c) => c.level))).toEqual(["Beginner"]);
    expect(groupBy([], (x: string) => x)).toEqual({});
  });

  test("countBy category", () => {
    expect(countBy(COURSES, (c) => c.category)).toEqual({
      Web: 3,
      JavaScript: 2,
      React: 3,
      TypeScript: 1,
      Backend: 2,
      Tools: 1,
    });
  });

  test("indexBy slug", () => {
    expect(indexBy(COURSES, (c) => c.slug)["react-fundamentals"]?.title).toBe(
      "React Fundamentals",
    );
  });

  test("sortBy copies and sorts both ways", () => {
    const before = COURSES.map((c) => c.id);
    const desc = sortBy(COURSES, (c) => c.hours, "desc");
    expect(desc.slice(0, 3).map((c) => c.title)).toEqual([
      "Node.js and Express",
      "JavaScript Essentials",
      "React Fundamentals",
    ]);
    expect(COURSES.map((c) => c.id)).toEqual(before); // input untouched
    expect(sortBy(["b", "a", "c"], (s) => s)).toEqual(["a", "b", "c"]);
  });

  test("sortBy is stable for equal values", () => {
    const eight = sortBy(COURSES, (c) => c.hours)
      .filter((c) => c.hours === 8)
      .map((c) => c.id);
    expect(eight).toEqual([4, 8, 12]);
  });

  test("uniqueBy keeps the first", () => {
    expect(uniqueBy(COURSES, (c) => c.category).map((c) => c.id)).toEqual([
      1, 3, 5, 8, 9, 11,
    ]);
  });

  test("pick and omit", () => {
    expect(pick(COURSES[0]!, ["id", "title"])).toEqual({
      id: 1,
      title: "HTML Foundations",
    });
    const rest = omit(COURSES[0]!, ["id", "slug"]);
    expect(rest).not.toHaveProperty("id");
    expect(rest).not.toHaveProperty("slug");
    expect(rest).toHaveProperty("title", "HTML Foundations");
  });

  test("mapValues", () => {
    expect(mapValues({ a: 1, b: 2 }, (n) => n * 10)).toEqual({ a: 10, b: 20 });
    expect(mapValues({ a: 1 }, (n, k) => `${k}=${n}`)).toEqual({ a: "a=1" });
  });

  test("toggleId and updateById are immutable", () => {
    const ids = [1, 2];
    expect(toggleId(ids, 3)).toEqual([1, 2, 3]);
    expect(toggleId(ids, 2)).toEqual([1]);
    expect(ids).toEqual([1, 2]);
    const list = [
      { id: 1, n: "a" },
      { id: 2, n: "b" },
    ];
    const next = updateById(list, 2, { n: "z" });
    expect(next).toEqual([
      { id: 1, n: "a" },
      { id: 2, n: "z" },
    ]);
    expect(list[1]).toEqual({ id: 2, n: "b" });
    expect(next[0]).toBe(list[0]); // untouched items keep identity
  });

  test("filterCourses combines filters and trims the query", () => {
    expect(
      filterCourses(COURSES, { query: "  REACT " }).map((c) => c.id),
    ).toEqual([5, 6, 8, 10]);
    expect(
      filterCourses(COURSES, { level: "Advanced" }).map((c) => c.id),
    ).toEqual([12]);
    expect(
      filterCourses(COURSES, { freeOnly: true, level: "Beginner" }),
    ).toHaveLength(5);
    expect(
      filterCourses(COURSES, { category: "Backend", freeOnly: true }),
    ).toEqual([]);
    expect(filterCourses(COURSES)).toHaveLength(12);
  });

  test("summarise", () => {
    expect(summarise(COURSES)).toEqual({
      total: 12,
      totalHours: 86,
      freeCount: 7,
      byLevel: { Beginner: 5, Intermediate: 6, Advanced: 1 },
    });
    expect(summarise([])).toEqual({
      total: 0,
      totalHours: 0,
      freeCount: 0,
      byLevel: { Beginner: 0, Intermediate: 0, Advanced: 0 },
    });
  });
});
```

`tests/courseboard.test.tsx`

```tsx
import { describe, expect, test } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CourseBoard } from "@/components/CourseBoard";
import { COURSES } from "@/lib/courses";

describe("CourseBoard", () => {
  test("groups by level, sorted by title, with a summary", () => {
    render(<CourseBoard courses={COURSES} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "12 of 12 courses, 86 hours, 0 saved",
    );
    const beginner = screen.getByRole("region", { name: "Beginner courses" });
    const titles = within(beginner)
      .getAllByRole("heading", { level: 4 })
      .map((h) => h.textContent);
    expect(titles).toEqual([
      "CSS Layout with Flexbox and Grid",
      "Git and GitHub Basics",
      "HTML Foundations",
      "JavaScript Essentials",
      "React Fundamentals",
    ]);
  });

  test("filters by search, level and free-only", async () => {
    render(<CourseBoard courses={COURSES} />);
    await userEvent.type(screen.getByLabelText("Search"), "react");
    expect(screen.getByRole("status")).toHaveTextContent("4 of 12 courses");
    await userEvent.selectOptions(
      screen.getByLabelText("Level"),
      "Intermediate",
    );
    expect(screen.getByRole("status")).toHaveTextContent("3 of 12 courses");
    await userEvent.click(screen.getByLabelText("Free only"));
    expect(screen.getByRole("status")).toHaveTextContent("1 of 12 courses");
    expect(
      screen.queryByRole("region", { name: "Beginner courses" }),
    ).not.toBeInTheDocument();
  });

  test("shows an empty state", async () => {
    render(<CourseBoard courses={COURSES} />);
    await userEvent.type(screen.getByLabelText("Search"), "zzz");
    expect(
      screen.getByText("No courses match your filters."),
    ).toBeInTheDocument();
  });

  test("save toggles per course and updates the count", async () => {
    render(<CourseBoard courses={COURSES} />);
    const save = screen.getByRole("button", { name: "Save HTML Foundations" });
    await userEvent.click(save);
    expect(save).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent("1 saved");
    await userEvent.click(save);
    expect(screen.getByRole("status")).toHaveTextContent("0 saved");
  });
});
```

### Type tests: prove the compiler catches mistakes

`tests/types.check.ts` (not run by Vitest: `npx tsc --noEmit` checks it. **`@ts-expect-error` fails the build if the line is NOT an error**, so it proves the error exists):

```ts
import type { Course, Level } from "@/lib/types";
import { COURSES } from "@/lib/courses";
import { groupBy, pick } from "@/lib/transform";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

const grouped = groupBy(COURSES, (c) => c.level);
export type G = Expect<Equal<typeof grouped, Partial<Record<Level, Course[]>>>>;

const picked = pick(COURSES[0]!, ["id", "title"]);
export type P = Expect<Equal<typeof picked, Pick<Course, "id" | "title">>>;

// @ts-expect-error "Expert" is not a Level
const bad: Level = "Expert";

// @ts-expect-error "nope" is not a key of Course
pick(COURSES[0]!, ["nope"]);

// @ts-expect-error `tags` is optional, so it may be undefined
const n: number = COURSES[0]!.tags.length;

// @ts-expect-error missing required fields
const incomplete: Course = { id: 1, title: "x" };
```

Run everything:

```bash
npx tsc --noEmit && npx vitest run
```

## 8. Edge cases to check

| Case                                      | Expected                                                        |
| ----------------------------------------- | --------------------------------------------------------------- |
| Empty list / no matches                   | `groupBy` -> `{}`, board shows "No courses match your filters." |
| Query with spaces/uppercase               | trimmed and case-insensitive                                    |
| `level` filter `"All"`                    | converted to `undefined` (no filtering)                         |
| Input arrays                              | never mutated (`sortBy` copies; `toggleId` returns a new array) |
| Equal sort keys                           | stable: original order kept                                     |
| Missing `tags`                            | no crash (guarded)                                              |
| A level with zero courses after filtering | its section is not rendered                                     |

## 9. Common mistakes

1. `useState([])` (type `never[]`) instead of `useState<number[]>([])`.
2. Mutating state: `savedIds.push(id)`; `courses.sort(...)` (sorts the original!).
3. Casting `e.target.value as Level` with no validation (a type guard is safer).
4. Forgetting that `Partial<Record<K, T[]>>` values can be `undefined`.
5. Using `any` in helper signatures (loses all safety) instead of generics.
6. Writing a union by hand **and** an array by hand (they drift). Derive one from the other with `as const`.
7. Using `reduce` for everything: a loop is often clearer.
8. Returning a different shape from the same function (some branches `string`, others `number`).
9. Not including every dependency in `useMemo` (stale results).
10. Typing props with `React.FC` out of habit: a plain function with a props interface is simpler and what most codebases now do.

## 10. Predict the output

**Q1** What does `Object.keys(groupBy(COURSES, (c) => c.level))` return, and how long is each array?

**Q2** What does `countBy(COURSES, (c) => c.category)` return? Which categories tie for the largest count?

**Q3** What does `summarise(filterCourses(COURSES, { freeOnly: true }))` return?

**Q4** What is the type of `pick(COURSES[0]!, ["id", "title"])`? What happens with `pick(COURSES[0]!, ["nope"])`?

**Q5** After `const sorted = sortBy(COURSES, (c) => c.hours, "desc")`, what is `COURSES[0]!.title`, and what is `sorted[0]!.title`?

## 11. Answers

- **Q1:** `["Beginner", "Intermediate", "Advanced"]` with lengths **5, 6, 1** (insertion order follows the first course of each level).
- **Q2:** `{ Web: 3, JavaScript: 2, React: 3, TypeScript: 1, Backend: 2, Tools: 1 }`. **Web and React tie** with 3.
- **Q3:** `{ total: 7, totalHours: 43, freeCount: 7, byLevel: { Beginner: 5, Intermediate: 2, Advanced: 0 } }`. The free courses are ids 1, 2, 3, 5, 7, 10 and 11: 4 + 6 + 10 + 9 + 5 + 6 + 3 = 43 hours.
- **Q4:** `Pick<Course, "id" | "title">`, i.e. `{ id: number; title: string }`. `["nope"]` is a **compile error**: `"nope"` isn't assignable to `keyof Course`.
- **Q5:** `COURSES[0]!.title` is **"HTML Foundations"** (the input is not mutated); `sorted[0]!.title` is **"Node.js and Express"** (12 hours).

## 12. Practice variations

1. Add `sortBy` direction and a "sort by" `<select>` typed as `"title" | "hours"`.
2. Write `partition<T>(items, predicate): [T[], T[]]` (a tuple return type).
3. Write `groupBy` with `reduce` and compare readability.
4. Make `CourseBoard` read the initial filters from `searchParams` in `page.tsx` (`Promise<{ level?: string }>`) and validate with `isLevel`.
5. Persist `savedIds` in `localStorage` with a typed `useLocalStorage<T>` hook (validate on read!).
6. Replace the hand-written `Course` interface with a **Zod** schema and derive the type with `z.infer`.
7. Add `byCategory: Record<string, number>` to `summarise` using `countBy`.

## Recap

- Small **pure generic helpers** (`groupBy`, `countBy`, `sortBy`, `pick`, `omit`, `mapValues`) are easy to type, test and reuse.
- Derive types from values (`as const`, `typeof`, `keyof`, `Pick`, `Omit`, `Record`) instead of duplicating them.
- Optional values (`?`, `Partial`, `Record` lookups) force you to handle `undefined`: that's the point.
- Type state explicitly when the initial value is empty (`useState<number[]>([])`); validate untrusted strings with a **type guard** instead of `as`.
- `@ts-expect-error` tests prove the compiler rejects what it should.

## Checklist

- [ ] My `CourseBoard` compiles with `strict: true` and all tests pass
- [ ] I can explain why `groups[lvl]` needs a check and why `useState([])` is wrong
- [ ] I wrote (not copied) `groupBy` and `sortBy` once from memory
- [ ] I can transform array <-> object with `Object.entries` / `Object.fromEntries`
- [ ] I got Q1 to Q5 right without looking
