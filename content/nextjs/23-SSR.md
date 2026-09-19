# SSR

Server-Side Rendering — the HTML for a page is generated **fresh, on every single request**, on the server, then sent to the browser. In the App Router, this happens automatically whenever a route uses dynamic data that can't be cached (or explicitly opts out of caching).

```tsx
async function getLiveStockPrice(symbol: string) {
  const res = await fetch(`https://api.example.com/stocks/${symbol}`, {
    cache: "no-store", // forces fresh data on EVERY request — this makes the route dynamic (SSR)
  });
  return res.json();
}

export default async function StockPage({
  params,
}: {
  params: { symbol: string };
}) {
  const price = await getLiveStockPrice(params.symbol); // fetched fresh, every single request
  return (
    <h1>
      {params.symbol}: ${price.current}
    </h1>
  );
}
```

**What automatically makes a route dynamic (SSR) in the App Router:**

- Using `cache: "no-store"` in a `fetch` call
- Reading cookies/headers (`cookies()`, `headers()` from `next/headers`)
- Reading `searchParams` in a Server Component
- Calling `noStore()` explicitly (`import { unstable_noStore as noStore } from "next/cache"`)

```tsx
import { cookies } from "next/headers";

export default async function Dashboard() {
  const cookieStore = cookies(); // reading cookies opts this route into dynamic rendering (SSR)
  const token = cookieStore.get("session")?.value;
  const data = await getPersonalizedData(token);
  return <div>{data.greeting}</div>;
}
```

**Why SSR matters:** content is always fresh and can be personalized per-request (based on cookies, headers, auth state) — at the cost of higher server load (real work happens on every request) and slower response times than a cached page.

**SSR vs SSG vs ISR — when to choose SSR specifically:** real-time or highly personalized data (a user's live dashboard, stock prices, an authenticated account page) where staleness is unacceptable and caching doesn't make sense.

**Interview note:** in the App Router, you rarely "choose SSR" explicitly the way you did with `getServerSideProps` in the Pages Router — instead, a route becomes dynamically rendered (SSR) automatically based on what it actually does (reading cookies, using `no-store` fetches, etc.); Next.js infers the rendering strategy from the code itself rather than a separate exported function.
