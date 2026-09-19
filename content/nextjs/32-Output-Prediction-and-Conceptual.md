# Output Prediction & Conceptual Questions

## Behavior-Prediction Questions

**Q1.**

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }) {
  console.log("Layout rendered");
  return <div>{children}</div>;
}
```

Navigating from `/dashboard/settings` to `/dashboard/analytics` — does "Layout rendered" log again?

<details><summary>Answer</summary>

No — Layouts persist across navigations within their scope and don't remount, so the layout only renders once when first entering `/dashboard/*`. (A `template.tsx` in the same position WOULD re-log on every navigation, since templates remount.)

</details>

**Q2.**

```tsx
const res = await fetch("https://api.example.com/data");
```

What's the default caching behavior of this fetch inside a Server Component?

<details><summary>Answer</summary>

Cached indefinitely by default (`cache: "force-cache"`), like static data — until manually revalidated via `revalidatePath`/`revalidateTag`, a `next: { revalidate: N }` option is added, or `cache: "no-store"` is explicitly set.

</details>

**Q3.**

```tsx
"use client";
import ServerComponent from "./ServerComponent";

export default function Wrapper() {
  return <ServerComponent />;
}
```

Is this valid? What happens?

<details><summary>Answer</summary>

Not directly valid as written — you cannot `import` and directly render a Server Component INSIDE a Client Component's own render tree like this; Next.js will convert `ServerComponent` into a Client Component too (or error, depending on what it does). The correct pattern is passing Server Components as `children`/props from a Server Component parent into the Client Component, not importing them directly inside a Client Component file.

</details>

**Q4.**

```tsx
export default async function Page() {
  const a = await getA();
  const b = await getB();
  return (
    <div>
      {a.name} {b.name}
    </div>
  );
}
```

Is this the most performant way to fetch two independent pieces of data?

<details><summary>Answer</summary>

No — this fetches sequentially (a waterfall). Starting both promises before awaiting either (or using `Promise.all`) lets them run in parallel, reducing total wait time.

</details>

---

## Conceptual Questions

1. What's the difference between Server Components and Client Components, and what determines which one a file becomes?
2. Explain the difference between a Layout and a Template.
3. How does ISR differ from pure SSG and pure SSR?
4. What triggers a route to be dynamically rendered (SSR) automatically in the App Router?
5. What's the difference between `revalidatePath` and `revalidateTag`?
6. Why are Server Actions often preferred over hand-built API Routes for internal form submissions?
7. What does Next.js's extended `fetch` caching add on top of the native Fetch API?
8. Why must `error.tsx` be a Client Component?
9. What's the purpose of Middleware, and what are its Edge Runtime limitations?
10. How does streaming with Suspense improve perceived performance compared to waiting for a full page render?
