# Server Actions

Async functions that run **exclusively on the server** but can be called directly from Client (or Server) Components — typically used for form submissions and data mutations, without manually building a separate API route.

```tsx
// app/actions.ts
"use server"; // marks every exported function in this file as a Server Action

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  await db.post.create({ data: { title } });
  revalidatePath("/posts"); // refresh cached data for that route (see Revalidation file)
}
```

**Using a Server Action directly in a form (progressive enhancement — works even without JS):**

```tsx
// app/posts/new/page.tsx — Server Component
import { createPost } from "@/app/actions";

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <button type="submit">Create Post</button>
    </form>
  );
}
```

**Calling a Server Action from a Client Component (e.g., outside a plain form, like a button click):**

```tsx
"use client";
import { deletePost } from "@/app/actions";

export default function DeleteButton({ id }: { id: string }) {
  return <button onClick={() => deletePost(id)}>Delete</button>;
}
```

**Inline Server Actions (defined directly inside a Server Component):**

```tsx
export default function Page() {
  async function handleSubmit(formData: FormData) {
    "use server"; // marks just this function as a Server Action
    // ... mutate data ...
  }
  return <form action={handleSubmit}>...</form>;
}
```

**Handling pending/loading state with `useFormStatus`:**

```tsx
"use client";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? "Saving..." : "Save"}</button>;
}
```

**Interview note:** Server Actions replace a lot of what would otherwise require a hand-built API Route + client-side `fetch` call — they're type-safe (no manual JSON serialization boilerplate), support progressive enhancement (forms work even before JS hydrates), and integrate directly with Next.js's caching/revalidation system via `revalidatePath`/`revalidateTag`.
