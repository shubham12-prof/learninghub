# 08. Error Middleware

## What Makes Middleware "Error-Handling"?

Error-handling middleware is defined with **four arguments** instead of three: `(err, req, res, next)`. Express identifies it as error middleware specifically by this arity — even if you don't use `next`, all four parameters must be present.

```js
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
}
```

## Where to Register It

Error-handling middleware must be registered **last**, after all other `app.use()` and route calls.

```js
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Home");
});

app.get("/fail", (req, res, next) => {
  next(new Error("Deliberate failure"));
});

// error middleware — must be last
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

app.listen(3000);
```

## Triggering Error Middleware

### 1. Calling `next(err)`

```js
app.get("/user/:id", (req, res, next) => {
  if (!isValidId(req.params.id)) {
    return next(new Error("Invalid ID format")); // skips to error middleware
  }
  res.send("valid user");
});
```

### 2. Synchronous throws (caught automatically, Express 4+)

```js
app.get("/sync-error", (req, res) => {
  throw new Error("Sync error thrown directly"); // Express catches this automatically
});
```

### 3. Asynchronous errors (must be forwarded manually in Express 4)

```js
app.get("/async-error", async (req, res, next) => {
  try {
    await someAsyncOperation();
  } catch (err) {
    next(err); // must call manually — Express 4 doesn't catch async throws
  }
});
```

> **Express 5** natively supports async route handlers — a rejected promise is automatically forwarded to `next(err)`. In Express 4, always wrap async handlers (see `asyncHandler` pattern in **07-Custom-Middleware.md**).

## Custom Error Classes

Creating your own `Error` subclasses makes error handling more structured.

```js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes expected errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

class ValidationError extends AppError {
  constructor(message = "Invalid input") {
    super(message, 400);
  }
}

module.exports = { AppError, NotFoundError, ValidationError };
```

Usage:

```js
const { NotFoundError } = require("./errors");

app.get("/users/:id", async (req, res, next) => {
  const user = await db.findUser(req.params.id);
  if (!user) return next(new NotFoundError("User not found"));
  res.json(user);
});
```

## A Production-Style Central Error Handler

```js
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Internal Server Error";

  console.error({
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

module.exports = errorHandler;
```

`app.js`:

```js
const errorHandler = require("./middleware/errorHandler");

// ...all routes...

app.use(errorHandler); // registered last
```

## Handling 404s (Route Not Found)

A 404 handler is regular (non-error) middleware placed **after all routes** but **before** the error handler — it catches requests that matched no route.

```js
// after all routes
app.use((req, res, next) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// error handler — last
app.use(errorHandler);
```

## Multiple Error Handlers (Chaining)

You can have several error middlewares, e.g., one for logging, one for formatting the response — call `next(err)` to pass along.

```js
function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err); // pass to the next error handler
}

function formatError(err, req, res, next) {
  res.status(err.statusCode || 500).json({ error: err.message });
}

app.use(logErrors);
app.use(formatError);
```

## Catching Uncaught Exceptions & Unhandled Rejections (App-Level Safety Net)

Express error middleware only catches errors **within** the request-response cycle. Catch process-level failures separately:

```js
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1); // restart via process manager (PM2, Docker, etc.)
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});
```

## Common Interview-Style Questions

- **How does Express identify error-handling middleware?**
  By the number of arguments in its function signature — exactly four: `(err, req, res, next)`.

- **Where must error middleware be placed?**
  After all other middleware and routes, at the very end of the middleware stack.

- **How do you manually trigger error middleware?**
  Call `next(err)` from any route or middleware.

- **Does Express catch errors thrown inside async route handlers automatically?**
  In Express 4, no — you must catch and call `next(err)` yourself (or use a wrapper). Express 5 handles this automatically.

- **What's the difference between an "operational" error and a "programmer" error?**
  Operational errors are expected failure states (invalid input, resource not found) that should produce a clean client-facing message. Programmer errors are bugs (e.g., undefined is not a function) that shouldn't leak details to the client — usually logged and returned as a generic 500.
