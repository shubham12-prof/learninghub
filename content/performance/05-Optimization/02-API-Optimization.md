# API Optimization

## 1. Why API Optimization Matters

APIs are the contract between frontend and backend (or between microservices). A slow or chatty API creates a poor user experience and cascades load onto every downstream service.

```
[Client] --HTTP request--> [API Server] --queries--> [DB / other services]
   ▲                                                        |
   └────────────────── slower at every hop ─────────────────┘
```

## 2. Reducing Payload Size

### Only Return What's Needed (Field Selection / Sparse Fieldsets)

```
GET /users/1?fields=id,name,email
```

```js
app.get("/users/:id", async (req, res) => {
  const fields = req.query.fields ? req.query.fields.split(",") : null;
  const user = await getUser(req.params.id);
  res.json(fields ? pick(user, fields) : user);
});
```

### Pagination Instead of Returning Everything

```
GET /orders?cursor=abc123&limit=20
```

```js
app.get("/orders", async (req, res) => {
  const { cursor, limit = 20 } = req.query;
  const orders = await db.query(
    "SELECT * FROM orders WHERE id > ? ORDER BY id LIMIT ?",
    [cursor || 0, limit],
  );
  res.json({
    data: orders,
    nextCursor: orders.length ? orders[orders.length - 1].id : null,
  });
});
```

### Compression

```js
// Express - gzip/brotli compress responses
const compression = require("compression");
app.use(compression());
```

```http
Content-Encoding: gzip
```

### Use Efficient Serialization Formats

```
JSON: human-readable, widely supported, larger payload
Protocol Buffers / MessagePack: binary, smaller & faster to (de)serialize
```

```js
// Example: gRPC with Protobuf for internal service-to-service calls
// user.proto
message User {
  int32 id = 1;
  string name = 2;
  string email = 3;
}
```

## 3. Avoiding Over-fetching & Under-fetching

### REST Over-fetching Problem

```
GET /users/1  -> returns 40 fields, client only needs 3
```

### GraphQL — Client Specifies Exactly What It Needs

```graphql
query {
  user(id: 1) {
    name
    email
  }
}
```

```js
// GraphQL resolver
const resolvers = {
  Query: {
    user: async (_, { id }) =>
      db.query("SELECT * FROM users WHERE id = ?", [id]),
  },
};
```

### Solving N+1 in GraphQL with DataLoader (Batching)

```js
const DataLoader = require("dataloader");

const userLoader = new DataLoader(async (ids) => {
  const users = await db.query("SELECT * FROM users WHERE id IN (?)", [ids]);
  return ids.map((id) => users.find((u) => u.id === id));
});

// Instead of N separate queries, batches into 1 query per tick
const user = await userLoader.load(post.authorId);
```

## 4. Caching API Responses

```js
// HTTP caching headers for public, cacheable GET endpoints
app.get("/api/articles/:id", async (req, res) => {
  res.set("Cache-Control", "public, max-age=60, s-maxage=600");
  res.json(await getArticle(req.params.id));
});
```

```js
// Application-level cache (Redis) for expensive computed responses
app.get("/api/dashboard-stats", async (req, res) => {
  const cacheKey = "dashboard-stats";
  let stats = await redis.get(cacheKey);
  if (!stats) {
    stats = await computeExpensiveStats();
    await redis.set(cacheKey, JSON.stringify(stats), "EX", 300);
  } else {
    stats = JSON.parse(stats);
  }
  res.json(stats);
});
```

See the Caching notes (`28-Caching`) for full detail on strategies, CDN, and invalidation.

## 5. Rate Limiting & Throttling

Protects the API from abuse and overload, ensuring fair usage.

```js
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  message: "Too many requests, please try again later.",
});

app.use("/api/", limiter);
```

### Token Bucket Algorithm (Conceptual)

```
Bucket capacity: 100 tokens
Refill rate: 10 tokens/sec

Each request consumes 1 token.
If bucket is empty -> reject request (429 Too Many Requests)
```

## 6. Batching & Debouncing Requests

### Batch Multiple Client Requests into One

```js
// Client sends multiple IDs in a single request instead of N requests
// BAD
ids.forEach((id) => fetch(`/api/users/${id}`));

// GOOD
fetch(`/api/users?ids=${ids.join(",")}`);
```

```js
app.get("/api/users", async (req, res) => {
  const ids = req.query.ids.split(",");
  const users = await db.query("SELECT * FROM users WHERE id IN (?)", [ids]);
  res.json(users);
});
```

## 7. Asynchronous Processing for Slow Operations

Don't make the client wait for slow work (emails, report generation, image processing) — respond immediately and process in the background.

```js
// BAD: client waits for the entire slow operation
app.post("/api/reports", async (req, res) => {
  const report = await generateHugeReport(req.body); // takes 30s
  res.json(report);
});

// GOOD: return immediately, process async, notify/poll later
app.post("/api/reports", async (req, res) => {
  const jobId = await queue.add("generate-report", req.body);
  res.status(202).json({ jobId, status: "processing" });
});

app.get("/api/reports/:jobId", async (req, res) => {
  const job = await queue.getJob(req.params.jobId);
  res.json({ status: job.status, result: job.returnvalue });
});
```

```js
// BullMQ worker example
const { Worker } = require("bullmq");
new Worker("generate-report", async (job) => {
  return await generateHugeReport(job.data);
});
```

## 8. Connection & Protocol Optimization

### HTTP/2 & HTTP/3

Multiplexes multiple requests over a single connection, eliminating head-of-line blocking present in HTTP/1.1 (which needs multiple TCP connections for parallel requests).

```nginx
server {
    listen 443 ssl http2;
    ...
}
```

### Keep-Alive Connections

```http
Connection: keep-alive
```

Reuses TCP connections across multiple requests, avoiding repeated handshake overhead.

```js
// Node.js HTTP agent with keep-alive for outgoing requests to other services
const https = require("https");
const agent = new https.Agent({ keepAlive: true, maxSockets: 50 });
fetch("https://api.example.com/data", { agent });
```

## 9. Database & Backend-Level API Optimization

- Avoid heavy computation inside the request/response cycle — precompute or cache.
- Use database connection pooling (see Database Optimization notes).
- Parallelize independent operations instead of sequential `await`s.

```js
// BAD: sequential, unnecessarily slow
const user = await getUser(id);
const orders = await getOrders(id);
const reviews = await getReviews(id);

// GOOD: parallel, since these don't depend on each other
const [user, orders, reviews] = await Promise.all([
  getUser(id),
  getOrders(id),
  getReviews(id),
]);
```

## 10. Monitoring & Observability

```js
// Basic request timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.path} - ${Date.now() - start}ms`);
  });
  next();
});
```

Use APM tools (Datadog, New Relic, OpenTelemetry) to track p50/p95/p99 latency per endpoint, error rates, and throughput in production.

## 11. Best Practices

1. Return only the fields the client needs; support field selection or use GraphQL.
2. Always paginate list endpoints — never return unbounded result sets.
3. Compress responses (gzip/brotli).
4. Cache aggressively for public/cacheable data; use short TTLs for semi-dynamic data.
5. Rate-limit public/expensive endpoints.
6. Move slow work off the request/response cycle with background jobs + polling/webhooks.
7. Parallelize independent async operations with `Promise.all`.
8. Use HTTP/2+ and keep-alive connections to reduce connection overhead.
9. Monitor p95/p99 latency per endpoint in production, not just average.
