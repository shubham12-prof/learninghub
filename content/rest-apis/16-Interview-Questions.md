# 16. Interview Questions — REST APIs (Comprehensive)

A consolidated set of commonly asked REST API interview questions, organized by topic, with concise answers and code where useful.

---

## REST Principles

**Q: What is REST?**
An architectural style for networked applications based on stateless client-server communication, resource-based URLs, and a uniform interface built on standard HTTP semantics.

**Q: What are the core constraints of REST?**
Client-server separation, statelessness, cacheability, uniform interface, layered system, and (optionally) code on demand.

**Q: Why is statelessness important?**
It allows any server instance to handle any request (no session affinity needed), enabling simple horizontal scaling and load balancing.

**Q: What is HATEOAS?**
Hypermedia as the Engine of Application State — the idea that API responses include links describing available related actions, so clients can navigate the API dynamically. Rarely fully implemented in real-world APIs.

**Q: How should resources be named in RESTful URLs?**
As plural nouns representing entities (`/users`, `/orders`) — never verbs, since HTTP methods already convey the action.

---

## CRUD & HTTP Methods

**Q: Map CRUD operations to HTTP methods.**
Create → POST, Read → GET, Update → PUT (full) / PATCH (partial), Delete → DELETE.

**Q: What's the difference between PUT and PATCH?**
PUT replaces the entire resource; PATCH updates only the provided fields, leaving the rest unchanged.

**Q: What does "idempotent" mean? Which methods are idempotent?**
Calling the operation multiple times produces the same end state as calling it once. GET, PUT, DELETE, HEAD, OPTIONS are idempotent; POST is not (typically creates a new resource each call); PATCH is not guaranteed to be.

**Q: What's the difference between "safe" and "idempotent"?**
Safe methods never modify server state at all (GET, HEAD, OPTIONS); idempotent methods may modify state but yield the same result no matter how many times repeated.

**Q: Can PUT create a resource?**
Yes, in strict REST semantics, PUT can create a resource at a client-specified URI if it doesn't exist — though many APIs restrict PUT to updates only, using POST for creation.

---

## Status Codes

**Q: Difference between 401 and 403?**
401 means the client isn't authenticated (missing/invalid credentials); 403 means the client is authenticated but lacks permission.

**Q: What status code should a successful DELETE return?**
`204 No Content` (no body) or `200 OK` with a confirmation body.

**Q: Difference between 400 and 422?**
400 = malformed/structurally invalid request; 422 = syntactically valid but semantically/business-rule invalid.

**Q: When would you use 202 instead of 200/201?**
For asynchronous operations accepted for processing but not yet complete (e.g., background jobs).

**Q: What status code indicates a rate limit was exceeded?**
`429 Too Many Requests`.

---

## Headers

**Q: Why is the `Location` header sent with a 201 response?**
To point the client to the URL of the newly created resource.

**Q: How does ETag-based caching work?**
The server sends an `ETag` identifying a resource version; the client resends it via `If-None-Match` on future requests; if unchanged, the server responds `304 Not Modified` with no body, saving bandwidth.

**Q: What header is commonly sent alongside a 401 response?**
`WWW-Authenticate`, describing the expected authentication scheme.

---

## Query Parameters, Pagination, Filtering, Sorting

**Q: Difference between route parameters and query parameters?**
Route parameters identify which specific resource (`/users/:id`); query parameters filter/modify how a collection is returned and are always optional.

**Q: Why does offset-based pagination degrade at scale?**
Large `OFFSET` values require the database to scan/skip that many rows; it's also prone to inconsistent results if data changes between page requests.

**Q: How does cursor-based pagination solve this?**
It anchors to a specific item (via ID/timestamp) instead of a numeric offset, giving consistent performance and stable results regardless of dataset size or concurrent changes.

**Q: What's the standard convention for sort direction in query strings?**
A leading `-` on the field name denotes descending order (`?sort=-price`); no prefix means ascending.

**Q: Why must you whitelist filter/sort fields instead of using raw client input directly in a query?**
To prevent SQL/NoSQL injection and unintended data exposure — column/field names can't be safely parameterized the same way as values.

---

## Validation

**Q: Why validate on the server if the client already validates?**
Client-side validation can be bypassed entirely (direct API calls, malicious clients); server-side validation is the real security and data-integrity boundary.

**Q: Difference between schema validation and business-rule validation?**
Schema validation checks structural correctness (types, required fields) without external data; business-rule validation enforces domain logic often requiring a database lookup (e.g., uniqueness checks).

**Q: Why return all validation errors at once instead of one at a time?**
Better developer experience — clients can fix everything in one round trip instead of repeated fix-and-resubmit cycles.

---

## API Documentation

**Q: Difference between Swagger and OpenAPI?**
OpenAPI is the specification format; Swagger is the historical toolset (Swagger UI/Editor) built around it — used interchangeably today.

**Q: What does Swagger UI provide?**
An interactive, browser-based documentation page generated from an OpenAPI spec, letting developers explore endpoints and send live test requests.

**Q: Why prefer generating docs from code/schemas over hand-writing a separate spec file?**
It prevents drift between actual API behavior/validation and documented behavior, since both derive from the same source of truth.

---

## Versioning

**Q: Most common REST versioning strategy?**
URI path versioning (`/api/v1/...`) — simple, explicit, and easy to route/test.

**Q: What counts as a breaking change requiring a new version?**
Removing/renaming response fields, changing data types, adding new required inputs, or altering status code behavior for existing scenarios.

**Q: How do you avoid duplicating logic across API versions?**
Keep the core model/service layer version-agnostic; only the thin controller/response-formatting layer diverges between versions.

---

## Error Handling

**Q: Why should error responses have a consistent shape across an API?**
So clients can reliably parse and branch on errors without endpoint-specific parsing logic.

**Q: Operational error vs programmer error?**
Operational errors are expected failure states (bad input, not found) with client-safe messages; programmer errors are bugs that should be logged internally and returned as a generic message without leaking details.

**Q: Why include a machine-readable error code alongside a message?**
So client code can branch reliably (`error.code === 'NOT_FOUND'`) without fragile string matching on message text that might change.

---

## Rate Limiting

**Q: Why is rate limiting important for a production API?**
Prevents abuse (DoS, brute force, scraping), protects shared backend resources, and enforces fair usage across clients/tiers.

**Q: Why rate-limit by user/API key instead of IP for authenticated APIs?**
Multiple users can share an IP (NAT, offices); a malicious actor could also rotate IPs — keying on user identity ties the limit to the actual client.

**Q: Why does an in-memory rate limiter break across multiple server instances?**
Each instance tracks its own counters independently, effectively multiplying the intended global limit — a shared store like Redis is needed for accuracy.

---

## API Security

**Q: Authentication vs authorization?**
Authentication verifies identity; authorization verifies permitted actions for that identity.

**Q: Why hash passwords with bcrypt/argon2 instead of SHA-256 alone?**
Bcrypt/argon2 are intentionally slow and salted, resisting brute-force/rainbow-table attacks; fast hashes like plain SHA-256 are efficient for attackers to crack at scale.

**Q: What is mass assignment, and how do you prevent it?**
Blindly saving an entire request body lets clients set fields they shouldn't control (like `role: 'admin'`); prevent by explicitly whitelisting accepted fields.

**Q: What is IDOR?**
Insecure Direct Object Reference — accessing a resource by ID without verifying the requester actually has permission to it; prevented by checking ownership/authorization on every access, not just existence.

**Q: Why are token-based APIs generally less vulnerable to CSRF than cookie-based ones?**
Cookies are automatically attached to cross-site requests by the browser; bearer tokens must be explicitly added by client JS to a header, which a malicious page can't do without already having the token.

**Q: How do you prevent SQL injection in an Express + SQL app?**
Always use parameterized queries/prepared statements; never string-concatenate user input directly into a query.

---

## Practical / Coding Questions Often Asked Live

**Q: Design a RESTful set of endpoints for a "products" resource.**

```
GET    /products          -> list (supports ?page, ?limit, ?sort, ?category)
GET    /products/:id      -> get one
POST   /products           -> create
PUT    /products/:id      -> full update
PATCH  /products/:id      -> partial update
DELETE /products/:id      -> delete
```

**Q: Write an Express route implementing pagination + filtering + sorting together.**

```js
app.get("/products", async (req, res) => {
  const { category, sort, page = 1, limit = 20 } = req.query;
  const filter = category ? { category } : {};

  const [data, total] = await Promise.all([
    Product.find(filter)
      .sort(sort || "-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  res.json({
    data,
    pagination: { page: Number(page), limit: Number(limit), total },
  });
});
```

**Q: Write a centralized error handler that distinguishes operational vs unexpected errors.**

```js
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  if (!err.isOperational) console.error("UNEXPECTED:", err);
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: err.isOperational ? err.message : "Something went wrong",
    },
  });
});
```

**Q: How would you design an API to support both v1 and v2 without duplicating business logic?**
Keep a shared service/model layer; mount version-specific routers (`/api/v1`, `/api/v2`) whose thin controllers call the same services but format responses differently per version.

**Q: How would you secure a DELETE endpoint so only resource owners or admins can use it?**

```js
app.delete("/orders/:id", authenticate, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Not found" });
  if (order.userId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  await order.deleteOne();
  res.status(204).send();
});
```
