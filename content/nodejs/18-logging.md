# 📝 Logging

## 🎯 Why `console.log` Isn't Enough in Production

`console.log` is fine for local debugging, but production apps need: **log levels**, **structured (JSON) output** for log aggregators, **performance** (async, non-blocking writes), and **contextual metadata** (request IDs, timestamps, service names).

---

## 🎨 Console Basics (Beyond `console.log`)

```js
console.log("ℹ️ Info message");
console.warn("⚠️ Warning message"); // goes to stderr
console.error("❌ Error message"); // goes to stderr
console.debug("🐛 Debug message");

console.table([
  { name: "Alice", age: 30 },
  { name: "Bob", age: 25 },
]); // pretty table!

console.time("operation");
// ... some work ...
console.timeEnd("operation"); // 'operation: 42.123ms'

console.group("User Details");
console.log("Name: Alice");
console.log("Age: 30");
console.groupEnd();

console.trace("Trace point"); // prints a stack trace
```

---

## 🌈 Colorful Console Output (ANSI Codes)

```js
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function logInfo(msg) {
  console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`);
}
function logSuccess(msg) {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}
function logWarn(msg) {
  console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`);
}
function logError(msg) {
  console.log(`${colors.red}❌ ${msg}${colors.reset}`);
}

logInfo("Server starting...");
logSuccess("Connected to database");
logWarn("Cache miss, falling back to DB");
logError("Failed to send email");
```

---

## 📊 Structured (JSON) Logging — Production Pattern

```js
function log(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  console.log(JSON.stringify(entry));
}

log("info", "User logged in", { userId: 42, ip: "192.168.1.1" });
// {"timestamp":"2026-08-04T10:00:00.000Z","level":"info","message":"User logged in","userId":42,"ip":"192.168.1.1"}
```

Structured JSON logs are what tools like **Datadog, ELK Stack, CloudWatch, and Splunk** expect — enabling searching/filtering/alerting on fields.

---

## 📦 Using a Real Logging Library — `pino` (Fast & Popular)

```bash
npm install pino pino-pretty
```

```js
const pino = require("pino");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty" } // colorful, human-readable in dev
      : undefined, // raw JSON in production (for log aggregators)
});

logger.info("Server started");
logger.warn({ userId: 42 }, "Rate limit approaching");
logger.error({ err: new Error("DB timeout") }, "Database connection failed");

// Child loggers with contextual metadata (e.g., per-request)
const requestLogger = logger.child({ requestId: "abc-123" });
requestLogger.info("Handling request");
```

### 📦 Alternative: `winston`

```bash
npm install winston
```

```js
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

logger.info("Server started");
logger.error("Something failed", { errorCode: "DB_TIMEOUT" });
```

---

## 🎚️ Log Levels — Standard Hierarchy

```
fatal  → app is unusable, about to crash
error  → something failed, needs attention
warn   → unexpected but recoverable
info   → general operational events (server start, request received)
debug  → detailed diagnostic info (dev-only usually)
trace  → very fine-grained (rarely used in prod)
```

```js
// Filter by level in production to reduce noise/cost:
const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
});
```

---

## 🔗 Request-Scoped Logging (Express Middleware Example)

```js
const { randomUUID } = require("node:crypto");

app.use((req, res, next) => {
  req.id = randomUUID();
  req.log = logger.child({
    requestId: req.id,
    path: req.path,
    method: req.method,
  });
  req.log.info("Request received");
  next();
});

app.get("/users/:id", (req, res) => {
  req.log.info({ userId: req.params.id }, "Fetching user");
  // ...
});
```

---

## ⚠️ Common Pitfalls

- Logging sensitive data (passwords, tokens, credit cards) — **redact** before logging!
- Using `console.log` for high-volume production logging — it's synchronous and can bottleneck under load; use async loggers like `pino`.
- No log levels — everything at the same priority makes it impossible to filter noise from critical alerts.
- Not including correlation IDs (request IDs) — makes tracing a single request across logs nearly impossible in concurrent systems.

---

## 🧪 Try It Yourself

1. Set up `pino` with `pino-pretty` in development and raw JSON in production, controlled by `NODE_ENV`.
2. Build Express middleware that attaches a unique request ID to every log line for that request.
3. Write a `redact()` helper that strips sensitive fields (e.g., `password`, `token`) before logging an object.
