# 09. Request Object (`req`)

The `req` object represents the HTTP request. Express extends Node's native `http.IncomingMessage` with extra properties and methods.

## Key Properties

| Property          | Description                                         | Example                                  |
| ----------------- | --------------------------------------------------- | ---------------------------------------- |
| `req.params`      | Route parameters                                    | `{ id: '5' }`                            |
| `req.query`       | Query string parameters                             | `{ page: '2' }`                          |
| `req.body`        | Parsed request body (needs body-parsing middleware) | `{ name: 'Alice' }`                      |
| `req.headers`     | All request headers (lowercase keys)                | `{ 'content-type': 'application/json' }` |
| `req.method`      | HTTP method                                         | `'GET'`                                  |
| `req.url`         | URL relative to the mount point                     | `/users?page=2`                          |
| `req.originalUrl` | Full original URL (useful with sub-routers)         | `/api/users?page=2`                      |
| `req.path`        | Just the path, no query string                      | `/users`                                 |
| `req.hostname`    | Host name from `Host` header                        | `example.com`                            |
| `req.ip`          | Remote IP address of the request                    | `127.0.0.1`                              |
| `req.protocol`    | `http` or `https`                                   | `https`                                  |
| `req.secure`      | `true` if HTTPS                                     | `true`                                   |
| `req.cookies`     | Parsed cookies (needs `cookie-parser`)              | `{ token: 'abc' }`                       |
| `req.xhr`         | `true` if request came via `XMLHttpRequest`         | `true`/`false`                           |

## Example: Inspecting a Request

```js
app.get("/inspect", (req, res) => {
  res.json({
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path,
    query: req.query,
    headers: req.headers,
    ip: req.ip,
    protocol: req.protocol,
  });
});
```

## `req.get(headerName)` — Read a Specific Header

```js
app.get("/", (req, res) => {
  const contentType = req.get("Content-Type");
  const userAgent = req.get("User-Agent");
  res.send(`Your browser is: ${userAgent}`);
});
```

## `req.is(type)` — Check Content-Type

```js
app.post("/upload", (req, res) => {
  if (req.is("application/json")) {
    res.send("Got JSON");
  } else if (req.is("multipart/form-data")) {
    res.send("Got form data with a file");
  } else {
    res.status(415).send("Unsupported content type");
  }
});
```

## `req.accepts()` — Content Negotiation

Checks what response types the client will accept (from the `Accept` header).

```js
app.get("/data", (req, res) => {
  res.format({
    "application/json": () => res.json({ message: "Hello JSON" }),
    "text/html": () => res.send("<h1>Hello HTML</h1>"),
    default: () => res.status(406).send("Not Acceptable"),
  });
});
```

## `req.params` vs `req.query` vs `req.body`

```js
// PUT /users/42?notify=true
// Body: { "name": "Alice" }

app.put("/users/:id", (req, res) => {
  console.log(req.params); // { id: '42' }
  console.log(req.query); // { notify: 'true' }
  console.log(req.body); // { name: 'Alice' }
  res.sendStatus(200);
});
```

## Getting the Real Client IP Behind a Proxy

By default, `req.ip` may show the proxy's IP instead of the real client IP when behind a load balancer/reverse proxy (Nginx, Heroku, etc.). Enable `trust proxy`:

```js
app.set("trust proxy", true); // trust X-Forwarded-For header
app.get("/", (req, res) => {
  res.send(`Your IP: ${req.ip}`);
});
```

## `req.cookies` (requires `cookie-parser`)

```js
const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.get("/", (req, res) => {
  console.log(req.cookies); // { sessionId: 'abc123' }
  res.send("Cookies logged");
});
```

## Attaching Custom Data to `req` (Common Pattern)

Middleware routinely attaches data for downstream handlers:

```js
app.use((req, res, next) => {
  req.requestTime = Date.now();
  next();
});

app.get("/", (req, res) => {
  res.send(`Request received at ${req.requestTime}`);
});
```

This is exactly how authentication middleware attaches `req.user`, or how a request ID middleware attaches `req.id`.

## `req.range()` — Handling Range Requests (e.g. video streaming)

```js
app.get("/video", (req, res) => {
  const range = req.range(fileSize); // parses "Range" header
  // use range.start / range.end to stream partial content
});
```

## Common Interview-Style Questions

- **What's the difference between `req.url` and `req.originalUrl`?**
  `req.url` is relative to the current router/mount point and can change as middleware/routers process the request; `req.originalUrl` preserves the full original URL as received.

- **How do you read a request header?**
  `req.get('Header-Name')` or `req.headers['header-name']`.

- **Why might `req.ip` show the wrong IP address in production?**
  Because requests pass through a reverse proxy/load balancer; you need `app.set('trust proxy', true)` so Express reads the real client IP from `X-Forwarded-For`.

- **Does `req.body` exist without body-parsing middleware?**
  No — without `express.json()`/`express.urlencoded()` (or similar), `req.body` is `undefined`.
