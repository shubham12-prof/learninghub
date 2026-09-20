# 04. Bundle Analysis

## Why Bundle Analysis Matters

Bundle analysis means actually **measuring** what's inside your production JavaScript bundles — which libraries, which modules, how large each piece is — rather than guessing or assuming your optimizations (code splitting, tree shaking) are working as intended. Without analysis, it's easy to ship an accidentally bloated bundle (a huge library imported for one small utility, duplicate dependencies, an entire icon library instead of the few icons actually used) without ever noticing.

```
Assumption:  "I'm using tree shaking and code splitting, so my bundle should be fine"
Reality:      could STILL be shipping a 500KB moment.js import for one date format call,
              a duplicated copy of React from a misconfigured dependency, or an entire
              UI library instead of the few components actually used

Bundle analysis: makes this VISIBLE, so you can actually FIX it
```

## Common Bundle Analysis Tools

### webpack-bundle-analyzer

```bash
npm install --save-dev webpack-bundle-analyzer
```

```js
// webpack.config.js
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

module.exports = {
  plugins: [new BundleAnalyzerPlugin()],
};
```

Generates an interactive, zoomable treemap visualization — box size proportional to that module's contribution to the final bundle size, making disproportionately large dependencies immediately, visually obvious.

### vite-bundle-visualizer (For Vite Projects)

```bash
npx vite-bundle-visualizer
```

```js
// vite.config.js
import { visualizer } from "rollup-plugin-visualizer";

export default {
  plugins: [visualizer({ open: true, gzipSize: true, brotliSize: true })],
};
```

### source-map-explorer

```bash
npm install --save-dev source-map-explorer
npx source-map-explorer build/static/js/*.js
```

Analyzes the actual bundle using its source maps, attributing size down to the original source files/lines — useful for pinpointing exactly which part of your own code (not just which library) is contributing disproportionately to bundle size.

## What to Look For in a Bundle Analysis

### 1. Unexpectedly Large Dependencies

```
lodash (full library):    71KB minified   <- if you only use 2-3 functions, this is a red flag
lodash-es (tree-shaken):    3KB (just the used functions)   <- what you actually want
```

### 2. Duplicate Dependencies

```
node_modules/react (18.2.0)                     45KB
node_modules/some-library/node_modules/react (17.0.2)   38KB   <- DUPLICATE, different version, likely a
                                                                    misconfigured/outdated dependency
```

Duplicate dependencies (often from mismatched version requirements across your own dependencies) silently bloat bundles — fixable via `npm dedupe`, resolving version mismatches, or using package manager features like Yarn/npm's `resolutions`/`overrides`.

### 3. Entire Libraries Imported for a Single Feature

```
moment.js (entire library, including ALL locale data): 300KB+
  used for: formatting ONE date string

date-fns (tree-shaken, only the specific functions used): 5KB
  achieves the SAME result
```

This is one of the most common, highest-impact findings from bundle analysis — swapping a heavy, monolithic library for a lighter, more tree-shakeable alternative (or just using fewer of its features) for the same functional result.

### 4. Icon Libraries — A Frequent Culprit

```js
// BAD — can pull in the ENTIRE icon set depending on the import style
import * as Icons from "react-icons/fa";

// GOOD — imports only the SPECIFIC icons actually used
import { FaHome, FaUser } from "react-icons/fa";
```

## Measuring Real-World Impact — Not Just Raw Bundle Size

Bundle size alone doesn't tell the whole performance story — what actually matters to users is loading/parsing/execution time, which correlates with (but isn't identical to) raw byte size.

```
Metrics to actually track:
  Time to Interactive (TTI)
  First Contentful Paint (FCP)
  Largest Contentful Paint (LCP)
  Total Blocking Time (TBT)
```

```bash
npx lighthouse https://myapp.com --view   # Google Lighthouse — measures real-world loading performance metrics
```

Bundle analysis tells you **what's in the bundle**; performance profiling (Lighthouse, Chrome DevTools Performance tab, WebPageTest) tells you **what effect that bundle actually has** on real loading experience — both are needed for a complete picture.

## Setting and Enforcing Bundle Size Budgets

Rather than discovering bloat after the fact, many teams enforce size limits directly in CI, failing the build if a bundle exceeds a defined threshold.

```json
// package.json — using the "bundlesize" or "size-limit" package
{
  "size-limit": [
    {
      "path": "dist/main.*.js",
      "limit": "150 KB"
    }
  ]
}
```

```yaml
# CI step
- run: npx size-limit
```

```
Bundle exceeds the configured limit -> CI FAILS -> forces the team to consciously address
the size increase (or explicitly, deliberately adjust the budget) before merging,
rather than bloat silently accumulating unnoticed over many small PRs
```

This proactive approach (catching regressions immediately, in the PR that introduced them) is significantly more effective than periodic, reactive bundle audits — by the time someone notices "the app feels slower," the root cause could be spread across dozens of small, hard-to-isolate contributing changes.

## Analyzing Bundles Over Time — Tracking Trends

```
Bundlephobia (bundlephobia.com):  check a package's size/tree-shakeability BEFORE adding it as a dependency
```

Checking a candidate library's actual bundle impact _before_ adopting it (rather than discovering the cost after it's already deeply integrated into your codebase) is a cheap, high-value habit — some seemingly small libraries turn out to have surprisingly large or poorly-tree-shakeable footprints.

## A Practical Bundle Analysis Workflow

```
1. Build the production bundle: npm run build
2. Run the analyzer: npx vite-bundle-visualizer (or webpack-bundle-analyzer)
3. Identify the largest contributors — libraries AND your own code
4. For each large contributor, ask:
   - Is this actually needed on the INITIAL load, or could it be code-split/lazy-loaded?
   - Is there a smaller alternative achieving the same result?
   - Is it being imported in a tree-shakeable way (specific imports, not the whole library)?
   - Is it duplicated anywhere in the dependency tree?
5. Make the fix, re-run the analysis, confirm the actual improvement
6. Set/adjust a size budget in CI to prevent regression going forward
```

## Common Interview-Style Questions

- **Why is bundle analysis necessary even if you believe you're already using tree shaking and code splitting correctly?**
  Optimizations like tree shaking and code splitting can silently fail to work as expected (due to non-tree-shakeable imports, misconfigured bundler settings, or barrel-file patterns), and bundle analysis is the only way to actually verify what's really in the shipped bundle rather than assuming based on the code alone — it makes hidden bloat (duplicate dependencies, oversized libraries) visible and actionable.

- **How would you identify that a bundle contains a duplicate copy of a dependency, and why does this happen?**
  A treemap visualization (webpack-bundle-analyzer, vite-bundle-visualizer) would show the same library appearing at different nested paths/versions within the bundle; this typically happens when different dependencies in your project require incompatible version ranges of a shared dependency, causing the package manager to install multiple copies rather than deduplicating to one shared version.

- **Why might bundle size alone be an incomplete performance metric, and what should it be paired with?**
  Raw byte size doesn't capture the full user-facing impact — parsing/execution time, network conditions, and how the bundle affects metrics like Time to Interactive or Largest Contentful Paint matter more directly to actual user experience; bundle analysis (what's in the bundle) should be paired with performance profiling tools (Lighthouse, DevTools Performance tab) that measure real-world loading impact.

- **What is a bundle size budget, and why enforce it in CI rather than relying on periodic manual audits?**
  A defined maximum size threshold for a bundle (or specific chunk), automatically checked and enforced as part of the CI pipeline, failing the build if exceeded; enforcing it in CI catches size regressions immediately in the specific PR that introduced them, which is far more effective than periodic manual audits where the root cause of accumulated bloat can become difficult to isolate across many small contributing changes over time.

- **Why might checking a library's bundle size on a tool like Bundlephobia before adopting it be a valuable habit?**
  It reveals a candidate dependency's actual size and tree-shakeability impact before it becomes deeply integrated into the codebase, when switching to a lighter alternative (if needed) is still cheap and easy — discovering a poor size/tree-shaking footprint only after a library is already widely used throughout the app is a much more costly problem to fix.
