# 13. Validation

## Why Validate?

Never trust client input. Validation protects your app from:

- Malformed data causing crashes
- Invalid data corrupting your database
- Security issues (injection, oversized payloads, unexpected types)

Validation should happen **before** business logic runs — typically as middleware.

## Approach 1: Manual Validation

Simple but tedious and error-prone at scale:

```js
app.post("/users", (req, res, next) => {
  const { name, email, age } = req.body;

  if (!name || typeof name !== "string") {
    return res
      .status(400)
      .json({ error: "name is required and must be a string" });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "valid email is required" });
  }
  if (age !== undefined && (typeof age !== "number" || age < 0)) {
    return res.status(400).json({ error: "age must be a positive number" });
  }

  next(); // passes to the route handler
});
```

## Approach 2: `express-validator`

The most popular validation middleware library for Express, built on `validator.js`.

```bash
npm install express-validator
```

```js
const { body, param, query, validationResult } = require("express-validator");

app.post(
  "/users",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email")
      .isEmail()
      .withMessage("Must be a valid email")
      .normalizeEmail(),
    body("age")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Age must be a positive integer"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  (req, res) => {
    res.status(201).json({ message: "User created", data: req.body });
  },
);
```

### Reusable Validation Middleware

```js
const { validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = validate;
```

```js
router.post(
  "/users",
  [body("email").isEmail(), body("name").notEmpty()],
  validate,
  userController.createUser,
);
```

### Validating Route Params and Query Strings

```js
router.get(
  "/users/:id",
  param("id").isMongoId().withMessage("Invalid user ID"),
  validate,
  userController.getUserById,
);

router.get(
  "/products",
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  validate,
  productController.list,
);
```

## Approach 3: Schema Validation with `zod`

`zod` is a modern, TypeScript-friendly schema validation library that's become very popular as an alternative to `joi`/`express-validator`.

```bash
npm install zod
```

```js
const { z } = require("zod");

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  age: z.number().int().positive().optional(),
});

function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ errors: result.error.flatten().fieldErrors });
    }
    req.body = result.data; // parsed & coerced data
    next();
  };
}

app.post("/users", validateBody(createUserSchema), (req, res) => {
  res.status(201).json({ message: "Created", data: req.body });
});
```

## Approach 4: Schema Validation with `Joi`

```bash
npm install joi
```

```js
const Joi = require("joi");

const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(0).optional(),
});

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        errors: error.details.map((d) => d.message),
      });
    }
    req.body = value;
    next();
  };
}

app.post("/users", validate(userSchema), (req, res) => {
  res.status(201).json({ data: req.body });
});
```

## Sanitization vs Validation

- **Validation** checks that data _meets requirements_ (e.g., is a valid email).
- **Sanitization** _transforms_ data to a safe/clean format (e.g., trimming whitespace, escaping HTML, normalizing casing).

```js
body('email').trim().normalizeEmail(),
body('bio').trim().escape(), // escapes HTML special characters — helps prevent XSS
```

## Validating File Uploads

```js
const multer = require("multer");
const upload = multer({
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/png", "image/jpeg"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only PNG/JPEG images are allowed"));
    }
    cb(null, true);
  },
});

app.post("/upload", upload.single("avatar"), (req, res) => {
  res.json({ file: req.file });
});
```

(More detail in **14-File-Upload.md**.)

## Best Practices

1. Validate as **early as possible** — before touching the database.
2. Return **all** validation errors at once (`abortEarly: false` in Joi, or `errors.array()` in express-validator) rather than one at a time — better UX.
3. Keep validation schemas **separate from route/controller files** for reuse (e.g., `validators/userValidator.js`).
4. Never rely solely on client-side validation — always validate on the server.
5. Return **400 Bad Request** (not 500) for validation failures.

## Common Interview-Style Questions

- **Why validate on the server if the client already validates?**
  Client-side validation can be bypassed (disabled JS, direct API calls via curl/Postman, malicious actors) — server-side validation is the actual security/data-integrity boundary.

- **What's the difference between validation and sanitization?**
  Validation checks whether input meets rules (and rejects it if not); sanitization transforms/cleans input into a safe canonical form.

- **How would you structure reusable validation in an Express app?**
  As middleware — either manually or via a library (`express-validator`, `Joi`, `zod`) — placed in the route chain before the controller, with a shared "check for errors" middleware at the end of each schema chain.
