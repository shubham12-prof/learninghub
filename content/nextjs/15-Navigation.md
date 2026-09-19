# Navigation

Beyond the `<Link>` component, Next.js provides hooks for programmatic navigation and reading route state — all client-side (`"use client"` required).

```tsx
"use client";
import {
  useRouter,
  usePathname,
  useSearchParams,
  useParams,
} from "next/navigation";

function SearchBar() {
  const router = useRouter();

  const handleSubmit = (query: string) => {
    router.push(`/search?q=${query}`); // navigate to a new URL, adds history entry
    // router.replace(`/search?q=${query}`); // navigate WITHOUT adding a history entry
    // router.back();                            // go back
    // router.refresh();                            // re-fetch current route's Server Component data
  };

  return (
    <input
      onKeyDown={(e) =>
        e.key === "Enter" && handleSubmit(e.currentTarget.value)
      }
    />
  );
}
```

**Reading the current URL/route state:**

```tsx
"use client";
import { usePathname, useSearchParams, useParams } from "next/navigation";

function CurrentRoute() {
  const pathname = usePathname(); // e.g. "/blog/hello-world"
  const searchParams = useSearchParams(); // e.g. reading "?page=2" -> searchParams.get("page")
  const params = useParams(); // dynamic route params, e.g. { slug: "hello-world" }

  return <p>You're on: {pathname}</p>;
}
```

**`router.refresh()` — a distinctly Next.js concept:** re-fetches the current route's Server Component data from the server WITHOUT losing client-side state (like scroll position or open modals) or doing a full page reload. Commonly used after a Server Action mutates data, to reflect the change.

```tsx
"use client";
import { useRouter } from "next/navigation";

function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const handleDelete = async () => {
    await deleteItem(id); // a Server Action
    router.refresh(); // re-fetch server data to show the updated list
  };
  return <button onClick={handleDelete}>Delete</button>;
}
```

**Interview note:** all of `useRouter`, `usePathname`, `useSearchParams`, and `useParams` come from `next/navigation` (App Router) — a common gotcha for developers coming from the older Pages Router is accidentally importing the same-named hooks from `next/router`, which is the Pages Router's (different, incompatible) API.
