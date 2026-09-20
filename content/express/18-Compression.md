# 18. Compression

## What is Compression Middleware?

The `compression` middleware compresses response bodies (typically using **gzip** or **brotli**) before sending them to the client, reducing payload size and improving load times — especially valuable for large JSON responses, HTML pages, and text-based assets.

```bash
npm install compression
```

## Basic Usage

```js
const express = require("express");
const compression = require("compression");

const app = express();

app.use(compression());

app.get("/large-data", (req, res) => {
  res.json(generateLargeDataset()); // automatically gzip-compressed
});

app.listen(3000);
```

The browser sends `Accept-Encoding: gzip, deflate, br`, and if the middleware detects support, it compresses the response and sets `Content-Encoding: gzip`.

## How It Works

1. Client sends a request with `Accept-Encoding: gzip, br` header (browsers do this automatically).
2. `compression()` middleware intercepts `res.write`/`res.end` calls.
3. If the response is large enough and the content type is compressible, it compresses the stream on the fly.
4. Sets `Content-Encoding` header so the client knows to decompress.

## Configuration Options

```js
app.use(
  compression({
    level: 6, // compression level 0 (none) - 9 (max, slower)
    threshold: 1024, // only compress responses larger than 1KB (default)
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false; // allow clients to opt out
      }
      return compression.filter(req, res); // default filter (checks Content-Type)
    },
  }),
);
```

### `threshold`

Compressing tiny responses isn't worth the CPU overhead — the default threshold is 1KB, meaning smaller responses are sent uncompressed.

### `level`

Higher levels compress better but use more CPU. Level 6 is a good default balance; level 9 gives marginally smaller output at a noticeably higher CPU cost.

## Excluding Certain Routes from Compression

```js
app.use(
  compression({
    filter: (req, res) => {
      if (req.path.startsWith("/stream")) return false; // don't compress streaming responses
      return compression.filter(req, res);
    },
  }),
);
```

## Compression and Already-Compressed Content

Don't bother compressing content that's already compressed (images, videos, zip files) — it wastes CPU with negligible size benefit. The default `filter` already skips most binary/already-compressed MIME types, but be mindful when serving custom binary content.

```js
app.get("/image", (req, res) => {
  res.set("Content-Encoding", "identity"); // explicitly skip compression for this response
  res.sendFile(imagePath);
});
```

## Compression in Production Architecture

In many production setups, compression is handled by a **reverse proxy** (Nginx, Cloudflare, a CDN) rather than the Node process itself — offloading CPU-intensive compression work away from your application server. If you're behind such a proxy, you may not need the `compression` middleware in Express at all. Use it primarily when:

- Node serves responses directly to clients (no compressing proxy in front)
- You're running a small-to-medium app without a dedicated reverse proxy layer

## Example: Combined with Other Middleware

```js
const express = require("express");
const compression = require("compression");
const helmet = require("helmet");

const app = express();

app.use(helmet());
app.use(compression());
app.use(express.json());

app.get("/api/report", (req, res) => {
  res.json({ data: buildLargeReport() }); // compressed automatically if large enough
});

app.listen(3000);
```

## Verifying Compression Is Working

```bash
curl -H "Accept-Encoding: gzip" -I http://localhost:3000/large-data
```

Look for `Content-Encoding: gzip` in the response headers.

## Common Interview-Style Questions

- **What does the `compression` middleware do?**
  It compresses HTTP response bodies (typically gzip) before sending them to reduce payload size and improve transfer speed.

- **Why is there a `threshold` option?**
  Compressing very small responses wastes CPU for negligible size savings — the threshold skips compression below a certain byte size (default ~1KB).

- **Should you compress images or videos?**
  No — they're usually already compressed formats; re-compressing wastes CPU with little to no size benefit.

- **Is Express-level compression always necessary?**
  No — if a reverse proxy or CDN in front of the app already handles compression, adding it again in Express is often redundant.
