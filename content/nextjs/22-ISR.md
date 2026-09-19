# ISR

Incremental Static Regeneration — lets you use static generation (fast, cached HTML) for pages, while still keeping the content periodically fresh, WITHOUT rebuilding the entire site.

**How it works:** a page is generated statically at build time (or on first request). After the configured revalidation period, the NEXT request still gets the (now stale) cached version instantly, but Next.js regenerates a fresh version in the background — subsequent requests then get the updated version. No visitor ever waits for a rebuild.

```tsx
// app/products/[id]/page.tsx
async function getProduct(id: string) {
  const res = await fetch(`https://api.example.com/products/${id}`, {
    next: { revalidate: 3600 }, // regenerate this page's cache at most once per hour
  });
  return res.json();
}

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProduct(params.id);
  return <h1>{product.name}</h1>;
}
```

**ISR vs pure SSG vs pure SSR:**

|                    | SSG                               | ISR                                                           | SSR                                   |
| ------------------ | --------------------------------- | ------------------------------------------------------------- | ------------------------------------- |
| When generated     | build time, once                  | build time (or on-demand), then periodically refreshed        | every single request                  |
| Serves stale data? | Never updates without a rebuild   | Briefly, until background regeneration completes              | Never — always fresh                  |
| Server load        | none after build                  | very low — most requests hit the cache                        | high — every request does real work   |
| Good for           | content that rarely/never changes | content that changes occasionally (product pages, blog posts) | highly personalized/real-time content |

**On-demand ISR** — combine with `revalidatePath`/`revalidateTag` (see Revalidation file) to refresh a specific page immediately after a content change, instead of waiting for the timer:

```tsx
"use server";
export async function publishPost(id: string) {
  await db.post.update({ where: { id }, data: { published: true } });
  revalidatePath(`/blog/${id}`); // instantly fresh, no need to wait for the revalidate timer
}
```

**Interview note:** ISR's key advantage over pure SSG is that content can stay fresh over time without a full site rebuild — and its key advantage over pure SSR is that most visitors are served an already-cached response instantly, with regeneration happening in the background rather than blocking every request.
