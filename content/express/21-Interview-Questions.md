# 21. Interview Questions — Express.js (Comprehensive)

A consolidated set of commonly asked Express.js interview questions, organized by topic, with concise answers and code where useful.

---

## Fundamentals

**Q: What is Express.js?**
A minimal, unopinionated Node.js web framework that provides routing, middleware support, and a cleaner request/response API on top of Node's raw `http` module.

**Q: Is Express a full MVC framework like Django or Rails?**
No — it's a lightweight, unopinionated framework. It doesn't enforce project structure, ORM, or templating choices; developers layer that structure (like MVC) on top themselves.

**Q: What does `app.listen()` return?**
An instance of `http.Server`, which can be stored and later closed (`server.close()`).

**Q: How do you disable the `X-Powered-By` header?**

```js
app.disable("x-powered-by");
```

---

## Routing

**Q: How does Express match a request to a route?**
It processes middleware and routes in registration order, matching HTTP method + path, and executes the first match (unless `next()` continues the chain).

**Q: Difference between `app.use()` and `app.get()`?**
`app.use()` matches all HTTP methods and any path starting with the given prefix; `app.get()` matches only GET requests to a specific path/pattern.

**Q: What is `express.Router()` and why use it?**
A mini, mountable route handler used to split routes into modules and mount them under a common path prefix (`app.use('/users', userRouter)`), keeping the main app file clean.

**Q: How do you handle a route parameter with a regex constraint?**

```js
app.get("/users/:id(\\d+)", handler); // only matches numeric IDs
```

---

## Middleware

**Q: What is middleware in Express?**
A function with signature `(req, res, next)` that runs during the request-response cycle, with the ability to modify `req`/`res`, end the cycle, or pass control via `next()`.

**Q: What happens if `next()` is never called and no response is sent?**
The request hangs indefinitely until it times out — the client never receives a response.

**Q: What are the different types of middleware?**
Application-level, router-level, built-in (`express.json()`, `express.static()`), third-party (`cors`, `morgan`), and error-handling (`(err, req, res, next)`).

**Q: How do you pass control to error-handling middleware?**
Call `next(err)` with any truthy value — Express skips remaining regular middleware and jumps to the nearest error handler.

**Q: Why does async middleware sometimes "swallow" errors in Express 4?**
Because a rejected promise inside an `async` function isn't automatically caught by Express 4's synchronous internals — you must catch it and call `next(err)` yourself, or wrap it in a helper. Express 5 fixes this natively.

```js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

**Q: How does Express identify error-handling middleware?**
By its four-argument function signature: `(err, req, res, next)`.

---

## Request / Response

**Q: Difference between `req.url` and `req.originalUrl`?**
`req.url` is relative to the current router/mount point and can change as the request passes through routers; `req.originalUrl` preserves the full original request URL.

**Q: Difference between `res.send()` and `res.json()`?**
`res.json()` always serializes to JSON and sets `Content-Type: application/json`; `res.send()` infers the content type based on the argument's type (string, buffer, object).

**Q: Why might `req.ip` show the wrong address behind a load balancer?**
Because the direct connection is from the proxy, not the real client — you need `app.set('trust proxy', true)` to read the real IP from `X-Forwarded-For`.

**Q: What error occurs if you call `res.send()` after already sending a response?**
`Error: Cannot set headers after they are sent to the client` (`ERR_HTTP_HEADERS_SENT`).

---

## Body Parsing & Static Files

**Q: What's the difference between `express.json()` and `express.urlencoded()`?**
`express.json()` parses `application/json` bodies; `express.urlencoded()` parses `application/x-www-form-urlencoded` bodies (classic HTML form submissions).

**Q: Do you still need `body-parser` in modern Express?**
No — since Express 4.16+, `express.json()` and `express.urlencoded()` are built in.

**Q: How do you serve static files?**

```js
app.use(express.static("public"));
```

Files inside `public/` become accessible directly by their relative path.

**Q: How do you serve a React/Vue production build with client-side routing?**
Serve the static build folder, then add a catch-all route serving `index.html` for unmatched paths (placed after all API routes):

```js
app.use(express.static("build"));
app.get("/{*splat}", (req, res) =>
  res.sendFile(path.join(__dirname, "build/index.html")),
);
```

---

## Architecture

**Q: What are the three layers of MVC?**
Model (data/business logic), View (presentation), Controller (mediates between requests and models/views).

**Q: In a JSON API, what plays the role of "View"?**
The shape/serialization of the JSON response — there's no template, but response formatting is still a distinct concern from business logic.

**Q: Why keep database access out of controllers?**
To keep controllers focused purely on HTTP concerns, and keep data-access logic reusable and independently testable in the model layer.

---

## Validation & Security

**Q: Why validate on the server if the client already validates input?**
Client-side validation is easily bypassed (direct API calls, disabled JS); server-side validation is the real security/data-integrity boundary.

**Q: What's the difference between validation and sanitization?**
Validation checks whether input meets rules and rejects invalid data; sanitization transforms/cleans input into a safe canonical form (trimming, escaping HTML, normalizing).

**Q: What does Helmet do?**
Sets a collection of HTTP security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.) to mitigate common web vulnerabilities like XSS and clickjacking.

**Q: What enforces CORS — client or server?**
The browser enforces CORS restrictions based on headers the server sends; CORS doesn't restrict non-browser clients like curl or server-to-server requests.

**Q: Can you use `origin: '*'` with `credentials: true` in CORS config?**
No — browsers disallow wildcard origins when credentials (cookies) are included; you must specify an explicit origin.

**Q: What status code should validation failures return?**
`400 Bad Request` (not 500 — a validation failure is a client error, not a server error).

---

## File Upload

**Q: Why can't `express.json()` parse file uploads?**
File uploads use `multipart/form-data` encoding, a different format requiring a streaming multipart parser like Multer.

**Q: Difference between `upload.single()`, `upload.array()`, `upload.fields()`?**
`single()` — one file, one field; `array()` — multiple files, same field; `fields()` — multiple files across different named fields.

**Q: Disk storage vs memory storage in Multer?**
Disk storage saves the file directly to the local filesystem; memory storage buffers it in RAM, useful for immediately forwarding to cloud storage (S3, Cloudinary) without touching local disk.

---

## Rate Limiting & Performance

**Q: What HTTP status indicates a rate limit was exceeded?**
`429 Too Many Requests`.

**Q: Why does the default in-memory rate limit store break across multiple server instances?**
Each instance tracks its own request counts independently, so a client could exceed the intended global limit by hitting different instances — a shared store like Redis solves this.

**Q: What does the `compression` middleware do, and when might you skip it?**
It gzip/brotli-compresses response bodies to reduce payload size; you might skip it in Express if a reverse proxy/CDN in front already handles compression, or for already-compressed content like images/videos.

---

## Logging

**Q: Difference between Morgan and Winston?**
Morgan is HTTP request logging middleware (one log line per request); Winston is a general-purpose application logger supporting multiple transports (console, file, external services) for arbitrary events, errors, and structured logs.

**Q: Why use structured (JSON) logging in production?**
So log aggregation tools (ELK, Datadog, CloudWatch) can parse, index, and query logs programmatically instead of relying on fragile string matching.

---

## API Design

**Q: What's the most common API versioning strategy?**
URI path versioning (`/api/v1/...`), due to its simplicity, explicitness, and ease of routing/documentation.

**Q: How do you avoid duplicating logic across API versions?**
Keep shared business logic (models, services) version-agnostic; branch only at the thin response-formatting layer when response shapes differ between versions.

---

## Practical / Coding Questions Often Asked Live

**Q: Write a simple Express server with one GET and one POST route.**

```js
const express = require("express");
const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.post("/echo", (req, res) => res.json({ received: req.body }));

app.listen(3000, () => console.log("Running on port 3000"));
```

**Q: Write middleware that logs the time taken for each request.**

```js
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} - ${Date.now() - start}ms`);
  });
  next();
});
```

**Q: Write an authentication middleware that checks a Bearer token.**

```js
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
```

**Q: Write a centralized error handler.**

```js
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
});
```

**Q: How would you structure a scalable Express project?**
Separate `routes/`, `controllers/`, `models/`, `middleware/`, and `config/` folders (MVC-style); split `app.js` (Express config) from `server.js` (server startup) for testability; use `express.Router()` per resource; centralize error handling and validation.
