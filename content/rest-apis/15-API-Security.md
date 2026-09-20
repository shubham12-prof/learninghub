# 15. API Security

## Why API Security Matters

A REST API is often the front door to your entire system — databases, business logic, third-party integrations. Unlike a traditional web app protected by session cookies and server-rendered pages, APIs are frequently called directly by scripts, mobile apps, and third parties, making them a prime attack target. Security has to be layered, not a single checkbox.

## 1. Authentication vs Authorization

- **Authentication** — verifying _who_ the caller is (login, tokens).
- **Authorization** — verifying _what_ the authenticated caller is allowed to do.

```js
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = verifyJWT(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

app.delete("/products/:id", authenticate, authorize("admin"), deleteProduct);
```

## 2. JWT-Based Authentication

```bash
npm install jsonwebtoken bcrypt
```

```js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Login: issue a token
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
  const refreshToken = jwt.sign(
    { sub: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" },
  );

  res.json({ token, refreshToken });
});
```

**Key practices:**

- Keep access tokens **short-lived** (minutes), use refresh tokens for renewal.
- Store secrets in environment variables, never hard-code them.
- Sign with a strong secret (or asymmetric keys — `RS256` — for distributed verification).

## 3. Password Storage

Never store plain-text passwords. Always hash with a slow, salted algorithm.

```js
const bcrypt = require("bcrypt");

const passwordHash = await bcrypt.hash(plainPassword, 12); // 12 salt rounds
const isMatch = await bcrypt.compare(plainPassword, passwordHash);
```

`bcrypt` (or `argon2`, generally considered even stronger) — never use plain `md5`/`sha256` alone for passwords, since they're too fast and vulnerable to brute-forcing/rainbow tables without proper salting and slowdown.

## 4. Input Validation & Sanitization (Injection Prevention)

```js
// Parameterized queries prevent SQL injection — NEVER string-concatenate user input into SQL
const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
  req.body.email,
]);

// NoSQL injection prevention — sanitize MongoDB operator injection
const mongoSanitize = require("express-mongo-sanitize");
app.use(mongoSanitize()); // strips keys starting with "$" or containing "."
```

```js
// Example NoSQL injection attack this prevents:
// POST /login  { "email": { "$ne": null }, "password": { "$ne": null } }
// Without sanitization, this could bypass authentication entirely in a naive query.
```

## 5. HTTPS Everywhere

All traffic — especially anything carrying credentials or tokens — must be encrypted in transit.

```js
app.use((req, res, next) => {
  if (
    req.headers["x-forwarded-proto"] !== "https" &&
    process.env.NODE_ENV === "production"
  ) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});
```

In production, HTTPS termination is often handled by a load balancer/reverse proxy (Nginx, Cloudflare) rather than Node directly.

## 6. Security Headers with Helmet

```js
const helmet = require("helmet");
app.use(helmet()); // sets CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.
```

(Full detail in the Express notes on Helmet.)

## 7. CORS — Restrict Cross-Origin Access

```js
const cors = require("cors");

app.use(
  cors({
    origin: ["https://myapp.com"],
    credentials: true,
  }),
);
```

Never use `origin: '*'` for APIs that handle authenticated/credentialed requests.

## 8. Rate Limiting & Brute-Force Protection

```js
const rateLimit = require("express-rate-limit");

app.use(
  "/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // only 5 login attempts per 15 minutes
  }),
);
```

(Full detail in Rate Limiting notes.)

## 9. Preventing Mass Assignment Vulnerabilities

Never blindly pass the entire `req.body` into a database write — clients could inject fields they shouldn't control (like `role: 'admin'` or `isVerified: true`).

```js
// BAD
const user = await User.create(req.body); // client could smuggle in { role: 'admin' }

// GOOD — explicitly whitelist accepted fields
const { name, email, password } = req.body;
const user = await User.create({ name, email, password });
```

## 10. Preventing Excessive Data Exposure

Don't return internal/sensitive fields just because they exist on the model.

```js
// BAD
res.json(user); // may include passwordHash, internal flags, etc.

// GOOD
res.json({ id: user.id, name: user.name, email: user.email });
```

With Mongoose, you can exclude fields at the schema level:

```js
const userSchema = new mongoose.Schema({
  password: { type: String, select: false }, // excluded from queries by default
});
```

## 11. Security Misconfiguration Checklist

- Disable verbose error messages / stack traces in production.
- Remove the `X-Powered-By: Express` header (`app.disable('x-powered-by')` or Helmet).
- Set strict CORS policies — don't default to allowing all origins.
- Enforce a request body size limit to prevent large-payload DoS: `express.json({ limit: '10kb' })`.
- Keep dependencies updated (`npm audit`) — many real-world breaches stem from outdated packages with known CVEs.

## 12. Preventing IDOR (Insecure Direct Object Reference)

Always verify that the authenticated user actually owns/can access the requested resource — don't rely solely on "if the ID exists, return it."

```js
app.get("/orders/:id", authenticate, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Not found" });

  if (order.userId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" }); // don't reveal existence to unauthorized users
  }

  res.json(order);
});
```

## 13. API Keys for Third-Party/Server-to-Server Access

```js
function validateApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || !isValidApiKey(key)) {
    return res.status(401).json({ error: "Invalid API key" });
  }
  next();
}

app.use("/api/partners", validateApiKey);
```

API keys should be treated like passwords: hashed at rest, rotatable, and scoped to specific permissions where possible.

## 14. CSRF (Cross-Site Request Forgery) — Relevant Mostly for Cookie-Based Auth

If your API uses cookies for authentication (rather than a bearer token in headers), it's vulnerable to CSRF, since browsers auto-attach cookies to cross-site requests.

```bash
npm install csurf
```

```js
const csrf = require("csurf");
app.use(csrf({ cookie: true }));

app.get("/form", (req, res) => {
  res.json({ csrfToken: req.csrfToken() }); // client must include this in subsequent requests
});
```

> Token-based (`Authorization: Bearer <token>`) APIs are generally **not** vulnerable to CSRF in the same way, since tokens aren't automatically attached by the browser like cookies are.

## 15. Logging & Monitoring for Security

```js
app.use((req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode === 401 || res.statusCode === 403) {
      logger.warn(
        `Auth failure: ${req.method} ${req.originalUrl} from ${req.ip}`,
      );
    }
  });
  next();
});
```

Monitoring repeated auth failures helps detect brute-force attempts or credential stuffing early.

## Full Example: A Security-Hardened Express Setup

```js
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

const app = express();

app.use(helmet());
app.use(cors({ origin: ["https://myapp.com"], credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(mongoSanitize());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.disable("x-powered-by");

app.use("/api", apiRoutes);
app.use(errorHandler);

app.listen(3000);
```

## Common Interview-Style Questions

- **What's the difference between authentication and authorization?**
  Authentication verifies who the caller is; authorization verifies what that authenticated caller is permitted to do.

- **Why should passwords be hashed with bcrypt/argon2 instead of a fast hash like SHA-256?**
  Fast hashes are efficient for attackers to brute-force at scale; bcrypt/argon2 are intentionally slow and salted, making brute-force/rainbow-table attacks impractical.

- **What is mass assignment, and how do you prevent it?**
  A vulnerability where blindly saving an entire request body lets clients set fields they shouldn't control (like `role` or `isAdmin`); prevented by explicitly whitelisting accepted fields rather than passing `req.body` directly into a create/update call.

- **What is IDOR, and how do you prevent it?**
  Insecure Direct Object Reference — accessing a resource by ID without verifying the requester actually owns/can access it; prevented by checking ownership/permissions server-side on every resource access, not just checking existence.

- **Why are token-based (Bearer) APIs generally less vulnerable to CSRF than cookie-based ones?**
  Browsers automatically attach cookies to cross-site requests, enabling CSRF; bearer tokens must be explicitly included by client-side JavaScript in an `Authorization` header, which a malicious cross-site page can't do without already having access to the token.

- **Why limit `express.json()` payload size?**
  To prevent denial-of-service attacks via extremely large request bodies consuming excessive memory/CPU.
