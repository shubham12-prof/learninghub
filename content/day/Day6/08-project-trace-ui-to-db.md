# 08 - Project: Trace a Feature From the UI to the API to the Database

> **Time to learn:** ~120 min | **Level:** Project | **Bonus of the day**
> Feature: **"Save a course"** (log in, save/unsave, see it persist). Everything here was built and run: **19 tests pass** with Express 5.3, `jsonwebtoken` 9.0.3 and Node 22's built-in `node:sqlite`; the UI was driven in headless Chromium and the database row was checked afterwards.
> Why this project: the interview question is _"walk me through what happens when the user clicks Save"_. You will answer it with evidence, not from memory.

## 1. What you will do

| Part           | Goal                                                                  | Time    |
| -------------- | --------------------------------------------------------------------- | ------- |
| **A. Build**   | create the small full-stack app (files below) and get the tests green | 40 min  |
| **B. Trace**   | follow **one click** through every layer and write down what you saw  | 30 min  |
| **C. Debug**   | apply 6 bugs one at a time, watch a test fail, read it and fix it     | 35 min  |
| **D. Stretch** | extend the feature                                                    | 15+ min |

## 2. Part A: set up

```bash
mkdir learninghub-api && cd learninghub-api
npm init -y
npm pkg set type=module
npm i express jsonwebtoken          # Node 22 or newer (node:sqlite is built in)
mkdir -p src test public
```

Create these files (in this order). Run the API with a secret:

```bash
JWT_SECRET=$(openssl rand -hex 32) node --no-warnings src/server.js      # http://localhost:3000
node --no-warnings --test test/api.test.js                                # the tests
```

> `node:sqlite` prints an experimental warning on Node 22; `--no-warnings` hides it. The server refuses to start without `JWT_SECRET`.

### `src/db.js`: schema, constraints, seed data

```js
import { DatabaseSync } from "node:sqlite";

// One connection for the whole process. ":memory:" = a fresh database per start (great for tests).
export function openDb(file = ":memory:") {
  const db = new DatabaseSync(file);
  db.exec("PRAGMA foreign_keys = ON"); // SQLite ignores foreign keys unless you turn this on
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      role          TEXT    NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS courses (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      slug  TEXT    NOT NULL UNIQUE,
      title TEXT    NOT NULL,
      level TEXT    NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
      hours INTEGER NOT NULL CHECK (hours > 0),
      free  INTEGER NOT NULL DEFAULT 0                  -- SQLite has no boolean: 0 or 1
    );

    CREATE TABLE IF NOT EXISTS saved_courses (
      user_id    INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
      course_id  INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, course_id)                  -- the pair is unique: you can't save a course twice
    );

    CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
  `);
  return db;
}

const SEED = [
  ["html-foundations", "HTML Foundations", "Beginner", 4, 1],
  ["css-layout", "CSS Layout with Flexbox and Grid", "Beginner", 6, 1],
  ["javascript-essentials", "JavaScript Essentials", "Beginner", 10, 1],
  ["async-javascript", "Async JavaScript", "Intermediate", 8, 0],
  ["react-fundamentals", "React Fundamentals", "Beginner", 9, 1],
  ["react-performance", "React Performance", "Intermediate", 7, 0],
  ["accessible-ui-design", "Accessible UI Design", "Intermediate", 5, 1],
  ["typescript-for-react", "TypeScript for React", "Intermediate", 8, 0],
  ["node-and-express", "Node.js and Express", "Intermediate", 12, 0],
  [
    "testing-react-components",
    "Testing React Components",
    "Intermediate",
    6,
    1,
  ],
  ["git-and-github", "Git and GitHub Basics", "Beginner", 3, 1],
  ["rest-api-design", "REST API Design", "Advanced", 8, 0],
];

export function seed(db) {
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM courses").get();
  if (n > 0) return;
  const insert = db.prepare(
    "INSERT INTO courses (slug, title, level, hours, free) VALUES (?, ?, ?, ?, ?)",
  );
  for (const row of SEED) insert.run(...row);
}
```

### `src/errors.js`: one error type, one handler

```js
// One error type for "expected" failures. Anything else is a bug and becomes a 500.
export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details) =>
  new HttpError(400, "BAD_REQUEST", message, details);
export const unauthorized = (message = "Authentication required") =>
  new HttpError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "You do not have permission") =>
  new HttpError(403, "FORBIDDEN", message);
export const notFound = (message = "Not found") =>
  new HttpError(404, "NOT_FOUND", message);
export const conflict = (message) => new HttpError(409, "CONFLICT", message);
export const unprocessable = (message, details) =>
  new HttpError(422, "VALIDATION_FAILED", message, details);

// Express error middleware: four arguments, registered LAST.
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof HttpError) {
    return res
      .status(err.status)
      .json({
        error: { code: err.code, message: err.message, details: err.details },
      });
  }
  if (err instanceof SyntaxError && "body" in err) {
    // express.json() could not parse the body
    return res
      .status(400)
      .json({
        error: {
          code: "INVALID_JSON",
          message: "Request body is not valid JSON",
        },
      });
  }

  if (err.type === "entity.too.large") {
    // body bigger than express.json({ limit })
    return res
      .status(413)
      .json({
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message: "Request body is too large",
        },
      });
  }

  console.error(`[${req.id}] unexpected error:`, err); // full details stay in the server log
  res
    .status(500)
    .json({
      error: {
        code: "INTERNAL",
        message: "Something went wrong",
        requestId: req.id,
      },
    });
}
```

### `src/auth.js`: password hashing, JWT, role check

```js
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import { forbidden, unauthorized } from "./errors.js";

// ---- passwords: never store them, store a salted, slow hash ----
export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(":");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(
    password,
    Buffer.from(saltHex, "hex"),
    expected.length,
  );
  return timingSafeEqual(actual, expected); // constant-time comparison
}

// ---- tokens ----
export function makeAuth({ secret, expiresIn = "15m" }) {
  if (!secret) throw new Error("JWT secret is required");

  function signToken(user) {
    // `sub` (subject) = who the token is about. Keep the payload small: it is readable by anyone.
    return jwt.sign({ role: user.role }, secret, {
      subject: String(user.id),
      expiresIn,
      algorithm: "HS256",
    });
  }

  // Middleware: expects "Authorization: Bearer <token>"
  function requireAuth(req, res, next) {
    const header = req.get("authorization") ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token)
      throw unauthorized("Missing bearer token");
    try {
      const payload = jwt.verify(token, secret, { algorithms: ["HS256"] }); // checks signature AND expiry
      req.user = { id: Number(payload.sub), role: payload.role };
      next();
    } catch (err) {
      const message =
        err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
      throw unauthorized(message);
    }
  }

  // Authorization (what you may do) comes AFTER authentication (who you are)
  const requireRole = (role) => (req, res, next) => {
    if (req.user?.role !== role) throw forbidden(`Requires role: ${role}`);
    next();
  };

  return { signToken, requireAuth, requireRole };
}
```

### `src/app.js`: middleware and routes

```js
import { randomUUID } from "node:crypto";
import express from "express";
import { hashPassword, makeAuth, verifyPassword } from "./auth.js";
import { openDb, seed } from "./db.js";
import {
  conflict,
  errorHandler,
  notFound,
  unauthorized,
  unprocessable,
} from "./errors.js";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

export function createApp({
  db = openDb(),
  secret = process.env.JWT_SECRET,
  tokenTtl = "15m",
  log = true,
} = {}) {
  seed(db);
  const { signToken, requireAuth, requireRole } = makeAuth({
    secret,
    expiresIn: tokenTtl,
  });
  const app = express();

  // 1. request id + access log (so one request can be followed through every layer)
  app.use((req, res, next) => {
    req.id = req.get("x-request-id") ?? randomUUID().slice(0, 8);
    res.set("X-Request-Id", req.id);
    const start = Date.now();
    res.on("finish", () => {
      if (log)
        console.log(
          `[${req.id}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start} ms)`,
        );
    });
    next();
  });
  app.use(express.json({ limit: "10kb" }));
  app.use(express.static(new URL("../public", import.meta.url).pathname));

  // ---------- auth ----------
  app.post("/api/auth/register", (req, res) => {
    const { email, password } = req.body ?? {};
    const problems = {};
    if (typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      problems.email = "Must be a valid email";
    if (typeof password !== "string" || password.length < 8)
      problems.password = "Must be at least 8 characters";
    if (Object.keys(problems).length)
      throw unprocessable("Invalid input", problems);

    const exists = db
      .prepare("SELECT 1 FROM users WHERE email = ?")
      .get(email.toLowerCase());
    if (exists) throw conflict("Email already registered");

    const info = db
      .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
      .run(email.toLowerCase(), hashPassword(password));
    res
      .status(201)
      .json({
        user: {
          id: Number(info.lastInsertRowid),
          email: email.toLowerCase(),
          role: "student",
        },
      });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body ?? {};
    const row =
      typeof email === "string"
        ? db
            .prepare("SELECT * FROM users WHERE email = ?")
            .get(email.toLowerCase())
        : undefined;
    // Same message for "no such user" and "wrong password": do not reveal which emails exist
    if (
      !row ||
      typeof password !== "string" ||
      !verifyPassword(password, row.password_hash)
    ) {
      throw unauthorized("Invalid email or password");
    }
    const user = { id: row.id, email: row.email, role: row.role };
    res.json({ token: signToken(user), user });
  });

  // ---------- courses (public) ----------
  app.get("/api/courses", (req, res) => {
    const { level, q } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page ?? "1", 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit ?? "5", 10) || 5),
    );

    if (level !== undefined && !LEVELS.includes(level)) {
      throw unprocessable("Invalid level", {
        level: `Must be one of: ${LEVELS.join(", ")}`,
      });
    }

    // Build the WHERE clause from fixed fragments; VALUES always go through ? placeholders (never string concatenation).
    const where = [];
    const params = [];
    if (level) {
      where.push("level = ?");
      params.push(level);
    }
    if (typeof q === "string" && q.trim()) {
      where.push("title LIKE ?");
      params.push(`%${q.trim()}%`);
    }
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const { total } = db
      .prepare(`SELECT COUNT(*) AS total FROM courses ${clause}`)
      .get(...params);
    const data = db
      .prepare(
        `SELECT id, slug, title, level, hours, free FROM courses ${clause} ORDER BY id LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, (page - 1) * limit)
      .map((c) => ({ ...c, free: Boolean(c.free) }));
    res.json({ data, page, limit, total });
  });

  app.get("/api/courses/:id", (req, res) => {
    const course = db
      .prepare(
        "SELECT id, slug, title, level, hours, free FROM courses WHERE id = ?",
      )
      .get(Number(req.params.id));
    if (!course) throw notFound("Course not found");
    res.json({ ...course, free: Boolean(course.free) });
  });

  // ---------- courses (admin only) ----------
  app.post("/api/courses", requireAuth, requireRole("admin"), (req, res) => {
    const { slug, title, level, hours, free = false } = req.body ?? {};
    const problems = {};
    if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug))
      problems.slug = "lowercase letters, numbers and dashes";
    if (typeof title !== "string" || !title.trim()) problems.title = "Required";
    if (!LEVELS.includes(level))
      problems.level = `One of: ${LEVELS.join(", ")}`;
    if (!Number.isInteger(hours) || hours <= 0)
      problems.hours = "A positive integer";
    if (Object.keys(problems).length)
      throw unprocessable("Invalid course", problems);

    if (db.prepare("SELECT 1 FROM courses WHERE slug = ?").get(slug))
      throw conflict("Slug already exists");
    const info = db
      .prepare(
        "INSERT INTO courses (slug, title, level, hours, free) VALUES (?, ?, ?, ?, ?)",
      )
      .run(slug, title.trim(), level, hours, free ? 1 : 0);
    const id = Number(info.lastInsertRowid);
    res
      .status(201)
      .location(`/api/courses/${id}`)
      .json({
        id,
        slug,
        title: title.trim(),
        level,
        hours,
        free: Boolean(free),
      });
  });

  // ---------- saved courses (needs login) ----------
  app.get("/api/me/saved", requireAuth, (req, res) => {
    const rows = db
      .prepare(
        `SELECT c.id, c.slug, c.title, c.level, c.hours, c.free, s.created_at AS savedAt
           FROM saved_courses s JOIN courses c ON c.id = s.course_id
          WHERE s.user_id = ? ORDER BY s.created_at, c.id`,
      )
      .all(req.user.id);
    res.json({ data: rows.map((c) => ({ ...c, free: Boolean(c.free) })) });
  });

  // PUT is idempotent: saving twice leaves exactly one row and gives the same result
  app.put("/api/me/saved/:courseId", requireAuth, (req, res) => {
    const courseId = Number(req.params.courseId);
    if (!db.prepare("SELECT 1 FROM courses WHERE id = ?").get(courseId))
      throw notFound("Course not found");
    db.prepare(
      "INSERT OR IGNORE INTO saved_courses (user_id, course_id) VALUES (?, ?)",
    ).run(req.user.id, courseId);
    res.json({ saved: true, courseId });
  });

  app.delete("/api/me/saved/:courseId", requireAuth, (req, res) => {
    db.prepare(
      "DELETE FROM saved_courses WHERE user_id = ? AND course_id = ?",
    ).run(req.user.id, Number(req.params.courseId));
    res.status(204).end();
  });

  // ---------- fallbacks ----------
  app.use("/api", (req, res) => {
    throw notFound(`No route for ${req.method} ${req.originalUrl}`);
  });
  app.use(errorHandler);

  app.db = db;
  return app;
}
```

### `src/server.js`

```js
import { createApp } from "./app.js";
import { openDb } from "./db.js";

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error(
    "Set JWT_SECRET first, e.g.  JWT_SECRET=$(openssl rand -hex 32) node src/server.js",
  );
  process.exit(1);
}

const app = createApp({
  db: openDb(process.env.DB_FILE ?? "learninghub.db"),
  secret,
});
const port = Number(process.env.PORT ?? 3000);
app.listen(port, () =>
  console.log(`LearningHub API on http://localhost:${port}`),
);
```

### `public/index.html`: the UI (plain JavaScript, no build step)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>LearningHub</title>
    <style>
      body {
        font-family: system-ui, sans-serif;
        max-width: 48rem;
        margin: 1rem auto;
        padding: 0 1rem;
        line-height: 1.5;
      }
      li {
        margin: 0.25rem 0;
      }
      button {
        min-height: 2.25rem;
      }
      #trace {
        font:
          0.8rem ui-monospace,
          monospace;
        background: #f3f4f6;
        padding: 0.5rem;
        white-space: pre-wrap;
      }
    </style>
  </head>
  <body>
    <h1>LearningHub</h1>

    <form id="auth">
      <label
        >Email
        <input name="email" type="email" required autocomplete="username"
      /></label>
      <label
        >Password
        <input
          name="password"
          type="password"
          required
          minlength="8"
          autocomplete="current-password"
      /></label>
      <button type="submit" value="login">Log in</button>
      <button type="submit" value="register">Register</button>
    </form>
    <p id="message" role="status"></p>
    <p id="who"></p>

    <h2>Courses</h2>
    <ul id="courses"></ul>
    <p><button id="more" type="button" hidden>Load more</button></p>

    <h2>Request trace</h2>
    <pre id="trace"></pre>

    <script type="module">
      const $ = (id) => document.getElementById(id);
      const state = {
        token: sessionStorage.getItem("token"),
        user: null,
        saved: new Set(),
        page: 1,
      };

      class ApiError extends Error {
        constructor(status, payload) {
          super(payload?.error?.message ?? `HTTP ${status}`);
          this.status = status;
          this.code = payload?.error?.code;
        }
      }

      // ONE place that talks to the server: adds the token, parses JSON, throws on non-2xx, records a trace line
      async function api(path, { method = "GET", body } = {}) {
        const res = await fetch(path, {
          method,
          headers: {
            ...(body ? { "Content-Type": "application/json" } : {}),
            ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
        });
        $("trace").textContent +=
          `${method} ${path} -> ${res.status} [request ${res.headers.get("X-Request-Id")}]\n`;
        const payload = res.status === 204 ? null : await res.json();
        if (!res.ok) throw new ApiError(res.status, payload);
        return payload;
      }

      const say = (text) => {
        $("message").textContent = text;
      };

      function renderCourse(c) {
        const li = document.createElement("li");
        const saved = state.saved.has(c.id);
        li.innerHTML = `<span></span> (${c.level}, ${c.hours} h) `;
        li.firstChild.textContent = c.title;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = saved ? "Saved" : "Save";
        btn.setAttribute("aria-pressed", String(saved));
        btn.setAttribute("aria-label", `Save ${c.title}`);
        btn.dataset.courseId = c.id;
        btn.addEventListener("click", () => toggleSave(c.id));
        li.append(btn);
        return li;
      }

      async function loadCourses(reset = true) {
        if (reset) {
          state.page = 1;
          $("courses").replaceChildren();
        }
        const { data, total, limit } = await api(
          `/api/courses?page=${state.page}&limit=5`,
        );
        $("courses").append(...data.map(renderCourse));
        $("more").hidden = state.page * limit >= total;
      }

      async function loadSaved() {
        if (!state.token) return;
        const { data } = await api("/api/me/saved");
        state.saved = new Set(data.map((c) => c.id));
      }

      async function toggleSave(courseId) {
        if (!state.token) return say("Log in to save courses.");
        try {
          if (state.saved.has(courseId)) {
            await api(`/api/me/saved/${courseId}`, { method: "DELETE" });
            state.saved.delete(courseId);
          } else {
            await api(`/api/me/saved/${courseId}`, { method: "PUT" });
            state.saved.add(courseId);
          }
          say(`${state.saved.size} saved`);
          const btn = document.querySelector(
            `button[data-course-id="${courseId}"]`,
          );
          const on = state.saved.has(courseId);
          btn.textContent = on ? "Saved" : "Save";
          btn.setAttribute("aria-pressed", String(on));
        } catch (err) {
          if (err.status === 401) {
            logout();
            say("Session expired. Please log in again.");
          } else say(`Could not save: ${err.message}`);
        }
      }

      function logout() {
        state.token = null;
        state.user = null;
        state.saved = new Set();
        sessionStorage.removeItem("token");
        $("who").textContent = "";
      }

      $("auth").addEventListener("submit", async (e) => {
        e.preventDefault();
        const action = e.submitter.value;
        const form = new FormData(e.currentTarget);
        const credentials = {
          email: form.get("email"),
          password: form.get("password"),
        };
        try {
          if (action === "register") {
            await api("/api/auth/register", {
              method: "POST",
              body: credentials,
            });
            say("Registered. Now log in.");
            return;
          }
          const { token, user } = await api("/api/auth/login", {
            method: "POST",
            body: credentials,
          });
          state.token = token;
          state.user = user;
          sessionStorage.setItem("token", token);
          $("who").textContent = `Logged in as ${user.email} (${user.role})`;
          say("Logged in.");
          await loadSaved();
          await loadCourses();
        } catch (err) {
          say(
            err.status === 422 || err.status === 409 || err.status === 401
              ? err.message
              : "Something went wrong. Try again.",
          );
        }
      });

      $("more").addEventListener("click", () => {
        state.page += 1;
        loadCourses(false);
      });

      await loadSaved().catch(() => logout());
      await loadCourses();
    </script>
  </body>
</html>
```

### `test/api.test.js`: the safety net

```js
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";
import { hashPassword, verifyPassword } from "../src/auth.js";

const SECRET = "test-secret";
let app, server, base;

const call = async (
  path,
  { method = "GET", body, token, headers = {} } = {},
) => {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body:
      body === undefined
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
  });
  const text = await res.text();
  return {
    status: res.status,
    headers: res.headers,
    body: text ? JSON.parse(text) : null,
  };
};

const register = (email, password = "password123") =>
  call("/api/auth/register", { method: "POST", body: { email, password } });
const login = async (email, password = "password123") =>
  (await call("/api/auth/login", { method: "POST", body: { email, password } }))
    .body.token;

before(async () => {
  app = createApp({ secret: SECRET, log: false });
  server = app.listen(0);
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

describe("auth", () => {
  test("register validates input with 422 and field details", async () => {
    const res = await register("not-an-email", "short");
    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, "VALIDATION_FAILED");
    assert.deepEqual(Object.keys(res.body.error.details).sort(), [
      "email",
      "password",
    ]);
  });

  test("register creates a user (201), never returns the hash, and rejects duplicates (409)", async () => {
    const res = await register("Ada@Example.com");
    assert.equal(res.status, 201);
    assert.deepEqual(res.body.user, {
      id: 1,
      email: "ada@example.com",
      role: "student",
    }); // lower-cased, no password fields
    const row = app.db
      .prepare("SELECT password_hash FROM users WHERE email = ?")
      .get("ada@example.com");
    assert.ok(!row.password_hash.includes("password123")); // stored hashed, not plain
    assert.equal((await register("ada@example.com")).status, 409);
  });

  test("login: 200 + token on success, same 401 message for wrong password and unknown email", async () => {
    const ok = await call("/api/auth/login", {
      method: "POST",
      body: { email: "ada@example.com", password: "password123" },
    });
    assert.equal(ok.status, 200);
    assert.ok(ok.body.token.split(".").length === 3);
    const wrong = await call("/api/auth/login", {
      method: "POST",
      body: { email: "ada@example.com", password: "nope-nope" },
    });
    const unknown = await call("/api/auth/login", {
      method: "POST",
      body: { email: "ghost@example.com", password: "password123" },
    });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.deepEqual(wrong.body, unknown.body);
  });

  test("the token carries sub, role, iat, exp and no secrets", async () => {
    const token = await login("ada@example.com");
    const payload = jwt.decode(token);
    assert.deepEqual(Object.keys(payload).sort(), [
      "exp",
      "iat",
      "role",
      "sub",
    ]);
    assert.equal(payload.sub, "1");
    assert.equal(payload.role, "student");
    assert.equal(payload.exp - payload.iat, 15 * 60);
  });

  test("invalid JSON body -> 400 INVALID_JSON", async () => {
    const res = await call("/api/auth/login", {
      method: "POST",
      body: "{bad json",
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "INVALID_JSON");
  });

  test("hashPassword is salted and verifyPassword works", () => {
    const a = hashPassword("secret-pass");
    const b = hashPassword("secret-pass");
    assert.notEqual(a, b); // different salt each time
    assert.ok(verifyPassword("secret-pass", a));
    assert.ok(!verifyPassword("Secret-pass", a));
  });
});

describe("token checks (401 vs 403)", () => {
  test("no token, malformed header, bad signature, wrong algorithm, expired -> 401", async () => {
    assert.equal((await call("/api/me/saved")).status, 401);
    assert.equal(
      (await call("/api/me/saved", { headers: { authorization: "Token abc" } }))
        .status,
      401,
    );

    const forged = jwt.sign({ role: "admin" }, "a-different-secret", {
      subject: "1",
    });
    const r = await call("/api/me/saved", { token: forged });
    assert.equal(r.status, 401);
    assert.equal(r.body.error.message, "Invalid token");

    // "alg: none" attack: unsigned token claiming to be admin
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const none = `${b64({ alg: "none", typ: "JWT" })}.${b64({ sub: "1", role: "admin" })}.`;
    assert.equal((await call("/api/me/saved", { token: none })).status, 401);

    const expired = jwt.sign({ role: "student" }, SECRET, {
      subject: "1",
      expiresIn: -10,
    });
    const e = await call("/api/me/saved", { token: expired });
    assert.equal(e.status, 401);
    assert.equal(e.body.error.message, "Token expired");
  });

  test("a tampered payload fails the signature check", async () => {
    const token = await login("ada@example.com");
    const [h, , s] = token.split(".");
    const evil = Buffer.from(
      JSON.stringify({ sub: "1", role: "admin", iat: 1, exp: 9999999999 }),
    ).toString("base64url");
    assert.equal(
      (await call("/api/me/saved", { token: `${h}.${evil}.${s}` })).status,
      401,
    );
  });

  test("a student gets 403 on an admin route; an admin gets 201 with a Location header", async () => {
    const student = await login("ada@example.com");
    const body = {
      slug: "intro-to-sql",
      title: "Intro to SQL",
      level: "Beginner",
      hours: 5,
      free: true,
    };
    const denied = await call("/api/courses", {
      method: "POST",
      token: student,
      body,
    });
    assert.equal(denied.status, 403);

    await register("root@example.com");
    app.db
      .prepare(
        "UPDATE users SET role = 'admin' WHERE email = 'root@example.com'",
      )
      .run();
    const admin = await login("root@example.com");
    const created = await call("/api/courses", {
      method: "POST",
      token: admin,
      body,
    });
    assert.equal(created.status, 201);
    assert.equal(
      created.headers.get("location"),
      `/api/courses/${created.body.id}`,
    );
    assert.equal(
      (await call("/api/courses", { method: "POST", token: admin, body }))
        .status,
      409,
    );
    const bad = await call("/api/courses", {
      method: "POST",
      token: admin,
      body: { ...body, slug: "x", hours: -1, level: "Expert" },
    });
    assert.equal(bad.status, 422);
    assert.deepEqual(Object.keys(bad.body.error.details).sort(), [
      "hours",
      "level",
    ]);
  });
});

describe("courses", () => {
  test("pagination: page, limit, total", async () => {
    const p1 = await call("/api/courses?limit=5&page=1");
    assert.equal(p1.body.data.length, 5);
    assert.equal(p1.body.total, 13); // 12 seeded + 1 created above
    const p3 = await call("/api/courses?limit=5&page=3");
    assert.equal(p3.body.data.length, 3);
    assert.equal((await call("/api/courses?limit=999")).body.limit, 50); // capped
  });

  test("filters: level and search; invalid level -> 422", async () => {
    const beginner = await call("/api/courses?level=Beginner&limit=50");
    assert.equal(beginner.body.total, 6); // 5 seeded + intro-to-sql
    const react = await call("/api/courses?q=react&limit=50");
    assert.equal(react.body.total, 4);
    assert.equal((await call("/api/courses?level=Expert")).status, 422);
  });

  test("get one: 200 and 404", async () => {
    const ok = await call("/api/courses/5");
    assert.equal(ok.status, 200);
    assert.equal(ok.body.title, "React Fundamentals");
    assert.equal(ok.body.free, true);
    assert.equal((await call("/api/courses/999")).status, 404);
    assert.equal((await call("/api/courses/abc")).status, 404);
  });

  test("SQL injection attempt in the search is just text", async () => {
    const res = await call(
      `/api/courses?q=${encodeURIComponent("' OR '1'='1")}`,
    );
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 0);
    assert.equal((await call("/api/courses?limit=1")).body.total, 13); // table untouched
  });
});

describe("saved courses", () => {
  test("PUT is idempotent, GET joins, DELETE is 204 and idempotent", async () => {
    const token = await login("ada@example.com");
    assert.equal(
      (await call("/api/me/saved/5", { method: "PUT", token })).status,
      200,
    );
    assert.equal(
      (await call("/api/me/saved/5", { method: "PUT", token })).status,
      200,
    ); // same result again
    assert.equal(
      app.db.prepare("SELECT COUNT(*) AS n FROM saved_courses").get().n,
      1,
    ); // still ONE row
    await call("/api/me/saved/3", { method: "PUT", token });

    const list = await call("/api/me/saved", { token });
    assert.deepEqual(list.body.data.map((c) => c.id).sort(), [3, 5]);
    assert.equal(list.body.data[0].title !== undefined, true);

    assert.equal(
      (await call("/api/me/saved/5", { method: "DELETE", token })).status,
      204,
    );
    assert.equal(
      (await call("/api/me/saved/5", { method: "DELETE", token })).status,
      204,
    );
    assert.equal((await call("/api/me/saved", { token })).body.data.length, 1);
  });

  test("saving an unknown course -> 404; saved lists are per user", async () => {
    const ada = await login("ada@example.com");
    assert.equal(
      (await call("/api/me/saved/999", { method: "PUT", token: ada })).status,
      404,
    );
    await register("bob@example.com");
    const bob = await login("bob@example.com");
    assert.equal(
      (await call("/api/me/saved", { token: bob })).body.data.length,
      0,
    );
  });

  test("deleting a user cascades to their saved rows (foreign keys)", () => {
    const before = app.db
      .prepare("SELECT COUNT(*) AS n FROM saved_courses")
      .get().n;
    assert.ok(before > 0);
    app.db.prepare("DELETE FROM users WHERE email = 'ada@example.com'").run();
    assert.equal(
      app.db.prepare("SELECT COUNT(*) AS n FROM saved_courses").get().n,
      0,
    );
  });
});

describe("errors", () => {
  test("unknown API route -> JSON 404; request id is echoed", async () => {
    const res = await call("/api/nothing-here", {
      headers: { "x-request-id": "trace-123" },
    });
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, "NOT_FOUND");
    assert.equal(res.headers.get("x-request-id"), "trace-123");
  });

  test("a body over the 10 kb limit -> 413, not a 500", async () => {
    const res = await call("/api/auth/register", {
      method: "POST",
      body: { email: "big@example.com", password: "x".repeat(20_000) },
    });
    assert.equal(res.status, 413);
    assert.equal(res.body.error.code, "PAYLOAD_TOO_LARGE");
  });

  test("a crash becomes a generic 500 with a request id and no internals", async () => {
    const broken = createApp({ secret: SECRET, log: false });
    const srv = broken.listen(0);
    broken.db.close(); // simulate the database going away
    const res = await fetch(
      `http://localhost:${srv.address().port}/api/courses`,
    );
    const body = await res.json();
    srv.close();
    assert.equal(res.status, 500);
    assert.equal(body.error.code, "INTERNAL");
    assert.equal(body.error.message, "Something went wrong");
    assert.ok(body.error.requestId);
    assert.ok(!JSON.stringify(body).includes("database"));
  });
});
```

All 19 tests should pass. Then open `http://localhost:3000`, register, log in, click **Save**.

## 3. Part B: the trace

The UI has a **Request trace** box that records every request. I drove it in headless Chromium (register, log in, save course 1, "Load more") and recorded what the browser sent:

```
GET  /api/courses?page=1&limit=5   Authorization: no
POST /api/auth/register            no
POST /api/auth/login               no
GET  /api/me/saved                 yes
GET  /api/courses?page=1&limit=5   yes
PUT  /api/me/saved/1               yes   <- the click on "Save"
GET  /api/courses?page=2&limit=5   yes
```

The server log for the same click (note the **request id**, also returned in the `X-Request-Id` header and shown in the trace box):

```
[a98ba2ed] PUT /api/me/saved/1 -> 200 (1 ms)
```

And the database afterwards:

```
SELECT user_id, course_id FROM saved_courses  ->  [ { user_id: 1, course_id: 1 } ]
```

The button changed to **"Saved"** with `aria-pressed="true"`.

### The click, layer by layer

| #   | Layer             | File                                                                     | What happens                                                                                                                                        |
| --- | ----------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **UI event**      | `public/index.html`                                                      | the click handler calls `toggleSave(1)`; no token means "Log in to save courses." and **no request**                                                |
| 2   | **API helper**    | `api()` in `index.html`                                                  | `fetch("/api/me/saved/1", { method: "PUT", headers: { Authorization: "Bearer <token>" } })`, and a trace line is written                            |
| 3   | **Network**       | browser                                                                  | same origin (Express serves the page), so **no CORS preflight**                                                                                     |
| 4   | **Middleware 1**  | `app.js`                                                                 | assigns `req.id`, sets `X-Request-Id`, will log on `finish`                                                                                         |
| 5   | **Middleware 2**  | `express.json`                                                           | parses JSON bodies (none for this PUT); rejects bodies over 10 kb with 413                                                                          |
| 6   | **Auth**          | `requireAuth` in `auth.js`                                               | splits `Bearer <token>`, `jwt.verify` checks signature + expiry, sets `req.user = { id, role }` (401 otherwise)                                     |
| 7   | **Route handler** | `app.put("/api/me/saved/:courseId")`                                     | `Number(req.params.courseId)`; `SELECT 1 FROM courses WHERE id = ?`; 404 if missing                                                                 |
| 8   | **Database**      | `INSERT OR IGNORE INTO saved_courses (user_id, course_id) VALUES (?, ?)` | the **composite primary key** blocks duplicates; `IGNORE` makes a repeat a no-op                                                                    |
| 9   | **Response**      | handler                                                                  | `200 {"saved":true,"courseId":1}` plus `X-Request-Id`                                                                                               |
| 10  | **Error path**    | `errorHandler`                                                           | anything thrown above becomes `{ error: { code, message } }` with the right status                                                                  |
| 11  | **UI update**     | `toggleSave`                                                             | adds the id to `state.saved`, updates the button text and `aria-pressed`, shows "1 saved"; a **401** logs the user out and says the session expired |

### Your trace worksheet

Do this yourself and write the answers down (they are exactly the interview answer):

1. Open DevTools -> **Network**. Click Save. Which request appeared? What were its method, URL, status, and request headers (find `Authorization`)?
2. Copy the `X-Request-Id` from the response headers. Find the same id in the server terminal.
3. Decode the token (paste the middle part into a Base64URL decoder, or run `node -e` with `Buffer.from(part, "base64url")`). What are `sub`, `role`, `exp`?
4. Click Save again on a saved item (it deletes), then check the Network tab: which method and status?
5. Open the database (`sqlite3 learninghub.db "select * from saved_courses"`, or a short Node script) and confirm the row appears and disappears.
6. In DevTools, **delete the token** from Session Storage and click Save. What do you see, and does a request leave the browser?
7. Stop the server and click Save. Which part of the UI code runs?

## 4. Part C: debug the broken versions

Start from the working project. Apply **one** change at a time, run `node --no-warnings --test test/api.test.js`, read the failure, then revert it. I did each of these; the failing test names are exact.

| #   | Change                                                                                                                 | File            | What breaks (failing test)                                                                                                                     | Lesson                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | replace `where.push("title LIKE ?"); params.push(`%${q.trim()}%`);` with ``where.push(`title LIKE '%${q.trim()}%'`);`` | `src/app.js`    | `SQL injection attempt in the search is just text`                                                                                             | **never** concatenate input into SQL                                |
| 2   | change `INSERT OR IGNORE INTO saved_courses` to `INSERT INTO saved_courses`                                            | `src/app.js`    | `PUT is idempotent, GET joins, DELETE is 204 and idempotent`                                                                                   | the second `PUT` hits the primary key and becomes a 500             |
| 3   | remove `requireRole("admin"),` from the `POST /api/courses` route                                                      | `src/app.js`    | `a student gets 403 on an admin route...`                                                                                                      | a logged-in user is **not** an admin; authorization must be checked |
| 4   | in `errorHandler`, change `message: "Something went wrong"` to `message: err.stack`                                    | `src/errors.js` | `a crash becomes a generic 500 with a request id and no internals`                                                                             | never leak internals to clients                                     |
| 5   | change `PRAGMA foreign_keys = ON` to `OFF`                                                                             | `src/db.js`     | `deleting a user cascades to their saved rows (foreign keys)`                                                                                  | SQLite ignores foreign keys unless enabled                          |
| 6   | change `jwt.verify(token, secret, { algorithms: ["HS256"] })` to `jwt.decode(token)`                                   | `src/auth.js`   | **two** tests: `no token, malformed header, bad signature, wrong algorithm, expired -> 401` and `a tampered payload fails the signature check` | `decode` trusts the payload; anyone could mint an admin token       |

For each: **(1)** predict which test fails _before_ running; **(2)** run; **(3)** read the assertion message; **(4)** find the line; **(5)** fix; **(6)** confirm 19/19.

**A bug I found while writing this project:** a 20 KB body returned `500` instead of `413`, because Express's `PayloadTooLargeError` fell into the "unexpected error" branch. I fixed it in `errorHandler` and added the test `a body over the 10 kb limit -> 413, not a 500`. Client mistakes must never look like server failures.

## 5. Part D: stretch goals

1. **Unsave all:** `DELETE /api/me/saved` (204), with a test.
2. **Saved count** on each course: `SELECT course_id, COUNT(*) FROM saved_courses GROUP BY course_id` (and think about an index).
3. **Escape `%` and `_`** in the search so `?q=%` doesn't match everything (it currently returns all 12 courses).
4. **Make the UI robust:** `res.json()` throws on a non-JSON error page (see `07` Q6). Guard it.
5. **Optimistic UI:** flip the button instantly, then roll back if the request fails.
6. **Refresh tokens:** `POST /api/auth/refresh` with an `HttpOnly` cookie.
7. **Rate-limit login** (return 429 with `Retry-After`) and test it.
8. **Swap the UI** for your React app from Day 3, using the client from `06`. Add the CORS headers, or use a dev proxy.
9. **Pagination by cursor** instead of offset.
10. **Replace the hand-written checks** with a schema library (for example Zod).

## 6. Security notes (what this demo does and doesn't do)

- Passwords: scrypt + salt, constant-time compare. Good.
- Login messages don't reveal which emails exist. Good.
- SQL: parameters everywhere. Good.
- The token lives in `sessionStorage` for simplicity, readable by scripts; production apps often prefer an `HttpOnly` cookie plus CSRF protection.
- No rate limiting, no HTTPS, no refresh tokens, no CORS: add them before real use.
- The UI inserts `c.level` and `c.hours` via `innerHTML`; they come from validated columns, but safer code would use `textContent` for everything.

## Recap

- A feature is a chain: **UI event -> fetch helper -> network -> middleware -> auth -> handler -> SQL -> response -> UI update**, and each link has its own failure mode and status code.
- **Idempotent `PUT` + composite key + `INSERT OR IGNORE`** makes "save" safe to repeat.
- A **request id** lets you find one request in the UI, the logs and the DB.
- **Tests that fail on purpose** (the broken variants) prove the tests actually protect you.

## Checklist

- [ ] The app runs and all 19 tests pass
- [ ] I traced one Save click through all 11 layers and can name the file for each
- [ ] I found my request id in DevTools and in the server log
- [ ] I applied the 6 bugs, predicted each failure, and fixed each one
- [ ] I completed at least one stretch goal
- [ ] I can tell the whole story out loud in two minutes
