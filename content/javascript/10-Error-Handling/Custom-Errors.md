# Custom Errors

Extend the built-in `Error` class to create domain-specific error types with extra context.

```js
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ValidationError"; // otherwise it'd say "Error"
    this.field = field;
    // Maintains proper stack trace (V8-specific, optional)
    if (Error.captureStackTrace) Error.captureStackTrace(this, ValidationError);
  }
}

class NotFoundError extends Error {
  constructor(resource) {
    super(`${resource} not found`);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}

function validateUser(user) {
  if (!user.email) {
    throw new ValidationError("Email is required", "email");
  }
}

try {
  validateUser({ name: "Alice" });
} catch (e) {
  if (e instanceof ValidationError) {
    console.log(`Validation failed on field "${e.field}": ${e.message}`);
  } else if (e instanceof NotFoundError) {
    console.log(`Not found (${e.statusCode}): ${e.message}`);
  } else {
    throw e; // re-throw unknown errors instead of swallowing them
  }
}
```

**Real-world pattern — centralized API error handling:**

```js
async function apiRequest(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new HttpError(res.status, `Request failed: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    if (err instanceof HttpError) {
      // handle known API errors
    } else {
      // handle network errors, etc.
    }
    throw err;
  }
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}
```
