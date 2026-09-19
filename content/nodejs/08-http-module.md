# 🌐 HTTP Module

## 🎯 What Is It?

The `http` module is Node's built-in toolkit for creating web servers and making HTTP requests — **no framework required**. Express, Fastify, and Koa are all built on top of it.

---

## 💻 A Minimal HTTP Server

```js
const http = require("node:http");

const server = http.createServer((req, res) => {
  console.log(`📨 ${req.method} ${req.url}`);

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Hello, World! 👋" }));
});

server.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
```

---

## 🧭 Basic Routing (Without a Framework)

```js
const http = require("node:http");
const { URL } = require("node:url");

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("🏠 Home Page");
  } else if (url.pathname === "/users" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify([{ id: 1, name: "Alice" }]));
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("❌ 404 Not Found");
  }
});

server.listen(3000);
```

---

## 📥 Handling POST Requests & Reading the Body

```js
const http = require("node:http");

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/echo") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    }); // 📦 accumulate chunks (stream!)

    req.on("end", () => {
      try {
        const parsed = JSON.parse(body);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ youSent: parsed }));
      } catch {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("❌ Invalid JSON");
      }
    });
  }
});

server.listen(3000);
```

⚠️ `req` is a **readable stream** — the body doesn't arrive all at once; you accumulate `'data'` events until `'end'` fires.

---

## 📤 Making HTTP Requests (Client Side)

```js
const https = require("node:https");

https
  .get("https://jsonplaceholder.typicode.com/todos/1", (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => console.log("✅ Response:", JSON.parse(data)));
  })
  .on("error", (err) => console.error("❌", err));

// Modern alternative: built-in fetch() (Node 18+) — much simpler!
const response = await fetch("https://jsonplaceholder.typicode.com/todos/1");
const json = await response.json();
console.log(json);
```

---

## 🎛️ Key Objects Cheat Sheet

| Object                  | Key Properties/Methods                                                      |
| ----------------------- | --------------------------------------------------------------------------- |
| `req` (IncomingMessage) | `.method`, `.url`, `.headers`, `.on('data')`, `.on('end')`                  |
| `res` (ServerResponse)  | `.writeHead(status, headers)`, `.write(chunk)`, `.end(data)`, `.statusCode` |
| `server`                | `.listen(port, cb)`, `.close()`, `.on('connection')`                        |

---

## 🆚 `http` vs Express (Why Frameworks Exist)

```js
// Raw http: verbose routing, manual body parsing, manual JSON headers
// Express:
const express = require("express");
const app = express();
app.use(express.json());

app.get("/users", (req, res) => res.json([{ id: 1, name: "Alice" }]));
app.post("/echo", (req, res) => res.json({ youSent: req.body }));

app.listen(3000, () => console.log("🚀 Express server running"));
```

Frameworks handle routing, middleware, body-parsing, and error handling for you — but understanding raw `http` helps you debug what's really happening underneath.

---

## ⚠️ Common Pitfalls

- Forgetting `res.end()` → request hangs forever (client waits indefinitely).
- Not setting `Content-Type` headers → clients may misinterpret the response.
- Reading `req` body without handling `'error'` events on the stream.
- Blocking the event loop inside a request handler (e.g., heavy sync loops) → freezes **all** concurrent requests.

---

## 🧪 Try It Yourself

1. Build a raw `http` server with 3 routes: `GET /`, `GET /time`, `POST /echo`.
2. Add basic error handling for malformed JSON in POST bodies.
3. Compare response times of a raw `http` server vs an Express server for the same route.
