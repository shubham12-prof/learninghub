# 19. Logging (Morgan / Winston)

Logging is essential for debugging, monitoring, and auditing an Express application. Two commonly paired tools:

- **Morgan** — HTTP request logger middleware (logs each incoming request)
- **Winston** — general-purpose, configurable application logger (logs application events, errors, custom messages, to multiple destinations)

## Morgan — HTTP Request Logging

```bash
npm install morgan
```

### Basic Usage

```js
const express = require("express");
const morgan = require("morgan");

const app = express();

app.use(morgan("dev")); // colored, concise output — great for development

app.get("/", (req, res) => res.send("Hello"));

app.listen(3000);
```

Example `dev` format output:

```
GET / 200 3.212 ms - 5
```

### Built-in Formats

| Format       | Description                                               |
| ------------ | --------------------------------------------------------- |
| `'dev'`      | Concise colored output, ideal for development             |
| `'combined'` | Standard Apache combined log format, ideal for production |
| `'common'`   | Standard Apache common log format                         |
| `'short'`    | Shorter than default, includes response time              |
| `'tiny'`     | Minimal output                                            |

```js
app.use(morgan("combined"));
```

Example `combined` output:

```
127.0.0.1 - - [15/Jul/2026:10:00:00 +0000] "GET / HTTP/1.1" 200 5 "-" "Mozilla/5.0"
```

### Custom Format

```js
morgan.token("id", (req) => req.id); // custom token, e.g. request ID

app.use(morgan(":id :method :url :status :response-time ms"));
```

### Logging to a File

```js
const fs = require("fs");
const path = require("path");

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }, // append mode
);

app.use(morgan("combined", { stream: accessLogStream }));
```

### Skipping Certain Logs

```js
app.use(
  morgan("dev", {
    skip: (req, res) => res.statusCode < 400, // only log errors
  }),
);
```

## Winston — Application-Level Logging

```bash
npm install winston
```

### Basic Setup

```js
const winston = require("winston");

const logger = winston.createLogger({
  level: "info", // minimum level to log: error, warn, info, http, verbose, debug, silly
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

logger.info("Server started");
logger.warn("Cache miss for key: user:42");
logger.error("Database connection failed");
```

### Log Levels (npm convention, highest to lowest priority)

```
error(0) > warn(1) > info(2) > http(3) > verbose(4) > debug(5) > silly(6)
```

Setting `level: 'info'` logs `error`, `warn`, and `info` — but not `debug`/`silly`.

### Environment-Aware Configuration

```js
const isProduction = process.env.NODE_ENV === "production";

const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  format: isProduction
    ? winston.format.json()
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
  transports: [new winston.transports.Console()],
});

module.exports = logger;
```

### Using Winston Inside Express

```js
const express = require("express");
const logger = require("./logger");

const app = express();

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

app.get("/error-test", (req, res, next) => {
  next(new Error("Something failed"));
});

app.use((err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(3000, () => logger.info("Server started on port 3000"));
```

## Combining Morgan + Winston

A common production pattern: pipe Morgan's HTTP logs through Winston, so all logging (requests + app events) goes to one unified destination/format.

```js
const morgan = require("morgan");
const logger = require("./logger");

const stream = {
  write: (message) => logger.http(message.trim()),
};

app.use(morgan("combined", { stream }));
```

This requires adding an `http` level to your Winston logger config (npm levels already include it).

## Structured Logging for Production (JSON Logs)

Production systems typically want structured (JSON) logs so log aggregators (ELK, Datadog, CloudWatch) can parse and index them.

```js
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "my-express-app" },
  transports: [new winston.transports.Console()],
});

logger.info("User created", { userId: 42, email: "alice@example.com" });
```

Output:

```json
{
  "level": "info",
  "message": "User created",
  "service": "my-express-app",
  "timestamp": "2026-07-15T10:00:00.000Z",
  "userId": 42,
  "email": "alice@example.com"
}
```

## Common Interview-Style Questions

- **What's the difference between Morgan and Winston?**
  Morgan is specifically HTTP request logging middleware (logs each incoming request/response); Winston is a general-purpose application logger for arbitrary log messages, errors, and events, supporting multiple transports (console, files, external services).

- **Why use structured (JSON) logging in production?**
  It allows log aggregation/monitoring tools to parse, filter, and search logs programmatically, rather than relying on fragile string matching.

- **How do log levels work in Winston?**
  Each log call has a severity level (error, warn, info, etc.); the logger's configured `level` determines the minimum severity that gets recorded — anything less severe is filtered out.

- **How would you avoid logging sensitive data (passwords, tokens)?**
  Redact/omit sensitive fields before logging (e.g., strip `password`/`authorization` from logged request bodies), and never log raw request bodies indiscriminately.
