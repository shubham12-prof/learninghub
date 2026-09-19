# 🔐 Environment Variables

## 🎯 Why They Matter

Environment variables let you configure app behavior (API keys, DB URLs, ports, feature flags) **without hardcoding secrets or environment-specific values** into your source code — critical for security and for running the same code across dev/staging/production.

---

## 💻 Accessing Env Vars

```js
console.log(process.env.NODE_ENV); // e.g. 'development', 'production', 'test'
console.log(process.env.PORT); // e.g. '3000' (always a STRING, even if numeric!)
console.log(process.env.HOME); // OS-provided vars are available too

// Providing sane defaults:
const PORT = process.env.PORT || 3000;
const DB_URL = process.env.DATABASE_URL || "mongodb://localhost:27017/dev";
```

⚠️ **Every value in `process.env` is a string** — `process.env.PORT` is `"3000"`, not `3000`. Convert explicitly:

```js
const port = Number(process.env.PORT) || 3000;
const isDebug = process.env.DEBUG === "true"; // booleans need explicit comparison
```

---

## 🖥️ Setting Env Vars from the Command Line

```bash
# Linux/Mac
NODE_ENV=production PORT=8080 node app.js

# Windows (cmd)
set NODE_ENV=production && node app.js

# Cross-platform (use the cross-env npm package)
npx cross-env NODE_ENV=production node app.js
```

---

## 📄 Using `.env` Files (Local Development)

**.env**

```
PORT=3000
DATABASE_URL=postgres://user:pass@localhost:5432/mydb
API_KEY=sk-abc123xyz
DEBUG=true
```

**app.js**

```js
// Node 20.6+ has NATIVE .env support — no package needed!
// Run with: node --env-file=.env app.js

console.log(process.env.PORT); // '3000'

// For older Node versions, use the `dotenv` package:
// require('dotenv').config();
```

```bash
# Node 20.6+
node --env-file=.env app.js

# Older Node
npm install dotenv
# add require('dotenv').config() at the TOP of your entry file
node app.js
```

---

## 🚨 CRITICAL: Never Commit `.env` to Git!

**.gitignore**

```
.env
.env.local
.env.*.local
```

Provide a template instead:

**.env.example**

```
PORT=3000
DATABASE_URL=your_database_url_here
API_KEY=your_api_key_here
```

---

## 🌍 Common Convention: `NODE_ENV`

```js
if (process.env.NODE_ENV === "production") {
  // enable caching, disable verbose logging, use production DB
} else if (process.env.NODE_ENV === "test") {
  // use in-memory/test DB
} else {
  // development defaults — verbose logs, hot reload, etc.
}
```

Many frameworks/tools (Express, React) key optimizations off `NODE_ENV === 'production'` (e.g., Express disables view caching in dev, enables it in prod).

---

## ✅ Validating Required Env Vars at Startup

```js
const requiredEnvVars = ["DATABASE_URL", "API_KEY", "JWT_SECRET"];

function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
  console.log("✅ All required environment variables present");
}

validateEnv(); // call this at the very top of your entry file
```

Popular tools like `zod` or `envalid` can do typed schema validation for larger apps.

---

## ⚠️ Common Pitfalls

- Forgetting values are always **strings** — `if (process.env.FEATURE_FLAG)` is truthy even for `"false"` (non-empty string)! Use `=== 'true'`.
- Committing `.env` files with real secrets to version control.
- Not validating required vars at startup → app crashes deep in runtime instead of failing fast.
- Relying on `.env` files in **production** — production secrets should come from a secrets manager (AWS Secrets Manager, Vault, platform env config) not a flat file.

---

## 🧪 Try It Yourself

1. Create a `.env` file and load it using Node's native `--env-file` flag (Node 20.6+) or `dotenv`.
2. Write a `validateEnv()` startup check that exits with a clear error if required vars are missing.
3. Build config logic that behaves differently based on `NODE_ENV` (e.g., verbose logging only in development).
