# 03. Cookies

## What Are Cookies?

Cookies are small key-value pairs stored by the browser and automatically sent back to the server with every request to the same domain (subject to path/domain/SameSite rules). They're the primary mechanism session-based auth uses to persist a session ID on the client, and are also used for tokens, preferences, tracking, etc.

```
Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Strict; Max-Age=3600
```

## Setting a Cookie in Express

```js
app.get("/set-cookie", (req, res) => {
  res.cookie("sessionId", "abc123", {
    maxAge: 1000 * 60 * 60, // 1 hour, in ms
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  res.send("Cookie set");
});
```

## Reading Cookies (`cookie-parser`)

```bash
npm install cookie-parser
```

```js
const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.get("/read-cookie", (req, res) => {
  console.log(req.cookies); // { sessionId: 'abc123' }
  res.json(req.cookies);
});
```

## Clearing a Cookie

```js
app.post("/logout", (req, res) => {
  res.clearCookie("sessionId");
  res.json({ message: "Logged out" });
});
```

## Key Cookie Attributes and Why They Matter

| Attribute             | Purpose                                                                             |
| --------------------- | ----------------------------------------------------------------------------------- |
| `HttpOnly`            | Prevents client-side JavaScript from reading the cookie — mitigates XSS-based theft |
| `Secure`              | Cookie only sent over HTTPS                                                         |
| `SameSite`            | Controls whether the cookie is sent on cross-site requests — mitigates CSRF         |
| `Max-Age` / `Expires` | Cookie lifetime                                                                     |
| `Domain`              | Which domain(s) the cookie applies to                                               |
| `Path`                | Which URL paths the cookie applies to                                               |

### `SameSite` Values

| Value    | Behavior                                                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Strict` | Cookie never sent on cross-site requests (even top-level navigation) — strongest CSRF protection, but can break cross-site login flows                    |
| `Lax`    | Cookie sent on top-level navigation (e.g., clicking a link) but not on cross-site subrequests (images, fetch, iframes) — good default balance             |
| `None`   | Cookie sent on all requests, including cross-site — requires `Secure` to also be set; needed for legitimate cross-site use cases (e.g., embedded widgets) |

```js
res.cookie("token", jwtToken, {
  httpOnly: true,
  secure: true,
  sameSite: "lax", // sensible default for most apps
  maxAge: 1000 * 60 * 60 * 24, // 1 day
});
```

## Signed Cookies (Tamper Detection)

```js
app.use(cookieParser(process.env.COOKIE_SECRET)); // enables signing

app.get("/set", (req, res) => {
  res.cookie("userId", "42", { signed: true });
  res.send("Signed cookie set");
});

app.get("/read", (req, res) => {
  console.log(req.signedCookies.userId); // '42' if valid, false if tampered
});
```

Signing doesn't encrypt the value (it's still readable by the client) — it only guarantees the value wasn't tampered with, since any modification invalidates the signature.

## Cookies vs `localStorage`/`sessionStorage` for Auth Tokens

|                     | Cookies (`HttpOnly`)                                                              | `localStorage`                                        |
| ------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Accessible to JS?   | No (if `HttpOnly`)                                                                | Yes                                                   |
| XSS vulnerability   | Lower — JS can't read the token even if XSS occurs                                | Higher — any injected script can read/steal the token |
| CSRF vulnerability  | Higher — automatically sent by the browser (mitigated via `SameSite`/CSRF tokens) | Lower — not automatically attached to requests        |
| Cross-domain use    | Harder — cookies are domain-scoped                                                | Easier to manually attach to any API's headers        |
| Persistence control | Server controls expiry via cookie attributes                                      | Client-side JS controls persistence entirely          |

**General guidance:** store sensitive auth tokens in `HttpOnly` cookies when possible (protects against XSS-based token theft), and mitigate CSRF with `SameSite` + CSRF tokens for cookie-based auth. If you must use `localStorage` (common in SPA/JWT setups), be extra rigorous about XSS prevention since it's the primary risk vector.

## Practical Example: Storing a JWT in an HttpOnly Cookie

```js
app.post("/login", async (req, res) => {
  const user = await authenticateUser(req.body);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60,
  });

  res.json({ message: "Logged in" });
});

function authenticate(req, res, next) {
  const token = req.cookies.token; // read from the HttpOnly cookie instead of a header
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
```

This pattern combines JWT's statelessness with the XSS-resistance of `HttpOnly` cookies — a common best practice for browser-based apps.

## Third-Party Cookies and Modern Browser Restrictions

Browsers increasingly restrict third-party cookies (cookies set by a domain other than the one in the address bar) by default, for privacy reasons. This affects embedded widgets, cross-domain SSO, and analytics — relevant context for any app split across multiple domains/subdomains.

## Common Interview-Style Questions

- **What does the `HttpOnly` flag do, and why does it matter for security?**
  It prevents client-side JavaScript from accessing the cookie, mitigating token/session theft via XSS attacks.

- **What does `SameSite=Lax` protect against, and what's the trade-off vs `Strict`?**
  It protects against CSRF by not sending the cookie on cross-site subrequests, while still allowing it on top-level navigations (like clicking a link) — `Strict` is more secure but can break some legitimate cross-site flows (e.g., some SSO redirects).

- **Why would you store a JWT in an `HttpOnly` cookie instead of `localStorage`?**
  `HttpOnly` cookies aren't readable by JavaScript, protecting the token from theft via XSS; `localStorage` is fully accessible to any script running on the page, making it a more attractive target if XSS occurs.

- **What does signing a cookie protect against, and what does it NOT protect against?**
  Signing protects against tampering (the server can detect if the value was modified), but does not encrypt the value — the cookie's content is still readable by the client/anyone who can inspect it.
