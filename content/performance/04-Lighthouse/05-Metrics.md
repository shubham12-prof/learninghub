# Lighthouse — Metrics (LCP, CLS, INP, FCP, TTFB)

## 1. Overview: Core Web Vitals vs Other Metrics

**Core Web Vitals** are the subset of metrics Google uses as user-experience signals (including for search ranking): **LCP**, **CLS**, and **INP** (which replaced FID in March 2024). FCP and TTFB are supporting/diagnostic metrics.

```
                     ┌─────────────────────────────┐
                     │      CORE WEB VITALS         │
                     │  LCP · CLS · INP              │
                     └─────────────────────────────┘
                                  ▲
        supporting metrics: FCP, TTFB, TBT, Speed Index
```

## 2. TTFB — Time To First Byte

**What it measures:** Time from navigation start until the browser receives the first byte of the response from the server.

```
[Navigation Start] --DNS--> --TCP--> --TLS--> --Request--> --Server Processing--> [First Byte Received]
                                                                                          ▲
                                                                                        TTFB
```

**Thresholds:**
| Rating | Time |
|---|---|
| Good | ≤ 0.8s |
| Needs Improvement | 0.8s – 1.8s |
| Poor | > 1.8s |

**What affects it:** server processing time, database query speed, network/CDN routing, redirects.

### Measuring TTFB (JavaScript)

```js
const [entry] = performance.getEntriesByType("navigation");
console.log("TTFB:", entry.responseStart);
```

### How to Improve TTFB

```js
// 1. Use a CDN close to users
// 2. Cache server responses (see Caching notes)
app.get("/api/data", cacheMiddleware, async (req, res) => {
  res.json(await getData());
});

// 3. Avoid unnecessary redirects
// BAD: example.com -> www.example.com -> https://www.example.com (3 hops)
// GOOD: example.com -> https://www.example.com (1 hop, configured directly)

// 4. Optimize server-side rendering / DB queries
// 5. Use HTTP/2 or HTTP/3 to reduce connection overhead
```

## 3. FCP — First Contentful Paint

**What it measures:** Time from navigation start until the browser renders the **first piece of DOM content** (text, image, canvas, SVG — not necessarily the "main" content).

```
[Navigation Start] -----------------> [First text/image painted] = FCP
```

**Thresholds:**
| Rating | Time |
|---|---|
| Good | ≤ 1.8s |
| Needs Improvement | 1.8s – 3.0s |
| Poor | > 3.0s |

### Measuring FCP

```js
new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntriesByName("first-contentful-paint")) {
    console.log("FCP:", entry.startTime);
  }
}).observe({ type: "paint", buffered: true });
```

### How to Improve FCP

```html
<!-- Eliminate render-blocking CSS/JS -->
<link rel="preload" href="critical.css" as="style" />
<style>
  /* inline critical above-the-fold CSS */
</style>
<script src="app.js" defer></script>
```

- Reduce server response time (TTFB is a prerequisite for FCP).
- Eliminate render-blocking resources.
- Minimize CSS/font blocking time (`font-display: swap`).

## 4. LCP — Largest Contentful Paint

**What it measures:** Time until the **largest visible element** (usually a hero image, video poster, or large text block) finishes rendering. Represents when the main content is likely "usable" to the user.

```
[Navigation Start] -------------------------------> [Largest element painted] = LCP
                          (hero image, big heading, etc.)
```

**Thresholds:**
| Rating | Time |
|---|---|
| Good | ≤ 2.5s |
| Needs Improvement | 2.5s – 4.0s |
| Poor | > 4.0s |

### What Counts as the LCP Element

- `<img>` elements
- `<image>` inside `<svg>`
- `<video>` poster images
- Elements with a CSS `background-image`
- Block-level elements containing text nodes

### Measuring LCP

```js
new PerformanceObserver((entryList) => {
  const entries = entryList.getEntries();
  const lastEntry = entries[entries.length - 1]; // LCP can update multiple times
  console.log("LCP:", lastEntry.startTime, lastEntry.element);
}).observe({ type: "largest-contentful-paint", buffered: true });
```

### How to Improve LCP

```html
<!-- 1. Preload the LCP image so it's discovered early -->
<link rel="preload" as="image" href="hero.webp" fetchpriority="high" />
<img src="hero.webp" alt="Hero" fetchpriority="high" />

<!-- 2. Don't lazy-load above-the-fold images (this DELAYS LCP) -->
<!-- BAD -->
<img src="hero.jpg" loading="lazy" />
<!-- GOOD - hero/LCP images should load eagerly -->
<img src="hero.jpg" loading="eager" fetchpriority="high" />
```

```js
// 3. Reduce server response time (TTFB) since LCP can't happen before the byte arrives
// 4. Remove render-blocking CSS/JS that delays paint
// 5. Optimize image size/format (WebP/AVIF, correct dimensions, compression)
// 6. Use a CDN to reduce resource fetch latency
```

## 5. CLS — Cumulative Layout Shift

**What it measures:** Sum of all unexpected layout shift scores during the page's lifetime. Measures visual stability — did content jump around unexpectedly?

```
Layout Shift Score = impact fraction × distance fraction (per shift, summed across session)
```

**Thresholds:**
| Rating | Score |
|---|---|
| Good | ≤ 0.1 |
| Needs Improvement | 0.1 – 0.25 |
| Poor | > 0.25 |

### Common Causes

1. Images/ads/embeds without reserved dimensions
2. Web fonts causing FOIT/FOUT (Flash of Invisible/Unstyled Text) reflow
3. Dynamically injected content pushing existing content down (e.g., a banner loading late)
4. Animations that use layout-triggering properties (`top`, `left`, `width`) instead of `transform`

### Measuring CLS

```js
let clsValue = 0;
new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    if (!entry.hadRecentInput) {
      clsValue += entry.value;
    }
  }
  console.log("Current CLS:", clsValue);
}).observe({ type: "layout-shift", buffered: true });
```

### How to Fix CLS

```html
<!-- 1. Always reserve space for images/videos with explicit dimensions -->
<img src="photo.jpg" width="640" height="360" alt="..." />
<!-- or use aspect-ratio in CSS -->
<style>
  img {
    aspect-ratio: 16 / 9;
    width: 100%;
    height: auto;
  }
</style>

<!-- 2. Reserve space for ads/embeds -->
<div style="min-height: 250px;">
  <!-- ad slot -->
</div>
```

```css
/* 3. Avoid layout-shift-causing font swaps */
@font-face {
  font-family: "MyFont";
  src: url("myfont.woff2") format("woff2");
  font-display: optional; /* or 'swap' with size-adjust to minimize shift */
}
```

```js
// 4. Animate with transform/opacity, not layout properties
// BAD
element.style.top = "100px"; // triggers layout

// GOOD
element.style.transform = "translateY(100px)"; // compositor-only, no layout shift
```

## 6. INP — Interaction to Next Paint

**What it measures:** Responsiveness — the time from a user interaction (click, tap, key press) to when the browser paints the next frame reflecting the visual result. Replaced **FID (First Input Delay)** as a Core Web Vital in March 2024 because FID only measured the _first_ interaction's delay, while INP measures overall responsiveness across the _whole page lifecycle_ (usually reporting a high-percentile value).

```
[User Interaction] -> [Input Delay] -> [Processing Time] -> [Presentation Delay] -> [Next Paint]
                        └──────────────────── INP ─────────────────────────┘
```

**Thresholds:**
| Rating | Time |
|---|---|
| Good | ≤ 200ms |
| Needs Improvement | 200ms – 500ms |
| Poor | > 500ms |

### Measuring INP

```js
new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    console.log("Interaction:", entry.name, "Duration:", entry.duration);
  }
}).observe({ type: "event", buffered: true, durationThreshold: 40 });
```

### How to Improve INP

```js
// 1. Break up long tasks (>50ms) so the main thread stays responsive
function processData(items) {
  let i = 0;
  function processChunk(deadline) {
    while (i < items.length && (deadline?.timeRemaining() > 0 || !deadline)) {
      doExpensiveWork(items[i++]);
    }
    if (i < items.length) requestIdleCallback(processChunk);
  }
  requestIdleCallback(processChunk);
}

// 2. Debounce/throttle expensive event handlers
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
searchInput.addEventListener("input", debounce(handleSearch, 200));

// 3. Use the `content-visibility` CSS property to reduce rendering cost of offscreen content
```

```css
.long-list-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 100px;
}
```

```js
// 4. Yield to the browser using the Scheduler API where supported
async function handleClick() {
  await scheduler.postTask(() => updateUI(), { priority: "user-blocking" });
  await scheduler.postTask(() => logAnalytics(), { priority: "background" });
}
```

## 7. Summary Table

| Metric | Full Name                 | Measures                                 | Good Threshold | Core Web Vital? |
| ------ | ------------------------- | ---------------------------------------- | -------------- | --------------- |
| TTFB   | Time To First Byte        | Server response speed                    | ≤ 0.8s         | No (supporting) |
| FCP    | First Contentful Paint    | First content rendered                   | ≤ 1.8s         | No (supporting) |
| LCP    | Largest Contentful Paint  | Main content loaded                      | ≤ 2.5s         | **Yes**         |
| CLS    | Cumulative Layout Shift   | Visual stability                         | ≤ 0.1          | **Yes**         |
| INP    | Interaction to Next Paint | Responsiveness                           | ≤ 200ms        | **Yes**         |
| TBT    | Total Blocking Time       | Main thread blocking (lab proxy for INP) | ≤ 200ms        | No (lab only)   |

## 8. Measuring Real User Metrics with `web-vitals` Library

```bash
npm install web-vitals
```

```js
import { onCLS, onINP, onLCP, onFCP, onTTFB } from "web-vitals";

function sendToAnalytics(metric) {
  navigator.sendBeacon("/analytics", JSON.stringify(metric));
}

onCLS(sendToAnalytics);
onINP(sendToAnalytics);
onLCP(sendToAnalytics);
onFCP(sendToAnalytics);
onTTFB(sendToAnalytics);
```

## 9. Best Practices

1. Prioritize LCP, CLS, INP first — they directly affect Core Web Vitals scores and SEO.
2. Always reserve dimensions for images, ads, and embeds to avoid CLS.
3. Preload/prioritize your LCP element (usually a hero image); never lazy-load it.
4. Break up long JS tasks and debounce expensive handlers to improve INP.
5. Optimize server/backend response time — it's the floor under every other metric (TTFB → FCP → LCP).
6. Measure both **lab data** (Lighthouse, controlled) and **field data** (`web-vitals`, CrUX, real users) — they can differ significantly.
