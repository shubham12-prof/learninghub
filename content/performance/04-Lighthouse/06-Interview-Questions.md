# Lighthouse — Interview Questions & Answers

## General / Conceptual

**Q1. What is Lighthouse and what does it audit?**
Lighthouse is an open-source automated tool (built into Chrome DevTools, also available as CLI/Node module) that audits web pages across five categories: Performance, Accessibility, Best Practices, SEO, and PWA. It produces a 0–100 score per category along with specific, actionable diagnostics.

**Q2. What's the difference between lab data and field data?**
Lab data is generated in a controlled, simulated environment (Lighthouse runs a single page load with throttled network/CPU) — useful for debugging and reproducibility. Field data comes from real users under real conditions (via Chrome UX Report / Real User Monitoring) — it's what actually reflects user experience and is used for things like Google's search ranking signals.

**Q3. Why might your Lighthouse score differ from your Google Search Console Core Web Vitals report?**
Lighthouse is lab data from a single simulated run; Search Console's Core Web Vitals come from real-world field data (CrUX) aggregated across many real users, devices, and network conditions over 28 days. Real user variability (slow devices, poor networks, browser extensions) can differ significantly from Lighthouse's simulated throttling.

**Q4. How is the overall Performance score calculated?**
It's a weighted geometric mean of several metrics run through a log-normal scoring curve (not linear), calibrated against real-world HTTPArchive data. Current key weights: TBT 30%, LCP 25%, CLS 25%, FCP 10%, Speed Index 10%. A metric slightly over a threshold hurts the score less linearly at first, more sharply as it gets much worse.

**Q5. How would you integrate Lighthouse into a CI/CD pipeline?**
Use Lighthouse CI (`@lhci/cli`), configure a `lighthouserc.js` with URLs to test, number of runs (to reduce variance), and assertion thresholds per category (e.g., `minScore: 0.9` for performance). Run it as a pipeline step (e.g., GitHub Actions) that fails the build if scores drop below thresholds, and optionally upload reports for historical tracking.

## Performance

**Q6. What is Total Blocking Time (TBT) and why does it carry the most weight?**
TBT measures the total time the main thread was blocked by long tasks (>50ms) between First Contentful Paint and Time to Interactive, preventing the page from responding to user input. It carries the heaviest weight (30%) because it's a strong lab-based proxy for real-world interactivity/responsiveness (correlating with INP).

**Q7. How would you reduce a large JavaScript bundle's impact on performance?**
Code-split with dynamic `import()` so only needed code loads per route/interaction, tree-shake unused exports, defer/async non-critical scripts, remove unused dependencies, and analyze the bundle (e.g., with `webpack-bundle-analyzer`) to find and eliminate bloat.

**Q8. What are render-blocking resources and how do you eliminate them?**
CSS and synchronous `<script>` tags in the `<head>` block the browser from parsing/rendering the page until they're downloaded and executed. Fix by inlining critical CSS, deferring non-critical CSS loading (`<link rel="preload" ... onload="this.rel='stylesheet'">`), and adding `defer`/`async` to script tags.

**Q9. What's the difference between `async` and `defer` on a `<script>` tag?**
`async` downloads the script in parallel with HTML parsing and executes it as soon as it's ready (potentially out of order, interrupting parsing). `defer` also downloads in parallel but executes only after HTML parsing completes, and multiple deferred scripts run in document order — generally preferred for scripts that depend on DOM being ready or on execution order.

## Accessibility

**Q10. Does a 100 accessibility score mean the site is fully accessible?**
No. Lighthouse's accessibility audit (via axe-core) only catches automatically-detectable issues — roughly 30-40% of WCAG success criteria. Things like logical reading order, meaningful (not just present) alt text, and real screen-reader usability require manual testing.

**Q11. How do you fix a "Buttons do not have an accessible name" audit failure?**
Ensure the button has either visible text content, or if it's icon-only, add an `aria-label` (e.g., `<button aria-label="Close">×</button>`) or visually-hidden text inside it.

**Q12. Why is it bad practice to remove `outline: none` on focus without a replacement?**
It removes the visual indicator keyboard users rely on to know which element is currently focused, making the site unusable for keyboard-only and some screen-reader users. Always provide a custom, visible focus style (e.g., via `:focus-visible`) if removing the default.

**Q13. What's the minimum contrast ratio for normal text under WCAG AA?**
4.5:1 for normal text, and 3:1 for large text (≥18pt, or ≥14pt bold) and UI components/graphical objects.

## SEO

**Q14. What does the Lighthouse SEO score actually verify?**
Basic crawlability/indexability best practices: valid title/meta description, crawlable links, not blocked by robots.txt/noindex, mobile-friendliness (viewport, font size, tap targets), and valid hreflang/canonical tags. It does NOT measure content quality, backlinks, or actual ranking potential.

**Q15. Why might a JavaScript-heavy single-page app rank poorly in search, and how do you fix it?**
If content is rendered entirely client-side, some crawlers may not execute all JS reliably or may index incomplete content, and initial HTML has little indexable content. Fix with server-side rendering (SSR) or static site generation (SSG) — e.g., Next.js `getServerSideProps`/`getStaticProps` — so crawlers receive fully-rendered HTML.

**Q16. What's the difference between `noindex` and `robots.txt Disallow`?**
`Disallow` in robots.txt prevents crawlers from _crawling_ the page (but the URL could still appear in search results without a description, if linked elsewhere). `noindex` (via meta tag or header) allows crawling but tells search engines not to _index_ the page at all — the more reliable way to fully exclude a page from search results.

## Best Practices

**Q17. Why does Lighthouse flag `target="_blank"` links without `rel="noopener"`?**
Without `rel="noopener"`, the newly opened page gets partial access to the opening page via `window.opener`, which can be exploited for phishing/malicious redirects ("reverse tabnabbing"). `rel="noopener noreferrer"` prevents this and also avoids leaking referrer information.

**Q18. What is a Content Security Policy (CSP) and what does it protect against?**
CSP is an HTTP response header that restricts which sources of scripts, styles, images, etc. a browser is allowed to load/execute, primarily to mitigate Cross-Site Scripting (XSS) attacks by disallowing inline/untrusted script execution unless explicitly permitted.

**Q19. Why does using `unload` event listeners hurt performance/best-practices scores?**
`unload` listeners prevent the page from being eligible for the browser's back-forward cache (bfcache), which normally allows instant back/forward navigation by keeping the page in memory. Using `pagehide` or `visibilitychange` instead preserves bfcache eligibility while still allowing cleanup logic.

## Metrics (Core Web Vitals)

**Q20. Name the three Core Web Vitals and what each measures.**
LCP (Largest Contentful Paint) — loading performance / when main content is visible. CLS (Cumulative Layout Shift) — visual stability / unexpected layout shifts. INP (Interaction to Next Paint) — responsiveness / how quickly the page responds to user interactions.

**Q21. What replaced FID as a Core Web Vital, and why?**
INP (Interaction to Next Paint) replaced FID (First Input Delay) in March 2024. FID only measured the delay before processing began for the _first_ interaction on a page, missing responsiveness issues throughout the rest of the session. INP measures end-to-end latency (input delay + processing + presentation) across all interactions, giving a fuller picture of overall responsiveness.

**Q22. What are the "good" thresholds for LCP, CLS, and INP?**
LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms (all measured at the 75th percentile of real users for field data assessment).

**Q23. What typically causes poor LCP, and how do you fix it?**
Common causes: slow server response (high TTFB), render-blocking CSS/JS delaying paint, unoptimized/oversized LCP image, and lazy-loading the LCP image itself (which delays discovery). Fixes: reduce TTFB, eliminate render-blocking resources, preload the LCP resource with `fetchpriority="high"`, and never lazy-load above-the-fold hero content.

**Q24. What causes layout shifts (CLS) and how do you prevent them?**
Images/embeds/ads without reserved dimensions, web fonts causing reflow on load (FOUT/FOIT), dynamically injected content pushing existing content down, and animations using layout-triggering CSS properties. Prevent by setting explicit `width`/`height` or `aspect-ratio` on media, reserving space for dynamic content, using `font-display` carefully, and animating with `transform`/`opacity` instead of `top`/`left`/`width`.

**Q25. How would you measure INP for real users in production?**
Use the `web-vitals` JS library's `onINP()` callback (or the PerformanceObserver `event` timing API directly) to capture the metric client-side, then send it to an analytics/RUM endpoint via `navigator.sendBeacon` for aggregation, since INP requires real user interaction data across a full session (not something a single lab run captures well).

**Q26. What's the relationship between TBT (lab metric) and INP (field metric)?**
TBT (Total Blocking Time) is Lighthouse's lab-based proxy for responsiveness — it measures how long the main thread was blocked by long tasks during page load. INP is the real, field-measured Core Web Vital for responsiveness across all user interactions during the page's lifetime. Improving TBT (breaking up long tasks, reducing JS execution) generally improves INP too, but they're not identical — TBT only covers the loading period, INP covers the whole session.

**Q27. Why is TTFB considered a "supporting" metric rather than a Core Web Vital, yet still important?**
It's not a direct Core Web Vital because it doesn't by itself capture user-perceived experience (a fast TTFB with a slow-rendering page still feels slow). But it's foundational — every other metric (FCP, LCP) can't happen before the first byte arrives, so a slow TTFB puts a hard floor under everything downstream.

## Scenario-Based

**Q28. Your Lighthouse Performance score is 45. Where would you start investigating?**
Start with the "Opportunities" and "Diagnostics" sections of the report, prioritizing the highest-weighted metrics first (TBT, LCP, CLS). Check for render-blocking resources, unused JS/CSS, unoptimized images, and long main-thread tasks. Use the Lighthouse "Treemap" or Chrome DevTools Performance panel to pinpoint the specific bottleneck (often a large JS bundle or unoptimized hero image) rather than guessing.

**Q29. A marketing team keeps adding third-party scripts (chat widgets, ad tags, analytics) and performance keeps degrading. How do you manage this?**
Load non-critical third-party scripts asynchronously/deferred, use `<link rel="preconnect">` for their domains, lazy-load widgets that aren't needed immediately (e.g., load chat widget only after user scrolls or after a delay), audit and periodically remove unused/duplicate scripts, and consider a tag manager with performance budgets, or sandboxing scripts in a web worker/iframe where feasible.

**Q30. Your CLS score looks fine in Lighthouse (lab test) but real users report content "jumping." What could explain the discrepancy?**
Lighthouse lab runs are single, short, simulated sessions and may not trigger all real-world shift scenarios — e.g., late-loading ads/personalized content, slow third-party scripts injecting DOM after the lab test's measurement window closes, or user-triggered shifts (like clicking "accept cookies" causing a banner to collapse) that only manifest with real interaction patterns and network variability. This is why field data (real user CLS via `web-vitals`/CrUX) should be monitored alongside lab data.
