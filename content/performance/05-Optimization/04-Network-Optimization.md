# Network Optimization

## 1. Why Network Optimization Matters

Even a perfectly optimized backend and frontend can feel slow if the network layer is inefficient — every round trip costs latency, and latency is bounded by physics (speed of light) as much as engineering.

```
[Client] <---- Round Trip Time (RTT) ----> [Server]

Total load time ≈ DNS lookup + TCP handshake + TLS handshake + Request + Response + Processing
```

## 2. Reducing DNS, Connection & TLS Overhead

### DNS Prefetch

```html
<link rel="dns-prefetch" href="//api.example.com" />
```

### Preconnect (DNS + TCP + TLS all at once)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://api.example.com" crossorigin />
```

### Reduce Number of Distinct Origins

Each unique origin (domain) requires its own DNS lookup + connection setup. Consolidate third-party origins where possible.

## 3. HTTP Protocol Upgrades

### HTTP/1.1 vs HTTP/2 vs HTTP/3

```
HTTP/1.1: 1 request per connection at a time (needs 6 parallel connections per origin,
          suffers from head-of-line blocking)

HTTP/2:   Multiplexes many requests over ONE connection
          (still has TCP-level head-of-line blocking)

HTTP/3:   Uses QUIC (over UDP) instead of TCP
          Eliminates head-of-line blocking entirely, faster connection setup
```

```nginx
# Enable HTTP/2
server {
    listen 443 ssl http2;
}

# Enable HTTP/3 (QUIC) - requires additional setup
server {
    listen 443 quic reuseport;
    listen 443 ssl http2;
    add_header Alt-Svc 'h3=":443"; ma=86400';
}
```

## 4. Reducing Payload Size

### Compression

```nginx
gzip on;
gzip_types text/plain text/css application/javascript application/json;
gzip_comp_level 6;

brotli on;
brotli_types text/plain text/css application/javascript application/json;
```

### Minification

```bash
# JS/CSS minification via build tools
npx terser app.js -o app.min.js -c -m
npx cssnano styles.css styles.min.css
```

### Image Optimization

```html
<picture>
  <source srcset="hero.avif" type="image/avif" />
  <source srcset="hero.webp" type="image/webp" />
  <img src="hero.jpg" alt="Hero" loading="lazy" width="800" height="400" />
</picture>
```

```bash
# Compress images at build time
npx sharp-cli --input hero.jpg --output hero.webp --format webp --quality 80
```

### Responsive Images

```html
<img
  srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1200.jpg 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
  src="photo-800.jpg"
  alt="Description"
/>
```

## 5. Reducing Number of Requests

### Bundle & Combine Assets (with caveats for HTTP/2)

```js
// webpack - split into logical chunks rather than one giant bundle or hundreds of tiny files
module.exports = {
  optimization: {
    splitChunks: { chunks: "all" },
  },
};
```

### Use Sprite Sheets / Icon Fonts / SVG Sprites for Small Assets

```html
<svg style="display:none">
  <symbol id="icon-close" viewBox="0 0 24 24">...</symbol>
</svg>
<svg><use href="#icon-close"></use></svg>
```

### Inline Critical Small Resources

```html
<!-- Inline small critical CSS to avoid an extra round trip -->
<style>
  /* critical above-the-fold CSS */
</style>
```

## 6. Caching (see also `28-Caching` folder for full detail)

```http
Cache-Control: public, max-age=31536000, immutable
```

```nginx
location ~* \.(js|css|woff2|png|jpg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 7. CDN Usage

```
Without CDN: every user request travels to a single origin server (far away = high latency)
With CDN: request served from nearest edge location
```

See `28-Caching/02-CDN-Cache.md` for detailed CDN configuration examples.

## 8. Lazy Loading & Prioritization

### Lazy-Load Below-the-Fold Content

```html
<img src="footer-banner.jpg" loading="lazy" alt="..." />
<iframe src="video.html" loading="lazy"></iframe>
```

### Prioritize Critical Resources

```html
<link rel="preload" as="image" href="hero.webp" fetchpriority="high" />
<img src="thumbnail.jpg" fetchpriority="low" loading="lazy" alt="..." />
```

### Resource Hints Summary

| Hint            | Purpose                                                              |
| --------------- | -------------------------------------------------------------------- |
| `dns-prefetch`  | Resolve DNS early for a domain you'll need soon                      |
| `preconnect`    | DNS + TCP + TLS handshake early                                      |
| `preload`       | Fetch a specific resource early, high priority                       |
| `prefetch`      | Fetch a resource likely needed for the NEXT navigation, low priority |
| `modulepreload` | Preload a JS module and its dependency graph                         |

```html
<link rel="prefetch" href="/next-page-data.json" />
```

## 9. Reducing Round Trips in APIs

### Combine Multiple API Calls

```js
// BAD: 3 round trips
const user = await fetch("/api/user");
const orders = await fetch("/api/orders");
const reviews = await fetch("/api/reviews");

// GOOD: 1 round trip (batched or GraphQL)
const { user, orders, reviews } = await fetch("/api/dashboard").then((r) =>
  r.json(),
);
```

### HTTP Keep-Alive to Reuse Connections

```js
const https = require("https");
const agent = new https.Agent({ keepAlive: true });
fetch("https://api.example.com", { agent });
```

## 10. Service Workers for Offline & Repeat-Visit Speed

```js
// Cache-first strategy for static assets, network-first for API data
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request)),
    );
  } else {
    event.respondWith(
      caches
        .match(event.request)
        .then((cached) => cached || fetch(event.request)),
    );
  }
});
```

## 11. Measuring Network Performance

```js
// Resource Timing API
performance.getEntriesByType("resource").forEach((entry) => {
  console.log(
    entry.name,
    "DNS:",
    entry.domainLookupEnd - entry.domainLookupStart,
  );
  console.log(entry.name, "TTFB:", entry.responseStart - entry.requestStart);
});
```

```bash
# Chrome DevTools Network tab, or CLI tools
curl -w "@curl-format.txt" -o /dev/null -s https://example.com
```

## 12. Best Practices

1. Use `preconnect`/`dns-prefetch` for critical third-party origins.
2. Upgrade to HTTP/2 or HTTP/3 to reduce connection overhead and enable multiplexing.
3. Compress everything (gzip/Brotli) and minify JS/CSS.
4. Serve modern image formats (WebP/AVIF) with responsive `srcset`.
5. Use a CDN to reduce physical distance/latency to users.
6. Lazy-load below-the-fold content; prioritize (`fetchpriority`) critical resources.
7. Reduce round trips — batch API calls, use keep-alive connections.
8. Cache aggressively with proper headers (see Caching notes).
9. Use Service Workers for repeat-visit speed and offline resilience.
