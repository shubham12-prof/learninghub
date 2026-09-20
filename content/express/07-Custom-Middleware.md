# 07. Custom Middleware

Custom middleware is any middleware function **you write yourself** to handle app-specific logic — logging, authentication, request validation, attaching data to `req`, etc.

## Anatomy of a Custom Middleware Function

```js
function myMiddleware(req, res, next) {
  // 1. do something with req/res
  // 2. either call next() to continue, or send a response to end the cycle
  next();
}

app.use(myMiddleware);
```

## Example 1: Request Logger

```js
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
    );
  });
  next();
}

app.use(requestLogger);
```

## Example 2: Authentication Middleware

```js
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = verifyToken(token); // your JWT verify logic
    req.user = decoded; // attach user info for downstream handlers
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

app.get("/profile", authenticate, (req, res) => {
  res.json({ user: req.user });
});
```

## Example 3: Role-Based Authorization Middleware Factory

A **middleware factory** is a function that returns a middleware function, letting you parameterize behavior.

```js
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

app.delete(
  "/admin/users/:id",
  authenticate,
  requireRole("admin"),
  (req, res) => {
    res.send(`User ${req.params.id} deleted`);
  },
);
```

## Example 4: Request ID Middleware (tracing)

```js
const { randomUUID } = require("crypto");

function requestId(req, res, next) {
  req.id = randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
}

app.use(requestId);
```

## Example 5: Attaching Shared Data (e.g., DB connection)

```js
function attachDb(db) {
  return (req, res, next) => {
    req.db = db;
    next();
  };
}

app.use(attachDb(myDatabaseConnection));

app.get("/users", (req, res) => {
  req.db.query("SELECT * FROM users", (err, rows) => {
    res.json(rows);
  });
});
```

## Example 6: Async Middleware & Error Handling

Async middleware that throws will **not** automatically be caught by Express 4 — you must catch it and call `next(err)` yourself (Express 5 fixes this for async handlers). A common pattern is a wrapper:

```js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await db.findUser(req.params.id);
    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err; // caught by asyncHandler, forwarded to next(err)
    }
    res.json(user);
  }),
);
```

## Example 7: Conditional Middleware

```js
function skipForHealthCheck(middleware) {
  return (req, res, next) => {
    if (req.path === "/health") return next();
    return middleware(req, res, next);
  };
}

app.use(skipForHealthCheck(authenticate));
```

## Organizing Middleware in a Real Project

```
src/
├── middleware/
│   ├── auth.js
│   ├── requestLogger.js
│   ├── requireRole.js
│   └── asyncHandler.js
```

`middleware/auth.js`:

```js
module.exports = function authenticate(req, res, next) {
  // ...
};
```

`app.js`:

```js
const authenticate = require("./middleware/auth");
app.use(authenticate);
```

## Middleware Best Practices

1. **Keep middleware focused** — one responsibility per middleware function.
2. **Always call `next()`** unless you're intentionally ending the response.
3. **Never mutate `req`/`res` in surprising ways** — document what you attach (`req.user`, `req.db`, etc.).
4. **Order matters** — parsers before validators, auth before authorization, everything before the final route handler.
5. **Wrap async logic** to make sure rejected promises reach your error handler.

## Common Interview-Style Questions

- **How do you write a middleware factory?**
  A function that accepts configuration and returns a `(req, res, next) => {}` function, allowing parameterized reusable middleware (e.g., `requireRole('admin')`).

- **Why doesn't Express 4 automatically catch errors thrown inside `async` middleware?**
  Because Express 4's internals aren't promise-aware — an unhandled rejection inside an async function doesn't call `next(err)` automatically, so you must catch it yourself (or use a wrapper / upgrade to Express 5, which handles this natively).

- **How would you attach a database connection to every request?**
  Middleware that does `req.db = dbInstance; next();`, registered early with `app.use()`.
