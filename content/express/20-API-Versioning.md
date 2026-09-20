# 20. API Versioning

## Why Version an API?

As an API evolves, breaking changes (renamed fields, changed response shapes, removed endpoints) can break existing clients. Versioning lets you introduce breaking changes while still supporting older clients during a transition period.

## Common Versioning Strategies

### 1. URI Path Versioning (Most Common)

```js
app.use("/api/v1/users", usersV1Router);
app.use("/api/v2/users", usersV2Router);
```

Example URLs:

```
GET /api/v1/users/42
GET /api/v2/users/42
```

**Pros:** simple, explicit, easy to test/cache/document, visible in logs.
**Cons:** URL changes between versions; some consider it not fully RESTful (a resource's identity shouldn't depend on version).

### 2. Header-Based Versioning

Client specifies the version via a custom header.

```js
app.use("/api/users", (req, res, next) => {
  const version = req.headers["x-api-version"] || "v1";
  req.apiVersion = version;
  next();
});

app.get("/api/users/:id", (req, res) => {
  if (req.apiVersion === "v2") {
    return res.json({ id: req.params.id, fullName: "Alice Doe" }); // v2 shape
  }
  res.json({ id: req.params.id, name: "Alice Doe" }); // v1 shape
});
```

Client request:

```
GET /api/users/42
X-API-Version: v2
```

**Pros:** clean URLs, version is metadata not identity.
**Cons:** less visible/discoverable, harder to test manually via browser URL bar.

### 3. Accept Header / Content Negotiation Versioning

```
GET /api/users/42
Accept: application/vnd.myapp.v2+json
```

```js
app.get("/api/users/:id", (req, res) => {
  const accept = req.headers.accept || "";
  if (accept.includes("vnd.myapp.v2")) {
    return res.json({ id: req.params.id, fullName: "Alice Doe" });
  }
  res.json({ id: req.params.id, name: "Alice Doe" });
});
```

**Pros:** most "RESTfully pure" approach — the resource URL stays the same.
**Cons:** more complex for clients, harder to explore/debug manually.

### 4. Query Parameter Versioning

```
GET /api/users/42?version=2
```

```js
app.get("/api/users/:id", (req, res) => {
  const version = req.query.version || "1";
  // ...branch on version
});
```

**Pros:** simple.
**Cons:** query params are typically meant for filtering, not identity/behavior — considered less clean; easy to forget/omit accidentally.

## Recommended Approach: URI Path Versioning with Modular Routers

Most real-world REST APIs (Stripe, GitHub, Twitter/X) use **URI path versioning** because of its simplicity and discoverability.

```
src/
├── routes/
│   ├── v1/
│   │   ├── userRoutes.js
│   │   └── index.js
│   └── v2/
│       ├── userRoutes.js
│       └── index.js
└── app.js
```

`routes/v1/index.js`:

```js
const express = require("express");
const router = express.Router();
const userRoutes = require("./userRoutes");

router.use("/users", userRoutes);

module.exports = router;
```

`routes/v2/index.js`:

```js
const express = require("express");
const router = express.Router();
const userRoutes = require("./userRoutes");

router.use("/users", userRoutes);

module.exports = router;
```

`app.js`:

```js
const express = require("express");
const v1Routes = require("./routes/v1");
const v2Routes = require("./routes/v2");

const app = express();
app.use(express.json());

app.use("/api/v1", v1Routes);
app.use("/api/v2", v2Routes);

app.listen(3000);
```

## Sharing Logic Between Versions

Avoid duplicating business logic across versions — keep controllers/services shared, and only diverge at the **response-shaping** layer where needed.

```js
// controllers/userController.js (shared across versions)
const UserModel = require("../models/userModel");

exports.getUser = async (req, res) => {
  const user = await UserModel.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "Not found" });

  if (req.apiVersion === "v2") {
    return res.json({ id: user.id, fullName: user.name }); // v2 response shape
  }
  res.json({ id: user.id, name: user.name }); // v1 response shape
};
```

## Deprecation Strategy

When retiring an old version, communicate clearly and give clients time to migrate:

```js
app.use(
  "/api/v1",
  (req, res, next) => {
    res.set("Deprecation", "true");
    res.set("Sunset", "Wed, 31 Dec 2026 23:59:59 GMT"); // RFC 8594 header
    res.set("Link", '</api/v2>; rel="successor-version"');
    next();
  },
  v1Routes,
);
```

## Semantic Versioning Reference (for context, not URL versioning itself)

APIs commonly follow **SemVer** style thinking even if the URL only shows the major version:

```
MAJOR.MINOR.PATCH
  1  .  4  .  2
```

- **MAJOR** — breaking changes (bump the URL version, e.g. `/v1` → `/v2`)
- **MINOR** — backward-compatible new features (no URL bump needed)
- **PATCH** — backward-compatible bug fixes (no URL bump needed)

## Common Interview-Style Questions

- **What's the most common API versioning strategy in practice?**
  URI path versioning (`/api/v1/...`, `/api/v2/...`) — simple, explicit, and easy to route/document.

- **What's a downside of URI path versioning from a strict REST perspective?**
  It implies the resource's identity/URL changes with version, whereas REST purists argue a resource should have one stable URI regardless of representation format/version.

- **How do you avoid duplicating business logic across API versions?**
  Keep shared logic (models, services, core controllers) version-agnostic, and only branch on version at the thin response-formatting layer.

- **How would you communicate that an API version is being deprecated?**
  Via documentation plus response headers like `Deprecation` and `Sunset` (RFC 8594), giving clients a migration timeline before removing the old version.
