# 04. Status Codes

## Why Status Codes Matter

HTTP status codes communicate the outcome of a request in a standardized way clients (and intermediaries like caches/proxies) can understand programmatically, without parsing the response body.

Status codes fall into five classes:

| Range | Class         | Meaning                                                                 |
| ----- | ------------- | ----------------------------------------------------------------------- |
| 1xx   | Informational | Request received, continuing process (rarely used directly by API devs) |
| 2xx   | Success       | Request succeeded                                                       |
| 3xx   | Redirection   | Further action needed to complete the request                           |
| 4xx   | Client Error  | The request has an error (client's fault)                               |
| 5xx   | Server Error  | The server failed to fulfill a valid request (server's fault)           |

## 2xx — Success

| Code  | Name       | When to Use                                                        |
| ----- | ---------- | ------------------------------------------------------------------ |
| `200` | OK         | Standard success response (GET, PUT, PATCH)                        |
| `201` | Created    | A new resource was successfully created (POST)                     |
| `202` | Accepted   | Request accepted for processing but not completed yet (async jobs) |
| `204` | No Content | Success, but no body to return (DELETE, sometimes PUT)             |

```js
app.post("/users", (req, res) => {
  const user = createUser(req.body);
  res.status(201).json(user); // 201 Created
});

app.delete("/users/:id", (req, res) => {
  deleteUser(req.params.id);
  res.status(204).send(); // 204 No Content — no body
});

app.post("/reports/generate", (req, res) => {
  queueReportJob(req.body);
  res.status(202).json({ message: "Report generation started" }); // 202 Accepted
});
```

## 3xx — Redirection

| Code  | Name              | When to Use                                                      |
| ----- | ----------------- | ---------------------------------------------------------------- |
| `301` | Moved Permanently | Resource permanently moved to a new URL                          |
| `302` | Found             | Temporary redirect                                               |
| `304` | Not Modified      | Cached version is still valid (used with `ETag`/`If-None-Match`) |

```js
app.get("/old-endpoint", (req, res) => {
  res.redirect(301, "/new-endpoint");
});

app.get("/products/:id", (req, res) => {
  const etag = generateETag(product);
  if (req.headers["if-none-match"] === etag) {
    return res.status(304).end(); // client's cached copy is still valid
  }
  res.set("ETag", etag).json(product);
});
```

## 4xx — Client Errors

| Code  | Name                 | When to Use                                                  |
| ----- | -------------------- | ------------------------------------------------------------ |
| `400` | Bad Request          | Malformed request syntax, invalid input                      |
| `401` | Unauthorized         | Missing or invalid authentication credentials                |
| `403` | Forbidden            | Authenticated, but not permitted to access this resource     |
| `404` | Not Found            | Resource doesn't exist                                       |
| `405` | Method Not Allowed   | HTTP method not supported for this resource                  |
| `406` | Not Acceptable       | Server can't produce a response matching the `Accept` header |
| `409` | Conflict             | Request conflicts with current state (e.g., duplicate email) |
| `410` | Gone                 | Resource existed but was permanently removed                 |
| `422` | Unprocessable Entity | Syntax is valid, but semantic/validation errors exist        |
| `429` | Too Many Requests    | Rate limit exceeded                                          |

```js
app.post("/users", (req, res) => {
  if (!req.body.email) {
    return res.status(400).json({ error: "email is required" }); // malformed request
  }
  if (userExists(req.body.email)) {
    return res.status(409).json({ error: "Email already registered" }); // conflict
  }
  // ...
});

app.get("/profile", (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  res.json(req.user);
});
```

### 401 vs 403 — Common Confusion

- **401 Unauthorized** — "I don't know who you are" (missing/invalid credentials). Should include a `WWW-Authenticate` header per spec.
- **403 Forbidden** — "I know who you are, but you're not allowed to do this" (valid credentials, insufficient permissions).

```js
if (!req.user) return res.status(401).json({ error: "Please log in" });
if (req.user.role !== "admin")
  return res.status(403).json({ error: "Admins only" });
```

### 400 vs 422 — Common Confusion

- **400 Bad Request** — the request itself is malformed (invalid JSON, missing required field entirely).
- **422 Unprocessable Entity** — the request is syntactically valid but fails semantic/business validation (e.g., `email` field present but not a valid email format, or `age: -5`).

Many APIs use 400 for both cases for simplicity — either is defensible, but be consistent within your API.

## 5xx — Server Errors

| Code  | Name                  | When to Use                                                  |
| ----- | --------------------- | ------------------------------------------------------------ |
| `500` | Internal Server Error | Generic catch-all for unexpected server failures             |
| `502` | Bad Gateway           | Upstream server (proxy/gateway) received an invalid response |
| `503` | Service Unavailable   | Server temporarily overloaded or down for maintenance        |
| `504` | Gateway Timeout       | Upstream server took too long to respond                     |

```js
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    error: err.isOperational ? err.message : "Internal Server Error",
  });
});
```

> Never expose internal error details/stack traces to clients in production for 500 errors — this can leak sensitive implementation details.

## Central Status Code Reference Table (Cheat Sheet)

```
200 OK                     — general success
201 Created                — resource created
202 Accepted               — async processing started
204 No Content              — success, empty body

301 Moved Permanently
302 Found
304 Not Modified

400 Bad Request             — malformed/invalid input
401 Unauthorized            — not authenticated
403 Forbidden               — authenticated, not authorized
404 Not Found               — resource doesn't exist
405 Method Not Allowed
409 Conflict                — duplicate/state conflict
422 Unprocessable Entity    — semantic validation failure
429 Too Many Requests       — rate limited

500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
504 Gateway Timeout
```

## Example: Consistent Status Code Usage Across a Resource

```js
router.get("/products", (req, res) => res.status(200).json(products)); // 200
router.get("/products/:id", (req, res) => {
  const p = findProduct(req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" }); // 404
  res.status(200).json(p); // 200
});
router.post("/products", (req, res) => {
  if (!req.body.name) return res.status(400).json({ error: "name required" }); // 400
  const p = createProduct(req.body);
  res.status(201).json(p); // 201
});
router.put("/products/:id", (req, res) => {
  const updated = replaceProduct(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Not found" }); // 404
  res.status(200).json(updated); // 200
});
router.delete("/products/:id", (req, res) => {
  const deleted = removeProduct(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Not found" }); // 404
  res.status(204).send(); // 204
});
```

## Common Interview-Style Questions

- **What's the difference between 401 and 403?**
  401 means the client isn't authenticated at all (no/invalid credentials); 403 means the client is authenticated but lacks permission for the requested action.

- **What status code should a successful DELETE return?**
  `204 No Content` is standard (no body); `200 OK` with confirmation content is also acceptable.

- **When would you use 202 instead of 200/201?**
  When the request has been accepted for processing but isn't complete yet — typically for asynchronous/background jobs (e.g., report generation, video processing).

- **What's the difference between 400 and 422?**
  400 indicates the request itself is malformed/invalid at a structural level; 422 indicates the request is well-formed but fails semantic or business-rule validation.

- **Should a server ever return 500 for a client mistake, like a missing field?**
  No — client mistakes should return 4xx codes; 500 is reserved for unexpected server-side failures (bugs, crashes, unhandled exceptions).
