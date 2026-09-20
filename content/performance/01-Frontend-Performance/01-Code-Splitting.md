# 01. Code Splitting

## What is Code Splitting?

Code splitting breaks a single large JavaScript bundle into multiple smaller chunks that can be loaded independently — instead of forcing every user to download your entire application's code upfront, only the code actually needed for the current view/interaction is loaded initially, with the rest fetched on demand.

```
Without code splitting:  main.bundle.js (2.5MB) -> ENTIRE app downloaded before ANYTHING renders

With code splitting:       main.bundle.js (200KB) -> loads immediately, renders the initial view
                            route-dashboard.chunk.js (400KB) -> loaded ONLY when the user navigates there
                            route-settings.chunk.js (150KB) -> loaded ONLY when the user navigates there
```

## Why It Matters

Every byte of JavaScript shipped to the browser must be downloaded, parsed, compiled, and executed before the page is interactive — a large monolithic bundle directly delays **Time to Interactive (TTI)** and **First Contentful Paint (FCP)**, especially on slower networks/devices. Code splitting is one of the highest-leverage frontend performance techniques because it directly reduces the amount of code the browser must process before the user can actually use the page.

## Route-Based Code Splitting — The Most Common Starting Point

Splitting by page/route is usually the biggest, easiest win — users typically only need the code for the route they're currently viewing.

```jsx
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  );
}
```

Each `import()` call here creates a **separate chunk** that's only fetched when that specific route is actually visited — the initial bundle only needs to contain the routing logic itself, not every page's code.

## Component-Based Code Splitting

Splitting individual heavy components that aren't needed immediately, even within a single page/route — a modal, a rich text editor, a charting library, anything not needed for the initial render.

```jsx
import { lazy, Suspense, useState } from "react";

const HeavyChartComponent = lazy(() => import("./HeavyChartComponent"));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Analytics</button>
      {showChart && (
        <Suspense fallback={<div>Loading chart...</div>}>
          <HeavyChartComponent />
        </Suspense>
      )}
    </div>
  );
}
```

The charting library's code (often quite large — libraries like D3 or Chart.js can be substantial) is only downloaded if/when the user actually clicks to view it, rather than bloating every page's initial load.

## Vendor/Library Splitting

Separating third-party library code from your own application code into its own chunk — libraries change far less frequently than application code, so splitting them lets browsers cache the vendor chunk independently, unaffected by your app's frequent updates.

```js
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
        },
      },
    },
  },
};
```

```
Without vendor splitting: EVERY app deploy invalidates the ENTIRE bundle's cache (app code + libraries mixed together)
With vendor splitting:       app deploys only invalidate the (smaller) app chunk's cache;
                              the vendor chunk (React, lodash, etc.) stays cached across deploys,
                              since it hasn't actually changed
```

## Dynamic Imports — The Underlying Mechanism

Code splitting in modern bundlers (Webpack, Vite, Rollup) is built on top of the standard JavaScript dynamic `import()` syntax, which returns a Promise resolving to the module.

```js
// Static import — always included in the initial bundle
import { formatDate } from "./utils/date";

// Dynamic import — creates a SEPARATE chunk, loaded on demand
async function handleExport() {
  const { generatePDF } = await import("./utils/pdf-generator");
  generatePDF(data);
}
```

This pattern is useful even outside of framework-specific lazy-loading APIs — any expensive, conditionally-needed piece of logic (a rarely-used export feature, a complex validation library only needed for one specific form) is a good candidate for a plain dynamic import.

## Framework-Specific Code Splitting

### Next.js — Automatic Route-Based Splitting

```jsx
// Next.js automatically code-splits by page/route — no manual lazy() needed for routes
// pages/dashboard.jsx (or app/dashboard/page.jsx) becomes its own chunk automatically

// For component-level splitting within a page:
import dynamic from "next/dynamic";

const HeavyChart = dynamic(() => import("../components/HeavyChart"), {
  loading: () => <p>Loading chart...</p>,
  ssr: false, // useful for components that can't/shouldn't render on the server
});
```

### Vue — Async Components

```js
import { defineAsyncComponent } from "vue";

const HeavyComponent = defineAsyncComponent(
  () => import("./HeavyComponent.vue"),
);
```

## Preloading and Prefetching — Smarter Chunk Loading

Rather than purely reactive loading (only fetch a chunk once needed), you can hint the browser to fetch a likely-needed chunk **ahead of time**, during idle moments.

```js
// Webpack magic comments
import(/* webpackPrefetch: true */ "./NextLikelyRoute");
import(/* webpackPreload: true */ "./CriticalButDeferredModule");
```

```
Prefetch: hints the browser to fetch this chunk during IDLE time, for something LIKELY needed soon
           (e.g., prefetch the checkout page's chunk once a user adds an item to their cart)
Preload:   hints the browser to fetch this chunk with HIGHER priority, for something needed SOON
            in the current navigation (used more sparingly, can compete with critical resources if overused)
```

## Measuring the Impact — Before/After Bundle Sizes

```bash
npx vite-bundle-visualizer   # or webpack-bundle-analyzer, source-map-explorer
```

(Full detail on bundle analysis tooling in the dedicated Bundle Analysis notes — critical for verifying code splitting is actually working as intended, rather than assuming it based on the code alone.)

## Common Pitfalls

```
Over-splitting:  creating TOO MANY tiny chunks can hurt performance — each chunk requires a
                  separate network request, and excessive request overhead can outweigh the
                  benefit of smaller individual file sizes (especially over HTTP/1.1; less of
                  a concern with HTTP/2's multiplexing, but still worth being mindful of)

Under-splitting:   the opposite problem — one giant bundle, defeating the purpose entirely

Waterfall loading: splitting a component that ITSELF needs to fetch another split component
                    sequentially can create a slow chain of sequential network requests
                    rather than one efficient parallel batch
```

Finding the right granularity (not too fine, not too coarse) is a genuine tuning exercise, informed by actual bundle analysis rather than guesswork.

## Common Interview-Style Questions

- **What is code splitting, and why does it improve frontend performance?**
  Breaking a single large JavaScript bundle into smaller chunks loaded independently, so users only download the code actually needed for their current view rather than the entire application upfront — this directly reduces the amount of JavaScript that must be downloaded, parsed, and executed before the page becomes interactive.

- **What's the difference between route-based and component-based code splitting?**
  Route-based splitting creates a separate chunk per page/route, so navigating to a different route triggers loading its specific code; component-based splitting targets specific heavy components within a single page (like a modal or charting library) that aren't needed for the initial render, deferring their code until actually used.

- **Why is separating vendor/library code into its own chunk beneficial for caching?**
  Third-party libraries change far less frequently than application code; keeping them in a separate chunk means browser caching of that chunk survives across app deployments (since the vendor code itself hasn't changed), while only the smaller application-code chunk needs to be re-downloaded after each deploy.

- **What's the difference between `webpackPrefetch` and `webpackPreload`?**
  Prefetch hints the browser to fetch a chunk during idle time for something likely needed soon (a lower-priority, speculative fetch); preload hints the browser to fetch a chunk with higher priority for something needed imminently in the current navigation — preload should be used more sparingly since it can compete with genuinely critical resources.

- **What's a risk of over-splitting code into too many small chunks?**
  Each chunk requires a separate network request; excessive numbers of tiny chunks can introduce enough request overhead to outweigh the benefit of smaller individual file sizes, particularly under older protocols without efficient multiplexing — finding the right granularity requires actual measurement via bundle analysis, not just splitting as much as technically possible.
