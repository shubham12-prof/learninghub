# 06. Built-in Middleware

Express ships with a small set of built-in middleware functions, available directly on the `express` object. No extra npm install needed.

## 1. `express.json()`

Parses incoming requests with a `Content-Type: application/json` header and populates `req.body` with the parsed object.

```js
const express = require("express");
const app = express();

app.use(express.json());

app.post("/data", (req, res) => {
  console.log(req.body); // parsed JSON object
  res.json({ received: req.body });
});
```

### Options

```js
app.use(
  express.json({
    limit: "1mb", // max body size (default '100kb')
    strict: true, // only accepts arrays/objects (default true)
    type: "application/json", // which Content-Type to parse
  }),
);
```

## 2. `express.urlencoded()`

Parses incoming requests with `Content-Type: application/x-www-form-urlencoded` (classic HTML form submissions).

```js
app.use(express.urlencoded({ extended: true }));

app.post("/submit-form", (req, res) => {
  console.log(req.body); // { name: 'Alice', age: '30' }
  res.send("Form received");
});
```

- `extended: true` — uses the `qs` library, supports nested objects/arrays.
- `extended: false` — uses Node's built-in `querystring` module, only supports flat key-value pairs.

## 3. `express.static()`

Serves static files (HTML, CSS, JS, images) directly from a folder.

```js
app.use(express.static("public"));
```

If `public/style.css` exists, it's now accessible at `http://localhost:3000/style.css` — no route needed.

### Mounting under a virtual path prefix

```js
app.use("/static", express.static("public"));
// public/style.css -> http://localhost:3000/static/style.css
```

### Options

```js
app.use(
  express.static("public", {
    maxAge: "1d", // cache-control max-age
    index: "index.html", // default file served for directory requests
    dotfiles: "ignore", // how to treat dotfiles (ignore/allow/deny)
    etag: true,
  }),
);
```

(Full details in **11-Static-Files.md**.)

## 4. `express.raw()`

Parses the request body into a `Buffer` when `Content-Type` matches. Useful for binary payloads or webhook signature verification (e.g., Stripe webhooks require the raw body).

```js
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  console.log(req.body); // Buffer, not parsed JSON
  const signature = req.headers["stripe-signature"];
  // verify signature using raw buffer...
  res.sendStatus(200);
});
```

## 5. `express.text()`

Parses the request body as plain text into a string.

```js
app.use(express.text({ type: "text/plain" }));

app.post("/note", (req, res) => {
  console.log(typeof req.body); // 'string'
  res.send("Received note");
});
```

## Putting It All Together

```js
const express = require("express");
const app = express();

app.use(express.json()); // JSON APIs
app.use(express.urlencoded({ extended: true })); // HTML forms
app.use(express.static("public")); // static assets
app.use("/webhook", express.raw({ type: "*/*" })); // raw body for a specific route

app.post("/api/users", (req, res) => {
  res.status(201).json({ created: req.body });
});

app.listen(3000);
```

## Common Gotchas

- **Forgetting `express.json()`** → `req.body` will be `undefined` for JSON POST/PUT/PATCH requests.
- **Wrong `Content-Type` header from the client** → the matching parser middleware won't run, so `req.body` stays empty. Always check the client is sending `Content-Type: application/json`.
- **Order matters** — parsing middleware must be registered _before_ the routes that rely on `req.body`.
- **`express.static` doesn't require auth** by default — anything inside the folder is publicly accessible; never point it at a directory with sensitive files.

## Common Interview-Style Questions

- **What's the difference between `express.json()` and `express.urlencoded()`?**
  `express.json()` parses JSON payloads (`Content-Type: application/json`); `express.urlencoded()` parses form-encoded payloads (`Content-Type: application/x-www-form-urlencoded`), typical of standard HTML `<form>` submissions.

- **When would you use `express.raw()`?**
  When you need the untouched raw request body, e.g., verifying a webhook signature (Stripe, GitHub) where the signature is computed over the exact raw bytes.

- **Do you need `body-parser` in modern Express?**
  No — as of Express 4.16+, `express.json()` and `express.urlencoded()` are built in, replacing the separate `body-parser` package for these use cases.
