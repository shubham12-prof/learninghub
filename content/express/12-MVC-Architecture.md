# 12. MVC Architecture

## What is MVC?

MVC (**Model–View–Controller**) is an architectural pattern that separates an application into three interconnected layers:

| Layer          | Responsibility                                                                    |
| -------------- | --------------------------------------------------------------------------------- |
| **Model**      | Data and business logic — database schemas, queries, validation rules             |
| **View**       | Presentation layer — what the user sees (HTML/templates, or JSON for APIs)        |
| **Controller** | Glue layer — receives requests, calls models, decides which view/response to send |

For REST APIs, "View" is often just the JSON response shape rather than a rendered template.

## Why Use MVC in Express?

Without structure, everything ends up crammed into `app.js`:

```js
// BAD: everything in one file
app.get("/users/:id", async (req, res) => {
  const user = await db.query("SELECT * FROM users WHERE id = ?", [
    req.params.id,
  ]);
  if (!user) return res.status(404).json({ error: "not found" });
  res.json(user);
});
```

This doesn't scale. MVC separates concerns so each piece is testable, reusable, and easy to find.

## Typical Folder Structure

```
src/
├── app.js
├── server.js
├── config/
│   └── db.js
├── models/
│   └── userModel.js
├── controllers/
│   └── userController.js
├── routes/
│   └── userRoutes.js
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
└── views/               (only needed for server-rendered apps)
    └── users/
        └── profile.ejs
```

## Model Layer

`models/userModel.js` (using a simple query builder / ORM-style example):

```js
const db = require("../config/db");

class UserModel {
  static async findAll() {
    return db.query("SELECT id, name, email FROM users");
  }

  static async findById(id) {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0] || null;
  }

  static async create({ name, email }) {
    const [result] = await db.query(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [name, email],
    );
    return { id: result.insertId, name, email };
  }
}

module.exports = UserModel;
```

With Mongoose (MongoDB), the model would instead be a schema:

```js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
```

## Controller Layer

`controllers/userController.js`:

```js
const UserModel = require("../models/userModel");

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await UserModel.findAll();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const newUser = await UserModel.create(req.body);
    res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
};
```

Controllers contain **no direct database queries** and **no route definitions** — just orchestration logic: call the model, handle errors, shape the response.

## Route Layer

`routes/userRoutes.js`:

```js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authenticate = require("../middleware/auth");

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.post("/", authenticate, userController.createUser);

module.exports = router;
```

## Wiring It Together

`app.js`:

```js
const express = require("express");
const userRoutes = require("./routes/userRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
app.use(express.json());

app.use("/api/users", userRoutes);

app.use(errorHandler); // last

module.exports = app;
```

`server.js`:

```js
const app = require("./app");
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
```

## View Layer (Server-Rendered Example)

If rendering HTML instead of JSON, the controller calls `res.render()`:

```js
exports.showProfile = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);
    res.render("users/profile", { user }); // renders views/users/profile.ejs
  } catch (err) {
    next(err);
  }
};
```

## Adding a Service Layer (MVC+S, Common in Larger Apps)

For complex business logic, many teams add a **service layer** between controllers and models, so controllers stay thin and logic is reusable/testable independent of HTTP.

```
controllers/  -> parses req, calls service, shapes res
services/     -> business logic, orchestrates multiple models
models/       -> raw data access
```

`services/userService.js`:

```js
const UserModel = require("../models/userModel");

exports.registerUser = async ({ name, email, password }) => {
  const existing = await UserModel.findByEmail(email);
  if (existing) throw new Error("Email already in use");

  const hashedPassword = await hash(password);
  return UserModel.create({ name, email, password: hashedPassword });
};
```

`controllers/userController.js`:

```js
const userService = require("../services/userService");

exports.register = async (req, res, next) => {
  try {
    const user = await userService.registerUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};
```

## Benefits of MVC in Express

- **Separation of concerns** — easier to reason about and test each layer independently.
- **Reusability** — models/services can be reused across multiple controllers.
- **Team collaboration** — different developers can work on routes, controllers, and models without stepping on each other.
- **Testability** — controllers and services can be unit tested by mocking models.

## Common Interview-Style Questions

- **What are the three layers of MVC, and what does each do?**
  Model (data/business logic), View (presentation), Controller (mediates between request and model/view).

- **In a JSON REST API, what plays the role of "View"?**
  The JSON response shape/serialization — there's no template rendering, but it's still a distinct presentation concern.

- **Why keep database queries out of controllers?**
  So controllers stay focused on HTTP concerns (parsing requests, shaping responses) and data-access logic stays reusable/testable in the model layer.

- **What's the benefit of adding a service layer?**
  It isolates business logic from both HTTP handling (controllers) and raw data access (models), making complex logic reusable and independently testable.
