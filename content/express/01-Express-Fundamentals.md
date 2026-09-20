# 01. Express Fundamentals

## What is Express.js?

Express is a minimal, unopinionated, fast web framework for Node.js. It sits on top of Node's built-in `http` module and gives you a much nicer API for:

- Handling routes (URLs + HTTP methods)
- Handling requests and responses
- Plugging in middleware for cross-cutting concerns (logging, auth, parsing, etc.)
- Serving static files
- Building REST APIs and full server-rendered apps

### Why use Express instead of raw Node `http`?

Raw Node.js:

```js
const http = require("http");

const server = http.createServer((req, res) => {
  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Home Page");
  } else if (req.url === "/about" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("About Page");
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(3000);
```

This gets messy fast — manual URL parsing, manual method checks, no middleware system, no easy way to parse JSON bodies. Express abstracts all of this away.

## Installing Express

```bash
mkdir my-app && cd my-app
npm init -y
npm install express
```

This creates `package.json` and installs Express into `node_modules`.

## The Minimal Express App

```js
// app.js
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello, Express!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

Run it:

```bash
node app.js
```

### Breaking it down

| Piece                    | Meaning                                                       |
| ------------------------ | ------------------------------------------------------------- |
| `express()`              | Factory function that creates an Express application instance |
| `app.get(path, handler)` | Registers a route handler for GET requests to `path`          |
| `req`                    | Represents the incoming HTTP request                          |
| `res`                    | Represents the outgoing HTTP response                         |
| `res.send()`             | Sends a response body (string, object, buffer, etc.)          |
| `app.listen(port, cb)`   | Starts the HTTP server and binds it to a port                 |

## The Express Application Object (`app`)

`app` is the central object of an Express app. Key responsibilities:

- Registering routes: `app.get()`, `app.post()`, `app.put()`, `app.delete()`, `app.all()`, `app.use()`
- Configuring settings: `app.set('view engine', 'ejs')`
- Mounting middleware: `app.use(middlewareFn)`
- Mounting sub-routers: `app.use('/api', apiRouter)`
- Starting the server: `app.listen()`

## Application Settings

```js
app.set("view engine", "ejs"); // template engine
app.set("views", "./views"); // views directory
app.set("trust proxy", true); // trust X-Forwarded-* headers (behind Nginx/Heroku)
app.get("trust proxy"); // read a setting
app.disable("x-powered-by"); // remove the "X-Powered-By: Express" header (security)
```

## Environment-based Configuration

```js
const env = app.get("env"); // reads process.env.NODE_ENV, defaults to 'development'

if (env === "production") {
  app.use(compression());
} else {
  app.use(morgan("dev"));
}
```

Run with:

```bash
NODE_ENV=production node app.js
```

## Nodemon for Development

Restarting the server manually on every change is painful. Use `nodemon`:

```bash
npm install --save-dev nodemon
```

`package.json`:

```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  }
}
```

```bash
npm run dev
```

## Basic Project Structure

A simple but scalable starting layout:

```
my-app/
├── node_modules/
├── src/
│   ├── app.js            # Express app setup (middleware, routes)
│   ├── server.js         # Entry point — starts the HTTP server
│   ├── routes/
│   │   └── userRoutes.js
│   ├── controllers/
│   │   └── userController.js
│   ├── middleware/
│   │   └── errorHandler.js
│   └── config/
│       └── db.js
├── .env
├── .gitignore
├── package.json
└── package-lock.json
```

`src/app.js`:

```js
const express = require("express");
const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;
```

`src/server.js`:

```js
const app = require("./app");
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
```

Separating `app.js` (the Express configuration) from `server.js` (the thing that actually starts listening) makes it much easier to write tests — test frameworks like Supertest can import `app` without needing a real network port.

## Core Concepts You'll Build On

1. **Routing** — mapping URL + HTTP method combinations to handler functions.
2. **Middleware** — functions that run in sequence for each request, with access to `req`, `res`, and `next`.
3. **Request/Response objects** — Express extends Node's raw `req`/`res` with convenience methods (`req.params`, `req.body`, `res.json()`, etc.).

These three ideas are the backbone of everything else in Express and are covered in the following notes.

## Common Interview-Style Questions

- **What is Express.js and why use it over plain Node `http`?**
  Express provides routing, middleware, and a cleaner request/response API on top of Node's low-level `http` module, reducing boilerplate.

- **Is Express opinionated?**
  No — it's minimal and unopinionated. It doesn't force a particular project structure, ORM, or templating engine.

- **What does `app.listen()` return?**
  An instance of Node's `http.Server`, so you can do `const server = app.listen(...)` and later `server.close()`.
