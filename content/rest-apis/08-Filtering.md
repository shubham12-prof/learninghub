# 08. Filtering

## What is Filtering?

Filtering lets clients narrow down a collection to only the items matching certain criteria, expressed via query parameters. It's one of the most common needs for any list endpoint.

```
GET /products?category=shoes&inStock=true&minPrice=20&maxPrice=100
```

## Basic Exact-Match Filtering

```js
app.get("/products", (req, res) => {
  let results = [...products];
  const { category, brand, inStock } = req.query;

  if (category) results = results.filter((p) => p.category === category);
  if (brand) results = results.filter((p) => p.brand === brand);
  if (inStock !== undefined)
    results = results.filter((p) => p.inStock === (inStock === "true"));

  res.json(results);
});
```

## Range Filtering

```js
app.get("/products", (req, res) => {
  let results = [...products];
  const { minPrice, maxPrice, minRating } = req.query;

  if (minPrice) results = results.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) results = results.filter((p) => p.price <= Number(maxPrice));
  if (minRating) results = results.filter((p) => p.rating >= Number(minRating));

  res.json(results);
});
```

Request: `GET /products?minPrice=20&maxPrice=100&minRating=4`

## Generic, Reusable Filter Builder (SQL Example)

Hard-coding every filter field gets repetitive. A generic filter builder scales better across many resources.

```js
const ALLOWED_FILTERS = ["category", "brand", "inStock"];

function buildWhereClause(query) {
  const conditions = [];
  const values = [];

  for (const key of ALLOWED_FILTERS) {
    if (query[key] !== undefined) {
      conditions.push(`${key} = ?`);
      values.push(query[key]);
    }
  }

  return {
    clause: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
  };
}

app.get("/products", async (req, res) => {
  const { clause, values } = buildWhereClause(req.query);
  const [rows] = await db.query(`SELECT * FROM products ${clause}`, values);
  res.json(rows);
});
```

> **Security note:** Always whitelist allowed filter fields (`ALLOWED_FILTERS`) — never build SQL dynamically from arbitrary client-supplied field names, or you risk SQL injection / unintended data exposure.

## MongoDB Filtering Example

```js
app.get("/products", async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.inStock !== undefined)
    filter.inStock = req.query.inStock === "true";
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
  }

  const results = await Product.find(filter);
  res.json(results);
});
```

## Advanced Query Operators (MongoDB-Style Filter Syntax)

Some APIs expose richer operators directly in the query string, mirroring MongoDB's comparison operators:

```
GET /products?price[gte]=20&price[lte]=100&rating[gt]=4
```

```js
app.get("/products", async (req, res) => {
  const queryObj = { ...req.query };
  const excludedFields = ["page", "limit", "sort", "fields"];
  excludedFields.forEach((field) => delete queryObj[field]);

  // Convert { price: { gte: '20' } } into { price: { $gte: 20 } }
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  const filter = JSON.parse(queryStr);
  const results = await Product.find(filter);
  res.json(results);
});
```

## Multi-Value Filtering (OR within a Field)

```
GET /products?category=shoes,boots,sandals
```

```js
app.get("/products", (req, res) => {
  let results = [...products];

  if (req.query.category) {
    const categories = req.query.category.split(",");
    results = results.filter((p) => categories.includes(p.category));
  }

  res.json(results);
});
```

SQL equivalent:

```js
const categories = req.query.category.split(",");
const placeholders = categories.map(() => "?").join(",");
const [rows] = await db.query(
  `SELECT * FROM products WHERE category IN (${placeholders})`,
  categories,
);
```

## Boolean Filtering

Query strings are always strings — booleans need explicit parsing.

```js
function parseBoolean(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

app.get("/products", (req, res) => {
  let results = [...products];
  const inStock = parseBoolean(req.query.inStock);
  if (inStock !== undefined) {
    results = results.filter((p) => p.inStock === inStock);
  }
  res.json(results);
});
```

## Date Range Filtering

```
GET /orders?createdAfter=2026-01-01&createdBefore=2026-06-30
```

```js
app.get("/orders", (req, res) => {
  let results = [...orders];
  const { createdAfter, createdBefore } = req.query;

  if (createdAfter)
    results = results.filter(
      (o) => new Date(o.createdAt) >= new Date(createdAfter),
    );
  if (createdBefore)
    results = results.filter(
      (o) => new Date(o.createdAt) <= new Date(createdBefore),
    );

  res.json(results);
});
```

## Validating Filter Inputs

```js
const ALLOWED_CATEGORIES = ["shoes", "apparel", "accessories"];

app.get("/products", (req, res) => {
  if (req.query.category && !ALLOWED_CATEGORIES.includes(req.query.category)) {
    return res
      .status(400)
      .json({
        error: `Invalid category. Allowed: ${ALLOWED_CATEGORIES.join(", ")}`,
      });
  }
  // ...proceed with filtering
});
```

## Common Interview-Style Questions

- **How should you handle filter query parameters that don't map to real fields?**
  Whitelist allowed filterable fields explicitly and ignore or reject (400) any unrecognized ones — never build queries dynamically from arbitrary client input, to avoid injection risks and unintended data exposure.

- **How would you support filtering on a price range?**
  Accept `minPrice`/`maxPrice` (or `price[gte]`/`price[lte]`) query params and translate them into range conditions (`>=`/`<=`) in the database query.

- **Why must query string booleans be parsed manually?**
  Because query parameters are always strings (`'true'`/`'false'`), not actual booleans — comparing directly against `true`/`false` without parsing will behave incorrectly.

- **What's a security risk of building filter queries directly from `req.query`?**
  SQL/NoSQL injection or unintended data exposure if arbitrary client-supplied fields/operators are used to build queries without validation or whitelisting.
