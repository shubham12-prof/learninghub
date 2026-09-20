# 02. Lazy Loading

## What is Lazy Loading?

Lazy loading defers loading a resource (JavaScript, images, components, data) until it's actually needed — typically when it's about to become visible or relevant to the user — rather than loading everything upfront. It's a broader concept than code splitting specifically; lazy loading applies to images, videos, iframes, and data-fetching, not just JavaScript code.

```
Eager loading (default):  EVERYTHING loads immediately on page load, whether visible or not
Lazy loading:                only load what's currently needed/visible; defer the rest until
                              it's actually about to be needed
```

## Lazy Loading Images — The Most Common Use Case

### Native Browser Lazy Loading

```html
<img src="product-photo.jpg" alt="Product" loading="lazy" />
```

The `loading="lazy"` attribute is natively supported by all modern browsers — the browser itself handles deferring the image download until it's near the viewport, with **zero JavaScript required**. This should be the default choice for most below-the-fold images today.

```html
<!-- Above-the-fold, critical images should NOT be lazy-loaded — they need to load immediately -->
<img src="hero-banner.jpg" alt="Hero" loading="eager" />
<!-- or simply omit "loading" entirely -->

<!-- Below-the-fold images — lazy load -->
<img src="testimonial-photo.jpg" alt="Customer" loading="lazy" />
```

> **Important nuance:** never lazy-load your Largest Contentful Paint (LCP) image (typically a hero image or primary above-the-fold visual) — doing so actually **delays** a key performance metric, since the browser waits to even start fetching it until it detects it's near the viewport, when it should be prioritized immediately.

### Intersection Observer — For More Control (Legacy Browsers or Advanced Cases)

Before native `loading="lazy"` was widely supported, and still useful for more customized lazy-loading logic (like custom loading thresholds, or lazy-loading non-image content), the Intersection Observer API detects when an element enters the viewport.

```js
const images = document.querySelectorAll("img[data-src]");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src; // swap the real src in once it's about to become visible
        observer.unobserve(img);
      }
    });
  },
  { rootMargin: "50px" },
); // start loading 50px BEFORE the image actually enters the viewport

images.forEach((img) => observer.observe(img));
```

```html
<img data-src="photo.jpg" alt="Lazy image" />
<!-- no "src" initially — nothing downloads until observed -->
```

## Lazy Loading in React with `IntersectionObserver`

```jsx
import { useState, useEffect, useRef } from "react";

function LazyImage({ src, alt }) {
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" },
    );

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef}>
      {isVisible ? (
        <img src={src} alt={alt} />
      ) : (
        <div className="image-placeholder" />
      )}
    </div>
  );
}
```

In practice, most teams reach for a well-tested library (`react-lazyload`, `react-intersection-observer`) or the framework's built-in image component (Next.js's `<Image>`, covered in the Image Optimization notes) rather than hand-rolling this.

## Lazy Loading iframes and Videos

```html
<iframe src="https://youtube.com/embed/..." loading="lazy"></iframe>
<video src="video.mp4" preload="none" poster="thumbnail.jpg" controls></video>
```

`preload="none"` on a `<video>` tells the browser not to download any of the video until the user actually initiates playback — showing a poster image (a static thumbnail) in the meantime.

## Lazy Loading Components — Preview (Full Detail in Code Splitting Notes)

```jsx
const HeavyModal = lazy(() => import("./HeavyModal"));
```

This is fundamentally the same underlying mechanism as code splitting — deferring the download of a component's JavaScript until it's actually rendered/needed (full detail in the dedicated Code Splitting notes).

## Lazy Loading Data — Beyond Just Assets

The same principle applies to data fetching — don't fetch data for content the user hasn't scrolled to or interacted with yet.

```jsx
function CommentsSection({ postId }) {
  const [loadComments, setLoadComments] = useState(false);

  return (
    <div>
      {!loadComments ? (
        <button onClick={() => setLoadComments(true)}>Show Comments</button>
      ) : (
        <Comments postId={postId} /> // only fetches comment data once actually requested
      )}
    </div>
  );
}
```

## Infinite Scroll — A Lazy-Loading Pattern for Long Lists

```jsx
function ProductList() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPage((prev) => prev + 1); // load the NEXT page only once the sentinel element is visible
      }
    });
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchProducts(page).then((newProducts) =>
      setProducts((prev) => [...prev, ...newProducts]),
    );
  }, [page]);

  return (
    <div>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
      <div ref={observerTarget} />{" "}
      {/* invisible "sentinel" element that triggers loading more */}
    </div>
  );
}
```

(For very long lists, this should typically be combined with **virtualization**, covered in its own dedicated notes, to also avoid rendering an ever-growing number of DOM nodes.)

## Common Interview-Style Questions

- **What is lazy loading, and how is it broader than just code splitting?**
  Deferring the loading of any resource — JavaScript, images, videos, iframes, or data — until it's actually needed, typically when it's about to become visible or relevant; code splitting is specifically about lazily loading JavaScript, while lazy loading as a concept also applies to images, media, and data fetching.

- **Why should you never lazy-load your page's Largest Contentful Paint (LCP) image?**
  Lazy loading defers the start of the image's download until the browser detects it's near the viewport; for the LCP image (typically a critical above-the-fold visual), this delay directly harms a key performance metric, since that image should be prioritized and fetched immediately rather than deferred.

- **What does the native `loading="lazy"` HTML attribute do, and when is it appropriate to use?**
  It tells the browser to natively defer loading an image (or iframe) until it's near the viewport, requiring no JavaScript; appropriate for below-the-fold images and non-critical embedded content, but should be avoided for above-the-fold critical content like the LCP image.

- **How does the Intersection Observer API enable custom lazy-loading behavior?**
  It lets you register a callback that fires when an observed element enters (or approaches, via `rootMargin`) the viewport, allowing you to trigger loading of that element's actual content (swapping in a real image `src`, fetching data, rendering a component) only at that point, rather than eagerly loading everything upfront.

- **Why should infinite scroll implementations for very long lists typically also incorporate virtualization?**
  Lazy loading additional pages of data solves the network/data-fetching cost, but without virtualization, the number of actual DOM nodes rendered keeps growing unboundedly as more pages load, eventually causing rendering/scrolling performance problems — virtualization addresses this separate concern by only rendering the DOM nodes currently visible in the viewport.
