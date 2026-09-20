# 03. HTTP Methods

## Overview

HTTP methods (verbs) tell the server what action to perform on a resource. REST APIs rely heavily on correct method usage — misusing methods (e.g., using GET to delete data) breaks caching, breaks browser prefetching assumptions, and confuses API consumers.

| Method    | Purpose                                     | Safe? | Idempotent?    | Has Body?           |
| --------- | ------------------------------------------- | ----- | -------------- | ------------------- |
| `GET`     | Retrieve a resource                         | Yes   | Yes            | No (conventionally) |
| `POST`    | Create a resource / trigger an action       | No    | No             | Yes                 |
| `PUT`     | Replace a resource entirely                 | No    | Yes            | Yes                 |
| `PATCH`   | Partially update a resource                 | No    | Not guaranteed | Yes                 |
| `DELETE`  | Remove a resource                           | No    | Yes            | Usually no          |
| `HEAD`    | Like GET, but returns headers only, no body | Yes   | Yes            | No                  |
| `OPTIONS` | Discover allowed methods/CORS preflight     | Yes   | Yes            | No                  |

## Safe vs Idempotent — Key Distinction

- **Safe** methods don't modify server state at all (read-only). Only `GET`, `HEAD`, `OPTIONS` are safe.
- **Idempotent** methods can be called multiple times with the same net effect on server state (though the method itself might still "do work" each time). `GET`, `PUT`, `DELETE`, `HEAD`, `OPTIONS` are idempotent; `POST` and (generally) `PATCH` are not.

## GET

Retrieves data. Should never modify server state.

```js
app.get("/products", (req, res) => {
  res.json(products);
});

app.get("/products/:id", (req, res) => {
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json(product);
});
```

## POST

Creates a new resource, or triggers a non-idempotent action (e.g., "send email", "process payment").

```js
app.post("/products", (req, res) => {
  const newProduct = { id: nextId++, ...req.body };
  products.push(newProduct);
  res
    .status(201)
    .set("Location", `/products/${newProduct.id}`) // conventionally points to the new resource
    .json(newProduct);
});
```

POST is also used for actions that don't map cleanly to CRUD:

```js
app.post("/orders/:id/cancel", cancelOrderHandler);
app.post("/auth/login", loginHandler);
app.post("/reports/generate", generateReportHandler);
```

## PUT

Replaces a resource entirely. The client sends the complete new representation.

```js
app.put("/products/:id", (req, res) => {
  const index = products.findIndex((p) => p.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Not found" });

  products[index] = { id: products[index].id, ...req.body }; // full replace
  res.json(products[index]);
});
```

> A strict RESTful implementation of PUT can also be used to **create** a resource at a client-specified URI if it doesn't exist yet (e.g., `PUT /users/custom-id-123`), though many APIs restrict PUT to updates only for simplicity.

## PATCH

Applies a partial update — only the provided fields change.

```js
app.patch("/products/:id", (req, res) => {
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: "Not found" });

  Object.assign(product, req.body); // merge only given fields
  res.json(product);
});
```

### JSON Patch (RFC 6902) — A More Formal PATCH Format

For very precise partial updates, some APIs adopt the JSON Patch spec:

```json
[
  { "op": "replace", "path": "/name", "value": "New Name" },
  { "op": "remove", "path": "/discontinuedField" }
]
```

```bash
npm install fast-json-patch
```

```js
const jsonpatch = require("fast-json-patch");

app.patch("/products/:id", (req, res) => {
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: "Not found" });

  const updated = jsonpatch.applyPatch(product, req.body).newDocument;
  Object.assign(product, updated);
  res.json(product);
});
```

Requires `Content-Type: application/json-patch+json` by convention.

## DELETE

Removes a resource.

```js
app.delete("/products/:id", (req, res) => {
  const index = products.findIndex((p) => p.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Not found" });

  products.splice(index, 1);
  res.status(204).send();
});
```

## HEAD

Identical to GET but the server returns only headers, no body — useful for checking if a resource exists or has changed (e.g., checking `Content-Length` or `ETag`) without downloading it.

```js
app.head("/products/:id", (req, res) => {
  const exists = products.some((p) => p.id === Number(req.params.id));
  res.status(exists ? 200 : 404).end();
});
```

Express automatically handles `HEAD` for any route that has a `GET` handler defined, stripping the body — you rarely need to define it manually.

## OPTIONS

Used to discover what methods/headers are allowed on a resource — also the mechanism browsers use for CORS preflight requests.

```js
app.options("/products/:id", (req, res) => {
  res.set("Allow", "GET,PUT,PATCH,DELETE").sendStatus(204);
});
```

## `app.all()` and `app.route()` — Handling Multiple Methods Cleanly

```js
app
  .route("/products/:id")
  .get(getProduct)
  .put(replaceProduct)
  .patch(updateProduct)
  .delete(deleteProduct);
```

## Method Not Allowed (405)

If a resource exists but doesn't support the requested method, return `405 Method Not Allowed` along with an `Allow` header listing valid methods.

```js
app.all("/products/:id", (req, res, next) => {
  const allowedMethods = ["GET", "PUT", "PATCH", "DELETE"];
  if (!allowedMethods.includes(req.method)) {
    return res
      .status(405)
      .set("Allow", allowedMethods.join(","))
      .json({ error: "Method Not Allowed" });
  }
  next();
});
```

## Common Interview-Style Questions

- **What's the difference between "safe" and "idempotent" HTTP methods?**
  Safe methods never modify server state (read-only: GET, HEAD, OPTIONS). Idempotent methods may modify state but produce the same end result no matter how many times they're repeated (GET, PUT, DELETE, HEAD, OPTIONS are idempotent; POST is not).

- **Is PATCH idempotent?**
  Not guaranteed by spec — it depends on the operation. A PATCH that sets a field to an exact value is idempotent; a PATCH that increments a counter is not.

- **Can PUT be used to create a resource?**
  Yes, in strict REST semantics, PUT can create a resource at a client-specified URI if it doesn't already exist — though many real-world APIs restrict PUT to "update only" for simplicity, using POST for creation.

- **What status code should be returned when a method isn't supported for a resource?**
  `405 Method Not Allowed`, along with an `Allow` header listing the supported methods.
