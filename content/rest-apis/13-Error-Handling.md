# 13. Error Handling

## Why Consistent Error Handling Matters

A REST API's error responses are part of its contract. Inconsistent error shapes force every client to write brittle, endpoint-specific error-parsing logic. A well-designed API returns errors in a **predictable, structured format** every time, regardless of which endpoint or failure type triggered them.

## A Standard Error Response Shape

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields",
    "details": [
      { "field": "email", "message": "Must be a valid email address" }
    ]
  }
}
```

Simpler alternative (fine for smaller APIs):

```json
{
  "success": false,
  "error": "Product not found"
}
```

Whichever shape you choose, **use it everywhere** — never mix plain-string errors on some endpoints and structured objects on others.

## Custom Error Classes

```js
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // expected/handled error, not a bug
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

class ValidationError extends AppError {
  constructor(details) {
    super("Validation failed", 400, "VALIDATION_ERROR");
    this.details = details;
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, "CONFLICT");
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
};
```

## Using Custom Errors in Controllers

```js
const { NotFoundError, ConflictError } = require("../errors");

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw new NotFoundError("Product");
    res.json(product);
  } catch (err) {
    next(err); // forward to centralized error handler
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const existing = await Product.findOne({ sku: req.body.sku });
    if (existing)
      throw new ConflictError("A product with this SKU already exists");
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};
```

## Centralized Error-Handling Middleware

```js
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  const response = {
    success: false,
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: isOperational ? err.message : "Something went wrong",
    },
  };

  if (err.details) response.error.details = err.details;

  if (process.env.NODE_ENV === "development") {
    response.error.stack = err.stack; // only expose stack traces in dev
  }

  if (!isOperational) {
    console.error("UNEXPECTED ERROR:", err); // log unexpected/programmer errors loudly
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
```

Register **last**, after all routes:

```js
app.use("/api/products", productRoutes);
app.use(errorHandler);
```

## Async Error Wrapper (Avoid Repeating try/catch)

```js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new NotFoundError("Product");
  res.json(product);
});
```

## 404 Handler for Unmatched Routes

```js
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
});

app.use(errorHandler); // still last
```

## Mapping Common Failure Types to Status Codes

| Scenario                              | Status      | Error Code (example)   |
| ------------------------------------- | ----------- | ---------------------- |
| Missing/invalid required field        | 400         | `VALIDATION_ERROR`     |
| No/invalid auth token                 | 401         | `UNAUTHORIZED`         |
| Valid auth, insufficient permission   | 403         | `FORBIDDEN`            |
| Resource doesn't exist                | 404         | `NOT_FOUND`            |
| Unsupported HTTP method               | 405         | `METHOD_NOT_ALLOWED`   |
| Duplicate/unique constraint violation | 409         | `CONFLICT`             |
| Semantically invalid data             | 422         | `UNPROCESSABLE_ENTITY` |
| Too many requests                     | 429         | `RATE_LIMITED`         |
| Unexpected server failure             | 500         | `INTERNAL_ERROR`       |
| Upstream service failure              | 502/503/504 | `UPSTREAM_ERROR`       |

## Handling Database-Specific Errors

Translate low-level DB errors into clean API errors rather than leaking raw driver error messages.

```js
function errorHandler(err, req, res, next) {
  // MongoDB duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: {
        code: "CONFLICT",
        message: "Duplicate value violates a unique constraint",
      },
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details,
      },
    });
  }

  // Fallback
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: err.isOperational ? err.message : "Something went wrong",
    },
  });
}
```

## Global Safety Nets for Uncaught Errors

Express error middleware only catches errors within the request-response cycle. Handle process-level crashes separately:

```js
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});
```

Use a process manager (PM2, Docker restart policies, Kubernetes) to automatically restart the process after a crash.

## Best Practices

1. **Never leak stack traces or internal details** to clients in production.
2. **Distinguish operational errors** (expected: bad input, not found) **from programmer errors** (bugs) — log the latter more aggressively.
3. **Use a consistent error response shape** across the entire API.
4. **Include a machine-readable error code** (not just a human-readable message) so clients can branch logic reliably (`if (error.code === 'CONFLICT')`) without parsing message strings.
5. **Log with context** — request ID, path, method, user ID if available — for easier debugging in production.

## Common Interview-Style Questions

- **Why should error responses have a consistent shape across an API?**
  So client applications can reliably parse and handle errors without writing endpoint-specific parsing logic.

- **What's the difference between an "operational" error and a "programmer" error?**
  Operational errors are expected failure states (invalid input, resource not found) with clean, client-facing messages; programmer errors are bugs (unexpected exceptions) that should be logged internally and returned as a generic message, not exposing implementation details.

- **Why include a machine-readable error code alongside a human-readable message?**
  It lets client code branch on the error type reliably (`error.code === 'NOT_FOUND'`) without fragile string matching on a message that might change wording.

- **Why shouldn't you expose stack traces to API clients in production?**
  Stack traces can reveal internal file structure, dependencies, and implementation details that could aid an attacker; they should only be logged server-side or shown in development environments.
