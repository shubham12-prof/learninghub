# Browser Cache

## 1. What is Browser Caching?

Browser caching is a mechanism where a web browser stores copies of files (HTML, CSS, JS, images, fonts) locally on the user's device, so that when the same resource is requested again, it can be served from the local disk/memory instead of going over the network to the server.

**Why it matters:**

- Reduces page load time
- Reduces server load and bandwidth usage
- Improves user experience, especially on repeat visits

## 2. How It Works (High Level)

1. Browser requests a resource (e.g. `style.css`) from the server.
2. Server responds with the resource **and** HTTP caching headers.
3. Browser stores the resource in its cache along with metadata (expiry, validators).
4. Next time the resource is needed, the browser checks the cache:
   - If still "fresh" → use cached copy directly (no network request at all).
   - If "stale" → send a **conditional request** to check if it changed.
   - If not in cache → fetch it fresh from the server.

```
[Browser] --GET /style.css--> [Server]
[Server] --200 OK + Cache-Control headers--> [Browser]
[Browser] stores in cache

Next request:
[Browser] checks cache -> fresh? -> use local copy (no network call)
                        -> stale? -> conditional GET (If-None-Match / If-Modified-Since)
```

## 3. Key HTTP Headers

### `Cache-Control`

The most important and modern header. Set by the server.

| Directive           | Meaning                                                                               |
| ------------------- | ------------------------------------------------------------------------------------- |
| `max-age=<seconds>` | How long the resource is considered fresh                                             |
| `no-cache`          | Must revalidate with server before using cached copy (does NOT mean "don't cache")    |
| `no-store`          | Do not cache at all                                                                   |
| `public`            | Can be cached by browser AND intermediate caches (CDN, proxy)                         |
| `private`           | Can only be cached by the browser, not shared caches                                  |
| `must-revalidate`   | Once stale, must revalidate before use, no using stale copy on network failure        |
| `immutable`         | Resource will never change during its freshness lifetime (great for versioned assets) |

```http
Cache-Control: public, max-age=31536000, immutable
```

### `Expires` (legacy)

Sets an absolute date/time after which the resource is stale. Superseded by `max-age` but still used as a fallback for old browsers.

```http
Expires: Wed, 21 Oct 2026 07:28:00 GMT
```

### `ETag` (validator)

A hash/fingerprint of the resource content. Used for revalidation.

```http
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d"
```

Browser sends it back as `If-None-Match` on the next request:

```http
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d"
```

If unchanged, server responds `304 Not Modified` (no body sent → saves bandwidth).

### `Last-Modified` (validator)

Date the resource was last changed. Weaker than ETag (only second precision).

```http
Last-Modified: Tue, 15 Jul 2025 10:00:00 GMT
If-Modified-Since: Tue, 15 Jul 2025 10:00:00 GMT
```

## 4. Cache Lifecycle: Fresh vs Stale vs Revalidation

```
        max-age window (FRESH)                REVALIDATE
|---------------------------------|------------------------------|
served from cache, 0 network      server asked "still valid?"
calls                             via If-None-Match / If-Modified-Since
                                   -> 304 (use cache) or 200 (new content)
```

## 5. Setting Cache Headers — Code Examples

### Node.js / Express

```js
const express = require("express");
const app = express();

// Static assets with long-term caching (hashed filenames recommended)
app.use(
  "/static",
  express.static("public", {
    maxAge: "1y",
    immutable: true,
    setHeaders: (res, path) => {
      if (path.endsWith(".html")) {
        // HTML should usually NOT be cached long-term
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  }),
);

// API response - private, short cache
app.get("/api/profile", (req, res) => {
  res.set("Cache-Control", "private, max-age=60");
  res.json({ name: "John Doe" });
});

app.listen(3000);
```

### Nginx

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location ~* \.html$ {
    add_header Cache-Control "no-cache";
}
```

### Setting ETag manually (Node.js)

```js
const crypto = require("crypto");
const fs = require("fs");

app.get("/data.json", (req, res) => {
  const content = fs.readFileSync("data.json");
  const hash = crypto.createHash("md5").update(content).digest("hex");
  res.set("ETag", hash);

  if (req.headers["if-none-match"] === hash) {
    return res.status(304).end(); // Not Modified
  }
  res.set("Cache-Control", "no-cache");
  res.send(content);
});
```

## 6. Cache-Busting Strategy (Versioned Assets)

The industry-standard pattern: give static files a **content hash** in the filename, and cache them forever.

```html
<!-- Instead of -->
<script src="app.js"></script>

<!-- Use a hashed filename generated at build time -->
<script src="app.a1b2c3d4.js"></script>
```

```js
// webpack.config.js example
module.exports = {
  output: {
    filename: "[name].[contenthash].js",
  },
};
```

Because the filename changes whenever content changes, you can safely set:

```http
Cache-Control: public, max-age=31536000, immutable
```

The browser will _never_ need to revalidate — a new deploy simply generates a new URL.

## 7. Types of Browser Storage related to caching

| Storage                        | Purpose                                | Persistence              |
| ------------------------------ | -------------------------------------- | ------------------------ |
| HTTP Cache (disk/memory cache) | Automatic caching of network responses | Controlled by headers    |
| Service Worker Cache API       | Programmatic, offline-first caching    | Until explicitly deleted |
| `localStorage`                 | Key-value storage for app data         | Persistent until cleared |
| `sessionStorage`               | Key-value storage for app data         | Cleared on tab close     |
| IndexedDB                      | Structured/large data storage          | Persistent               |

### Service Worker Example (Cache API for offline support)

```js
// service-worker.js
const CACHE_NAME = "app-cache-v1";
const ASSETS = ["/", "/index.html", "/app.css", "/app.js"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    }),
  );
});
```

## 8. Debugging Browser Cache

- Chrome DevTools → Network tab → check "Size" column (`from disk cache` / `from memory cache` / `(memory cache)`).
- DevTools → Application tab → Cache Storage (for Service Workers).
- Hard refresh: `Ctrl+Shift+R` (bypasses cache).
- "Disable cache" checkbox in DevTools while Network tab is open.

## 9. Best Practices

1. Use `immutable` + long `max-age` for versioned/hashed static assets.
2. Never cache HTML pages long-term (use `no-cache` so it always revalidates).
3. Use `private` for user-specific data, `public` for shared data.
4. Prefer `ETag`/`Last-Modified` for revalidation of frequently-changing content.
5. Use `no-store` for sensitive data (banking info, tokens).
6. Combine with a CDN for global reach (see next section).
