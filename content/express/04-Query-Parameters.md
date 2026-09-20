# 04. Query Parameters

## What are Query Parameters?

Query parameters (query strings) are key-value pairs appended to a URL after a `?`, separated by `&`. They're commonly used for filtering, sorting, pagination, and search — data that isn't part of the resource's identity.

```
/products?category=shoes&sort=price&page=2
```

Express parses these automatically into `req.query`.

```js
app.get("/products", (req, res) => {
  console.log(req.query);
  // { category: 'shoes', sort: 'price', page: '2' }
  res.json(req.query);
});
```

> All values in `req.query` are strings (or arrays/objects for complex query strings) — you must cast numbers/booleans manually.

## Basic Usage

```js
app.get("/search", (req, res) => {
  const { q, limit = 10, page = 1 } = req.query;
  res.json({
    query: q,
    limit: Number(limit),
    page: Number(page),
  });
});
```

Request: `GET /search?q=laptop&limit=5&page=2`

Response:

```json
{ "query": "laptop", "limit": 5, "page": 2 }
```

## Arrays in Query Strings

Express (via the `qs` library, its default query parser) supports bracket-style arrays:

```
/filter?tags[]=red&tags[]=blue
```

```js
app.get("/filter", (req, res) => {
  console.log(req.query.tags); // ['red', 'blue']
  res.json(req.query);
});
```

Also works without brackets when repeated:

```
/filter?tags=red&tags=blue
```

```js
console.log(req.query.tags); // ['red', 'blue']
```

## Nested Objects in Query Strings

```
/search?user[name]=alice&user[age]=30
```

```js
console.log(req.query.user); // { name: 'alice', age: '30' }
```

## Changing the Query String Parser

Express lets you configure how query strings are parsed:

```js
app.set("query parser", "simple"); // uses Node's built-in querystring — no nested objects
app.set("query parser", "extended"); // default, uses 'qs' — supports nested objects/arrays
app.set("query parser", (str) => {
  // custom parser function
  return new URLSearchParams(str);
});
```

## Real-World Pattern: Filtering, Sorting, Pagination

```js
const express = require("express");
const app = express();

const products = [
  { id: 1, name: "Shoe", category: "footwear", price: 50 },
  { id: 2, name: "Shirt", category: "apparel", price: 20 },
  { id: 3, name: "Boot", category: "footwear", price: 80 },
];

app.get("/products", (req, res) => {
  let results = [...products];

  // Filtering
  if (req.query.category) {
    results = results.filter((p) => p.category === req.query.category);
  }

  // Sorting
  if (req.query.sort === "price") {
    results.sort((a, b) => a.price - b.price);
  }

  // Pagination
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const start = (page - 1) * limit;
  const paginated = results.slice(start, start + limit);

  res.json({
    page,
    limit,
    total: results.length,
    data: paginated,
  });
});

app.listen(3000);
```

Example request: `GET /products?category=footwear&sort=price&page=1&limit=1`

## Validating Query Parameters

Query params are user input — validate before trusting them.

```js
app.get("/products", (req, res) => {
  const page = parseInt(req.query.page, 10);
  if (req.query.page && (isNaN(page) || page < 1)) {
    return res.status(400).json({ error: "page must be a positive integer" });
  }
  // ...proceed
});
```

For larger apps, use a validation library like `express-validator` or `zod` (covered in **13-Validation.md**).

## Common Interview-Style Questions

- **Where does Express store parsed query string data?**
  `req.query`.

- **Are query parameter values typed?**
  No, they're strings (or arrays/nested objects for complex queries) — always cast/validate manually.

- **How do you send an array through a query string?**
  Repeat the key (`?tags=a&tags=b`) or use bracket notation (`?tags[]=a&tags[]=b`), both parsed into `req.query.tags` as an array by the default `qs` parser.

- **Difference between route params and query params (again, important)?**
  Route params identify _which_ resource (`/users/:id`); query params filter/modify _how_ you want that resource or collection returned (`?sort=asc`).
