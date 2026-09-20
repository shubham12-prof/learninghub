# CDN Cache (Content Delivery Network)

## 1. What is a CDN?

A CDN is a globally distributed network of proxy servers (**edge servers** / **PoPs — Points of Presence**) that cache and serve content from a location physically close to the end user, reducing latency.

```
                     Origin Server (e.g. Mumbai, India)
                              |
        ---------------------------------------------
        |              |              |             |
   Edge (US)      Edge (Europe)  Edge (Asia)   Edge (Australia)
        |              |              |             |
     User A          User B         User C        User D
```

Instead of every user hitting the origin server in one location, users are routed (via DNS/Anycast) to the nearest edge node.

## 2. Why Use a CDN?

- **Lower latency** — content served from nearby edge location
- **Reduced origin load** — origin server handles far fewer requests
- **DDoS protection & security** — CDNs absorb traffic spikes/attacks
- **High availability** — if one edge node fails, traffic reroutes
- **Bandwidth cost savings** — origin serves less traffic

## 3. What Gets Cached on a CDN?

| Content Type                                   | Cacheable?                                |
| ---------------------------------------------- | ----------------------------------------- |
| Static assets (JS, CSS, images, fonts, videos) | Yes, easily                               |
| HTML pages (mostly static / marketing sites)   | Yes, with short TTL                       |
| API responses (public, non-personalized)       | Yes, with care                            |
| API responses (personalized/user-specific)     | Usually No (or edge-side personalization) |
| POST/PUT/DELETE requests                       | No (not cacheable by default)             |

## 4. CDN Cache Flow (Cache Hit vs Miss)

```
Request flow (Cache MISS - first request):
User -> Edge Server -> (not found) -> Origin Server
                                          |
                                    Origin responds
                                          |
Edge Server stores copy <-----------------
        |
User <- Edge Server (response)

Request flow (Cache HIT - subsequent requests):
User -> Edge Server (found in cache) -> User
(Origin server never touched)
```

## 5. Key CDN-Related Headers

### `Cache-Control` with `s-maxage`

`s-maxage` overrides `max-age` specifically for **shared caches** like CDNs (browser ignores it, CDN respects it).

```http
Cache-Control: public, max-age=60, s-maxage=3600
```

Meaning: browser caches for 60 seconds, but the CDN edge caches for 3600 seconds.

### `Vary` header

Tells the CDN/browser to cache different versions based on a request header.

```http
Vary: Accept-Encoding
```

```http
Vary: Accept-Language
```

Common mistake: `Vary: User-Agent` or `Vary: Cookie` can hurt cache hit ratio badly because it creates too many cache variants.

### `Surrogate-Control` (CDN-specific, e.g. Fastly/Akamai)

Only understood by the CDN, stripped before response reaches the browser.

```http
Surrogate-Control: max-age=86400
Cache-Control: no-cache
```

This means: CDN caches for 1 day, but browser must always revalidate.

### `CDN-Cache-Control` (multi-CDN control, newer standard)

```http
CDN-Cache-Control: max-age=600
```

## 6. Popular CDN Providers

| Provider          | Notable Features                                   |
| ----------------- | -------------------------------------------------- |
| Cloudflare        | Free tier, DDoS protection, Workers (edge compute) |
| Amazon CloudFront | Deep AWS integration, Lambda@Edge                  |
| Akamai            | Enterprise-grade, largest network                  |
| Fastly            | Instant purge (~150ms), VCL-based config           |
| Google Cloud CDN  | Integrated with GCP                                |

## 7. Example: Configuring CloudFront (AWS) via Infrastructure-as-Code

```js
// AWS CDK example (TypeScript) - simplified
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";

new cloudfront.Distribution(this, "MyDistribution", {
  defaultBehavior: {
    origin: new origins.S3Origin(myBucket),
    cachePolicy: new cloudfront.CachePolicy(this, "CachePolicy", {
      defaultTtl: Duration.hours(24),
      minTtl: Duration.seconds(0),
      maxTtl: Duration.days(365),
    }),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
  },
});
```

## 8. Example: Setting Headers From an Express App (Origin) for CDN Caching

```js
app.get("/api/articles/:id", async (req, res) => {
  const article = await getArticle(req.params.id);

  // Public article data - safe to cache at CDN edge for 10 min,
  // browsers revalidate every request
  res.set("Cache-Control", "public, max-age=0, s-maxage=600");
  res.json(article);
});

app.get("/api/user/dashboard", async (req, res) => {
  // Personalized - never cache at CDN
  res.set("Cache-Control", "private, no-store");
  res.json(await getUserDashboard(req.user.id));
});
```

## 9. Edge Compute (Modern CDN Feature)

Modern CDNs let you run code AT the edge, not just cache static files.

### Cloudflare Worker Example

```js
export default {
  async fetch(request, env, ctx) {
    const cache = caches.default;
    let response = await cache.match(request);

    if (!response) {
      response = await fetch(request); // go to origin
      response = new Response(response.body, response);
      response.headers.append("Cache-Control", "public, max-age=3600");
      ctx.waitUntil(cache.put(request, response.clone()));
    }
    return response;
  },
};
```

## 10. Purging / Invalidating CDN Cache

Since CDN edges can be stale for a long TTL, providers offer manual purge APIs.

### Cloudflare Purge Example (REST API)

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://example.com/app.js"]}'
```

### AWS CloudFront Invalidation (CLI)

```bash
aws cloudfront create-invalidation \
  --distribution-id EXAMPLEID123 \
  --paths "/index.html" "/static/*"
```

Note: CloudFront invalidations are not instant and cost money after a free quota — versioned filenames are preferred over frequent invalidation.

## 11. CDN Caching Strategy Diagram

```
                 ┌───────────────────────┐
                 │   Client Request       │
                 └──────────┬─────────────┘
                            │
                    ┌───────▼────────┐
                    │  CDN Edge Node  │
                    └───────┬────────┘
             Cache Hit?     │      Cache Miss?
        ┌────────Yes────────┴────────No─────────┐
        │                                        │
 Serve from Edge                         Fetch from Origin
 (fast, low latency)                     Store copy in edge
        │                                        │
        └──────────────► Response ◄──────────────┘
```

## 12. Best Practices

1. Use `s-maxage` to control CDN TTL separately from browser TTL.
2. Version/hash static asset filenames so you rarely need to purge.
3. Avoid caching personalized responses at shared/CDN layer — use `private`.
4. Be careful with the `Vary` header — too many variants kill cache hit ratio.
5. Use edge compute (Workers/Lambda@Edge) for personalization without losing cache benefits (e.g., cache the shell, personalize small parts).
6. Monitor **cache hit ratio** as a key metric (aim for high hit % on static content).
