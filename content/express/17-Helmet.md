# 17. Helmet

## What is Helmet?

Helmet is a middleware that sets various HTTP security headers to help protect Express apps from well-known web vulnerabilities (XSS, clickjacking, MIME sniffing, etc.). It's essentially a collection of ~15 smaller middleware functions bundled together.

```bash
npm install helmet
```

## Basic Usage

```js
const express = require("express");
const helmet = require("helmet");

const app = express();

app.use(helmet()); // applies a sensible set of default security headers

app.listen(3000);
```

## What Helmet Sets by Default

| Header                              | Purpose                                                              |
| ----------------------------------- | -------------------------------------------------------------------- |
| `Content-Security-Policy`           | Restricts sources for scripts, styles, images, etc. (mitigates XSS)  |
| `X-DNS-Prefetch-Control`            | Controls browser DNS prefetching                                     |
| `Strict-Transport-Security` (HSTS)  | Forces HTTPS connections                                             |
| `X-Frame-Options`                   | Prevents clickjacking by restricting iframe embedding                |
| `X-Content-Type-Options`            | Prevents MIME-sniffing (`nosniff`)                                   |
| `X-Permitted-Cross-Domain-Policies` | Restricts Adobe Flash/PDF cross-domain policies                      |
| `Referrer-Policy`                   | Controls how much referrer info is sent                              |
| `X-Powered-By` removal              | Hides that the app is running Express (obscurity, not real security) |

## Individual Middleware (Fine-Grained Control)

You can enable/configure Helmet's sub-middleware individually instead of using all defaults:

```js
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "trusted-cdn.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  }),
);

app.use(helmet.frameguard({ action: "deny" })); // block ALL iframe embedding
app.use(
  helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }),
);
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({ policy: "no-referrer" }));
```

## Disabling Specific Protections

Sometimes a default breaks something (e.g., CSP blocking an inline script you need, or a Swagger UI that needs relaxed CSP):

```js
app.use(
  helmet({
    contentSecurityPolicy: false, // disable CSP entirely (use cautiously)
  }),
);
```

Or customize just one directive:

```js
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'"],
      },
    },
  }),
);
```

## Example: Full Security Setup

```js
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

app.use(helmet());
app.use(cors({ origin: "https://myfrontend.com", credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json({ limit: "10kb" })); // also limit payload size

app.disable("x-powered-by"); // helmet already does this, but explicit doesn't hurt

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.listen(3000);
```

## Why `X-Powered-By` Removal Matters

By default, Express sends `X-Powered-By: Express` on every response. This tells attackers exactly what framework you're using, making it easier to target known Express-specific vulnerabilities. Helmet removes this header automatically.

```js
app.disable("x-powered-by"); // manual equivalent, without Helmet
```

## Helmet and HTTPS

`Strict-Transport-Security` (HSTS) only makes sense over HTTPS — if your app is only ever accessed over plain HTTP (e.g., local dev), this header has no real effect but is harmless to leave enabled since it's typically fine in production behind HTTPS-terminating proxies.

## Common Interview-Style Questions

- **What does Helmet actually do under the hood?**
  It's a collection of smaller middleware functions, each setting a specific HTTP security header (CSP, HSTS, X-Frame-Options, etc.), bundled together with sensible defaults via `helmet()`.

- **Why remove the `X-Powered-By` header?**
  To avoid revealing that the app uses Express, which could help attackers target framework-specific vulnerabilities.

- **What does Content-Security-Policy protect against?**
  Primarily cross-site scripting (XSS) and data injection attacks, by restricting which sources scripts/styles/images/etc. can be loaded from.

- **Is Helmet a replacement for other security practices (input validation, auth, HTTPS)?**
  No — it's one layer of defense (secure HTTP headers). It doesn't replace proper input validation, authentication/authorization, rate limiting, or using HTTPS itself.
