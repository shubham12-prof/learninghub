# 05. Headers

## What Are HTTP Headers?

Headers are key-value pairs sent with every HTTP request and response, carrying metadata: content type, authentication, caching rules, client info, and more. They're separate from the request/response body.

```
GET /users/42 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOi...
Accept: application/json
User-Agent: Mozilla/5.0
```

## Categories of Headers

### Request Headers (sent by client)

| Header          | Purpose                                          |
| --------------- | ------------------------------------------------ |
| `Authorization` | Credentials (`Bearer <token>`, `Basic <base64>`) |
| `Content-Type`  | Format of the request body (`application/json`)  |
| `Accept`        | Formats the client can handle in the response    |
| `User-Agent`    | Client software identification                   |
| `Cookie`        | Cookies sent from a previous response            |
| `If-None-Match` | Conditional request using ETag                   |
| `X-Request-ID`  | Custom client-generated tracing ID               |

### Response Headers (sent by server)

| Header                        | Purpose                                                       |
| ----------------------------- | ------------------------------------------------------------- |
| `Content-Type`                | Format of the response body                                   |
| `Content-Length`              | Size of the response body in bytes                            |
| `Cache-Control`               | Caching directives                                            |
| `ETag`                        | Version identifier for a resource, used for caching           |
| `Location`                    | URL of a newly created resource (with 201) or redirect target |
| `Set-Cookie`                  | Sets a cookie on the client                                   |
| `WWW-Authenticate`            | Sent with 401, describes how to authenticate                  |
| `Access-Control-Allow-Origin` | CORS header                                                   |
| `Retry-After`                 | Sent with 429/503, tells client when to retry                 |

## Reading Request Headers in Express

```js
app.get("/profile", (req, res) => {
  const auth = req.get("Authorization"); // or req.headers['authorization']
  const contentType = req.get("Content-Type");
  const accept = req.get("Accept");
  res.json({ auth, contentType, accept });
});
```

## Setting Response Headers

```js
app.get("/data", (req, res) => {
  res.set("X-Total-Count", "150");
  res.set({
    "Cache-Control": "public, max-age=3600",
    "X-API-Version": "2.1",
  });
  res.json({ data: [] });
});
```

## `Content-Type` — Critical for API Correctness

```js
app.post("/users", (req, res) => {
  // express.json() only parses the body if Content-Type: application/json
  res.status(201).json({ message: "Created" }); // res.json() sets Content-Type automatically
});
```

If a client sends JSON without setting `Content-Type: application/json`, `express.json()` middleware won't parse it, and `req.body` will be `undefined` (or `{}`).

## `Location` Header on Resource Creation

Best practice: when creating a resource (201), point clients to it.

```js
app.post("/users", (req, res) => {
  const user = createUser(req.body);
  res.status(201).set("Location", `/users/${user.id}`).json(user);
});
```

## Authorization Header Patterns

### Bearer Token (JWT / OAuth2)

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```js
function authenticate(req, res, next) {
  const authHeader = req.get("Authorization"); // "Bearer <token>"
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = verifyJWT(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
```

### Basic Auth

```
Authorization: Basic base64(username:password)
```

```js
function basicAuth(req, res, next) {
  const authHeader = req.get("Authorization") || "";
  const [scheme, encoded] = authHeader.split(" ");
  if (scheme !== "Basic" || !encoded) {
    res.set("WWW-Authenticate", "Basic");
    return res.status(401).json({ error: "Authentication required" });
  }
  const [username, password] = Buffer.from(encoded, "base64")
    .toString()
    .split(":");
  // validate username/password...
  next();
}
```

## Caching Headers

```js
app.get("/static-data", (req, res) => {
  res.set("Cache-Control", "public, max-age=86400"); // cache for 1 day
  res.json(staticData);
});

app.get("/private-data", (req, res) => {
  res.set("Cache-Control", "no-store"); // never cache sensitive data
  res.json(privateData);
});
```

### ETag-Based Conditional Requests

```js
const crypto = require("crypto");

app.get("/products/:id", (req, res) => {
  const product = findProduct(req.params.id);
  const etag = crypto
    .createHash("md5")
    .update(JSON.stringify(product))
    .digest("hex");

  if (req.get("If-None-Match") === etag) {
    return res.status(304).end(); // client's cache is still valid
  }

  res.set("ETag", etag).json(product);
});
```

## CORS-Related Headers (Preview — Full Detail in Express Notes)

```js
res.set("Access-Control-Allow-Origin", "https://myfrontend.com");
res.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
res.set("Access-Control-Allow-Credentials", "true");
```

## Rate Limiting Headers

```js
res.set({
  "RateLimit-Limit": "100",
  "RateLimit-Remaining": "42",
  "RateLimit-Reset": "900",
  "Retry-After": "60", // seconds until the client can retry, used with 429
});
```

## Custom Headers (`X-` Prefix Convention)

Historically, custom (non-standard) headers were prefixed with `X-` (e.g., `X-Request-ID`, `X-API-Key`). This convention was formally deprecated by RFC 6648 in 2012, but it's still widely used in practice for clarity/backward compatibility.

```js
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.set("X-Request-ID", req.id);
  next();
});
```

## Common Interview-Style Questions

- **How do you read a specific request header in Express?**
  `req.get('Header-Name')` or `req.headers['header-name']` (headers are case-insensitive but normalized to lowercase in `req.headers`).

- **Why is the `Location` header sent with a 201 response?**
  To tell the client where the newly created resource can be accessed (its URL).

- **What's the difference between `Cache-Control: no-store` and `no-cache`?**
  `no-store` means never cache the response at all; `no-cache` means the response can be cached but must be revalidated with the server before reuse.

- **How does an ETag improve efficiency?**
  It lets the client send `If-None-Match` on subsequent requests; if the resource hasn't changed, the server responds with `304 Not Modified` (no body), saving bandwidth.

- **What header commonly accompanies a 401 response?**
  `WWW-Authenticate`, describing the expected authentication scheme.
