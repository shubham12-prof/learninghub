# Performance

Next.js provides many built-in performance tools — the work is choosing the right rendering strategy per route and using the framework's optimization features correctly.

**1. Choose the right rendering strategy per route** (see SSG/ISR/SSR/Streaming files) — default to static (SSG) or ISR wherever possible; reserve full SSR for genuinely dynamic/personalized content.

**2. Use `next/image` and `next/font`** (see their own files) for automatic image/font optimization — avoids manual responsive image handling and eliminates render-blocking font requests.

**3. Code splitting via dynamic imports — defer loading heavy, rarely-used components:**

```tsx
import dynamic from "next/dynamic";

const HeavyChart = dynamic(() => import("./HeavyChart"), {
  loading: () => <p>Loading chart...</p>,
  ssr: false, // skip server rendering entirely for client-only libraries (e.g. some chart libs)
});
```

**4. Streaming with Suspense** (see that file) — get useful content in front of users faster instead of blocking on the slowest data fetch.

**5. Parallel data fetching** — avoid accidental request waterfalls (see Data Fetching file); use `Promise.all` for independent fetches.

**6. Minimize Client Component boundaries** — keep as much of the tree as possible as Server Components (zero JS shipped); push `"use client"` as far down/leaf-ward in the tree as it will go.

```tsx
// ❌ Marks the ENTIRE page (and everything inside it) as client-rendered
"use client";
export default function Page() {
  return (
    <div>
      <StaticHeader />{" "}
      {/* forced to be client, even though it has no interactivity */}
      <InteractiveWidget />
    </div>
  );
}

// ✅ Only the widget that actually needs interactivity ships client JS
export default function Page() {
  return (
    <div>
      <StaticHeader /> {/* stays a Server Component */}
      <InteractiveWidget /> {/* only THIS has "use client" */}
    </div>
  );
}
```

**7. Bundle analysis — find what's bloating your JS bundle:**

```bash
npm install --save-dev @next/bundle-analyzer
```

```js
// next.config.js
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});
module.exports = withBundleAnalyzer({});
```

**8. Core Web Vitals** — Next.js exposes hooks/utilities (`useReportWebVitals`) to measure and report LCP, CLS, FID/INP directly from real user sessions.

**Interview note:** a strong answer to "how would you optimize a slow Next.js page?" walks through this roughly in order: identify whether the route can be static/ISR instead of SSR → check for Client Component over-usage bloating the bundle → check for sequential (non-parallel) data fetches → add streaming/Suspense for genuinely slow parts → verify images/fonts use the built-in optimized components.
