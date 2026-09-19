# Client Components

Components explicitly opted into client-side rendering with the `"use client"` directive — needed for interactivity (state, event handlers, browser-only APIs) since Server Components (the default in `app/`) can't use any of these.

```tsx
"use client"; // must be at the very top of the file, before any imports

import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0); // hooks require a Client Component
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

**When you NEED `"use client"`:**

- Using React hooks (`useState`, `useEffect`, `useContext`, etc.)
- Event handlers (`onClick`, `onChange`, etc.)
- Browser-only APIs (`window`, `localStorage`, `navigator`)
- Class components with lifecycle methods
- Third-party libraries that themselves rely on hooks/browser APIs (e.g., many UI component libraries, charting libraries)

**`"use client"` marks a boundary, not just one file** — everything imported into a Client Component's tree (below it) also runs on the client, even without its own `"use client"` directive:

```tsx
"use client";
import Counter from "./Counter"; // Counter doesn't need its own directive —
// it's already inside a client boundary via this import
```

**Server Components can still be passed as `children` to Client Components** — an important pattern for keeping as much as possible on the server:

```tsx
// ClientWrapper.tsx
"use client";
export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return <div onClick={() => setOpen(!open)}>{open && children}</div>;
}

// page.tsx (Server Component)
import ClientWrapper from "./ClientWrapper";
import ServerContent from "./ServerContent"; // stays a Server Component!

export default function Page() {
  return (
    <ClientWrapper>
      <ServerContent />{" "}
      {/* passed as children — still rendered on the server */}
    </ClientWrapper>
  );
}
```

**Interview note:** the "children as a slot" pattern above is the standard technique for keeping data-fetching-heavy content on the server while still nesting it inside an interactive Client Component wrapper (like a modal or accordion) — avoiding the need to make the entire subtree a Client Component just because one small wrapper needs interactivity.
