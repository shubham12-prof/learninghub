# Server Components (Concept)

React Server Components (RSC) are components that render **entirely on the server**, sending only the resulting UI description (not JS code) to the client — reducing the JS bundle shipped to the browser and allowing direct, secure access to server-only resources (databases, file systems, secrets) inside a component.

```jsx
// A Server Component (e.g., in Next.js App Router — no "use client" directive)
// This runs ONLY on the server; its code (and any imports) never reach the browser bundle.
async function ProductList() {
  const products = await db.query("SELECT * FROM products"); // direct DB access — safe, server-only
  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}
```

```jsx
// A Client Component — explicitly opts into client-side interactivity/state
"use client";
import { useState } from "react";

function LikeButton() {
  const [liked, setLiked] = useState(false);
  return (
    <button onClick={() => setLiked(!liked)}>{liked ? "❤️" : "🤍"}</button>
  );
}
```

**Server vs Client Components:**

|                                      | Server Components     | Client Components  |
| ------------------------------------ | --------------------- | ------------------ |
| Runs where                           | server only           | browser (hydrated) |
| Can use hooks (useState, useEffect)? | No                    | Yes                |
| Can access DB/filesystem directly?   | Yes                   | No                 |
| Ships JS to the browser?             | No (zero bundle cost) | Yes                |
| Can be interactive?                  | No                    | Yes                |

**Interview note:** Server Components are a framework-level feature (Next.js App Router is the primary real-world implementation) rather than a plain `create-react-app`/Vite feature — they require a compatible bundler/router that supports the RSC protocol for streaming server-rendered output to the client.
