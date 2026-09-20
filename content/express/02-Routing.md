# 02. Routing

## What is Routing?

Routing determines how an application responds to a client request for a specific **endpoint** — a combination of a **URL path** and an **HTTP method** (GET, POST, PUT, DELETE, PATCH, etc.).

```js
app.METHOD(PATH, HANDLER);
```

- `app` — Express app instance
- `METHOD` — an HTTP method, in lowercase (`get`, `post`, `put`, `delete`, ...)
- `PATH` — path on the server
- `HANDLER` — function executed when the route matches

## Basic Route Examples

```js
const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("GET request to homepage"));
app.post("/", (req, res) => res.send("POST request to homepage"));
app.put("/user", (req, res) => res.send("PUT request to /user"));
app.delete("/user", (req, res) => res.send("DELETE request to /user"));

app.listen(3000);
```

## `app.all()`

Matches all HTTP methods for a path — useful for logging or auth checks that apply regardless of method.

```js
app.all("/secret", (req, res, next) => {
  console.log("Accessing the secret section...");
  next();
});
```

## Route Paths: Strings, Patterns, and Regex

### String paths

```js
app.get("/about", handler);
```

### String patterns (Express 5 uses path-to-regexp v6+)

```js
// Matches /ab and /a-b, but wildcards differ between Express 4 and 5 — check version docs
app.get("/ab?cd", handler); // Express 4 style optional char (not supported same way in Express 5)
```

> **Note:** Express 5 changed its underlying routing library (`path-to-regexp@8`). Patterns like `*`, `+`, `?`, `()` as loose wildcards were removed/restricted. Use named parameters and explicit regex instead when writing Express 5 apps. Always check which major version you're using.

### Named wildcard (Express 5 recommended way)

```js
app.get("/files/{*splat}", (req, res) => {
  res.send(req.params.splat); // catches everything after /files/
});
```

### Regular expressions

```js
app.get(/.*fly$/, (req, res) => {
  res.send("This matches butterfly, dragonfly, etc.");
});
```

## Route Handlers

A route can have **one handler**, **multiple handler functions**, or an **array of handlers**. This is useful for composing reusable middleware-like logic per route.

### Single callback

```js
app.get("/example", (req, res) => {
  res.send("single handler");
});
```

### Multiple callbacks (must call `next()`)

```js
const checkAuth = (req, res, next) => {
  console.log("checking auth...");
  next();
};

app.get("/protected", checkAuth, (req, res) => {
  res.send("You are authorized");
});
```

### Array of callbacks

```js
const cb0 = (req, res, next) => {
  console.log("cb0");
  next();
};
const cb1 = (req, res, next) => {
  console.log("cb1");
  next();
};
const cb2 = (req, res) => res.send("done");

app.get("/multi", [cb0, cb1, cb2]);
```

## `res` Methods That End the Request-Response Cycle

| Method           | Description                             |
| ---------------- | --------------------------------------- |
| `res.send()`     | Send a response of any type             |
| `res.json()`     | Send a JSON response                    |
| `res.jsonp()`    | Send a JSON response with JSONP support |
| `res.redirect()` | Redirect a request                      |
| `res.render()`   | Render a view template                  |
| `res.sendFile()` | Send a file as an octet stream          |
| `res.download()` | Prompt a file download                  |
| `res.end()`      | End the response process                |

## `express.Router` — Modular Routing

Instead of writing every route in `app.js`, use `express.Router()` to create mini route-handlers that can be mounted with `app.use()`.

`routes/userRoutes.js`:

```js
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => res.send("List of users"));
router.get("/:id", (req, res) => res.send(`User ${req.params.id}`));
router.post("/", (req, res) => res.send("Create user"));

module.exports = router;
```

`app.js`:

```js
const express = require("express");
const userRoutes = require("./routes/userRoutes");

const app = express();
app.use("/users", userRoutes); // all userRoutes are now prefixed with /users

app.listen(3000);
```

Now `GET /users`, `GET /users/5`, and `POST /users` are handled by `userRoutes.js`.

### Router-level middleware

```js
router.use((req, res, next) => {
  console.log("Time:", Date.now());
  next();
});
```

### `router.route()` — chainable route methods

Avoids repeating the path for different methods on the same endpoint.

```js
router
  .route("/:id")
  .get((req, res) => res.send("Get user"))
  .put((req, res) => res.send("Update user"))
  .delete((req, res) => res.send("Delete user"));
```

## Route Order Matters

Express matches routes **top to bottom**, and stops at the first match (unless you call `next()`). More specific routes should generally come before more generic/catch-all ones.

```js
app.get("/users/new", (req, res) => res.send("New user form")); // must come first
app.get("/users/:id", (req, res) => res.send(`User ${req.params.id}`)); // otherwise this eats "/users/new"
```

## Chained Route Handlers with `app.route()`

```js
app
  .route("/book")
  .get((req, res) => res.send("Get a book"))
  .post((req, res) => res.send("Add a book"))
  .put((req, res) => res.send("Update a book"));
```

## Common Interview-Style Questions

- **How does Express decide which route handles a request?**
  It walks through the middleware/route stack in the order they were registered, matching method + path, and runs the first matching handler(s) unless `next()` passes control along.

- **What's the difference between `app.use()` and `app.get()`?**
  `app.use()` matches **all HTTP methods** and any path that _starts with_ the given prefix (or all paths if omitted). `app.get()` matches only GET requests to an exact/pattern path.

- **Why use `express.Router()`?**
  For modularity — it lets you split routes across files and mount them with a common prefix, keeping `app.js` clean.

- **What happens if no route matches?**
  Express falls through to its default 404 handler, unless you've defined your own catch-all/error middleware.
