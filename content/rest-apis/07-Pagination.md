# 07. Pagination

## Why Paginate?

Returning an entire collection in one response doesn't scale — a `/products` endpoint with a million rows would be slow, memory-heavy, and wasteful for clients who only need the first page. Pagination breaks large collections into manageable chunks.

## Strategy 1: Offset-Based Pagination (Page/Limit)

The most common and intuitive approach.

```
GET /products?page=2&limit=20
```

```js
app.get("/products", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  const total = allProducts.length;
  const data = allProducts.slice(offset, offset + limit);

  res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
});
```

### With a SQL Database

```js
app.get("/products", async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const [rows] = await db.query("SELECT * FROM products LIMIT ? OFFSET ?", [
    limit,
    offset,
  ]);
  const [[{ count }]] = await db.query(
    "SELECT COUNT(*) as count FROM products",
  );

  res.json({
    data: rows,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  });
});
```

### With MongoDB / Mongoose

```js
app.get("/products", async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const [data, total] = await Promise.all([
    Product.find()
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(),
  ]);

  res.json({
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});
```

### Pros / Cons of Offset Pagination

**Pros:** simple, allows jumping to any page directly, familiar UX (page numbers).
**Cons:** performance degrades on large offsets (`OFFSET 1000000` still scans/skips that many rows in many databases); prone to skipped/duplicated items if data changes between page requests (inserts/deletes shift offsets).

## Strategy 2: Cursor-Based Pagination

Instead of a page number, the client passes a **cursor** — typically the ID or timestamp of the last item seen — and the server returns the next batch after it.

```
GET /products?limit=20&cursor=eyJpZCI6NDJ9
```

```js
app.get("/products", async (req, res) => {
  const limit = Number(req.query.limit) || 20;
  const cursor = req.query.cursor ? decodeCursor(req.query.cursor) : null;

  const query = cursor ? { _id: { $gt: cursor.id } } : {};
  const data = await Product.find(query)
    .sort({ _id: 1 })
    .limit(limit + 1); // fetch one extra to check "hasMore"

  const hasMore = data.length > limit;
  const results = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore
    ? encodeCursor({ id: results[results.length - 1]._id })
    : null;

  res.json({
    data: results,
    pagination: { nextCursor, hasMore },
  });
});

function encodeCursor(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64");
}
function decodeCursor(str) {
  return JSON.parse(Buffer.from(str, "base64").toString());
}
```

### Pros / Cons of Cursor Pagination

**Pros:** consistent performance regardless of dataset size (no large `OFFSET` scans); stable results even if data changes between requests (no skipped/duplicated items).
**Cons:** can't jump directly to an arbitrary page number; slightly more complex to implement; cursor typically must be opaque (encoded) to avoid clients relying on its internal structure.

## Strategy 3: Keyset Pagination (a Simpler Cursor Variant)

Similar to cursor pagination but uses a plain, human-readable value (like the last seen ID or timestamp) instead of an encoded token.

```
GET /products?limit=20&after_id=42
```

```js
app.get("/products", async (req, res) => {
  const limit = Number(req.query.limit) || 20;
  const afterId = Number(req.query.after_id) || 0;

  const [rows] = await db.query(
    "SELECT * FROM products WHERE id > ? ORDER BY id ASC LIMIT ?",
    [afterId, limit],
  );

  res.json({
    data: rows,
    pagination: {
      nextAfterId: rows.length ? rows[rows.length - 1].id : null,
      hasMore: rows.length === limit,
    },
  });
});
```

## Response Shape: Including Metadata

A well-designed paginated response typically separates `data` from `pagination` (or `meta`):

```json
{
  "data": [
    { "id": 1, "name": "Shoe" },
    { "id": 2, "name": "Boot" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 143,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## Pagination via `Link` Header (GitHub-style)

Some APIs (like GitHub's) communicate pagination purely through response headers rather than a body wrapper, keeping the body as a plain array.

```js
app.get("/products", async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = 20;
  const data = await getPage(page, limit);

  const baseUrl = `${req.protocol}://${req.get("host")}${req.path}`;
  res.set(
    "Link",
    [
      `<${baseUrl}?page=${page + 1}>; rel="next"`,
      `<${baseUrl}?page=${page - 1}>; rel="prev"`,
    ].join(", "),
  );

  res.json(data); // just the array, no wrapper object
});
```

## Choosing a Strategy

| Use Case                                                          | Recommended Strategy |
| ----------------------------------------------------------------- | -------------------- |
| Admin dashboards, small-to-medium datasets, need "jump to page N" | Offset-based         |
| Infinite scroll feeds, very large datasets, real-time data        | Cursor-based         |
| Simple sequential IDs, moderate scale                             | Keyset pagination    |

## Common Interview-Style Questions

- **What's the main drawback of offset-based pagination at scale?**
  Large `OFFSET` values require the database to scan/skip that many rows, degrading performance as the offset grows; it's also prone to inconsistent results if rows are inserted/deleted between page requests.

- **How does cursor-based pagination avoid the "skipped/duplicated items" problem?**
  Instead of relying on a numeric offset, it anchors to a specific item (via ID or timestamp) and fetches everything strictly after it, so insertions/deletions elsewhere in the dataset don't shift the pagination window.

- **Why encode a cursor instead of exposing the raw ID?**
  To keep the cursor opaque, preventing clients from depending on its internal structure and allowing the server to change the underlying implementation without breaking clients.

- **What information should a paginated API response typically include?**
  The data array plus pagination metadata: current page/cursor, limit, total count (if feasible), and flags/links for next/previous pages.
