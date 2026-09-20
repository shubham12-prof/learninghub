# 12. Versioning

## Why Version a REST API?

APIs evolve. New fields get added, response shapes change, endpoints get restructured. Versioning lets you make breaking changes without immediately breaking every existing client — old clients keep using an older version while new clients adopt the latest.

A **breaking change** includes: removing/renaming a field, changing a field's type, changing required parameters, changing status codes for existing scenarios, or removing an endpoint entirely. Adding new optional fields or new endpoints is generally **not** breaking.

## Versioning Strategies

### 1. URI Path Versioning (Most Widely Used)

```
GET /api/v1/products
GET /api/v2/products
```

```js
app.use("/api/v1/products", productRoutesV1);
app.use("/api/v2/products", productRoutesV2);
```

**Pros:** explicit, cacheable, easy to test manually, highly discoverable.
**Cons:** technically implies the resource's URL/identity changes across versions, which some REST purists object to.

### 2. Header-Based Versioning

```
GET /api/products
X-API-Version: 2
```

```js
app.use("/api/products", (req, res, next) => {
  req.apiVersion = req.headers["x-api-version"] || "1";
  next();
});

app.get("/api/products", (req, res) => {
  if (req.apiVersion === "2") return res.json(formatV2(products));
  res.json(formatV1(products));
});
```

**Pros:** clean, stable URLs; version treated as metadata, not identity.
**Cons:** less visible/discoverable; harder to test directly from a browser URL bar.

### 3. Accept Header / Media Type Versioning

```
GET /api/products
Accept: application/vnd.myapi.v2+json
```

```js
app.get("/api/products", (req, res) => {
  const accept = req.headers.accept || "";
  if (accept.includes("vnd.myapi.v2")) {
    return res.json(formatV2(products));
  }
  res.json(formatV1(products));
});
```

**Pros:** most aligned with "pure" REST content-negotiation principles.
**Cons:** most complex for API consumers to use correctly; poor tooling ergonomics.

### 4. Query Parameter Versioning

```
GET /api/products?version=2
```

**Pros:** simple to add.
**Cons:** query params conventionally represent filtering, not core routing/behavior — easy for clients to omit accidentally, considered less clean by most API design guides.

## Recommended Real-World Approach

Most public APIs (Stripe, GitHub, Twilio) use **URI path versioning** for its simplicity, or (like Stripe) a **date-based version header** combined with account-level pinned defaults. For most teams building an internal or moderately-sized public API, URI path versioning at the **major version** level (`/v1`, `/v2`) is the pragmatic default.

## Structuring an Express App for Multiple Versions

```
src/
├── routes/
│   ├── v1/
│   │   ├── productRoutes.js
│   │   └── index.js
│   └── v2/
│       ├── productRoutes.js
│       └── index.js
├── controllers/
│   ├── v1/productController.js
│   └── v2/productController.js
└── app.js
```

`app.js`:

```js
const v1Routes = require("./routes/v1");
const v2Routes = require("./routes/v2");

app.use("/api/v1", v1Routes);
app.use("/api/v2", v2Routes);
```

## Sharing Core Logic Across Versions

Avoid duplicating business logic — keep the underlying model/service layer version-agnostic and only diverge at the response-formatting boundary.

```js
// services/productService.js — shared across all versions
exports.getAllProducts = () => Product.find();

// controllers/v1/productController.js
exports.list = async (req, res) => {
  const products = await productService.getAllProducts();
  res.json(products.map((p) => ({ id: p.id, name: p.name, price: p.price }))); // v1 shape
};

// controllers/v2/productController.js
exports.list = async (req, res) => {
  const products = await productService.getAllProducts();
  res.json(products.map((p) => ({ id: p.id, title: p.name, cost: p.price }))); // v2 renamed fields
};
```

## Deprecating an Old Version

Communicate deprecation via headers and documentation, giving clients a migration window.

```js
app.use(
  "/api/v1",
  (req, res, next) => {
    res.set("Deprecation", "true");
    res.set("Sunset", "Wed, 31 Dec 2026 23:59:59 GMT"); // RFC 8594
    res.set(
      "Link",
      '<https://api.example.com/api/v2>; rel="successor-version"',
    );
    next();
  },
  v1Routes,
);
```

## Version Numbering Convention

Most REST APIs only expose the **major** version in the URL/header, since minor/patch-level changes should be backward compatible by definition and shouldn't require a version bump.

```
MAJOR.MINOR.PATCH  (SemVer, conceptually)
   1  .  4   .  2     -> exposed to clients simply as "v1"
```

- **MAJOR** — breaking change → new version exposed to clients (`/v1` → `/v2`)
- **MINOR** — new backward-compatible feature → no version bump needed
- **PATCH** — backward-compatible bug fix → no version bump needed

## What Counts as a Breaking Change? (Checklist)

| Change                                                   | Breaking?  |
| -------------------------------------------------------- | ---------- |
| Adding a new optional field to a response                | No         |
| Adding a new endpoint                                    | No         |
| Removing a field from a response                         | Yes        |
| Renaming a field                                         | Yes        |
| Changing a field's data type                             | Yes        |
| Making an optional request field required                | Yes        |
| Changing a success status code (e.g., 200 → 201)         | Yes        |
| Adding a new required request header                     | Yes        |
| Loosening a validation rule (e.g., allow longer strings) | Usually no |

## Common Interview-Style Questions

- **What's the most common REST API versioning strategy in the industry?**
  URI path versioning (`/api/v1/...`), due to its simplicity, visibility, and ease of routing.

- **What qualifies as a "breaking change" that justifies a new API version?**
  Removing/renaming response fields, changing data types, adding new required inputs, or altering existing status code behavior — anything that could break an existing client's assumptions.

- **How do you avoid duplicating business logic across API versions?**
  Keep the core model/service layer version-agnostic and shared; only the thin controller/response-formatting layer differs between versions.

- **How should you communicate that an API version will be retired?**
  Through documentation plus standard headers like `Deprecation` and `Sunset` (RFC 8594), giving consumers advance notice and a migration path before removal.
