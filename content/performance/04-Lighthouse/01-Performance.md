# Lighthouse — Performance

## 1. What is Lighthouse?

Lighthouse is an open-source, automated auditing tool from Google (built into Chrome DevTools) that analyzes web pages and generates reports across five categories: **Performance, Accessibility, Best Practices, SEO, and PWA**. It gives a score (0–100) plus specific, actionable recommendations.

```
Chrome DevTools -> Lighthouse Tab -> Run Audit -> Report (scores + diagnostics)
```

## 2. How the Performance Score Is Calculated

The Performance score is a **weighted average** of several metrics, run through a log-normal curve (not linear!) that compares your page against real-world performance data (HTTPArchive).

### Current Weights (Lighthouse 10+, mobile default)

| Metric                         | Weight |
| ------------------------------ | ------ |
| Total Blocking Time (TBT)      | 30%    |
| Largest Contentful Paint (LCP) | 25%    |
| Cumulative Layout Shift (CLS)  | 25%    |
| First Contentful Paint (FCP)   | 10%    |
| Speed Index (SI)               | 10%    |

> Note: **INP** (Interaction to Next Paint) is a Core Web Vital measured in the field (CrUX/RUM), not currently part of the lab-based Lighthouse performance score — but Lighthouse does report it as an experimental/informational metric.

## 3. Running Lighthouse

### a) Chrome DevTools (GUI)

```
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Choose categories + device (Mobile/Desktop)
4. Click "Analyze page load"
```

### b) CLI

```bash
npm install -g lighthouse

lighthouse https://example.com --view

# Only performance category, output as JSON
lighthouse https://example.com --only-categories=performance --output=json --output-path=./report.json

# Mobile emulation (default) vs Desktop
lighthouse https://example.com --preset=desktop
```

### c) Node.js Programmatic API

```js
const lighthouse = require("lighthouse");
const chromeLauncher = require("chrome-launcher");

async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });
  const options = { logLevel: "info", output: "json", port: chrome.port };
  const runnerResult = await lighthouse(url, options);

  console.log(
    "Performance score:",
    runnerResult.lhr.categories.performance.score * 100,
  );
  await chrome.kill();
  return runnerResult;
}

runLighthouse("https://example.com");
```

### d) CI Integration (Lighthouse CI)

```bash
npm install -g @lhci/cli

# lighthouserc.js
module.exports = {
  ci: {
    collect: { numberOfRuns: 3, url: ['https://example.com'] },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
```

```bash
lhci autorun
```

```yaml
# GitHub Actions example
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
```

## 4. Common Performance Diagnostics & How to Fix Them

### Render-Blocking Resources

CSS/JS in `<head>` that blocks the browser from painting content.

```html
<!-- BAD: blocks rendering -->
<link rel="stylesheet" href="styles.css" />
<script src="analytics.js"></script>

<!-- BETTER -->
<link rel="stylesheet" href="critical.css" />
<script src="analytics.js" defer></script>
<link
  rel="preload"
  href="non-critical.css"
  as="style"
  onload="this.rel='stylesheet'"
/>
```

### Unused JavaScript/CSS

Use code-splitting and tree-shaking.

```js
// Dynamic import - only loaded when needed
button.addEventListener("click", async () => {
  const { openModal } = await import("./modal.js");
  openModal();
});
```

### Properly Size Images

```html
<!-- BAD -->
<img src="huge-image.jpg" width="200" height="200" />

<!-- GOOD: responsive images, correctly sized, modern format -->
<img
  src="image-400.webp"
  srcset="image-400.webp 400w, image-800.webp 800w"
  sizes="(max-width: 600px) 400px, 800px"
  width="400"
  height="400"
  loading="lazy"
  alt="Description"
/>
```

### Text Compression

```nginx
# Nginx
gzip on;
gzip_types text/plain text/css application/javascript application/json;

# Or use Brotli (better ratio)
brotli on;
brotli_types text/plain text/css application/javascript;
```

### Preconnect to Required Origins

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://api.example.com" crossorigin />
```

### Avoid Large Layout Shifts / Long Main-Thread Tasks

```js
// Break up long tasks using scheduler / setTimeout to yield to main thread
function processLargeArray(items) {
  let i = 0;
  function chunk() {
    const end = Math.min(i + 100, items.length);
    for (; i < end; i++) doWork(items[i]);
    if (i < items.length) setTimeout(chunk, 0); // yield
  }
  chunk();
}
```

## 5. Key Performance Opportunities Lighthouse Flags

| Audit                               | What It Checks                               |
| ----------------------------------- | -------------------------------------------- |
| Eliminate render-blocking resources | CSS/JS blocking first paint                  |
| Reduce unused CSS/JS                | Dead code shipped to browser                 |
| Efficiently encode images           | Uncompressed/oversized images                |
| Serve images in next-gen formats    | WebP/AVIF instead of JPEG/PNG                |
| Enable text compression             | Gzip/Brotli on text assets                   |
| Preload key requests                | Critical resources fetched too late          |
| Minimize main-thread work           | Heavy JS execution blocking interactivity    |
| Reduce JavaScript execution time    | Large bundles, unoptimized code              |
| Avoid enormous network payloads     | Total page weight too large                  |
| Use efficient cache policy          | Missing/short cache headers on static assets |

## 6. Lab Data vs Field Data

|             | Lab Data (Lighthouse)      | Field Data (CrUX / RUM)              |
| ----------- | -------------------------- | ------------------------------------ |
| Source      | Simulated run, single load | Real users, real conditions          |
| Network/CPU | Throttled/simulated        | Actual user devices/networks         |
| Consistency | Reproducible, debuggable   | Variable, represents reality         |
| Use case    | Debugging, CI gating       | Measuring real-world Core Web Vitals |

Lighthouse is **lab data** — great for debugging in a controlled environment, but real Core Web Vitals scores (used e.g. for Google Search ranking signals) come from **field data** via the Chrome UX Report (CrUX).

## 7. Best Practices for Improving Performance Score

1. Minimize and defer non-critical JS; use `async`/`defer`.
2. Inline critical CSS, lazy-load the rest.
3. Optimize images (compress, modern formats, responsive `srcset`, `loading="lazy"`).
4. Use a CDN for static assets.
5. Set proper cache headers (see Caching notes).
6. Reduce third-party script impact (tag managers, analytics, ads) — load them lazily/async.
7. Use code-splitting to reduce initial JS bundle size.
8. Preconnect/preload critical resources (fonts, hero images, API endpoints).
