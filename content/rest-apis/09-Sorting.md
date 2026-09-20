# 09. Sorting

## What is Sorting?

Sorting lets clients control the order in which a collection is returned, typically via a `sort` query parameter.

```
GET /products?sort=price
GET /products?sort=-price
```

## Basic Single-Field Sort

```js
app.get("/products", (req, res) => {
  let results = [...products];
  const { sort } = req.query;

  if (sort) {
    const direction = sort.startsWith("-") ? -1 : 1;
    const field = sort.replace("-", "");
    results.sort((a, b) => {
      if (a[field] < b[field]) return -1 * direction;
      if (a[field] > b[field]) return 1 * direction;
      return 0;
    });
  }

  res.json(results);
});
```

Convention: a leading `-` denotes **descending** order; no prefix means **ascending**.

## Multi-Field Sorting

```
GET /products?sort=-rating,price
```

Sort by `rating` descending first; for ties, sort by `price` ascending.

```js
function multiFieldSort(data, sortParam) {
  if (!sortParam) return data;
  const fields = sortParam.split(",").map((f) => ({
    field: f.replace("-", ""),
    direction: f.startsWith("-") ? -1 : 1,
  }));

  return [...data].sort((a, b) => {
    for (const { field, direction } of fields) {
      if (a[field] < b[field]) return -1 * direction;
      if (a[field] > b[field]) return 1 * direction;
    }
    return 0;
  });
}

app.get("/products", (req, res) => {
  const sorted = multiFieldSort(products, req.query.sort);
  res.json(sorted);
});
```

## Sorting in SQL

```js
const ALLOWED_SORT_FIELDS = ["price", "rating", "createdAt", "name"];

app.get("/products", async (req, res) => {
  let orderBy = "id ASC"; // safe default

  if (req.query.sort) {
    const field = req.query.sort.replace("-", "");
    const direction = req.query.sort.startsWith("-") ? "DESC" : "ASC";

    if (!ALLOWED_SORT_FIELDS.includes(field)) {
      return res.status(400).json({ error: `Cannot sort by '${field}'` });
    }
    orderBy = `${field} ${direction}`;
  }

  const [rows] = await db.query(`SELECT * FROM products ORDER BY ${orderBy}`);
  res.json(rows);
});
```

> **Security note:** Never interpolate a raw client-supplied field name directly into an SQL `ORDER BY` clause without validating it against a whitelist — this is a classic SQL injection vector since column names can't be parameterized with placeholders the same way values can.

## Sorting in MongoDB / Mongoose

```js
app.get("/products", async (req, res) => {
  let sortObj = {};

  if (req.query.sort) {
    req.query.sort.split(",").forEach((f) => {
      const field = f.replace("-", "");
      sortObj[field] = f.startsWith("-") ? -1 : 1;
    });
  }

  const results = await Product.find().sort(sortObj);
  res.json(results);
});
```

Mongoose also accepts the shorthand string form directly:

```js
const results = await Product.find().sort(req.query.sort || "createdAt");
// Mongoose interprets "-price" as descending automatically
```

## Combining Sort with Pagination and Filtering

```js
app.get("/products", async (req, res) => {
  const filter = buildFilter(req.query); // from Filtering notes
  const sort = req.query.sort || "createdAt";
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const results = await Product.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ page, limit, data: results });
});
```

## Default Sort Order

Always define a sensible default so results are deterministic even without an explicit `sort` param (e.g., avoids inconsistent ordering across requests, which breaks pagination).

```js
app.get("/products", async (req, res) => {
  const sort = req.query.sort || "-createdAt"; // newest first by default
  const results = await Product.find().sort(sort);
  res.json(results);
});
```

> Without a deterministic default sort (or a unique tiebreaker field), paginated results can show duplicates or skip items between page requests, since row order isn't guaranteed by most databases without an explicit `ORDER BY`.

## Case-Insensitive Sorting (Strings)

```js
results.sort((a, b) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
);
```

SQL:

```sql
SELECT * FROM products ORDER BY LOWER(name) ASC;
```

## Common Interview-Style Questions

- **What's the standard convention for expressing descending sort order via query string?**
  A leading `-` before the field name (`?sort=-price`), while no prefix implies ascending order.

- **Why is it dangerous to pass a raw client-supplied field name directly into an `ORDER BY` clause?**
  Column/field names can't be parameterized the same way as values, so directly interpolating client input creates a SQL injection risk — always validate against a whitelist of allowed sortable fields.

- **Why does a paginated endpoint need a deterministic default sort order?**
  Without one, most databases don't guarantee row order between queries, which can cause duplicate or skipped items across paginated requests.

- **How would you implement multi-field sorting (e.g., sort by rating, then price)?**
  Parse a comma-separated sort parameter into an ordered list of (field, direction) pairs, and apply them in sequence — either via a JS comparator with fallthrough logic or a multi-column `ORDER BY` clause in SQL.
