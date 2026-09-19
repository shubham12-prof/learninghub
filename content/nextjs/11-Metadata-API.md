# Metadata API

Next.js's built-in system for defining `<head>` content — titles, descriptions, Open Graph tags, favicons — declaratively, either as a static object or generated dynamically per-route.

**Static metadata:**

```tsx
// app/about/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn more about our company",
  openGraph: {
    title: "About Us",
    images: ["/og-about.png"],
  },
};

export default function AboutPage() {
  return <h1>About</h1>;
}
```

**Dynamic metadata — generated based on route params or fetched data:**

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPost(params.slug);
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { images: [post.coverImage] },
  };
}

export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);
  return <article>{post.content}</article>;
}
```

**Metadata merging — child segments merge with (and can override) parent metadata:**

```tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: { default: "My Site", template: "%s | My Site" }, // template applies to child titles
};

// app/about/page.tsx
export const metadata: Metadata = { title: "About" };
// Final rendered <title> becomes: "About | My Site"
```

**File-based metadata** — Next.js also auto-detects special files for common metadata needs, no code required:

```
app/
├── favicon.ico
├── opengraph-image.png
├── robots.txt
├── sitemap.xml
```

**Interview note:** the Metadata API replaces manually managing `<Head>` tags (as in older React/Next.js patterns) with a type-safe, colocated, server-rendered approach — since metadata is resolved on the server before the page streams to the client, it's immediately available to search engine crawlers and social media link previews, unlike client-side-only title updates.
