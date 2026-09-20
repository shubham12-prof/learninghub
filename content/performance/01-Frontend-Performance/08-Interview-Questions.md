# 08. Interview Questions — Frontend Performance (Comprehensive)

A consolidated set of commonly asked frontend performance interview questions, organized by topic, with concise answers and code where useful.

---

## Code Splitting

**Q: What is code splitting, and why does it help performance?**
Breaking a large bundle into smaller chunks loaded independently, so users only download code needed for their current view, reducing what must be downloaded/parsed/executed before the page is interactive.

**Q: Route-based vs component-based splitting?**
Route-based splits by page; component-based targets specific heavy components (modals, charts) within a page that aren't needed for initial render.

**Q: Why separate vendor code into its own chunk?**
Libraries change less often than app code; a separate vendor chunk stays cached across app deployments since it hasn't changed.

**Q: `webpackPrefetch` vs `webpackPreload`?**
Prefetch fetches during idle time for something likely needed soon; preload fetches with higher priority for something needed imminently.

---

## Lazy Loading

**Q: How is lazy loading broader than code splitting?**
It applies to any resource — images, video, iframes, data — not just JavaScript.

**Q: Why never lazy-load the LCP image?**
Lazy loading delays the start of the fetch until near-viewport detection, directly harming the LCP metric which needs immediate prioritization.

**Q: What does native `loading="lazy"` do?**
Tells the browser to natively defer image/iframe loading until near the viewport, with no JavaScript required.

**Q: Why combine infinite scroll with virtualization for long lists?**
Infinite scroll solves data-fetching cost; virtualization separately solves the growing DOM-node-count problem.

---

## Tree Shaking

**Q: What makes tree shaking possible?**
ES Modules' static import/export structure, analyzable at build time without executing code — unlike CommonJS's dynamic `require()`.

**Q: Why might a CommonJS library fail to tree-shake even with `import` syntax?**
Its exports are determined dynamically at runtime, so the bundler can't statically prove what's unused and must conservatively include the whole module.

**Q: What does the `sideEffects` field control?**
Tells the bundler which files are safe to aggressively tree-shake versus which must always be included if imported (like CSS or polyfills).

**Q: Why can barrel files hurt tree-shaking?**
The bundler may struggle to prove importing one export doesn't require evaluating/including the others, especially with side effects present.

---

## Bundle Analysis

**Q: Why is bundle analysis necessary even with tree shaking/code splitting in place?**
Optimizations can silently fail (non-tree-shakeable imports, barrel files, misconfiguration); analysis is the only way to verify what's actually shipped.

**Q: How would you spot a duplicate dependency in a bundle?**
A treemap visualization shows the same library at different nested paths/versions, typically from incompatible version requirements across dependencies.

**Q: Why pair bundle size with performance profiling?**
Raw byte size doesn't fully capture user-facing impact (parse/execution time, TTI, LCP) — profiling tools measure real-world loading effect.

**Q: Why enforce bundle size budgets in CI?**
Catches regressions immediately in the introducing PR, rather than accumulated bloat becoming hard to isolate later.

---

## Image Optimization

**Q: Why is WebP generally preferred over JPEG/PNG?**
~25-35% smaller at equivalent quality, supports transparency and both lossy/lossless modes, with wide browser support.

**Q: What do `srcset` and `sizes` accomplish together?**
`srcset` declares available width variants; `sizes` tells the browser the image's actual display size at different viewports, enabling selection of the most appropriate variant.

**Q: How do explicit `width`/`height` attributes help performance?**
They reserve layout space before the image loads, preventing content shift and improving CLS.

**Q: Advantage of an image CDN?**
Transforms images on the fly (size, format, quality) including automatic best-format serving, without manually pre-generating every combination.

---

## Font Optimization

**Q: What is FOIT, and how does `font-display: swap` address it?**
Flash of Invisible Text — text hidden while waiting for a custom font; `swap` shows a fallback immediately and swaps once loaded, keeping content readable.

**Q: What is font subsetting?**
Stripping a font to only the characters actually used, dramatically reducing file size versus shipping the full glyph set.

**Q: Advantage of variable fonts?**
One file contains all weights/styles, often smaller in total and requiring only one request versus multiple separate static files.

**Q: Why self-host fonts over a third-party service?**
Avoids extra DNS lookup/connection overhead and gives full control over caching, preloading, and subsetting.

---

## Virtualization

**Q: What problem does virtualization solve?**
Rendering every item in a huge list creates excessive DOM nodes even when most are off-screen, hurting render/memory/scroll performance; virtualization renders only currently-visible items.

**Q: How does virtualization maintain the illusion of a full list?**
Calculates total virtual scrollable height, then absolutely positions only currently-visible items' actual DOM nodes at their correct offset.

**Q: Why is variable-size virtualization more complex?**
Requires tracking/measuring each item's actual height rather than simply multiplying a fixed height by index.

**Q: When would you skip virtualization despite its benefits?**
For short lists (a few dozen items) where the unvirtualized DOM cost is already negligible relative to the added implementation complexity.

---

## Practical / Coding Questions Often Asked Live

**Q: Implement route-based code splitting in React.**

```jsx
const Dashboard = lazy(() => import("./pages/Dashboard"));
<Suspense fallback={<Loading />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Suspense>;
```

**Q: Write a responsive image with modern format fallback.**

```html
<picture>
  <source srcset="photo.avif" type="image/avif" />
  <source srcset="photo.webp" type="image/webp" />
  <img src="photo.jpg" alt="Photo" width="800" height="600" loading="lazy" />
</picture>
```

**Q: Set up font-display swap with a preloaded critical font.**

```html
<link
  rel="preload"
  href="/fonts/main.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
<style>
  @font-face {
    font-family: "MainFont";
    src: url("/fonts/main.woff2") format("woff2");
    font-display: swap;
  }
</style>
```

**Q: Implement a virtualized list with react-window.**

```jsx
import { FixedSizeList } from "react-window";

<FixedSizeList height={600} itemCount={items.length} itemSize={50} width="100%">
  {({ index, style }) => <div style={style}>{items[index].name}</div>}
</FixedSizeList>;
```

**Q: A product listing page loads slowly on mobile. Walk through your diagnostic and optimization approach.**
Run Lighthouse to identify which Core Web Vitals are worst (likely LCP given image-heavy content); check bundle analysis for oversized/duplicate JS dependencies and apply code splitting for non-critical routes/components; audit images for correct format (WebP/AVIF), responsive `srcset`/`sizes`, explicit dimensions to prevent CLS, and lazy loading for below-the-fold images while ensuring the LCP image is preloaded and never lazy-loaded; check font loading strategy (`font-display: swap`, subsetting, preloading critical fonts); if the product grid is very long, consider virtualization; re-measure with Lighthouse after each change to confirm actual impact rather than assuming.

**Q: How would you set up a CI pipeline step to prevent frontend performance regressions from being merged?**
Add a bundle size budget check (via `size-limit` or similar) as a required status check, failing the build if any tracked chunk exceeds its configured threshold; optionally add a Lighthouse CI step running against a preview deployment, asserting minimum scores/thresholds for key Core Web Vitals (LCP, CLS, TBT), so performance-impacting changes are caught and must be consciously addressed before merging rather than discovered later in production.
