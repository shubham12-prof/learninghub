# 02. CRUD Operations

## What is CRUD?

CRUD stands for **Create, Read, Update, Delete** — the four basic operations you can perform on persistent data. RESTful APIs map these directly onto HTTP methods and resource URLs.

| Operation        | HTTP Method | Example Endpoint    | Description                 |
| ---------------- | ----------- | ------------------- | --------------------------- |
| Create           | `POST`      | `POST /users`       | Create a new resource       |
| Read (all)       | `GET`       | `GET /users`        | List/retrieve a collection  |
| Read (one)       | `GET`       | `GET /users/:id`    | Retrieve a single resource  |
| Update (full)    | `PUT`       | `PUT /users/:id`    | Replace a resource entirely |
| Update (partial) | `PATCH`     | `PATCH /users/:id`  | Update part of a resource   |
| Delete           | `DELETE`    | `DELETE /users/:id` | Remove a resource           |

## Full CRUD Example with Express + In-Memory Store

```js
const express = require("express");
const app = express();
app.use(express.json());

let users = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
];
let nextId = 3;

// CREATE
app.post("/users", (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "name and email are required" });
  }
  const newUser = { id: nextId++, name, email };
  users.push(newUser);
  res.status(201).json(newUser);
});

// READ ALL
app.get("/users", (req, res) => {
  res.status(200).json(users);
});

// READ ONE
app.get("/users/:id", (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.status(200).json(user);
});

// UPDATE (full replace)
app.put("/users/:id", (req, res) => {
  const index = users.findIndex((u) => u.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "User not found" });

  const { name, email } = req.body;
  if (!name || !email) {
    return res
      .status(400)
      .json({ error: "name and email are required for full update" });
  }
  users[index] = { id: users[index].id, name, email };
  res.status(200).json(users[index]);
});

// UPDATE (partial)
app.patch("/users/:id", (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });

  Object.assign(user, req.body); // merge only provided fields
  res.status(200).json(user);
});

// DELETE
app.delete("/users/:id", (req, res) => {
  const index = users.findIndex((u) => u.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "User not found" });

  users.splice(index, 1);
  res.status(204).send(); // No Content
});

app.listen(3000, () => console.log("CRUD API running on port 3000"));
```

## PUT vs PATCH — Critical Distinction

|                | `PUT`                                 | `PATCH`                                                                  |
| -------------- | ------------------------------------- | ------------------------------------------------------------------------ |
| Semantics      | Replace the **entire** resource       | Update **only** the provided fields                                      |
| Missing fields | Should be reset/cleared (or rejected) | Left untouched                                                           |
| Idempotent?    | Yes                                   | Not strictly guaranteed, but typically treated as idempotent in practice |

```js
// PUT /users/5  Body: { "name": "Alice" }
// A strict implementation would either reject this (missing "email")
// or set email to null/undefined — it REPLACES the whole resource.

// PATCH /users/5  Body: { "name": "Alice" }
// Only updates "name"; "email" stays whatever it was.
```

## Idempotency in CRUD

An operation is **idempotent** if performing it multiple times has the same effect as performing it once.

| Method   | Idempotent?    | Why                                                                              |
| -------- | -------------- | -------------------------------------------------------------------------------- |
| `GET`    | Yes            | Reading doesn't change state                                                     |
| `PUT`    | Yes            | Replacing with the same data repeatedly yields the same end state                |
| `DELETE` | Yes            | Deleting an already-deleted resource still results in "resource is gone"         |
| `PATCH`  | Not guaranteed | Depends on implementation (e.g., "increment counter" patches aren't idempotent)  |
| `POST`   | No             | Each call typically creates a new resource (e.g., calling twice = two new users) |

## CRUD with a Real Database (MongoDB / Mongoose Example)

```js
const User = require("../models/userModel");

exports.createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Not found" });
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // return the updated document
      runValidators: true, // enforce schema validation on update
    });
    if (!user) return res.status(404).json({ error: "Not found" });
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "Not found" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
```

## Soft Delete vs Hard Delete

Instead of physically removing data (hard delete), many APIs mark records as deleted (soft delete) to preserve history/allow recovery.

```js
exports.softDeleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, {
      deletedAt: new Date(),
    });
    if (!user) return res.status(404).json({ error: "Not found" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// Reads must then filter out soft-deleted records:
exports.getUsers = async (req, res) => {
  const users = await User.find({ deletedAt: null });
  res.json(users);
};
```

## Common Interview-Style Questions

- **Map CRUD operations to HTTP methods.**
  Create → POST, Read → GET, Update → PUT/PATCH, Delete → DELETE.

- **What's the difference between PUT and PATCH?**
  PUT replaces the entire resource (missing fields are cleared/rejected); PATCH updates only the fields provided, leaving the rest untouched.

- **What does "idempotent" mean, and which CRUD-mapped methods are idempotent?**
  An idempotent operation produces the same result no matter how many times it's repeated. GET, PUT, and DELETE are idempotent; POST is not (each call typically creates a new resource).

- **What status code should DELETE return on success?**
  `204 No Content` is standard when there's no body to return; `200 OK` with a confirmation body is also acceptable.

- **What's the difference between a soft delete and a hard delete?**
  A soft delete marks a record as deleted (e.g., a `deletedAt` timestamp) without removing it from the database, preserving history and enabling recovery; a hard delete permanently removes the record.
