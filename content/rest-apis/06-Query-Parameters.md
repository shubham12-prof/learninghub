# 06. Query Parameters (in REST API Design)

## Role of Query Parameters in REST APIs

While route parameters (`/users/:id`) identify **which** resource, query parameters shape **how** a collection is returned — filtering, sorting, pagination, field selection, and search. They're always optional and never required to identify a resource's core identity.

```
GET /products?category=shoes&sort=-price&page=2&limit=20&fields=name,price
```

## Common Query Parameter Conventions

| Purpose                | Example                                     | Notes                                           |
| ---------------------- | ------------------------------------------- | ----------------------------------------------- |
| Filtering              | `?status=active&category=shoes`             | Narrow down a collection                        |
| Sorting                | `?sort=price` or `?sort=-price`             | `-` prefix commonly denotes descending          |
| Pagination             | `?page=2&limit=20` or `?offset=20&limit=20` | Two common styles (see 07-Pagination.md)        |
| Field selection        | `?fields=id,name,price`                     | Return only requested fields (partial response) |
| Search                 | `?q=laptop` or `?search=laptop`             | Free-text search                                |
| Embedding related data | `?include=reviews,seller`                   | Expand related resources inline                 |

## Basic Example

```js
app.get("/products", (req, res) => {
  const { category, minPrice, maxPrice } = req.query;
  let results = [...products];

  if (category) results = results.filter((p) => p.category === category);
  if (minPrice) results = results.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) results = results.filter((p) => p.price <= Number(maxPrice));

  res.json(results);
});
```

Request: `GET /products?category=shoes&minPrice=20&maxPrice=100`

## Sorting Convention

A common REST convention: a `-` prefix means descending order.

```js
app.get("/products", (req, res) => {
  let results = [...products];
  const sortField = req.query.sort;

  if (sortField) {
    const direction = sortField.startsWith("-") ? -1 : 1;
    const field = sortField.replace("-", "");
    results.sort((a, b) => (a[field] > b[field] ? direction : -direction));
  }

  res.json(results);
});
```

Requests:

```
GET /products?sort=price     -> ascending by price
GET /products?sort=-price    -> descending by price
GET /products?sort=-rating,price -> multi-field sort (rating desc, then price asc)
```

## Multi-Field Sort

```js
function applySort(data, sortParam) {
  if (!sortParam) return data;
  const fields = sortParam.split(",");

  return [...data].sort((a, b) => {
    for (const f of fields) {
      const direction = f.startsWith("-") ? -1 : 1;
      const key = f.replace("-", "");
      if (a[key] < b[key]) return -1 * direction;
      if (a[key] > b[key]) return 1 * direction;
    }
    return 0;
  });
}
```

## Sparse Fieldsets (Partial Response)

Lets clients request only the fields they need, reducing payload size.

```js
app.get("/products", (req, res) => {
  let results = [...products];

  if (req.query.fields) {
    const selectedFields = req.query.fields.split(",");
    results = results.map((p) => {
      const partial = {};
      selectedFields.forEach((f) => {
        if (f in p) partial[f] = p[f];
      });
      return partial;
    });
  }

  res.json(results);
});
```

Request: `GET /products?fields=id,name,price`

## Free-Text Search

```js
app.get("/products", (req, res) => {
  let results = [...products];

  if (req.query.q) {
    const term = req.query.q.toLowerCase();
    results = results.filter((p) => p.name.toLowerCase().includes(term));
  }

  res.json(results);
});
```

For real search at scale, use a dedicated search engine (Elasticsearch, Algolia, PostgreSQL full-text search) rather than in-memory `.includes()`.

## Combining Filter + Sort + Paginate + Fields (Realistic Endpoint)

```js
app.get("/products", (req, res) => {
  let results = [...products];

  // Filter
  if (req.query.category)
    results = results.filter((p) => p.category === req.query.category);
  if (req.query.minPrice)
    results = results.filter((p) => p.price >= Number(req.query.minPrice));

  // Search
  if (req.query.q) {
    const term = req.query.q.toLowerCase();
    results = results.filter((p) => p.name.toLowerCase().includes(term));
  }

  // Sort
  results = applySort(results, req.query.sort);

  const total = results.length;

  // Paginate
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const start = (page - 1) * limit;
  const paginated = results.slice(start, start + limit);

  // Field selection
  let data = paginated;
  if (req.query.fields) {
    const selectedFields = req.query.fields.split(",");
    data = paginated.map((p) => {
      const partial = {};
      selectedFields.forEach((f) => {
        if (f in p) partial[f] = p[f];
      });
      return partial;
    });
  }

  res.json({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data,
  });
});
```

## Validating Query Parameters

Always validate types and ranges — query params are always strings by default.

```js
app.get(
  "/products",
  (req, res, next) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (isNaN(page) || page < 1) {
      return res.status(400).json({ error: "page must be a positive integer" });
    }
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({ error: "limit must be between 1 and 100" });
    }
    req.pagination = { page, limit };
    next();
  },
  productsController.list,
);
```

## Common Interview-Style Questions

- **What's the difference between a route parameter and a query parameter in REST design?**
  Route parameters identify which specific resource is being accessed (`/users/:id`); query parameters modify or filter how a collection/resource is returned and are always optional.

- **What's the common convention for expressing sort direction in a query string?**
  A `-` prefix on the field name typically denotes descending order (`?sort=-price`), while no prefix means ascending.

- **What is a "sparse fieldset" and why offer it?**
  A mechanism (`?fields=id,name`) letting clients request only specific fields, reducing payload size and avoiding over-fetching.

- **Why shouldn't you build production search with simple `.includes()` filtering?**
  It doesn't scale, lacks relevance ranking, doesn't handle typos/stemming/fuzzy matching, and becomes slow on large datasets — dedicated search engines (Elasticsearch, Algolia) or database full-text search handle this properly.
