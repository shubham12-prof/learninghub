# 🛡️ Security Best Practices

## 🎯 Why It Matters

Node.js apps are exposed to the same web vulnerabilities as any backend — plus some Node-specific gotchas (prototype pollution, unsafe `eval`/`exec`, dependency supply-chain risks). Here's a practical checklist.

---

## 1️⃣ Never Trust User Input

```js
// ❌ SQL Injection risk
db.query(`SELECT * FROM users WHERE email = '${req.body.email}'`);

// ✅ Use parameterized queries
db.query("SELECT * FROM users WHERE email = ?", [req.body.email]);

// ❌ Shell injection risk
exec(`convert ${req.body.filename} output.png`);

// ✅ Use execFile with an argument array (no shell interpretation)
execFile("convert", [req.body.filename, "output.png"]);
```

---

## 2️⃣ Validate & Sanitize Everything

```js
const { z } = require("zod"); // or joi, yup, express-validator

const userSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(120),
});

app.post("/users", (req, res) => {
  const result = userSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.issues });
  }
  // result.data is now validated & typed
});
```

---

## 3️⃣ Secure HTTP Headers — Use `helmet`

```bash
npm install helmet
```

```js
const helmet = require("helmet");
app.use(helmet()); // sets X-Frame-Options, CSP, HSTS, X-Content-Type-Options, etc.
```

---

## 4️⃣ Rate Limiting (Prevent Brute Force / DoS)

```bash
npm install express-rate-limit
```

```js
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: "⚠️ Too many requests, please try again later.",
});

app.use("/api/", limiter);
```

---

## 5️⃣ Password Hashing — Never Store Plaintext

```bash
npm install bcrypt
```

```js
const bcrypt = require("bcrypt");

async function hashPassword(plainPassword) {
  const saltRounds = 12;
  return bcrypt.hash(plainPassword, saltRounds);
}

async function verifyPassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}
```

⚠️ Never use `md5`/`sha1` for passwords — they're fast hashes, easily brute-forced. Use `bcrypt`, `argon2`, or `scrypt` (deliberately slow, salted).

---

## 6️⃣ Environment Variables for Secrets

```js
// ❌ NEVER hardcode secrets
const apiKey = "sk-abc123xyz";

// ✅ Load from environment, validate presence at startup
const apiKey = process.env.API_KEY;
if (!apiKey) throw new Error("API_KEY is required");
```

_(See [`15-environment-variables`](../15-environment-variables/README.md))_

---

## 7️⃣ Keep Dependencies Updated & Audited

```bash
npm audit                # check for known vulnerabilities
npm audit fix             # auto-fix where possible
npm outdated               # see what's behind
```

- Use tools like **Snyk**, **Dependabot**, or **Renovate** for automated dependency vulnerability scanning + PRs.
- Avoid installing packages with very low download counts / no recent updates for critical functionality — supply-chain attacks are real.

---

## 8️⃣ Prevent Prototype Pollution

```js
// ❌ DANGEROUS: merging untrusted user input directly
function merge(target, source) {
  for (const key in source) {
    target[key] = source[key]; // attacker could set "__proto__" to pollute Object.prototype!
  }
}

// ✅ Guard against dangerous keys
function safeMerge(target, source) {
  for (const key in source) {
    if (key === "__proto__" || key === "constructor" || key === "prototype")
      continue;
    target[key] = source[key];
  }
}

// ✅ Even better: use Object.create(null) or well-vetted libraries (e.g. lodash.merge is patched)
```

---

## 9️⃣ CORS — Restrict, Don't Wildcard, in Production

```js
const cors = require("cors");

// ❌ Wide open — fine for public APIs, risky for anything with auth/cookies
app.use(cors());

// ✅ Explicit allowlist
app.use(
  cors({
    origin: ["https://myapp.com", "https://admin.myapp.com"],
    credentials: true,
  }),
);
```

---

## 🔟 Additional Checklist

- ✅ Use **HTTPS** everywhere (TLS termination at load balancer or via `https` module).
- ✅ Set secure cookie flags: `httpOnly`, `secure`, `sameSite`.
- ✅ Limit request body size (`express.json({ limit: '1mb' })`) to prevent DoS via huge payloads.
- ✅ Don't leak stack traces / internal errors to clients in production.
- ✅ Run Node as a **non-root user** in Docker containers.
- ✅ Use `npm ci` (not `npm install`) in CI/CD to ensure exact, audited dependency versions.
- ✅ Sanitize file uploads (check MIME type, extension, size limits, scan for malware if needed).

```js
// Production error handler that hides internals from clients
app.use((err, req, res, next) => {
  console.error(err.stack); // full details in logs
  res.status(err.statusCode || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
});
```

---

## ⚠️ Common Pitfalls

- Trusting `req.body`/`req.query`/`req.params` without validation.
- Storing secrets in source code or committed `.env` files.
- Using `eval()` or `new Function()` on any user-influenced string.
- Returning verbose error stack traces to end users in production.
- Forgetting to set request size limits, enabling memory-exhaustion DoS.

---

## 🧪 Try It Yourself

1. Add `helmet` and `express-rate-limit` to a small Express app and inspect the response headers.
2. Implement `bcrypt` password hashing for a signup/login flow.
3. Write a `safeMerge()` function that guards against prototype pollution and test it against a `__proto__` payload.
