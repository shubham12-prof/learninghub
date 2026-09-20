# 10. Response Object (`res`)

The `res` object represents the HTTP response Express sends when it receives a request. It extends Node's native `http.ServerResponse`.

## Core Methods

| Method                       | Description                                                    |
| ---------------------------- | -------------------------------------------------------------- |
| `res.send()`                 | Sends a response of various types (string, object, buffer)     |
| `res.json()`                 | Sends a JSON response (also sets `Content-Type`)               |
| `res.status()`               | Sets the HTTP status code                                      |
| `res.sendStatus()`           | Sets status code and sends its string representation as body   |
| `res.redirect()`             | Redirects to a given URL                                       |
| `res.render()`               | Renders a view template                                        |
| `res.set()` / `res.header()` | Sets response header(s)                                        |
| `res.cookie()`               | Sets a cookie                                                  |
| `res.clearCookie()`          | Clears a cookie                                                |
| `res.sendFile()`             | Sends a file as a stream                                       |
| `res.download()`             | Prompts file download                                          |
| `res.end()`                  | Ends the response without data                                 |
| `res.type()`                 | Sets the `Content-Type` based on a file extension or MIME type |
| `res.location()`             | Sets the `Location` header (used by redirect internally)       |
| `res.append()`               | Appends a value to an existing header                          |
| `res.vary()`                 | Adds a field to the `Vary` header                              |

## `res.send()`

```js
app.get("/text", (req, res) => res.send("Plain text response"));
app.get("/obj", (req, res) => res.send({ message: "auto-converted to JSON" }));
app.get("/buf", (req, res) => res.send(Buffer.from("binary data")));
```

## `res.json()` — Preferred for APIs

```js
app.get("/api/user", (req, res) => {
  res.json({ id: 1, name: "Alice" });
});
```

`res.json()` explicitly sets `Content-Type: application/json` and stringifies the payload — use it for APIs even though `res.send()` would technically also work for objects.

## Status Codes

```js
app.post("/users", (req, res) => {
  res.status(201).json({ id: 1, name: "New user" }); // 201 Created
});

app.get("/missing", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.get("/ping", (req, res) => {
  res.sendStatus(200); // sends "OK" as the body
});
```

## Common Status Codes to Know

| Code    | Meaning                        |
| ------- | ------------------------------ |
| 200     | OK                             |
| 201     | Created                        |
| 204     | No Content                     |
| 301/302 | Redirect (permanent/temporary) |
| 400     | Bad Request                    |
| 401     | Unauthorized                   |
| 403     | Forbidden                      |
| 404     | Not Found                      |
| 409     | Conflict                       |
| 422     | Unprocessable Entity           |
| 429     | Too Many Requests              |
| 500     | Internal Server Error          |
| 503     | Service Unavailable            |

## Setting Headers

```js
app.get("/custom-header", (req, res) => {
  res.set("X-Custom-Header", "MyValue");
  res.set({
    "X-Powered-By": "MyApp",
    "X-Response-Time": "12ms",
  });
  res.send("Headers set");
});
```

## Redirects

```js
app.get("/old-page", (req, res) => {
  res.redirect("/new-page"); // 302 by default
});

app.get("/moved", (req, res) => {
  res.redirect(301, "https://example.com"); // permanent redirect
});

app.get("/back", (req, res) => {
  res.redirect("back"); // deprecated in newer versions; prefer explicit URL
});
```

## Cookies

```js
app.get("/set-cookie", (req, res) => {
  res.cookie("sessionId", "abc123", {
    maxAge: 900000, // ms
    httpOnly: true, // not accessible via client-side JS
    secure: true, // only sent over HTTPS
    sameSite: "strict", // CSRF protection
  });
  res.send("Cookie set");
});

app.get("/clear-cookie", (req, res) => {
  res.clearCookie("sessionId");
  res.send("Cookie cleared");
});
```

## Sending Files

```js
app.get("/download-report", (req, res) => {
  res.download("/files/report.pdf"); // prompts a file download
});

app.get("/view-image", (req, res) => {
  res.sendFile("/images/logo.png", { root: __dirname });
});
```

## Rendering Views (Server-Side Templates)

```js
app.set("view engine", "ejs");

app.get("/profile", (req, res) => {
  res.render("profile", { name: "Alice", age: 30 }); // renders views/profile.ejs
});
```

## Content Negotiation with `res.format()`

```js
app.get("/data", (req, res) => {
  res.format({
    "text/plain": () => res.send("Plain text"),
    "text/html": () => res.send("<p>HTML</p>"),
    "application/json": () => res.json({ msg: "JSON" }),
  });
});
```

## Chaining Response Methods

Most `res` methods return `res` itself, enabling chaining:

```js
app.post("/users", (req, res) => {
  res.status(201).set("X-Created", "true").json({ id: 1 });
});
```

## Common Mistake: Sending Multiple Responses

```js
app.get("/bad", (req, res) => {
  res.send("First response");
  res.send("Second response"); // ERROR: Cannot set headers after they are sent
});
```

Once `res.send()`/`res.json()`/`res.end()` is called, the response is finished — calling another response method throws `ERR_HTTP_HEADERS_SENT`.

## Common Interview-Style Questions

- **What's the difference between `res.send()` and `res.json()`?**
  `res.json()` always serializes the payload as JSON and sets the appropriate `Content-Type` header explicitly; `res.send()` is more general-purpose and infers content type based on the argument type.

- **How do you set both a status code and a JSON body?**
  Chain `res.status(code).json(data)`.

- **What error occurs if you call `res.send()` twice?**
  `Error: Cannot set headers after they are sent to the client` (`ERR_HTTP_HEADERS_SENT`).

- **How do you make a cookie inaccessible to client-side JavaScript?**
  Set the `httpOnly: true` option in `res.cookie()`.
