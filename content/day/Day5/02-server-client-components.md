# 02 - Server Components and Client Components

> **Time to learn:** ~50 min | **Level:** Core concept | **Interview frequency:** Extremely high
> Read `01-routing.md` first. This is the single biggest mental shift from plain React.

## 1. The idea

In the App Router **every component is a Server Component by default**. It runs **only on the server** (at build time or on a request), and the browser receives its **output**, not its JavaScript. A **Client Component** (file starts with `"use client"`) is rendered on the server for the first HTML **and** its JavaScript is sent to the browser so it can be **hydrated** and become interactive.

## 2. Analogy

A restaurant: the **kitchen (server)** prepares the food and has access to the pantry, the till and the supplier's phone number (database, secrets, file system). The **table (client)** is where a customer can interact: ask for salt, change their mind. You don't ship the whole kitchen to the table. You send the plate (HTML) and only the **parts that need interaction** (a salt shaker = a Client Component).

## 3. What each can do

|                                                  | **Server Component** (default) | **Client Component** (`"use client"`)                            |
| ------------------------------------------------ | ------------------------------ | ---------------------------------------------------------------- |
| Runs                                             | on the server only             | on the server (first HTML) **and** in the browser                |
| JavaScript sent to the browser                   | **none**                       | yes (bundle size grows)                                          |
| `async` / `await` in the component               | **yes**                        | no                                                               |
| Read a database, file system, secrets (env vars) | **yes**                        | no (it would leak)                                               |
| `useState`, `useReducer`, `useEffect`, `useRef`  | no                             | **yes**                                                          |
| Event handlers (`onClick`, `onChange`)           | no                             | **yes**                                                          |
| Browser APIs (`window`, `localStorage`)          | no                             | **yes** (inside effects/handlers)                                |
| `useContext`, context providers                  | no                             | **yes**                                                          |
| Can import the other kind?                       | imports Client Components      | can only render Server Components **passed as `children`/props** |

**Rule of thumb:** start on the server. Add `"use client"` only to the **smallest** component that needs state, effects, event handlers or browser APIs.

## 4. A Server Component fetching data

```tsx
// app/courses/page.tsx  (no directive = Server Component)
import { COURSES } from "@/lib/courses";

export default async function CoursesPage() {
  const courses = await getCourses(); // direct data access, no useEffect, no loading state in the component
  return (
    <ul>
      {courses.map((c) => (
        <li key={c.id}>{c.title}</li>
      ))}
    </ul>
  );
}

async function getCourses() {
  // a database query, an ORM call, or fetch() to an external API
  return COURSES;
}
```

No `useEffect`, no `useState` for data, no loading flag in the component: the HTML arrives **already containing the data**, and the browser downloads **no JavaScript** for this component.

## 5. A Client Component

```tsx
// components/SaveButton.tsx
"use client"; // first line, before imports

import { useState } from "react";

export function SaveButton({ courseId }: { courseId: number }) {
  const [saved, setSaved] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() => setSaved((s) => !s)}
    >
      {saved ? "Saved" : "Save"} #{courseId}
    </button>
  );
}
```

### The `"use client"` boundary

`"use client"` marks the **entry point** to the client bundle. Everything that file **imports** is also part of the client bundle. You don't mark every child, only the boundary.

```
page.tsx            (server)
 +-- CourseList     (server)
      +-- CourseCard   (server)
           +-- SaveButton  "use client"   <- boundary: this and its imports ship JS
```

## 6. Mixing them: composition rules

### Server inside client: pass it as `children`

A Client Component can't `import` a Server Component (it would become client code), but it **can render one it receives as a prop**:

```tsx
// components/Modal.tsx
"use client";
import { useState, type ReactNode } from "react";

export function Modal({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      {open && <div role="dialog">{children}</div>}
    </>
  );
}

// app/page.tsx (server)
import { Modal } from "@/components/Modal";
import { ServerStats } from "@/components/ServerStats"; // a Server Component

export default function Page() {
  return (
    <Modal>
      <ServerStats />
    </Modal>
  ); // ServerStats stays on the server
}
```

This is the **same "children" composition** you learned for performance on Day 4.

### Props crossing the boundary must be serializable

Server -> Client props are sent as data. Allowed: strings, numbers, booleans, `null`, plain objects/arrays, `Date`, `Map`, `Set`, `Promise`s, and **Server Actions**. **Not allowed:** ordinary functions, class instances, JSX closures.

```tsx
// Server Component
<SaveButton onSave={() => console.log("x")} /> // Error: Event handlers cannot be passed to Client Component props.
```

Real build error (Next.js 16.4.2):

```
Error: Event handlers cannot be passed to Client Component props.
  {onPick: function onPick}
           ^^^^^^^^^^^^^^^
If you need interactivity, consider converting part of this to a Client Component.
```

Fix: define the handler **inside** the Client Component, or use a **Server Action** (`"use server"`) for mutations.

### Context providers must be Client Components

```tsx
// app/providers.tsx
"use client";
import { createContext, useState, type ReactNode } from "react";

export const ThemeContext = createContext<"light" | "dark">("light");

export function Providers({ children }: { children: ReactNode }) {
  const [theme] = useState<"light" | "dark">("light");
  return <ThemeContext value={theme}>{children}</ThemeContext>;
}

// app/layout.tsx stays a Server Component and wraps {children} in <Providers>
```

## 7. Keeping secrets and server-only code safe

```ts
// lib/db.ts
import "server-only"; // build error if a Client Component ever imports this
export async function getUserByToken(token: string) {
  /* uses process.env.DB_URL */
}
```

Only env vars prefixed **`NEXT_PUBLIC_`** are exposed to the browser. Everything else stays on the server.

## 8. Why this design? (the interview answer)

1. **Less JavaScript** shipped, so faster load and better Core Web Vitals.
2. **Data close to the source**: fetch directly in the component, no extra API layer or client waterfalls.
3. **Security**: secrets and DB access stay on the server.
4. **Streaming**: slow parts can stream in with `<Suspense>`.
5. **Better SEO**: the HTML already contains the content.

## 9. Client Components are still server-rendered!

A common misunderstanding: **"Client Component" does not mean "renders only in the browser".** On the first request it is **pre-rendered to HTML on the server too**, then hydrated. That's why `window` access during render fails on the server, and why you put browser-only code in `useEffect` or an event handler.

```tsx
"use client";
const width = window.innerWidth; // ReferenceError during server pre-render
```

## 10. Common mistakes

1. **Using `useState` / `useEffect` / `onClick` in a Server Component.** Real error (Next.js 16.4.2): `You're importing a module that depends on useState into a React Server Component module. This API is only available in Client Components. To fix, mark the file (or its parent) with the "use client" directive.`
2. Adding `"use client"` to the whole page "to make errors go away", losing the benefits.
3. Passing functions/class instances from a Server to a Client Component.
4. Importing a Server Component into a Client Component file (it silently becomes client code). Pass it as `children`.
5. Putting secrets in a Client Component or a `NEXT_PUBLIC_` variable.
6. Making a Client Component `async` (React in the browser doesn't support async components; fetch on the server or use an effect/a data library).
7. Accessing `window`/`localStorage` during render.
8. Putting a context provider in a Server Component.
9. Fetching the same data in many components without thinking (see `03-rendering-strategies.md`, request memoization and caching).

## 11. Predict the output

**Q1** Which of these need `"use client"`?
(a) a component that renders a list from a DB query (b) a component with `useState` (c) a component with `onClick` (d) a component that reads `process.env.DB_URL` (e) a component that uses `useEffect` (f) a layout that renders `{children}`

**Q2** Can this Server Component render? Why or why not?

```tsx
export default function Page() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Q3** Does `SaveButton`'s JavaScript get shipped if `page.tsx` (server) renders it? Does `CourseList` (server, no directive) get shipped?

**Q4** What is wrong, and what are two fixes?

```tsx
// Server Component
<Card onSelect={() => console.log("picked")} /> // Card is "use client"
```

**Q5** A Client Component contains `console.log("render")`. A user loads the page. Where does "render" appear in the logs?

## 12. Answers

- **Q1:** (b), (c), (e) need `"use client"`. (a), (d), (f) are Server Components.
- **Q2:** **No**: `useState` and `onClick` only work in Client Components. Fix: add `"use client"` to this component (or extract just the button into a small Client Component).
- **Q3:** **Yes** for `SaveButton` (it's the client boundary). **No** for `CourseList`: server components send **no JS**, only their rendered output.
- **Q4:** You can't pass a function (event handler) across the server/client boundary. Fix 1: create the handler inside `Card` (or in a small Client wrapper). Fix 2: for a mutation, pass a **Server Action** (`"use server"` function), which _is_ allowed.
- **Q5:** In the **server** logs (during the pre-render of the first HTML) **and** in the **browser console** (hydration). In development with StrictMode you may see it twice in the browser.

## Recap

- **Server Components are the default**: async, direct data access, zero client JS, secrets stay safe.
- **Client Components** (`"use client"`) add state, effects, event handlers and browser APIs, and they're still pre-rendered on the server.
- `"use client"` is a **boundary**: its imports join the client bundle. Keep it as low and small as possible.
- Pass Server Components **into** Client Components as `children`; props across the boundary must be serializable.

## Checklist

- [ ] I can list 4 things only Client Components can do and 3 only Server Components can do
- [ ] I can explain the `"use client"` boundary and the `children` composition trick
- [ ] I can explain why Client Components are still server-rendered first
- [ ] I can fix the "event handlers cannot be passed" error
- [ ] I got Q1 to Q5 right without looking
