# 03. Route Parameters

## What are Route Parameters?

Route parameters are named segments of the URL, prefixed with `:`, used to capture values at specific positions. They're stored in `req.params`.

```js
app.get("/users/:userId", (req, res) => {
  res.send(req.params); // { userId: '42' }
});
```

Request to `/users/42` → `req.params.userId === '42'`

> Route params are always **strings**, even if they look like numbers. Convert manually: `Number(req.params.userId)`.

## Multiple Parameters

```js
app.get("/users/:userId/books/:bookId", (req, res) => {
  const { userId, bookId } = req.params;
  res.send(`User: ${userId}, Book: ${bookId}`);
});
```

Request to `/users/42/books/7` → `{ userId: '42', bookId: '7' }`

## Optional Parameters

In Express 4, `?` marked a param optional:

```js
app.get("/products/:id?", (req, res) => {
  if (req.params.id) {
    res.send(`Product ${req.params.id}`);
  } else {
    res.send("All products");
  }
});
```

> In Express 5 (path-to-regexp v6+), write two explicit routes instead, since the loose `?`/`*` modifiers on params were restricted for predictability:

```js
router.get("/products", listAll);
router.get("/products/:id", getOne);
```

## Parameter Validation with Regex

You can constrain a parameter's format inline:

```js
// only matches numeric IDs
app.get("/users/:id(\\d+)", (req, res) => {
  res.send(`Numeric ID: ${req.params.id}`);
});
```

## `app.param()` — Param Middleware

Runs custom logic whenever a specific route parameter is present, useful for pre-fetching/validating a resource before the route handler runs.

```js
app.param("userId", (req, res, next, id) => {
  console.log(`Looking up user with id ${id}`);
  const user = db.findUserById(id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  req.user = user; // attach to request for later handlers
  next();
});

app.get("/users/:userId", (req, res) => {
  res.json(req.user); // already fetched by app.param
});

app.get("/users/:userId/profile", (req, res) => {
  res.json({ profile: req.user.profile }); // fetched again automatically
});
```

This avoids repeating the "look up the user" logic in every route that uses `:userId`.

## Difference Between Route Params and Query Params

|           | Route Parameters                    | Query Parameters               |
| --------- | ----------------------------------- | ------------------------------ |
| Syntax    | `/users/:id`                        | `/users?id=5`                  |
| Access    | `req.params`                        | `req.query`                    |
| Purpose   | Identify a specific resource        | Filter, sort, paginate, search |
| Required? | Usually required (part of the path) | Usually optional               |

Example combining both:

```js
// GET /users/42/orders?status=shipped&limit=10
app.get("/users/:userId/orders", (req, res) => {
  const { userId } = req.params; // '42'
  const { status, limit } = req.query; // 'shipped', '10'
  res.json({ userId, status, limit });
});
```

## Full Working Example

```js
const express = require("express");
const app = express();

const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

app.param("id", (req, res, next, id) => {
  const numericId = Number(id);
  const user = users.find((u) => u.id === numericId);
  if (!user) return res.status(404).json({ error: "Not found" });
  req.foundUser = user;
  next();
});

app.get("/users/:id", (req, res) => {
  res.json(req.foundUser);
});

app.listen(3000);
```

## Common Interview-Style Questions

- **How do you access route parameters in Express?**
  Via `req.params`, an object populated from named segments (`:name`) in the route path.

- **Are route parameters typed?**
  No — they are always strings; you must manually cast/validate them.

- **What is `app.param()` used for?**
  To run middleware logic tied to a specific route parameter name, commonly for fetching/validating a resource once instead of repeating logic in every handler.

- **How would you validate that `:id` is numeric before the handler runs?**
  Use a regex constraint in the route (`/:id(\\d+)`) or validate inside `app.param()`/middleware and return a 400 if invalid.
