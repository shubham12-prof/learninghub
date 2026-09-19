# Streaming

Sends HTML to the browser **incrementally**, as it becomes ready, instead of waiting for the ENTIRE page (including every slow data fetch) to finish before sending anything — built on React Suspense and Server Components.

```tsx
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <div>
      <Header /> {/* renders immediately */}
      <Suspense fallback={<p>Loading stats...</p>}>
        <SlowStats /> {/* streams in once its data resolves */}
      </Suspense>
      <Suspense fallback={<p>Loading feed...</p>}>
        <SlowFeed /> {/* streams in independently, in parallel */}
      </Suspense>
    </div>
  );
}

async function SlowStats() {
  const stats = await getStats(); // slow fetch — takes 2 seconds
  return <StatsPanel data={stats} />;
}

async function SlowFeed() {
  const feed = await getFeed(); // slow fetch — takes 3 seconds
  return <FeedList items={feed} />;
}
```

**What the user experiences:** `Header` and the two fallback spinners appear almost instantly. `SlowStats` streams in and replaces its spinner after ~2 seconds, then `SlowFeed` streams in after ~3 seconds — the user sees progressive rendering instead of one long blank/loading screen followed by everything at once.

**Route-level streaming via `loading.tsx`** (see that file) is a simpler, automatic form of the same underlying mechanism — Next.js wraps the whole page in a Suspense boundary using `loading.tsx` as the fallback.

**Why streaming matters for performance:** it improves perceived performance (users see SOMETHING useful quickly) and can improve real metrics like Time to First Byte and First Contentful Paint, since the server doesn't have to wait for the SLOWEST piece of data before sending ANY HTML.

**Interview note:** streaming is only possible because Server Components can be `async` and "suspend" independently — each `<Suspense>` boundary becomes its own streamable chunk, letting Next.js send the fast parts of a page immediately while slower parts arrive later in the same HTTP response, without needing separate requests or client-side loading spinners for each piece.
