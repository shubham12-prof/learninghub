# 10. Validation

## Why Validation is Central to REST API Design

A REST API is a contract — clients send data expecting the server to enforce that contract. Validation is the layer that:

- Protects data integrity (bad data never reaches the database)
- Produces clear, actionable error messages for API consumers
- Prevents security issues (injection, oversized payloads, type confusion)
- Forms part of your API's documented behavior (what's required vs optional, formats, constraints)

## Where Validation Fits in the Request Lifecycle

```
Request -> [Body/Query/Param Validation] -> [Authentication] -> [Authorization] -> [Business Logic] -> Response
```

Validation should reject bad input **before** any database or business logic runs.

## Validating the Request Body with `express-validator`

```bash
npm install express-validator
```

```js
const { body, validationResult } = require("express-validator");

const createProductRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("name is required")
    .isLength({ max: 100 })
    .withMessage("name must be under 100 characters"),
  body("price")
    .isFloat({ gt: 0 })
    .withMessage("price must be a positive number"),
  body("category")
    .isIn(["shoes", "apparel", "accessories"])
    .withMessage("invalid category"),
  body("inStock")
    .optional()
    .isBoolean()
    .withMessage("inStock must be true/false"),
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

app.post("/products", createProductRules, validate, (req, res) => {
  const product = createProduct(req.body);
  res.status(201).json(product);
});
```

## Validating Route Params and Query Strings

```js
const { param, query } = require("express-validator");

app.get(
  "/products/:id",
  param("id").isMongoId().withMessage("Invalid product ID"),
  validate,
  getProductById,
);

app.get(
  "/products",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("sort").optional().isIn(["price", "-price", "rating", "-rating"]),
  ],
  validate,
  listProducts,
);
```

## Schema-Based Validation with `zod` (Modern Approach)

```bash
npm install zod
```

```js
const { z } = require("zod");

const createProductSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  category: z.enum(["shoes", "apparel", "accessories"]),
  inStock: z.boolean().optional().default(true),
});

function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ errors: result.error.flatten().fieldErrors });
    }
    req.body = result.data; // validated + coerced/defaulted
    next();
  };
}

app.post("/products", validateBody(createProductSchema), (req, res) => {
  res.status(201).json(createProduct(req.body));
});
```

### Validating Partial Updates (PATCH) with Zod

```js
const updateProductSchema = createProductSchema.partial(); // all fields become optional

app.patch(
  "/products/:id",
  validateBody(updateProductSchema),
  updateProductHandler,
);
```

## Consistent Error Response Format

A well-designed REST API returns validation errors in a predictable, structured shape — not just a plain string.

```json
{
  "success": false,
  "errors": [
    { "field": "email", "message": "Must be a valid email address" },
    { "field": "price", "message": "Must be greater than 0" }
  ]
}
```

```js
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}
```

## Validating Nested Objects and Arrays

```js
const orderSchema = z.object({
  customerId: z.string().uuid(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, "Order must contain at least one item"),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    zip: z.string().regex(/^\d{5}$/, "ZIP must be 5 digits"),
  }),
});
```

## Content-Type and Payload Size Validation

```js
app.use(express.json({ limit: "10kb" })); // reject oversized bodies early

app.post("/products", (req, res, next) => {
  if (!req.is("application/json")) {
    return res
      .status(415)
      .json({ error: "Content-Type must be application/json" });
  }
  next();
});
```

## Business-Rule Validation vs Schema Validation

Schema validation checks structure/type (`price is a number > 0`). Business-rule validation checks domain logic that often needs a database lookup (`email must be unique`, `stock must be available before allowing an order`).

```js
app.post("/users", validateBody(createUserSchema), async (req, res, next) => {
  const existing = await User.findOne({ email: req.body.email });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" }); // business rule, not schema
  }
  const user = await User.create(req.body);
  res.status(201).json(user);
});
```

## Best Practices for REST API Validation

1. Validate **every** input source: body, params, query, headers, and files.
2. Return **400** for structural/schema failures, **409** for business-rule conflicts, **422** if you distinguish semantic errors from malformed syntax.
3. Return **all** validation errors at once, not just the first one found — better developer experience for API consumers.
4. Keep validation schemas as the **source of truth** for your API documentation (many tools like `zod-to-openapi` can generate OpenAPI specs directly from schemas).
5. Sanitize alongside validating (trim strings, normalize emails, escape HTML) to avoid storing messy or unsafe data.

## Common Interview-Style Questions

- **Why validate on the server even if the client (frontend) already validates?**
  Because client-side validation can always be bypassed (direct API calls via curl/Postman, malicious clients) — server-side validation is the actual data-integrity and security boundary.

- **What's the difference between schema validation and business-rule validation?**
  Schema validation checks structural correctness (types, formats, required fields) without needing external data; business-rule validation enforces domain logic that often requires a database lookup (uniqueness, referential integrity, stock availability).

- **What status code should be used for a validation failure vs a business-rule conflict?**
  Structural validation failures typically return `400 Bad Request` (or `422 Unprocessable Entity`); business-rule conflicts (like a duplicate unique field) typically return `409 Conflict`.

- **Why return all validation errors at once instead of stopping at the first one?**
  It gives API consumers a complete picture of what needs fixing in a single round trip, rather than forcing repeated fix-and-resubmit cycles.
