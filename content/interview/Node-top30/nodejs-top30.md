# Top 30 Node.js Interview Questions & Answers (0–2 Years Experience)

A beginner-friendly guide. Each answer has a simple explanation, an analogy where helpful, and a small code example.

---

## Table of Contents

1. [Basics](#basics) (Q1–Q8)
2. [Core Concepts: Async & Events](#core-concepts-async--events) (Q9–Q16)
3. [Modules, Files & Streams](#modules-files--streams) (Q17–Q21)
4. [Express & APIs](#express--apis) (Q22–Q27)
5. [Best Practices](#best-practices) (Q28–Q30)

---

# Basics

## Q1. What is Node.js?

Node.js is a **runtime environment** that lets you run **JavaScript outside the browser** (on your computer or a server). It is built on Google Chrome's **V8 engine**.

**Key points:**

- Not a language, not a framework — it is a runtime.
- Used to build servers, APIs, CLI tools, real-time apps.

---

## Q2. Why is Node.js popular? What are its main features?

- **Fast** – V8 compiles JS to machine code.
- **Non-blocking, asynchronous I/O** – handles many requests at once.
- **Single language** – JavaScript on both frontend and backend.
- **NPM** – the world's biggest package ecosystem.
- **Scalable** – great for real-time apps (chat, streaming).
- **Cross-platform** – Windows, Mac, Linux.

---

## Q3. Is Node.js single-threaded? How does it handle many requests?

Yes, Node.js runs your JavaScript code on a **single main thread**. But it handles many requests using the **event loop** and **non-blocking I/O**.

**Analogy:** A waiter (single thread) takes orders from many tables. He doesn't stand waiting for the kitchen to cook — he gives the order to the kitchen (background workers) and serves other tables. When food is ready, he delivers it.

> Behind the scenes, libuv uses a **thread pool** (default 4 threads) for heavy tasks like file system and crypto.

---

## Q4. What is NPM?

**NPM = Node Package Manager.** It is used to install, share, and manage libraries (packages).

```bash
npm init -y            # create package.json
npm install express    # install a package
npm install -D nodemon # install as dev dependency
npm uninstall express  # remove
```

---

## Q5. What is `package.json`?

A file that describes your project: name, version, scripts, and **dependencies**.

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "scripts": { "start": "node index.js", "dev": "nodemon index.js" },
  "dependencies": { "express": "^4.18.0" },
  "devDependencies": { "nodemon": "^3.0.0" }
}
```

- `dependencies` → needed in production.
- `devDependencies` → needed only during development (testing, nodemon).

---

## Q6. What is `package-lock.json`?

It records the **exact versions** of every installed package (including nested ones). This makes sure everyone on the team and the server installs the **same versions**.

---

## Q7. Difference between `dependencies` and `devDependencies`?

| dependencies           | devDependencies             |
| ---------------------- | --------------------------- |
| Needed to run the app  | Needed only for development |
| e.g. express, mongoose | e.g. nodemon, jest, eslint  |
| `npm install pkg`      | `npm install -D pkg`        |

---

## Q8. Difference between Node.js and Browser JavaScript?

| Node.js                          | Browser                       |
| -------------------------------- | ----------------------------- |
| Runs on server                   | Runs in browser               |
| Has `fs`, `http`, `path` modules | Has `window`, `document`, DOM |
| No DOM access                    | No file system access         |
| Global object: `global`          | Global object: `window`       |

---

# Core Concepts: Async & Events

## Q9. What is the Event Loop?

The **event loop** is the mechanism that lets Node.js perform non-blocking operations. It continuously checks: _"Is the call stack empty? Is there any callback waiting to run?"_ and runs them one by one.

**Simple flow:**

1. Run synchronous code first.
2. Send async tasks (timers, file reads, network calls) to the background.
3. When they finish, their callbacks go into a queue.
4. Event loop pushes callbacks to the stack when it is empty.

```js
console.log("1");
setTimeout(() => console.log("2"), 0);
console.log("3");
// Output: 1, 3, 2
```

Even with `0` ms, the timeout callback runs **after** synchronous code.

---

## Q10. Blocking vs Non-Blocking code?

- **Blocking:** Next line waits until the current one finishes.
- **Non-blocking:** Next line runs immediately; result comes later via callback/promise.

```js
const fs = require("fs");

// Blocking
const data = fs.readFileSync("file.txt", "utf8");
console.log(data);

// Non-blocking
fs.readFile("file.txt", "utf8", (err, data) => {
  console.log(data);
});
console.log("I run first!");
```

---

## Q11. What is a Callback? What is Callback Hell?

A **callback** is a function passed into another function, to be called later.

**Callback Hell** = deeply nested callbacks that are hard to read:

```js
getUser(1, (user) => {
  getOrders(user.id, (orders) => {
    getPayment(orders[0], (payment) => {
      console.log(payment);
    });
  });
});
```

**Fix:** use Promises or async/await.

---

## Q12. What is a Promise?

An object that represents a value that will be available **in the future**. It has 3 states:

- **Pending** – waiting
- **Fulfilled** – success (`resolve`)
- **Rejected** – failed (`reject`)

```js
const promise = new Promise((resolve, reject) => {
  setTimeout(() => resolve("Done!"), 1000);
});

promise
  .then((result) => console.log(result))
  .catch((err) => console.error(err));
```

---

## Q13. What is async/await?

A cleaner way to write Promise-based code so it looks synchronous.

```js
async function getData() {
  try {
    const user = await getUser(1);
    const orders = await getOrders(user.id);
    console.log(orders);
  } catch (err) {
    console.error(err);
  }
}
```

- `async` makes a function return a Promise.
- `await` pauses **inside that function** until the Promise settles.
- Always use `try/catch` for errors.

---

## Q14. What is `process.nextTick()` vs `setImmediate()` vs `setTimeout()`?

- `process.nextTick()` → runs **right after the current operation**, before anything else (highest priority).
- `setTimeout(fn, 0)` → runs in the **timers phase** of the event loop.
- `setImmediate()` → runs in the **check phase**, after I/O events.

```js
setTimeout(() => console.log("timeout"), 0);
setImmediate(() => console.log("immediate"));
process.nextTick(() => console.log("nextTick"));
// nextTick always prints first
```

---

## Q15. What is EventEmitter?

A built-in class for working with **events** (publish/subscribe pattern). Many Node modules (streams, http) use it internally.

```js
const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("greet", (name) => console.log(`Hello ${name}`));
emitter.emit("greet", "Rahul"); // Hello Rahul
```

---

## Q16. What is `Promise.all()` and how is it different from `Promise.allSettled()`?

- `Promise.all([...])` → runs promises **in parallel**; if **any one fails**, the whole thing fails.
- `Promise.allSettled([...])` → waits for **all**, and gives result of each (success or failure).

```js
const results = await Promise.all([getUser(), getPosts(), getComments()]);
```

Use `Promise.all` to speed up independent tasks (faster than awaiting one by one).

---

# Modules, Files & Streams

## Q17. What are Modules in Node.js? CommonJS vs ES Modules?

A **module** is a separate file with its own code that you can reuse.

| CommonJS (default)  | ES Modules           |
| ------------------- | -------------------- |
| `require()`         | `import`             |
| `module.exports`    | `export`             |
| Loads synchronously | Loads asynchronously |

```js
// CommonJS
const fs = require("fs");
module.exports = { add };

// ES Modules (set "type": "module" in package.json)
import fs from "fs";
export const add = (a, b) => a + b;
```

---

## Q18. What are the types of modules?

1. **Core modules** – built-in (`fs`, `http`, `path`, `os`, `events`).
2. **Local modules** – your own files (`require("./utils")`).
3. **Third-party modules** – installed via npm (`express`, `lodash`).

---

## Q19. What is the `fs` module? Give an example.

Used to work with the **file system** (read, write, delete files).

```js
const fs = require("fs/promises");

await fs.writeFile("a.txt", "Hello");
const data = await fs.readFile("a.txt", "utf8");
await fs.appendFile("a.txt", " World");
await fs.unlink("a.txt"); // delete
```

---

## Q20. What are Streams? Why use them?

Streams let you process data **piece by piece (chunks)** instead of loading everything into memory. Great for big files.

**Analogy:** Watching YouTube — you don't download the entire video first; it plays as chunks arrive.

**Types:** Readable, Writable, Duplex, Transform.

```js
const fs = require("fs");
fs.createReadStream("big.mp4").pipe(fs.createWriteStream("copy.mp4"));
```

---

## Q21. What is a Buffer?

A **Buffer** is a temporary memory area used to store **raw binary data** (like images, files, network data).

```js
const buf = Buffer.from("Hello");
console.log(buf); // <Buffer 48 65 6c 6c 6f>
console.log(buf.toString()); // Hello
```

---

# Express & APIs

## Q22. What is Express.js?

A minimal, popular **web framework for Node.js** that makes building servers and REST APIs easy (routing, middleware, request/response handling).

```js
const express = require("express");
const app = express();

app.use(express.json());

app.get("/", (req, res) => res.send("Hello World"));

app.listen(3000, () => console.log("Server running on 3000"));
```

---

## Q23. What is Middleware?

A function that runs **between the request and the response**. It can modify `req`/`res`, end the request, or pass control using `next()`.

```js
const logger = (req, res, next) => {
  console.log(req.method, req.url);
  next(); // go to next middleware/route
};

app.use(logger);
```

**Common uses:** logging, authentication, validation, error handling, parsing JSON.

---

## Q24. What is REST API? What are the HTTP methods?

**REST** = a style of designing APIs using HTTP.

| Method | Purpose              | Example           |
| ------ | -------------------- | ----------------- |
| GET    | Read data            | `GET /users`      |
| POST   | Create data          | `POST /users`     |
| PUT    | Replace/update fully | `PUT /users/1`    |
| PATCH  | Update partially     | `PATCH /users/1`  |
| DELETE | Delete data          | `DELETE /users/1` |

---

## Q25. Difference between `req.params`, `req.query`, and `req.body`?

```js
// URL: /users/5?sort=asc   (POST body: { "name": "Amit" })

app.post("/users/:id", (req, res) => {
  req.params.id; // "5"      → from the URL path
  req.query.sort; // "asc"    → from ?key=value
  req.body.name; // "Amit"   → from request body (needs express.json())
});
```

---

## Q26. Common HTTP status codes?

| Code | Meaning                      |
| ---- | ---------------------------- |
| 200  | OK                           |
| 201  | Created                      |
| 204  | No Content                   |
| 400  | Bad Request                  |
| 401  | Unauthorized (not logged in) |
| 403  | Forbidden (no permission)    |
| 404  | Not Found                    |
| 500  | Internal Server Error        |

---

## Q27. What is CORS?

**Cross-Origin Resource Sharing** — a browser security rule that blocks a web page from calling an API on a **different origin** (domain/port) unless the server allows it.

```js
const cors = require("cors");
app.use(cors()); // allow all origins
app.use(cors({ origin: "https://myfrontend.com" })); // allow specific
```

---

# Best Practices

## Q28. How do you handle errors in Node.js?

1. **Callbacks:** check `err` first.
2. **Promises:** `.catch()`.
3. **async/await:** `try/catch`.
4. **Express:** global error-handling middleware (4 params).

```js
app.get("/user/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Error middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});
```

---

## Q29. What are environment variables? Why use `.env`?

Values that change per environment (dev/production) and **secrets** (DB password, API keys) should **not** be hard-coded.

```bash
# .env
PORT=3000
DB_URL=mongodb://localhost/mydb
JWT_SECRET=mysecret
```

```js
require("dotenv").config();
console.log(process.env.PORT);
```

> Add `.env` to `.gitignore` so it never goes to GitHub.

---

## Q30. How do you secure a Node.js app? (Basics)

- Use **environment variables** for secrets.
- **Hash passwords** with `bcrypt` (never store plain text).
- Use **JWT** for authentication.
- **Validate input** (Joi, express-validator) to prevent bad data/injection.
- Use **helmet** for secure HTTP headers.
- Use **rate limiting** (`express-rate-limit`) to stop abuse.
- Enable **HTTPS** and configure **CORS** properly.
- Keep packages updated (`npm audit`).

```js
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
```

---

# Quick Revision Cheat Sheet

- Node.js = JS runtime on V8, **single-threaded + event loop + non-blocking I/O**.
- Async styles: **callback → promise → async/await**.
- `process.nextTick` > `setImmediate` / `setTimeout` order of priority for micro-ish tasks.
- **Streams** for big data, **Buffer** for binary data.
- **Express** = routing + middleware; always handle errors and use `next()`.
- Never commit secrets; use `.env`; hash passwords; validate input.

**Good luck with your interview! 🚀**
