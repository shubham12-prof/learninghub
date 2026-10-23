# 07 - Interview: Request-Response Flow, JWT and Error Handling

> **Time to learn:** ~60 min | **Interview frequency:** Almost guaranteed for full-stack roles
> Read `01` to `04` first. **Target:** answer the 3 core questions out loud in 30 to 60 seconds each, then handle the follow-ups.
> Every status code, message and behaviour quoted here was produced by the running API in `08`.

## 1. The 3 answers (say them out loud)

### Answer 1: "Explain the request-response flow. What happens when I click 'Save' on a course?"

> "The browser's JavaScript calls `fetch` with `PUT /api/me/saved/7` and an `Authorization: Bearer` header carrying the user's token. If the API is on another origin, the browser first sends a CORS preflight. The request travels over the network (DNS, TCP, TLS) to the server, which runs it through **middleware in order**: it assigns a request id, parses the JSON body, and **authenticates** by verifying the token's signature and expiry. Then the **route handler** validates the input, runs a **parameterised SQL query** against the database, and builds a response. The server returns a **status code**, headers and a JSON body, here `200 { saved: true }`. Back in the browser, my code checks `res.ok`, parses the JSON and **updates the UI** (for example, the button's state). If anything fails, an error middleware turns it into a consistent error response with the right status code, and the UI shows a message. HTTP is stateless, so everything the server needs, like who the user is, must be in the request."

**Follow-ups**

- _Where would you add caching?_ Browser (`Cache-Control`/`ETag` on GETs), a CDN for public data, an in-memory or Redis cache in front of the database.
- _What is middleware?_ A function `(req, res, next)` that runs before the handler; it can change the request, end the response, or call `next()`. Order matters.
- _What is CORS and who enforces it?_ A browser rule; the server opts in with `Access-Control-Allow-*` headers; the preflight is an `OPTIONS` request (verified in `01`).
- _What does the UI do on a 401?_ Clears the token and asks the user to log in again (the demo UI does exactly this).
- _How do you debug one request across layers?_ A **request id** returned as `X-Request-Id` and written in every server log line (shown in `08`).

### Answer 2: "How does JWT authentication work?"

> "On login the server checks the email and the **salted, slow-hashed** password, and then issues a **JSON Web Token**: three Base64 parts, header, payload and signature. The payload holds claims like `sub` (the user id), `role`, `iat` and `exp`, and the server signs it with a secret using HS256. The client sends it on every request in the `Authorization: Bearer` header. The server **verifies the signature and expiry** with no database lookup, then trusts the claims. If someone edits the payload, say to become admin, the signature no longer matches and the server answers 401. Important points: a JWT is **signed, not encrypted**, so I never put secrets in it; I **pin the algorithm** and use a strong secret from the environment; and I keep access tokens **short-lived**, around 15 minutes, with a refresh token for longevity, because a stateless JWT is **hard to revoke**. Authentication gives 401; if the user is logged in but not allowed, authorization gives 403."

**Follow-ups**

- _JWT vs sessions?_ Sessions store state on the server (easy to revoke, needs a shared store); JWTs carry state in the token (stateless and easy to scale, harder to revoke).
- _Where do you store the token?_ Memory or an `HttpOnly` cookie is safest against XSS (the cookie needs CSRF protection); `localStorage` is readable by any script on the page.
- _What's the difference between `verify` and `decode`?_ `decode` only reads the payload; `verify` checks the signature and expiry. Never make access decisions from `decode`.
- _What is `alg: none` and how do you defend?_ A forged token that claims no signature. Pin allowed algorithms; `jsonwebtoken` rejected it with `jwt signature is required`.
- _What do you do when the access token expires?_ Return 401 `Token expired`; the client calls the refresh endpoint, then repeats the request once.
- _Symmetric vs asymmetric signing?_ HS256 shares one secret (fine for one service); RS256/ES256 uses a private key to sign and a public key to verify (good when many services only need to verify).

### Answer 3: "How do you handle errors in an API?"

> "I separate **expected** errors from **bugs**. Expected ones, like invalid input, missing login, forbidden or not found, are thrown as a small `HttpError` with a status, a stable `code` and a message, and a **single error-handling middleware** at the end turns them into one consistent JSON shape: `{ error: { code, message, details } }`. I use correct status codes: 400 for malformed requests, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 422 validation failed, 413 too large. **Unexpected** errors are caught by the same middleware, **logged in full on the server** with a request id, and the client gets a **generic 500** with that request id, never a stack trace or SQL. On the client I check `res.ok` because `fetch` doesn't throw on 4xx or 5xx, map responses to typed errors, show friendly messages, and retry only transient failures like timeouts, 429 and 5xx, with backoff. I also validate every input and put database constraints behind it, so bad data can't get in even if one check is missed."

**Follow-ups**

- _Why not return the stack trace?_ It reveals internals (paths, libraries, SQL) to attackers. Log it, don't send it.
- _400 or 422?_ 400 for requests that can't be parsed; 422 for parsed-but-invalid data. Consistency matters more than the choice.
- _How does Express know it's an error handler?_ It has **four** parameters `(err, req, res, next)` and is registered **last**. In Express 5, a throw (or rejected promise) inside a handler reaches it automatically.
- _Which errors do you retry?_ Network errors, timeouts, 408, 429, 5xx; never other 4xx.
- _What do you log?_ Request id, method, path, status, duration, and the full error for 5xx. Never passwords or tokens.

## 2. The same flow as a diagram

```
Browser                          Server (Express)                            Database
  | fetch PUT /api/me/saved/7       |                                          |
  |  Authorization: Bearer <jwt>    |                                          |
  |-------------------------------->| 1 request-id + log                       |
  |                                 | 2 express.json() (10 kb limit)           |
  |                                 | 3 requireAuth: verify signature + exp    |
  |                                 | 4 handler: validate, check course exists |
  |                                 |-- INSERT OR IGNORE ... (user_id, 7) ---->|
  |                                 |<------------- 1 row changed -------------|
  |<--------------------------------| 200 {"saved":true,"courseId":7}          |
  | check res.ok -> update the UI   |   (X-Request-Id: a98ba2ed)               |
```

## 3. Quick-fire questions

| Question                                   | Short answer                                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Is HTTP stateful?                          | No. Each request stands alone; state comes from tokens or cookies.                           |
| `PUT` vs `POST`?                           | `PUT` sets a known resource (idempotent); `POST` creates or runs an action (not idempotent). |
| 401 vs 403?                                | 401 = not authenticated; 403 = authenticated but not allowed.                                |
| Why salt a password hash?                  | Same password gives different hashes; defeats pre-computed tables.                           |
| Why not `sha256` for passwords?            | Too fast to brute-force. Use scrypt, bcrypt or argon2.                                       |
| Where does SQL injection come from?        | Building SQL with string concatenation. Use parameters.                                      |
| What does a 500 mean?                      | A server bug or outage; the client can't fix it.                                             |
| What is idempotency?                       | Repeating the request leaves the same server state.                                          |
| What is a request id for?                  | Following one request through logs across services.                                          |
| How do you stop an API from being flooded? | Rate limiting (429 + `Retry-After`), size limits, auth, caching.                             |

## 4. Predict the output

**Q1** The token has expired. What status and `message` does `requireAuth` produce?

**Q2** A handler throws `new Error("db password is hunter2")`. What does the client receive, and what is logged?

**Q3** `POST /api/auth/login` with the body `{bad`. Status and `code`?

**Q4** A 20 KB JSON body is sent when the limit is 10 KB. Status and `code`?

**Q5** `GET /api/does-not-exist`. Is the response HTML or JSON, and which status?

**Q6** A proxy returns an HTML 502 page and your code runs `await res.json()`. What happens?

## 5. Answers

- **Q1:** **401** with `message: "Token expired"` (an invalid token gives `Invalid token`).
- **Q2:** The client receives **500** `{ error: { code: "INTERNAL", message: "Something went wrong", requestId } }` with **no** secret. The server log has the full error with the same request id (my test asserts the response doesn't contain the internal text).
- **Q3:** **400**, `code: "INVALID_JSON"`.
- **Q4:** **413**, `code: "PAYLOAD_TOO_LARGE"`. (My first version returned a 500 for this, which I found while probing and fixed: a client mistake must never be a 5xx.)
- **Q5:** **JSON**, status **404**, `code: "NOT_FOUND"`, message `No route for GET /api/does-not-exist`.
- **Q6:** It throws a **`SyntaxError`** (`Unexpected token '<' ... is not valid JSON`). The fix: check `res.ok` and the `Content-Type` before parsing, or parse the text inside a `try`, as the client in `06` does.

## Recap

- **Flow:** fetch -> (CORS preflight) -> network -> middleware (id, parse, auth) -> handler (validate, SQL) -> response -> check `res.ok` -> update the UI.
- **JWT:** signed claims; verify signature + expiry; short-lived; not encrypted; hard to revoke; 401 vs 403.
- **Errors:** expected = `HttpError` with a stable shape and the right status; unexpected = log it all, send a generic 500 with a request id; clients retry only transient failures.

## Checklist

- [ ] I can narrate the whole request-response flow in under a minute without notes
- [ ] I can explain a JWT, its risks and how to mitigate them
- [ ] I can explain my error-handling strategy on both server and client
- [ ] I can answer the follow-ups for each of the three answers
- [ ] I got Q1 to Q6 right without looking
