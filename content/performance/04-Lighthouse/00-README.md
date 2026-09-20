# 29. Lighthouse

A complete learning guide on Google Lighthouse, with theory + diagrams + working code examples (HTML, CSS, JS, Node.js, CI configs).

## Contents

1. [Performance](./01-Performance.md) — scoring weights, running Lighthouse (GUI/CLI/CI), diagnostics & fixes
2. [Accessibility](./02-Accessibility.md) — axe-core checks, ARIA, contrast, keyboard nav, semantic HTML
3. [SEO](./03-SEO.md) — crawlability, meta tags, structured data, mobile-friendliness
4. [Best Practices](./04-Best-Practices.md) — security (HTTPS, CSP), console errors, browser API misuse
5. [Metrics (LCP, CLS, INP, FCP, TTFB)](./05-Metrics.md) — Core Web Vitals deep dive with measurement code
6. [Interview Questions](./06-Interview-Questions.md) — 30 Q&A covering all topics above

## Suggested Study Order

```
Metrics (Core Web Vitals) -> Performance -> Accessibility -> SEO -> Best Practices -> Interview Questions
```

Start with the metrics since they underpin the Performance category, then work through each Lighthouse category, and finish with interview prep tying everything together.

## Quick Reference: Core Web Vitals Thresholds

| Metric | Good    | Needs Improvement | Poor    |
| ------ | ------- | ----------------- | ------- |
| LCP    | ≤ 2.5s  | 2.5s – 4.0s       | > 4.0s  |
| CLS    | ≤ 0.1   | 0.1 – 0.25        | > 0.25  |
| INP    | ≤ 200ms | 200ms – 500ms     | > 500ms |
| FCP    | ≤ 1.8s  | 1.8s – 3.0s       | > 3.0s  |
| TTFB   | ≤ 0.8s  | 0.8s – 1.8s       | > 1.8s  |
