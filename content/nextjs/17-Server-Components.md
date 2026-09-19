# Server Components

The **default** component type in the App Router — rendered entirely on the server, sending only HTML (and a compact serialized description) to the browser, with zero JS shipped for that component's own code.

```tsx
// app/products/page.tsx — a Server Component by default, no directive needed
async function getProducts() {
  const res = await fetch("https://api.example.com/products");
  return res.json();
}

export default async function ProductsPage() {
  const products = await getProducts(); // direct async/await, right in the component — no useEffect needed
  return (
    <ul>
      {products.map((p: any) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}
```

**What Server Components CAN do that Client Components can't:**

- Directly `await` data (databases, file system, internal APIs) inside the component body — no `useEffect`/loading state boilerplate.
- Access server-only resources safely (DB credentials, secret API keys) — this code never reaches the browser bundle.
- Keep large dependencies (e.g., a markdown parser, a heavy date library) entirely out of the client JS bundle.

**What Server Components CANNOT do:**

- Use hooks (`useState`, `useEffect`, `useContext`, etc.)
- Use event handlers (`onClick`, etc.) — no interactivity
- Access browser-only APIs (`window`, `localStorage`)

**Server vs Client Components:**

|                                 | Server Component | Client Component                |
| ------------------------------- | ---------------- | ------------------------------- |
| Default in `app/`?              | Yes              | No — opt in with `"use client"` |
| Ships JS to browser?            | No               | Yes                             |
| Can use hooks/state?            | No               | Yes                             |
| Can directly access DB/secrets? | Yes              | No                              |
| Can be interactive?             | No               | Yes                             |

**Composition pattern:** a typical Next.js page is a Server Component (fetching data, handling SEO) that renders smaller Client Components only where interactivity is genuinely needed (a like button, a dropdown, a form) — maximizing the amount of code that never ships to the browser.

**Interview note:** "Why default to Server Components?" — they reduce the JS bundle sent to the browser (faster load, less to parse/execute), let data fetching happen closer to the data source (often lower latency than a client-side fetch), and keep sensitive logic/credentials off the client entirely — but they trade away interactivity, which is why the framework still needs Client Components for anything stateful.
