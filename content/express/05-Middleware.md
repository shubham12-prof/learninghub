# 05. Middleware

## What is Middleware?

Middleware functions are functions that have access to the **request object (`req`)**, the **response object (`res`)**, and the **`next` function** in the application's request-response cycle. They can:

- Execute any code
- Modify `req`/`res`
- End the request-response cycle
- Call `next()` to pass control to the next middleware

```js
function myMiddleware(req, res, next) {
  console.log("Middleware running...");
  next(); // MUST call this, or the request hangs forever
}
```

If `next()` is not called and the response isn't sent, the request will **hang** until it times out.

## The Signature

```js
(req, res, next) => { ... }        // regular middleware
(err, req, res, next) => { ... }   // error-handling middleware (4 args — see 08-Error-Middleware.md)
```

## Mounting Middleware with `app.use()`

```js
const express = require("express");
const app = express();

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} — ${new Date().toISOString()}`);
  next();
});

app.get("/", (req, res) => res.send("Home"));

app.listen(3000);
```

Every request — regardless of method or path — passes through the logger above before reaching a route handler.

## Middleware Execution Order

Express processes middleware **in the order it's declared**. This is one of the most important mental models in Express.

```js
app.use((req, res, next) => {
  console.log("1st");
  next();
});

app.use((req, res, next) => {
  console.log("2nd");
  next();
});

app.get("/", (req, res) => {
  console.log("3rd — route handler");
  res.send("done");
});
```

Console output for `GET /`: `1st`, `2nd`, `3rd — route handler`.

## Path-Scoped Middleware

```js
app.use("/admin", (req, res, next) => {
  console.log("Admin area accessed");
  next();
});
```

This middleware only runs for paths starting with `/admin` (e.g., `/admin`, `/admin/users`).

## Types of Middleware in Express

| Type                  | Description                                                       |
| --------------------- | ----------------------------------------------------------------- |
| **Application-level** | Bound via `app.use()` / `app.METHOD()`                            |
| **Router-level**      | Same as above but bound to an `express.Router()` instance         |
| **Built-in**          | Shipped with Express (`express.json()`, `express.static()`, etc.) |
| **Third-party**       | Installed via npm (`morgan`, `cors`, `helmet`, ...)               |
| **Error-handling**    | Special 4-arg signature `(err, req, res, next)`                   |

## Chaining Multiple Middleware for One Route

```js
const auth = (req, res, next) => {
  if (!req.headers.authorization) return res.status(401).send("Unauthorized");
  next();
};

const logRequest = (req, res, next) => {
  console.log("Request logged");
  next();
};

app.get("/dashboard", auth, logRequest, (req, res) => {
  res.send("Welcome to your dashboard");
});
```

## `next('route')` — Skip to the Next Route

Passing the string `'route'` to `next` skips remaining middleware in the current route and moves to the next matching route.

```js
app.get(
  "/user/:id",
  (req, res, next) => {
    if (req.params.id === "0") return next("route"); // skip to next handler for this path
    next();
  },
  (req, res) => {
    res.send("regular user id");
  },
);

app.get("/user/:id", (req, res) => {
  res.send("special case for id 0");
});
```

## `next(err)` — Forward to Error Handling

Calling `next()` with any argument tells Express that an error occurred, and it skips all remaining non-error middleware, jumping straight to error-handling middleware.

```js
app.get("/risky", (req, res, next) => {
  try {
    throw new Error("Something broke");
  } catch (err) {
    next(err); // forwarded to error middleware
  }
});
```

## Order Matters: Middleware vs Routes

Middleware registered **after** a route that sends a response will never run for that request:

```js
app.get("/", (req, res) => res.send("Hi")); // response sent, cycle ends here

app.use((req, res, next) => {
  console.log("This never runs for GET /");
  next();
});
```

## Common Built-in / Popular Middleware Stack (Preview)

```js
app.use(express.json()); // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse form bodies
app.use(express.static("public")); // serve static files
app.use(require("morgan")("dev")); // logging
app.use(require("cors")()); // CORS
app.use(require("helmet")()); // security headers
```

(Each of these is explored in depth in later notes.)

## Common Interview-Style Questions

- **What are the three things middleware has access to?**
  `req`, `res`, and `next`.

- **What happens if you forget to call `next()`?**
  The request hangs and eventually times out, since Express doesn't know to move to the next handler.

- **What's the difference between application-level and router-level middleware?**
  Application-level is bound to the `app` object; router-level is bound to an `express.Router()` instance and only runs for requests matching that router's mount path.

- **How do you skip to error-handling middleware?**
  Call `next(err)` with any truthy argument.

- **Does middleware order matter?**
  Yes — Express executes middleware strictly in the order it was registered.
