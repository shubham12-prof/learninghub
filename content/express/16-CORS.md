# 16. CORS (Cross-Origin Resource Sharing)

## What is CORS?

CORS is a browser security mechanism that restricts web pages from making requests to a domain **different** from the one that served the page, unless the server explicitly allows it via HTTP headers.

Example: a frontend running on `http://localhost:3001` trying to call an API on `http://localhost:3000` is a **cross-origin** request. Without proper CORS headers, the browser blocks the response from reaching the frontend JavaScript.

> Important: CORS is enforced by the **browser**, not the server. Tools like `curl` or Postman ignore CORS entirely — CORS only matters for browser-based clients.

## The `cors` Middleware

```bash
npm install cors
```

### Allow All Origins (Development Only)

```js
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors()); // Access-Control-Allow-Origin: *

app.listen(3000);
```

> Not recommended for production APIs that use cookies/credentials — allowing `*` with credentials is disallowed by browsers anyway.

### Allow a Specific Origin

```js
app.use(
  cors({
    origin: "https://myfrontend.com",
  }),
);
```

### Allow Multiple Origins

```js
const allowedOrigins = [
  "https://myfrontend.com",
  "https://admin.myfrontend.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);
```

> `!origin` handles non-browser requests (like curl/Postman/server-to-server) where the `Origin` header isn't set.

### Allow Credentials (Cookies, Authorization Headers)

```js
app.use(
  cors({
    origin: "https://myfrontend.com",
    credentials: true, // allows cookies to be sent cross-origin
  }),
);
```

On the frontend, the request must also opt in:

```js
fetch("https://api.example.com/data", {
  credentials: "include",
});
```

> When `credentials: true` is set, `origin` **cannot** be `'*'` — it must be an explicit origin.

### Restricting Methods and Headers

```js
app.use(
  cors({
    origin: "https://myfrontend.com",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["X-Total-Count"], // headers the browser JS is allowed to read
    maxAge: 86400, // cache preflight response for 1 day (seconds)
  }),
);
```

## Route-Specific CORS

```js
const corsOptions = { origin: "https://myfrontend.com" };

app.get("/public-data", cors(), publicController); // open to all
app.get("/private-data", cors(corsOptions), privateController); // restricted
```

## Preflight Requests (`OPTIONS`)

For "non-simple" requests (e.g., `Content-Type: application/json`, custom headers, methods like PUT/DELETE), browsers first send an `OPTIONS` preflight request to check permissions before the actual request.

```js
app.options("*", cors()); // handle preflight for all routes (Express 4)
// Express 5: app.options('/{*splat}', cors());
```

The `cors` middleware handles this automatically when applied globally via `app.use(cors())`.

## Manual CORS Headers (Without the Library)

Understanding what the middleware does under the hood:

```js
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://myfrontend.com");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204); // respond to preflight immediately
  }
  next();
});
```

## Common CORS Errors and Fixes

| Error (in browser console)                                                                                                  | Cause                                | Fix                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `No 'Access-Control-Allow-Origin' header is present`                                                                        | Server didn't send CORS headers      | Add `cors()` middleware                                                                      |
| `The value of the 'Access-Control-Allow-Origin' header ... must not be the wildcard '*' when credentials mode is 'include'` | Using `origin: '*'` with credentials | Set an explicit origin string                                                                |
| `Method PUT is not allowed by Access-Control-Allow-Methods`                                                                 | Method not whitelisted               | Add method to `methods` option                                                               |
| Preflight `OPTIONS` returns 404/500                                                                                         | No handler for `OPTIONS`             | Ensure `cors()` middleware is applied before routes, or add explicit `app.options()` handler |

## Full Production-Style Example

```js
const express = require("express");
const cors = require("cors");

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("CORS not allowed for this origin"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.listen(3000);
```

## Common Interview-Style Questions

- **What enforces CORS — the client or the server?**
  The browser enforces it based on headers the server sends; server-to-server or non-browser requests aren't restricted by CORS at all.

- **What's a preflight request?**
  An automatic `OPTIONS` request the browser sends before certain cross-origin requests (non-"simple" methods/headers) to check if the actual request is permitted.

- **Can you use `origin: '*'` together with `credentials: true`?**
  No — browsers reject wildcard origins when credentials are included; you must specify an explicit origin.

- **How do you allow multiple specific origins?**
  Use a function for the `origin` option that checks the incoming `Origin` header against an allow-list.
