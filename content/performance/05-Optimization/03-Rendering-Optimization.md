# Rendering Optimization

## 1. What is Rendering Optimization?

Rendering optimization focuses on how quickly and smoothly the browser can paint content to the screen and respond to user interaction — covering the DOM, CSS, JavaScript execution, and the browser's rendering pipeline.

## 2. The Browser Rendering Pipeline

```
JavaScript --> Style --> Layout --> Paint --> Composite
   |             |          |          |          |
 changes      compute     compute   fill in    layers
 to DOM/CSS   styles      geometry   pixels    combined
                          (reflow)
```

Understanding which stage a change triggers is key: some CSS changes only trigger **Composite** (cheap), others trigger **Layout** (expensive, cascades to children/siblings).

| Property Type                                         | Triggers                                    |
| ----------------------------------------------------- | ------------------------------------------- |
| `transform`, `opacity`                                | Composite only (GPU, cheapest)              |
| `color`, `background`, `visibility`                   | Paint + Composite                           |
| `width`, `height`, `top`, `left`, `margin`, `padding` | Layout + Paint + Composite (most expensive) |

## 3. Rendering Strategies: CSR vs SSR vs SSG vs ISR

```
CSR (Client-Side Rendering):
  Server sends empty HTML shell -> Browser downloads JS -> JS renders content
  Slow initial paint, fast subsequent navigation

SSR (Server-Side Rendering):
  Server renders full HTML per request -> Browser paints immediately -> JS hydrates
  Fast initial paint, but needs "hydration" before interactive

SSG (Static Site Generation):
  HTML pre-built at build time -> served instantly from CDN
  Fastest possible, but content is fixed until rebuild

ISR (Incremental Static Regeneration):
  Static pages, but regenerated in the background on a schedule/on-demand
  Best of both: fast + can stay fresh
```

### Next.js Example of Each

```jsx
// SSG - built once at build time
export async function getStaticProps() {
  const data = await fetchData();
  return { props: { data } };
}

// ISR - rebuilt in the background every 60s
export async function getStaticProps() {
  const data = await fetchData();
  return { props: { data }, revalidate: 60 };
}

// SSR - rendered fresh on every request
export async function getServerSideProps() {
  const data = await fetchData();
  return { props: { data } };
}
```

## 4. Minimizing Reflows & Repaints

### Batch DOM Reads and Writes

```js
// BAD: forces multiple synchronous reflows (layout thrashing)
elements.forEach((el) => {
  const height = el.offsetHeight; // READ (forces layout)
  el.style.height = height + 10 + "px"; // WRITE (invalidates layout)
});

// GOOD: batch all reads first, then all writes
const heights = elements.map((el) => el.offsetHeight); // all READS
elements.forEach((el, i) => {
  el.style.height = heights[i] + 10 + "px"; // all WRITES
});
```

### Use `requestAnimationFrame` for Visual Updates

```js
// BAD: runs outside the render cycle, can cause jank
function updatePosition() {
  el.style.left = x + "px";
  x += 1;
  setTimeout(updatePosition, 16);
}

// GOOD: synced with the browser's repaint cycle
function updatePosition() {
  el.style.transform = `translateX(${x}px)`;
  x += 1;
  requestAnimationFrame(updatePosition);
}
requestAnimationFrame(updatePosition);
```

### Animate with `transform`/`opacity`, Not Layout Properties

```css
/* BAD: triggers layout on every frame */
.box {
  transition:
    left 0.3s,
    top 0.3s;
}

/* GOOD: GPU-accelerated, composite-only */
.box {
  transition:
    transform 0.3s,
    opacity 0.3s;
}
```

### Use `will-change` Sparingly for Known Animations

```css
.modal {
  will-change: transform, opacity;
}
```

Overuse wastes GPU memory by promoting too many layers — use only on elements about to animate.

## 5. Virtualization for Long Lists

Rendering thousands of DOM nodes is expensive. Only render what's visible in the viewport.

```jsx
// React - using react-window for list virtualization
import { FixedSizeList } from "react-window";

function VirtualizedList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => <div style={style}>{items[index].name}</div>}
    </FixedSizeList>
  );
}
```

## 6. Reducing JavaScript Execution / Framework-Specific Optimization

### React — Avoid Unnecessary Re-renders

```jsx
// BAD: component re-renders every time parent re-renders, even if props unchanged
function ExpensiveChild({ data }) {
  return <div>{heavyComputation(data)}</div>;
}

// GOOD: memoize the component
const ExpensiveChild = React.memo(function ExpensiveChild({ data }) {
  return <div>{heavyComputation(data)}</div>;
});
```

```jsx
// Memoize expensive computed values
const sortedData = useMemo(() => data.sort(expensiveSortFn), [data]);

// Memoize callback references passed to children
const handleClick = useCallback(() => doSomething(id), [id]);
```

```jsx
// Avoid creating new objects/arrays inline as props (breaks memoization)
// BAD
<Child options={{ a: 1 }} />;
// GOOD
const options = useMemo(() => ({ a: 1 }), []);
<Child options={options} />;
```

### Code Splitting / Lazy Loading Components

```jsx
import { lazy, Suspense } from "react";

const HeavyChart = lazy(() => import("./HeavyChart"));

function Dashboard() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyChart />
    </Suspense>
  );
}
```

## 7. Reducing Layout Shift (see also Lighthouse CLS notes)

```html
<!-- Reserve space to avoid content jumping when it loads -->
<img src="photo.jpg" width="400" height="300" alt="..." />
<div style="aspect-ratio: 16/9;">
  <!-- video/embed -->
</div>
```

## 8. Font Loading Optimization

```css
@font-face {
  font-family: "MyFont";
  src: url("myfont.woff2") format("woff2");
  font-display: swap; /* show fallback font immediately, swap when ready */
}
```

```html
<link
  rel="preload"
  href="myfont.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

## 9. Reducing Main-Thread Work with Web Workers

Move heavy computation off the main thread so the UI stays responsive.

```js
// main.js
const worker = new Worker("worker.js");
worker.postMessage({ data: largeDataset });
worker.onmessage = (e) => {
  renderResults(e.data);
};

// worker.js
self.onmessage = (e) => {
  const result = heavyComputation(e.data.data);
  self.postMessage(result);
};
```

## 10. `content-visibility` for Offscreen Content

```css
.article-section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px; /* placeholder size estimate */
}
```

Tells the browser to skip rendering work (layout/paint) for offscreen elements until they're about to become visible — big win on long pages.

## 11. Best Practices

1. Understand which CSS properties trigger layout vs paint vs composite; prefer `transform`/`opacity` for animation.
2. Batch DOM reads and writes to avoid layout thrashing.
3. Virtualize long lists/tables instead of rendering everything at once.
4. Use SSR/SSG/ISR appropriately based on how dynamic the content is.
5. Memoize expensive computations and components in React (`useMemo`, `useCallback`, `React.memo`) — but don't over-memoize trivial ones.
6. Code-split and lazy-load non-critical components/routes.
7. Offload heavy computation to Web Workers to keep the main thread responsive.
8. Use `content-visibility: auto` for long pages with lots of offscreen content.
9. Reserve space for images/embeds/fonts to prevent layout shift.
