# 03. CDN (Content Delivery Network)

## What is a CDN?

A CDN is a globally distributed network of proxy servers ("edge servers" or "points of presence" / PoPs) that cache and serve content from locations physically close to end users, rather than every request traveling all the way back to your origin server. This dramatically reduces latency and offloads traffic from your origin infrastructure.

```
Without a CDN:
  User in Tokyo -> request travels all the way to -> Origin server in Virginia, USA
                   (high latency due to physical distance)

With a CDN:
  User in Tokyo -> request served by -> CDN edge server in Tokyo (cached copy)
                   (low latency — content is physically nearby)
```

## How a CDN Works — Basic Flow

```
1. User requests https://cdn.example.com/logo.png
2. DNS routes the request to the NEAREST CDN edge server (based on the user's location)
3. Edge server checks: do I already have a cached copy of this file?
     -> CACHE HIT: serve it immediately from the edge, very fast
     -> CACHE MISS: fetch it from the origin server, cache it at the edge, THEN serve it
4. Subsequent requests for the same file from nearby users are served from the (now-cached) edge copy
```

## What Gets Cached on a CDN

| Content Type                                   | CDN Suitability                                                                                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Static assets (images, CSS, JS, fonts, videos) | Excellent — the classic CDN use case                                                                                                              |
| API responses that rarely change               | Good, with appropriate caching headers                                                                                                            |
| Personalized/user-specific content             | Generally poor fit — not the same for every user, so caching provides little benefit (though some CDNs support more advanced per-user edge logic) |
| Real-time data (stock prices, live scores)     | Poor fit for traditional caching — needs very short TTLs or a different approach entirely                                                         |

## Cache Control — Telling the CDN What/How Long to Cache

CDNs respect standard HTTP caching headers set by the origin server.

```js
// Express example — setting cache headers for static assets
app.use(
  "/static",
  express.static("public", {
    maxAge: "30d", // browsers AND CDN edge servers can cache this for 30 days
  }),
);
```

```
Cache-Control: public, max-age=2592000        # cache for 30 days (in seconds)
Cache-Control: public, max-age=3600, s-maxage=86400  # browser caches 1hr, but CDN (shared cache) caches 24hrs
Cache-Control: no-cache                        # can be cached, but must be revalidated with the origin before reuse
Cache-Control: no-store                        # never cache this at all (sensitive/dynamic data)
```

`s-maxage` specifically targets shared caches (like CDNs), letting you set a different (often longer) cache duration for the CDN than for individual users' browsers.

## Cache Invalidation / Purging

When content changes, previously-cached copies at CDN edges need to be invalidated (purged) so users get the updated version.

```bash
# Conceptual CDN purge request (syntax varies by provider — Cloudflare, CloudFront, Fastly, etc.)
curl -X POST "https://api.cdn-provider.com/purge" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{"files": ["https://cdn.example.com/logo.png"]}'
```

### Cache-Busting via Versioned Filenames (A Common, Robust Alternative to Purging)

Instead of purging, many teams avoid the invalidation problem entirely by embedding a content hash/version into the filename — a "new" version is simply a new URL, so there's never stale content to invalidate.

```html
<!-- Before a content change -->
<link rel="stylesheet" href="/styles.a3f9c2.css" />

<!-- After a content change — new hash, new URL, browsers/CDN naturally fetch the new version -->
<link rel="stylesheet" href="/styles.b7e1d4.css" />
```

Build tools (Webpack, Vite, etc.) handle this automatically via content-hashed filenames — this pattern lets you set extremely long cache lifetimes (`max-age=31536000, immutable`) safely, since the URL itself changes whenever the content does.

## CDN Benefits Beyond Just Caching

### 1. DDoS Protection

A CDN's distributed edge network can absorb and filter large-scale traffic spikes/attacks before they ever reach the origin server.

### 2. SSL/TLS Termination

CDNs can handle HTTPS encryption/decryption at the edge, reducing the computational load on origin servers.

### 3. Image Optimization

Many CDNs offer on-the-fly image resizing, format conversion (e.g., serving WebP/AVIF to supporting browsers), and compression.

### 4. Edge Compute

Modern CDNs (Cloudflare Workers, AWS Lambda@Edge/CloudFront Functions, Fastly Compute) let you run actual application logic at edge locations, not just cache static files — enabling things like A/B testing, authentication checks, or request routing to happen close to the user, before the request even reaches the origin.

```js
// Conceptual Cloudflare Worker — logic running AT THE EDGE, not the origin
addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const country = request.cf.country;
  if (country === "EU") {
    return fetch(request, { headers: { "X-Region": "eu" } }); // route/tag based on edge-detected location
  }
  return fetch(request);
}
```

## CDN vs Origin Server — What Still Needs the Origin

A CDN doesn't replace your backend — dynamic, personalized, or write-based requests still need to reach the origin server (or origin-adjacent infrastructure).

```
CDN handles:     static assets, cacheable API responses, DDoS absorption
Origin handles:  authentication, database writes, personalized responses,
                  anything genuinely dynamic/user-specific
```

## Popular CDN Providers

| Provider          | Notes                                                                          |
| ----------------- | ------------------------------------------------------------------------------ |
| Cloudflare        | Very widely used, generous free tier, strong edge compute offering (Workers)   |
| Amazon CloudFront | Deeply integrated with AWS (S3, Lambda@Edge)                                   |
| Fastly            | Popular for real-time purging and edge compute, used by many large media sites |
| Akamai            | One of the original/largest CDN providers, common in enterprise                |
| Google Cloud CDN  | Integrated with Google Cloud infrastructure                                    |

## Practical Example: Setting Up a CDN for a Web App

```
1. Static assets (JS, CSS, images) are built with content-hashed filenames
2. Assets are uploaded to an origin store (e.g., an S3 bucket)
3. A CDN (e.g., CloudFront) is configured to pull from that S3 bucket as its origin
4. The web app references assets via the CDN's URL (e.g., https://cdn.example.com/...)
   instead of the origin's direct URL
5. API requests continue going directly to the application origin server
   (or through the CDN with no-cache headers for anything dynamic)
```

## Common Interview-Style Questions

- **What is a CDN, and what problem does it primarily solve?**
  A globally distributed network of edge servers that cache and serve content from locations physically close to end users, primarily solving the latency problem caused by requests traveling long physical distances to a single origin server, while also offloading traffic from that origin.

- **What's the difference between `max-age` and `s-maxage` in a `Cache-Control` header?**
  `max-age` applies to any cache, including a user's browser; `s-maxage` specifically targets shared caches like CDNs, allowing you to set a different (often longer) caching duration for the CDN layer than for individual users' browser caches.

- **Why is cache-busting via content-hashed filenames often preferred over manually purging CDN caches?**
  It avoids the invalidation problem entirely — since a content change produces a new filename/URL, there's never actually "stale" content sitting at a cached URL, allowing extremely long, safe cache lifetimes without needing to coordinate purge operations across the CDN.

- **What kinds of content are generally poor fits for CDN caching, and why?**
  Personalized or user-specific content (since it's not the same for every user, providing little caching benefit) and real-time/rapidly-changing data (since it would need such short cache lifetimes that caching provides minimal benefit) — both are typically served directly from the origin, or via specialized edge-compute logic rather than simple caching.

- **What is "edge compute," and how does it extend a CDN beyond simple caching?**
  The ability to run actual application logic (not just serve cached static files) at CDN edge locations close to users — enabling use cases like request routing, authentication checks, or A/B testing to happen before a request even reaches the origin server, reducing latency for that logic as well.
