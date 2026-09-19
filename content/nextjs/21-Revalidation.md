# Revalidation

The process of refreshing cached data after it's gone stale — Next.js supports both **time-based** (automatic) and **on-demand** (manually triggered) revalidation.

**Time-based revalidation — set an expiration on a specific fetch:**

```tsx
const res = await fetch("https://api.example.com/posts", {
  next: { revalidate: 3600 }, // cache this response, refresh at most once per hour
});
```

**On-demand revalidation with `revalidatePath` — invalidates the cache for a specific route, typically called from a Server Action after a mutation:**

```tsx
"use server";
import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  await db.post.create({ data: { title: formData.get("title") as string } });
  revalidatePath("/posts"); // next visit to /posts fetches fresh data instead of using the stale cache
}
```

**On-demand revalidation with `revalidateTag` — invalidates ALL fetches sharing a tag, across any route, more targeted than a full path:**

```tsx
// Tagging a fetch when it's made
const res = await fetch("https://api.example.com/posts", {
  next: { tags: ["posts"] },
});

// Later, invalidating everything tagged "posts" — could be in a totally different route/action
import { revalidateTag } from "next/cache";
revalidateTag("posts");
```

**`revalidatePath` vs `revalidateTag`:**

|                  | Scope                                                                | Use when                                                        |
| ---------------- | -------------------------------------------------------------------- | --------------------------------------------------------------- |
| `revalidatePath` | invalidates a specific route's cache                                 | you know exactly which page(s) need fresh data                  |
| `revalidateTag`  | invalidates every fetch tagged with that string, regardless of route | the same data appears across multiple, possibly unrelated pages |

**Real-world example — invalidating a product listing after an admin edits a product:**

```tsx
"use server";
export async function updateProduct(id: string, data: ProductInput) {
  await db.product.update({ where: { id }, data });
  revalidateTag("products"); // refreshes the product listing page
  revalidatePath(`/products/${id}`); // AND refreshes this specific product's detail page
}
```

**Interview note:** revalidation is the mechanism that makes ISR (see that file) practical for content that changes based on user actions (not just a fixed timer) — a mutation via a Server Action can immediately invalidate exactly the cached data it affected, rather than waiting for a time-based revalidation window to pass.
