# Dynamic Routes

Route segments whose value comes from the URL itself rather than a fixed path — defined with square brackets in the folder name.

```
app/
├── blog/
│   └── [slug]/
│       └── page.tsx    # matches "/blog/anything-here"
```

```tsx
// app/blog/[slug]/page.tsx
export default function BlogPost({ params }: { params: { slug: string } }) {
  return <h1>Post: {params.slug}</h1>; // "/blog/hello-world" -> params.slug === "hello-world"
}
```

**Catch-all segments — `[...slug]` matches multiple path segments as an array:**

```
app/
├── docs/
│   └── [...slug]/
│       └── page.tsx    # matches "/docs/a", "/docs/a/b", "/docs/a/b/c", etc.
```

```tsx
export default function Docs({ params }: { params: { slug: string[] } }) {
  return <p>{params.slug.join(" / ")}</p>; // "/docs/a/b/c" -> params.slug === ["a","b","c"]
}
```

**Optional catch-all — `[[...slug]]` also matches the base route with NO extra segments:**

```
app/
├── shop/
│   └── [[...slug]]/
│       └── page.tsx    # matches "/shop" AND "/shop/a" AND "/shop/a/b"
```

**Generating static params ahead of time (for SSG — see that file) with `generateStaticParams`:**

```tsx
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug })); // pre-renders each of these at build time
}
```

**Interview note:** the difference between `[slug]`, `[...slug]`, and `[[...slug]]` is a very common interview question — single dynamic segment (exactly one path part), catch-all (one or more parts, required), and optional catch-all (zero or more parts, so the base route without any extra segments also matches).
