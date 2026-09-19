# 🚨 Error Handling

## 🎯 Why It's Critical in Node.js

Unhandled errors in Node can **crash your entire process** — taking down every in-flight request, not just the one that failed. Proper error handling is one of the most important production-readiness skills.

---

## 🧩 Error Types in Node

```js
// Built-in error types
new Error("Generic error");
new TypeError("Wrong type provided");
new RangeError("Value out of range");
new SyntaxError("Invalid syntax");

// Custom errors (recommended for domain-specific handling)
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
    this.statusCode = 400;
    Error.captureStackTrace(this, ValidationError); // clean stack trace
  }
}

throw new ValidationError("Email is required", "email");
```

---

## 🔄 Sync vs Async Error Handling

### 1️⃣ Synchronous — `try/catch`

```js
function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (err) {
    console.error("❌ Invalid JSON:", err.message);
    return null;
  }
}
```

### 2️⃣ Callback-Style — Error-First Convention

```js
const fs = require("node:fs");

fs.readFile("data.txt", (err, data) => {
  if (err) {
    // ⚠️ ALWAYS check err first!
    console.error("❌", err.message);
    return; // don't forget to return / stop execution
  }
  console.log("✅", data.toString());
});
```

### 3️⃣ Promises — `.catch()`

```js
fetch("https://api.example.com/data")
  .then((res) => res.json())
  .catch((err) => console.error("❌ Fetch failed:", err.message));
```

### 4️⃣ Async/Await — `try/catch` (Most Readable)

```js
async function getData() {
  try {
    const res = await fetch("https://api.example.com/data");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("❌", err.message);
    throw err; // re-throw if the caller needs to know
  }
}
```

---

## 🌐 Error Handling in Express (Real-World Pattern)

```js
const express = require("express");
const app = express();

// Async route wrapper — avoids repetitive try/catch in every handler
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

app.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await db.findUser(req.params.id);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    res.json(user);
  }),
);

// 🎯 Centralized error-handling middleware (MUST have 4 args to be recognized!)
app.use((err, req, res, next) => {
  console.error("💥", err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || "Internal Server Error",
  });
});
```

---

## 🚨 Process-Level Safety Nets

```js
// Last-resort catchers — LOG and EXIT, don't try to "recover" from unknown state
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  process.exit(1); // let your process manager (PM2/K8s) restart cleanly
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
```

⚠️ These are **safety nets, not primary error handling** — relying on them means bugs slipped through everywhere else. Handle errors as close to the source as possible.

---

## 🎯 Operational vs Programmer Errors

| Type                                    | Example                                             | Response                                                    |
| --------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------- |
| **Operational** (expected, recoverable) | Invalid user input, network timeout, file not found | Catch, log, return a graceful response                      |
| **Programmer** (bugs)                   | `undefined is not a function`, typos, logic errors  | Should crash loudly in dev; fix the code, don't "handle" it |

```js
// ✅ Operational error — handle gracefully
try {
  const user = await db.findUser(id);
} catch (err) {
  if (err.code === "ENOTFOUND")
    return res.status(503).json({ error: "DB unavailable" });
  throw err; // unknown error — let it bubble up / crash
}
```

---

## 🔁 Custom Error Hierarchy Example

```js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // marks this as an expected, handleable error
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor() {
    super("Unauthorized", 401);
  }
}

// Usage:
throw new NotFoundError("User");
```

---

## ⚠️ Common Pitfalls

- Swallowing errors silently (`catch (err) {}` with nothing inside) — always at least log.
- Forgetting `return` after handling an error in a callback → code continues executing with bad data.
- Not distinguishing operational errors from programmer bugs → over-catching hides real bugs.
- Mixing callback error-first pattern with thrown exceptions inconsistently.
- Not setting up `unhandledRejection`/`uncaughtException` handlers in production → silent crashes with no logs.

---

## 🧪 Try It Yourself

1. Build a custom `ValidationError` class and a centralized Express error handler that returns proper status codes.
2. Deliberately trigger an `unhandledRejection` and observe the process behavior with/without a handler.
3. Refactor a callback-heavy file to use async/await with proper try/catch.
