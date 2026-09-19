# Images

The built-in `next/image` component automatically optimizes images — resizing, format conversion (WebP/AVIF), lazy loading, and preventing layout shift — replacing the plain HTML `<img>` tag.

```tsx
import Image from "next/image";

export default function Profile() {
  return (
    <Image
      src="/profile.jpg"
      alt="User profile photo"
      width={400}
      height={400}
      priority // disables lazy-loading — use for above-the-fold, LCP-critical images
    />
  );
}
```

**Why `width`/`height` are required:** Next.js uses them to calculate the image's aspect ratio and reserve the correct space in the layout BEFORE the image loads — preventing Cumulative Layout Shift (CLS), a Core Web Vitals metric.

**Remote images require explicit domain allow-listing (security measure):**

```ts
// next.config.js
module.exports = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.example.com" }],
  },
};
```

```tsx
<Image
  src="https://images.example.com/photo.jpg"
  width={300}
  height={300}
  alt="Remote photo"
/>
```

**`fill` — for images with an unknown/responsive size, filling a positioned parent container:**

```tsx
<div style={{ position: "relative", width: "100%", height: "300px" }}>
  <Image src="/banner.jpg" alt="Banner" fill style={{ objectFit: "cover" }} />
</div>
```

**Automatic optimizations `next/image` provides over a plain `<img>`:**

- Serves modern formats (WebP/AVIF) automatically when the browser supports them, falling back to the original format otherwise.
- Generates and serves appropriately sized images per device (responsive `srcset`) instead of one large file for all screens.
- Lazy-loads images below the fold by default (unless `priority` is set).
- Prevents layout shift by reserving space based on the declared dimensions.

**Interview note:** `priority` should be used specifically for the Largest Contentful Paint (LCP) image on a page (e.g., a hero image) — marking it disables lazy loading and hints the browser to fetch it with higher priority, directly improving the LCP performance metric.
