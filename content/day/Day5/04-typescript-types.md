# 04 - TypeScript: Types, Interfaces, Inference and React

> **Time to learn:** ~70 min | **Level:** Core concept | **Interview frequency:** Very high
> Verified with TypeScript 7.0.2 (the native compiler; the `tsc` command and the language are the same as 5.x/6.x for everything here) and `strict: true`.

## 1. What is TypeScript?

**TypeScript = JavaScript + static types.** You describe the _shape_ of data; the compiler checks your code **before it runs** and then **erases the types** (the browser only ever sees JavaScript). Types are a **compile-time safety net**: they don't exist at runtime, so they can't validate data that comes from an API (see section 12).

## 2. Analogy

A **shipping label** on a parcel: "fragile, 2 kg, this side up". The label doesn't change the parcel, it just lets everyone handling it know what to expect and warns you when something doesn't match (putting a piano in a "letter" slot).

## 3. The basics

```ts
const title: string = "React";
const hours: number = 6;
const free: boolean = true;
const tags: string[] = ["react", "hooks"]; // or Array<string>
const pair: [string, number] = ["react", 6]; // tuple: fixed length and types
let anything: unknown; // safe "I don't know yet"
function hours2minutes(h: number): number {
  return h * 60;
}
const greet = (name: string, punctuation = "!"): string =>
  `Hi ${name}${punctuation}`; // default value => optional param
```

`any` turns the type checker **off** for that value; avoid it. Use `unknown` and narrow it.

## 4. `type` vs `interface`

Both describe object shapes.

```ts
interface Course {
  id: number;
  slug: string;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  tags?: string[]; // optional: string[] | undefined
  readonly createdAt: string; // can't be reassigned
}

type CourseSummary = {
  id: number;
  title: string;
};
```

|                                                                 | `interface`                | `type`                                          |
| --------------------------------------------------------------- | -------------------------- | ----------------------------------------------- |
| Object shapes                                                   | yes                        | yes                                             |
| Extend                                                          | `interface B extends A {}` | `type B = A & { extra: string }` (intersection) |
| **Declaration merging** (same name twice merges)                | **yes**                    | no (error)                                      |
| Unions (`A \| B`), primitives, tuples, mapped/conditional types | **no**                     | **yes**                                         |
| Can be `implements`-ed by a class                               | yes                        | yes                                             |

**Practical rule (a good interview answer):** use **`interface` for object shapes you may extend** (props, API models), use **`type` for unions, tuples, utility/mapped types and aliases**. Either is fine; **be consistent** with your team.

```ts
interface Person {
  name: string;
}
interface Student extends Person {
  school: string;
} // extends
type Teacher = Person & { subject: string }; // intersection

type Level = "Beginner" | "Intermediate" | "Advanced"; // only `type` can alias a union
```

## 5. Union and literal types, narrowing

```ts
type Level = "Beginner" | "Intermediate" | "Advanced"; // literal union: a closed set of strings
type Id = number | string;

function show(id: Id) {
  if (typeof id === "string") return id.toUpperCase(); // narrowed to string
  return id.toFixed(0); // narrowed to number
}
```

Narrowing tools: `typeof`, `instanceof`, `"key" in obj`, equality (`===`), truthiness, and **discriminated unions**.

### Discriminated unions (the most useful pattern for UI state)

```ts
type Remote<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

function describe(r: Remote<string[]>): string {
  switch (r.status) {
    case "idle":
      return "Nothing yet";
    case "loading":
      return "Loading...";
    case "error":
      return r.message; // only here does `message` exist
    case "success":
      return `${r.data.length} items`; // only here does `data` exist
  }
}
```

If you add a new `status`, TypeScript flags every `switch` that doesn't handle it (exhaustiveness).

### Type guards

```ts
function isCourse(value: unknown): value is Course {
  return (
    typeof value === "object" &&
    value !== null &&
    "slug" in value &&
    "title" in value
  );
}
```

## 6. Generics

A generic is a **type parameter**: a placeholder the caller fills in.

```ts
function first<T>(items: readonly T[]): T | undefined {
  return items[0];
}

const n = first([1, 2, 3]); // T inferred as number  -> number | undefined
const s = first(["a", "b"]); // T inferred as string  -> string | undefined

interface ApiResponse<T> {
  data: T;
  error?: string;
}
const res: ApiResponse<Course[]> = { data: [] };

function groupBy<T, K extends string>(
  items: readonly T[],
  getKey: (item: T) => K,
): Partial<Record<K, T[]>> {
  /* ... */
}
```

`K extends string` is a **constraint**: "K can be any string literal type".

## 7. Utility types you must know

```ts
type Course = {
  id: number;
  title: string;
  level: Level;
  hours: number;
  tags?: string[];
};

type Draft = Partial<Course>; // every property optional
type Strict = Required<Course>; // every property required
type Preview = Pick<Course, "id" | "title">; // only these keys
type NoId = Omit<Course, "id">; // everything except id
type ByLevel = Record<Level, Course[]>; // object with exactly these keys
type Locked = Readonly<Course>; // cannot be reassigned
type Ret = ReturnType<typeof first>; // the return type of a function
type Resolved = Awaited<Promise<Course[]>>; // Course[]
type Keys = keyof Course; // "id" | "title" | "level" | "hours" | "tags"
type Item = Course["title"]; // indexed access: string
type OneCourse = (typeof COURSES)[number]; // element type of an array value
```

## 8. Inference: let TypeScript do the work

TypeScript **infers** types from values, so you annotate **less** than you think.

```ts
let a = "hello"; // string   (a `let` widens to the general type)
const b = "hello"; // "hello"  (a `const` keeps the literal type)
const c = 5; // 5
const d = [1, 2, 3]; // number[]
const e = { id: 1, ok: true }; // { id: number; ok: boolean }
const f = [1, "a"]; // (string | number)[]

function double(n: number) {
  return n * 2;
} // return type inferred: number
const result = double(4); // number

const names = ["a", "b"].map((s) => s.length); // s is inferred as string (contextual typing); names: number[]
```

### `as const` and `satisfies`

```ts
const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const; // readonly tuple of literals
type Level = (typeof LEVELS)[number]; // "Beginner" | "Intermediate" | "Advanced"

const config = { retries: 3, mode: "fast" } satisfies {
  retries: number;
  mode: "fast" | "slow";
};
// satisfies CHECKS the shape but KEEPS the narrow inferred type: config.mode is "fast", not string
```

### When to annotate (interview answer)

**Annotate:** function **parameters**, **exported** function return types (optional but nice), public APIs/props, and **empty** initial values (`useState<Course[]>([])`). **Let it infer:** local variables and values that are initialised with a clear value.

```ts
const [items, setItems] = useState([]); // never[]  <- the classic mistake
const [items2, setItems2] = useState<Course[]>([]); // correct
```

## 9. Strict mode and common compiler errors

`"strict": true` in `tsconfig.json` turns on the useful checks: `noImplicitAny`, `strictNullChecks`, and more. Always use it.

| Code               | Error (TypeScript 7.0.2)                                                                                         | Meaning                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `strictNullChecks` | `'course.tags' is possibly 'undefined'.`                                                                         | handle the optional value (`?.`, `??`, `if`)                                               |
| `noImplicitAny`    | `Parameter 'x' implicitly has an 'any' type.`                                                                    | add a type                                                                                 |
| assignment         | `Type 'string' is not assignable to type 'number'.`                                                              | wrong type                                                                                 |
| literal unions     | `Argument of type 'string' is not assignable to parameter of type '"Advanced" \| "Beginner" \| "Intermediate"'.` | a plain `string` isn't one of the literals (TypeScript 7 lists the members alphabetically) |

```ts
function tagList(course: Course) {
  return course.tags.join(", "); // Error: 'course.tags' is possibly 'undefined'.
  return (course.tags ?? []).join(", "); // fix
}
```

**The non-null assertion `!`** (`course.tags!.join()`) just tells the compiler "trust me". If you're wrong it crashes at runtime. Prefer real checks.

**`as` type assertions** also override the compiler (`value as Course`). They don't convert or validate anything.

## 10. TypeScript with React and Next.js

```tsx
import type { ReactNode, ChangeEvent, ComponentProps } from "react";
import { useState } from "react";

interface CourseCardProps {
  course: Course;
  isSaved?: boolean; // optional prop
  onToggleSave?: (id: number) => void; // callback prop
  children?: ReactNode; // anything renderable
}

export function CourseCard({
  course,
  isSaved = false,
  onToggleSave,
  children,
}: CourseCardProps) {
  return (
    <article>
      <h2>{course.title}</h2>
      <button onClick={() => onToggleSave?.(course.id)} aria-pressed={isSaved}>
        Save
      </button>
      {children}
    </article>
  );
}

// state: generics when the initial value doesn't tell the whole story
const [level, setLevel] = useState<Level | "All">("All");
const [selected, setSelected] = useState<Course | null>(null);

// events
function onChange(e: ChangeEvent<HTMLSelectElement>) {
  setLevel(e.target.value as Level | "All"); // e.target.value is `string`, so we assert (or validate)
}

// reuse the props of a DOM element
type ButtonProps = ComponentProps<"button"> & { variant?: "primary" | "ghost" };
```

Generic components:

```tsx
interface ListProps<T> {
  items: readonly T[];
  getKey: (item: T) => string | number;
  renderItem: (item: T) => ReactNode;
}

export function List<T>({ items, getKey, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item) => (
        <li key={getKey(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

// T is inferred from `items`
<List items={courses} getKey={(c) => c.id} renderItem={(c) => c.title} />;
```

Next.js-specific types:

```tsx
import type { Metadata, NextConfig } from "next";
import type { NextRequest } from "next/server";

// params and searchParams are Promises
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  /* ... */
}
```

## 11. Where do the types come from?

| Source                                              | What                                             |
| --------------------------------------------------- | ------------------------------------------------ |
| **TypeScript itself**                               | the language and `lib.dom.d.ts` (DOM types)      |
| **`@types/react`, `@types/node`** (devDependencies) | types for JS libraries that don't ship their own |
| **The library itself** (`next`, `zod`, ...)         | ships its own `.d.ts`                            |
| **Your code**                                       | `interface`s, `type`s, inferred types            |

`next build` runs the type check (`Running TypeScript ...`) and **fails the build on type errors**. In CI also run `tsc --noEmit`.

## 12. Types vanish at runtime: validate external data

```ts
const res = await fetch("/api/courses");
const data = (await res.json()) as Course[]; // a LIE if the server returns something else; no check happens
```

`res.json()` returns `any`/`unknown`. A type assertion doesn't validate. For data from outside (API, form, `localStorage`, `searchParams`) **validate at runtime** with a **type guard** or a schema library such as **Zod**, then trust the type.

```ts
function isCourseArray(value: unknown): value is Course[] {
  return Array.isArray(value) && value.every(isCourse);
}
```

## 13. Common mistakes

1. Using `any` instead of `unknown` (or a real type).
2. `useState([])` / `useState(null)` without a generic.
3. **Type assertions (`as`) or `!` to silence errors** instead of fixing the cause.
4. Trusting `fetch(...).json() as T` without runtime validation.
5. Typing a `string` when a **literal union** (`"Beginner" | ...`) is what you mean.
6. Duplicating a type by hand instead of deriving it (`Pick`, `Omit`, `typeof`, `keyof`, `as const`).
7. Annotating everything (noise) or nothing (public API types missing).
8. Forgetting optional props are `T | undefined` and calling them without `?.`.
9. Mutating a `readonly` array (the compiler blocks it: use `[...list, item]`).
10. Not enabling `strict`.

## 14. Predict the output (types)

**Q1** What are the types of `a`, `b`, `c`, `d`?

```ts
let a = "x";
const b = "x";
const c = [1, 2, 3];
const d = { id: 1, tags: ["a"] };
```

**Q2** What does the compiler say, and why?

```ts
interface Course {
  id: number;
  tags?: string[];
}
function count(course: Course) {
  return course.tags.length;
}
```

**Q3** What is `Preview`?

```ts
type Course = { id: number; title: string; hours: number };
type Preview = Omit<Course, "hours">;
```

**Q4** Is this an error? What is the type of `x` in each branch?

```ts
function f(x: string | number | null) {
  if (x === null) return "none";
  if (typeof x === "string") return x.length;
  return x;
}
```

Also, what is the **return type** of `f`?

**Q5** What is the type of `items`, and what's the fix?

```ts
const [items, setItems] = useState([]);
setItems([{ id: 1 }]);
```

## 15. Answers

- **Q1:** `a: string` (`let` widens), `b: "x"` (`const` keeps the literal), `c: number[]`, `d: { id: number; tags: string[] }`.
- **Q2:** **Error** `'course.tags' is possibly 'undefined'.` because `tags?:` means `string[] | undefined`. Fix: `course.tags?.length ?? 0`.
- **Q3:** `{ id: number; title: string }`.
- **Q4:** **No error.** In the first branch `x` is `null`; then `string`; at the end `x` is `number`. The return type is inferred as **`number | "none"`** (the literal `"none"` is kept, and `x.length` and `x` are both `number`).
- **Q5:** `items` is **`never[]`**, so `setItems([{ id: 1 }])` is an error (nothing is assignable to `never`). Fix: `useState<{ id: number }[]>([])` (or `useState<Course[]>([])`).

## Recap

- Types are **compile-time only**: validate runtime data from outside.
- **`interface`** for extendable object shapes, **`type`** for unions/tuples/utilities. Both fine; be consistent.
- **Unions + discriminated unions + narrowing** model real UI state safely.
- **Generics** make reusable typed functions and components; **utility types** (`Partial`, `Pick`, `Omit`, `Record`, `ReturnType`, `Awaited`, `keyof`, `typeof`) derive types instead of duplicating them.
- **Inference** does most of the work: annotate **parameters, public APIs and empty initial values**; `const` keeps literals; `as const` and `satisfies` keep types precise.
- In React/Next: type props with an interface, use `useState<T>()` when the initial value isn't enough, use `Promise<...>` for `params`/`searchParams`.

## Checklist

- [ ] I can explain `type` vs `interface` with an example of each unique feature
- [ ] I can model loading/error/success with a discriminated union
- [ ] I can write a generic function and a generic component
- [ ] I can use `Partial`, `Pick`, `Omit`, `Record`, `ReturnType` and `keyof`
- [ ] I can explain when to annotate and when to let TypeScript infer
- [ ] I got Q1 to Q5 right without looking
