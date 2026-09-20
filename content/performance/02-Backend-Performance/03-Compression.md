# 03. Compression

## Why Compression Matters for Backend Performance

Compressing HTTP response bodies before sending them over the network reduces the number of bytes transferred, directly improving response times (especially over slower or high-latency network connections) at the cost of some CPU time spent compressing/decompressing. For text-heavy responses (JSON APIs, HTML, CSS, JS), compression ratios are often substantial.

```
Uncompressed JSON response:  250KB
Gzip-compressed:                 45KB   (roughly 80% reduction — typical for repetitive JSON structures)
```

## How HTTP Compression Works

```
1. Client sends a request with: Accept-Encoding: gzip, deflate, br
2. Server compresses the response body using one of the client's supported encodings
3. Server sets: Content-Encoding: gzip (or br, deflate)
4. Client automatically decompresses the response before handing it to application code
```

This negotiation is transparent to most application code — the client and server handle compression/decompression, and your API handler code just works with normal JSON/data as usual.

## Enabling Compression in Express

```bash
npm install compression
```

```js
const compression = require("compression");
const express = require("express");
const app = express();

app.use(compression());
```

(Full detail on configuration options — threshold, filtering, compression level — in the Express module's Compression notes.)

## Compression Algorithms — Trade-offs

| Algorithm       | Compression Ratio                            | CPU Cost                                      | Browser Support                         |
| --------------- | -------------------------------------------- | --------------------------------------------- | --------------------------------------- |
| **gzip**        | Good                                         | Low-moderate                                  | Universal                               |
| **deflate**     | Similar to gzip                              | Low-moderate                                  | Universal (less commonly used directly) |
| **Brotli (br)** | Better than gzip (~15-20% smaller typically) | Higher (especially at max compression levels) | Wide modern support                     |

```js
app.use(
  compression({
    // Most compression middleware automatically negotiates the BEST algorithm
    // the client supports, preferring Brotli when available since it typically compresses better
  }),
);
```

**Practical guidance:** Brotli generally produces smaller output than gzip for the same content, but at a higher CPU cost — for **static, pre-compressible** content (assets that don't change per-request), pre-compressing at build time with Brotli's maximum compression level is a common pattern, since the CPU cost is paid once at build time rather than on every single request.

```bash
# Pre-compressing static assets at build time (paying compression CPU cost ONCE, not per-request)
brotli --best -o app.js.br app.js
gzip -9 -k app.js
```

```nginx
# Nginx serving pre-compressed static files directly, avoiding runtime compression entirely
location /static/ {
  gzip_static on;
  brotli_static on;
}
```

## Compression Level — Balancing Ratio vs CPU Cost

```js
app.use(
  compression({
    level: 6, // 0 (no compression, fastest) to 9 (max compression, slowest) — 6 is a common balanced default
  }),
);
```

For dynamically-generated responses (compressed fresh on every request, unlike pre-compressed static assets), a lower/moderate compression level often makes sense — the marginal size reduction from level 9 vs level 6 is usually small, but the CPU cost difference can be significant under high request volume.

## When NOT to Compress

```
Already-compressed content:  images (JPEG/PNG/WebP), videos, ZIP files, already-compressed API responses
                              -> re-compressing wastes CPU for negligible (or even negative) size benefit

Very small responses:          compression overhead (headers, algorithm metadata) can exceed the
                                 actual savings for tiny payloads — most compression middleware has
                                 a size threshold (e.g., only compress responses > 1KB) for this reason
```

```js
app.use(
  compression({
    threshold: 1024, // don't bother compressing responses smaller than 1KB
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res); // default filter already excludes many binary/already-compressed types
    },
  }),
);
```

## gRPC and Binary Protocols — An Alternative to Compressing JSON

Rather than compressing verbose JSON responses after the fact, some systems reduce payload size at the source by using a more compact binary serialization format in the first place (Protocol Buffers, MessagePack) — often combined with compression for further reduction, but starting from a meaningfully smaller baseline.

```
JSON (verbose, human-readable):        { "id": 12345, "name": "Alice", "active": true }   -> ~50 bytes
Protocol Buffers (compact, binary):      same data, binary-encoded                          -> ~15-20 bytes
```

This is a different, complementary lever from HTTP compression — reducing the size of the data itself, rather than compressing whatever serialization format was already chosen.

## Compression and CDNs

As covered in the Scaling module's CDN notes, compression is sometimes handled by a CDN or reverse proxy layer in front of the application server, rather than (or in addition to) the application server itself — offloading the compression CPU cost to infrastructure specifically positioned to handle it efficiently at scale.

```
App server compression:  simple, works everywhere, but adds CPU load directly to app instances
CDN/reverse proxy compression: offloads the CPU cost to dedicated infrastructure,
                                 can also enable pre-compression/caching of compressed static assets
```

## Measuring Compression's Actual Impact

```bash
curl -H "Accept-Encoding: gzip" -w "Size: %{size_download} bytes\n" -o /dev/null -s https://api.example.com/data
curl -w "Size: %{size_download} bytes\n" -o /dev/null -s https://api.example.com/data   # without compression, for comparison
```

Always verify compression is actually reducing payload size as expected in practice (not just assumed based on enabling the middleware) — misconfiguration (wrong content types, threshold set too high, filter excluding more than intended) can silently leave compression not actually happening for a given endpoint.

## Common Interview-Style Questions

- **How does HTTP compression negotiation work between client and server?**
  The client sends an `Accept-Encoding` header listing the compression algorithms it supports; the server compresses the response using one of those algorithms (typically the best one it supports, like Brotli over gzip when both are available) and sets a `Content-Encoding` header, which the client uses to automatically decompress the response before handing it to application code.

- **What's the trade-off between Brotli and gzip?**
  Brotli generally achieves better compression ratios (smaller output) than gzip for the same content, but at a higher CPU cost, especially at maximum compression levels; the choice often comes down to whether the content is compressed once at build time (favoring Brotli's better ratio, since the cost is paid only once) versus compressed fresh on every request (where the CPU cost trade-off matters more directly).

- **Why shouldn't you compress already-compressed content like images or videos?**
  These formats are already compressed at the format level; attempting to re-compress them with HTTP compression wastes CPU for negligible (or sometimes even negative) additional size benefit, since there's little remaining redundancy for a general-purpose compression algorithm to exploit.

- **Why does compression middleware typically apply a minimum size threshold before compressing a response?**
  For very small responses, the overhead of compression (algorithm metadata, headers) can actually exceed the size savings achieved, making compression counterproductive below a certain payload size — a threshold (commonly around 1KB) avoids this negative-value scenario.

- **What's an alternative/complementary approach to reducing payload size beyond compressing JSON responses?**
  Using a more compact binary serialization format (like Protocol Buffers or MessagePack) instead of verbose JSON in the first place, reducing the size of the underlying data itself — this can be combined with HTTP compression for further reduction, but starts from a meaningfully smaller baseline than compressing an inherently verbose text format.
