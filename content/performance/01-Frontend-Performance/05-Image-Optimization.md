# 05. Image Optimization

## Why Image Optimization Matters

Images are typically the single largest contributor to a webpage's total download size — often outweighing all JavaScript, CSS, and HTML combined. Optimizing images is frequently the highest-leverage performance improvement available, especially for content-heavy or e-commerce sites.

```
Typical unoptimized page: 2-4MB+ of images out of a total 3-5MB page weight
Properly optimized:          200-500KB of images for the SAME visual content
```

## Choosing the Right Image Format

| Format   | Best For                                            | Notes                                                                                                         |
| -------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **JPEG** | Photos, complex images with gradients               | Lossy compression, good general-purpose choice                                                                |
| **PNG**  | Images needing transparency, sharp edges/text       | Lossless, larger file sizes than JPEG for photos                                                              |
| **WebP** | Almost everything — modern replacement for JPEG/PNG | ~25-35% smaller than JPEG at equivalent quality, supports transparency + lossy/lossless, wide browser support |
| **AVIF** | Even better compression than WebP                   | Newest format, excellent compression, growing but not yet universal browser support                           |
| **SVG**  | Icons, logos, simple illustrations                  | Vector-based, scales infinitely, tiny file size for simple graphics                                           |

```html
<!-- Serving modern formats with automatic fallback -->
<picture>
  <source srcset="photo.avif" type="image/avif" />
  <source srcset="photo.webp" type="image/webp" />
  <img src="photo.jpg" alt="Fallback for browsers supporting neither" />
</picture>
```

The browser tries each `<source>` in order, using the first format it supports — this gives you the best available compression for each visitor's specific browser, with a guaranteed working fallback.

## Responsive Images — Serving the Right Size for Each Device

Serving a single, large image to every device (including small mobile screens) wastes significant bandwidth — `srcset` and `sizes` let the browser choose the most appropriately-sized image variant.

```html
<img
  src="photo-800w.jpg"
  srcset="
    photo-400w.jpg   400w,
    photo-800w.jpg   800w,
    photo-1200w.jpg 1200w,
    photo-1600w.jpg 1600w
  "
  sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 800px"
  alt="Responsive photo"
/>
```

```
srcset:  declares AVAILABLE image widths (the browser picks the best one for the current viewport/DPR)
sizes:     tells the browser how large the image will actually be DISPLAYED at different viewport widths,
            so it can make an informed choice from srcset BEFORE the CSS layout is even fully computed
```

## Compression — Lossy vs Lossless

```
Lossy compression:     discards some image data to achieve smaller file sizes — imperceptible at
                        reasonable quality settings (JPEG, WebP, AVIF all support this)
Lossless compression:    reduces file size WITHOUT discarding any data — smaller gains, but
                          zero quality loss (PNG is lossless by nature)
```

```bash
# Command-line compression tools
npx @squoosh/cli --webp '{"quality":80}' photo.jpg
npx imagemin photo.jpg --out-dir=optimized --plugin=mozjpeg
```

Most build pipelines automate this via a bundler plugin rather than manual per-image compression.

```js
// Vite example — vite-plugin-image-optimizer
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

export default {
  plugins: [
    ViteImageOptimizer({
      jpg: { quality: 80 },
      webp: { quality: 80 },
    }),
  ],
};
```

## Lazy Loading Images — Preview (Full Detail in Lazy Loading Notes)

```html
<img src="photo.jpg" alt="Below-the-fold content" loading="lazy" />
```

Deferring below-the-fold images until they're near the viewport (full detail in the dedicated Lazy Loading notes) avoids downloading images the user might never even scroll to see.

## Image CDNs — Automatic, On-the-Fly Optimization

Rather than manually generating and managing multiple sizes/formats of every image, an image CDN (Cloudinary, Imgix, Cloudflare Images, or a framework's built-in image service) can transform images on the fly based on URL parameters.

```
https://images.example.com/photo.jpg?w=800&format=webp&quality=80
```

```html
<img
  src="https://images.example.com/photo.jpg?w=400&format=auto"
  srcset="
    https://images.example.com/photo.jpg?w=400&format=auto 400w,
    https://images.example.com/photo.jpg?w=800&format=auto 800w
  "
  alt="Automatically optimized"
/>
```

`format=auto` (or similar) commonly lets the CDN automatically serve the best format the requesting browser supports (AVIF, WebP, or JPEG fallback) — offloading the entire format/size decision matrix to the CDN rather than manually generating every combination yourself.

## Framework-Specific Image Optimization

### Next.js `<Image>` Component

```jsx
import Image from "next/image";

function ProductPhoto() {
  return (
    <Image
      src="/product.jpg"
      alt="Product"
      width={800}
      height={600}
      priority // marks this as high-priority (e.g., for an LCP image) — loads eagerly, not lazily
    />
  );
}
```

Next.js's `<Image>` component automatically handles responsive `srcset` generation, lazy loading (by default, unless `priority` is set), modern format serving (WebP/AVIF where supported), and layout-shift prevention (via required `width`/`height`) — encapsulating most of the manual techniques above into a single component.

## Preventing Cumulative Layout Shift (CLS) from Images

If an image's dimensions aren't reserved in advance, the page layout shifts once the image finishes loading and the browser learns its actual size — a jarring user experience and a directly-measured Core Web Vital (CLS).

```html
<!-- BAD — no dimensions specified, causes layout shift once the image loads -->
<img src="photo.jpg" alt="Photo" />

<!-- GOOD — explicit dimensions reserve the correct space BEFORE the image loads -->
<img src="photo.jpg" alt="Photo" width="800" height="600" />
```

```css
/* Alternative/complementary approach — aspect-ratio CSS reserves space based on a ratio */
img {
  aspect-ratio: 4 / 3;
  width: 100%;
  height: auto;
}
```

## Preloading the LCP Image

For the specific image that constitutes your page's Largest Contentful Paint (often a hero image), explicitly preloading it can improve LCP timing by starting the download as early as possible, even before the browser would otherwise discover it in the HTML.

```html
<link rel="preload" as="image" href="hero-banner.webp" />
```

## Common Interview-Style Questions

- **Why is WebP generally preferred over JPEG/PNG for most images today?**
  It typically achieves 25-35% smaller file sizes than JPEG at equivalent visual quality, while also supporting transparency (unlike JPEG) and both lossy and lossless compression modes, with wide modern browser support — making it a strong general-purpose replacement for both older formats in most cases.

- **What do the `srcset` and `sizes` attributes accomplish together?**
  `srcset` declares multiple available image width variants; `sizes` tells the browser how large the image will actually be displayed at different viewport widths, letting the browser select the most appropriately-sized variant from `srcset` for the current device, avoiding downloading an unnecessarily large image on smaller screens.

- **Why should you never lazy-load the image responsible for your page's Largest Contentful Paint?**
  Lazy loading defers the start of an image's download until it's near the viewport; for the LCP image (typically a critical above-the-fold visual), this delay directly harms that specific, measured performance metric — it should instead be prioritized (and potentially even preloaded) for immediate loading.

- **How does specifying explicit `width` and `height` attributes on an `<img>` tag help performance?**
  It lets the browser reserve the correct amount of layout space for the image before it has actually finished loading, preventing the page content from visibly shifting once the image's real dimensions become known — directly improving the Cumulative Layout Shift (CLS) Core Web Vital.

- **What's the advantage of using an image CDN over manually generating and managing multiple image sizes/formats?**
  An image CDN can transform images on the fly based on URL parameters (size, format, quality), including automatically serving the best format a given browser supports (AVIF/WebP/JPEG fallback) — eliminating the need to manually pre-generate and manage every size/format combination yourself, and adapting automatically as browser support evolves.
