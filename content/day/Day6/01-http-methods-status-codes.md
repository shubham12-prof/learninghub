# 01 - HTTP: Request/Response, Methods, Status Codes, Headers, CORS

> **Time to learn:** ~55 min | **Level:** Core concept | **Interview frequency:** Almost guaranteed
> Everything below was run against a real Express 5 server (Node 22) and, for CORS, a real Chromium. The server is built in `08-project-trace-ui-to-db.md`.

## 1. The one idea

HTTP is a **conversation of one question and one answer**. The client sends a **request**; the server sends back one **response**; then the exchange is over (HTTP is **stateless**: the server does not remember you between requests unless you send something, such as a token, that identifies you).

```
REQUEST                                        RESPONSE
PUT /api/me/saved/1 HTTP/1.1                   HTTP/1.1 200 OK
Host: localhost:3000                           Content-Type: application/json; charset=utf-8
Authorization: Bearer eyJhbGciOi...            X-Request-Id: a98ba2ed
Content-Type: application/json
                                               {"saved":true,"courseId":1}
(optional body)
```

A request has: **method + path (+ query string) + headers + optional body**. A response has: **status code + headers + optional body**.

## 2. Analogy

A restaurant. The **method** is what you want to do (look at the menu, order, change your order, cancel). The **path** is which dish or table. The **headers** are the notes you hand over (your reservation name, allergies). The **status code** is the waiter's answer: "here you go" (200), "we made it for you" (201), "we don't have that" (404), "you need a reservation" (401), "that table is staff only" (403), "the kitchen is on fire" (500).

## 3. Methods

| Method    | Meaning                                     | Body?      | **Safe** (no change) | **Idempotent** (repeat = same result) | Typical success      |
| --------- | ------------------------------------------- | ---------- | -------------------- | ------------------------------------- | -------------------- |
| `GET`     | read                                        | no         | yes                  | yes                                   | 200                  |
| `POST`    | create / run an action                      | yes        | no                   | **no**                                | 201 (created) or 200 |
| `PUT`     | replace / set to this exact state           | yes        | no                   | yes                                   | 200 or 204           |
| `PATCH`   | change part of a resource                   | yes        | no                   | not guaranteed                        | 200                  |
| `DELETE`  | remove                                      | usually no | no                   | yes                                   | 204                  |
| `HEAD`    | like GET, headers only                      | no         | yes                  | yes                                   | 200                  |
| `OPTIONS` | "what may I do here?" (also CORS preflight) | no         | yes                  | yes                                   | 204                  |

- **Safe** = does not change anything on the server. Crawlers and prefetchers may call `GET` freely, so **never change data in a `GET`**.
- **Idempotent** = calling it 1 time or 10 times leaves the server in the **same state**. This matters for **retries**: after a network timeout you can safely retry a `PUT`/`DELETE`; retrying a `POST` may create a duplicate (see `06-coding-api-integration.md`, idempotency keys).

I ran the same requests twice against the API:

```
PUT    /api/me/saved/1  ->  200 {"saved":true,"courseId":1}
PUT    /api/me/saved/1  ->  200 {"saved":true,"courseId":1}     same result, still ONE row
DELETE /api/me/saved/1  ->  204
DELETE /api/me/saved/1  ->  204                                  same result: it is gone
```

(Some teams return 404 for the second `DELETE`. **The server state is still the same, so it is still idempotent**: idempotent talks about state, not about the status code.)

## 4. Status codes

Read the **first digit** first.

| Class   | Meaning          | Remember                                                            |
| ------- | ---------------- | ------------------------------------------------------------------- |
| **2xx** | success          | it worked                                                           |
| **3xx** | redirect         | go somewhere else                                                   |
| **4xx** | **client** error | _you_ sent something wrong; retrying the same request will not help |
| **5xx** | **server** error | _we_ failed; retrying may help                                      |

The codes you must know, and what my API returned:

| Code            | Name                                        | When                                               | Seen in the API                                      |
| --------------- | ------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| 200             | OK                                          | success with a body                                | `GET /api/courses`                                   |
| 201             | Created                                     | a new resource exists (send a `Location` header)   | `POST /api/auth/register`, admin `POST /api/courses` |
| 204             | No Content                                  | success, nothing to send back                      | `DELETE /api/me/saved/1`                             |
| 301 / 302       | Moved permanently / found                   | redirect                                           | n/a                                                  |
| 304             | Not Modified                                | your cached copy is still good (ETag)              | n/a                                                  |
| 400             | Bad Request                                 | the request can't be understood (e.g. broken JSON) | `POST /api/auth/login` with body `{bad`              |
| **401**         | **Unauthorized** (really "unauthenticated") | no valid credentials: no/invalid/expired token     | `GET /api/me/saved` with no token                    |
| **403**         | **Forbidden**                               | logged in, but **not allowed**                     | a student calling `POST /api/courses`                |
| 404             | Not Found                                   | no such resource or route                          | `GET /api/courses/9999`                              |
| 409             | Conflict                                    | clashes with current state (duplicate)             | registering the same email twice                     |
| 413             | Payload Too Large                           | body bigger than the limit                         | a 20 KB body when the limit is 10 KB                 |
| 422             | Unprocessable Content                       | understood, but **validation failed**              | `?level=Expert`, a 3-character password              |
| 429             | Too Many Requests                           | rate limit; look for `Retry-After`                 | the mock server in `06`                              |
| 500             | Internal Server Error                       | unexpected bug                                     | a crash in a handler                                 |
| 502 / 503 / 504 | bad gateway / unavailable / gateway timeout | upstream or overloaded                             | the lossy `/orders` in `06`                          |

**401 vs 403** is the classic question: **401 = "who are you?"** (identity missing or invalid), **403 = "I know who you are, and the answer is no."**

**400 vs 422**: both are "your fault". Many teams use **400 for malformed requests** (broken JSON) and **422 for well-formed but invalid data** (a field fails validation). The important part is to **be consistent** and send a body explaining the problem.

## 5. Headers you should recognise

| Header                        | Direction          | Purpose                                       |
| ----------------------------- | ------------------ | --------------------------------------------- |
| `Content-Type`                | both               | format of the body: `application/json`        |
| `Accept`                      | request            | the formats the client can read               |
| `Authorization`               | request            | credentials: `Bearer <token>`                 |
| `Cookie` / `Set-Cookie`       | request / response | cookies (sessions)                            |
| `Location`                    | response           | where the new resource lives (after 201)      |
| `Cache-Control`, `ETag`       | response           | caching                                       |
| `Retry-After`                 | response           | how long to wait (429, 503)                   |
| `X-Request-Id`                | response           | an id to find this request in the server logs |
| `Access-Control-Allow-Origin` | response           | CORS permission                               |

## 6. CORS in 60 seconds

Browsers enforce the **same-origin policy**: JavaScript running on `http://localhost:4031` may not **read** a response from `http://localhost:4030` (different port = different origin) unless that server says it is fine with `Access-Control-Allow-Origin`.

I tested it in headless Chromium with a page on port 4031 calling an API on port 4030:

| #   | Request                                      | API sends CORS headers? | Browser result               | What the **server saw**                                               |
| --- | -------------------------------------------- | ----------------------- | ---------------------------- | --------------------------------------------------------------------- |
| 1   | simple `GET`                                 | no                      | `TypeError: Failed to fetch` | `GET /data` **(it did run!)**                                         |
| 2   | simple `GET`                                 | yes                     | works                        | `GET /data`                                                           |
| 3   | `POST` with `Content-Type: application/json` | no                      | `TypeError: Failed to fetch` | only `OPTIONS /data` (the **preflight**); the POST was **never sent** |
| 4   | `POST` with `Content-Type: application/json` | yes                     | works                        | `OPTIONS /data`, then `POST /data`                                    |

What that teaches:

1. **CORS is enforced by the browser, not the server.** In case 1 the server happily ran the request; the browser just refused to give the response to your JavaScript. `curl` and server-to-server calls are not affected.
2. A request that isn't "simple" (JSON content type, custom headers like `Authorization`, methods like `PUT`/`DELETE`) triggers a **preflight**: the browser first sends `OPTIONS` asking permission, and only sends the real request if the answer allows it.
3. The fix is on the **server**: send `Access-Control-Allow-Origin` (and `-Headers`, `-Methods` for preflights) for the origins you trust. In Express this is usually the `cors` package. **Never** reflect `*` blindly for credentialed APIs.
4. In development you can avoid CORS entirely by serving the UI and API from the **same origin** (that is what `08` does: Express serves the HTML) or by using a dev-server proxy.

## 7. `fetch` and status codes (a favourite trap)

```js
const res = await fetch("/api/courses/9999");
console.log(res.ok, res.status); // false 404  <- fetch did NOT throw
```

`fetch` only **rejects** when the request could not be made at all (network down, DNS failure, connection refused, CORS blocked, aborted). **A 404 or 500 is a successful HTTP exchange**, so you must check `res.ok` yourself. I verified: a 404 gives `ok: false, status: 404` with no exception, and a refused connection throws `TypeError: fetch failed`.

## 8. Common mistakes

1. Using `GET` to change data (links get prefetched; caches may serve it).
2. Returning **200** for everything, with `{ success: false }` in the body. Use real status codes.
3. Confusing **401 and 403**.
4. Returning **500** for bad user input. If the client can fix it, it's a **4xx**.
5. Forgetting that `fetch` **doesn't throw on 4xx/5xx**.
6. Thinking CORS protects the server. It protects the **user's browser**; the server must still authenticate and validate.
7. Sending a body with `GET`.
8. Retrying `POST` blindly (duplicates) but not retrying `GET`/`PUT`/`DELETE` when it would be safe.
9. Sending sensitive data in the **query string** (it ends up in logs and history). Use headers or the body.
10. Using `404` for "not logged in" (that is 401), or 401 for "not allowed" (that is 403).

## 9. Predict the output

Use the API from `08` (a student user is logged in; course 1 exists; `DELETE` removes saved rows).

**Q1** `PUT /api/me/saved/1` is sent **twice**. What are the two status codes, and how many rows end up in `saved_courses`?

**Q2** `DELETE /api/me/saved/1` is sent twice. What are the two status codes?

**Q3** A student (not admin) sends a valid `POST /api/courses` with a valid token. Which status?

**Q4** `GET /api/me/saved` with **no** `Authorization` header. Which status? And `GET /api/courses?level=Expert`?

**Q5** Does this `catch` run when the server answers 404?

```js
try {
  const res = await fetch("/api/courses/9999");
  console.log("got a response");
} catch {
  console.log("caught");
}
```

**Q6** A page at `http://localhost:3000` calls `fetch("http://localhost:4000/x", { method: "DELETE" })` and the API sends no CORS headers. Does the `DELETE` run on the server?

## 10. Answers

- **Q1:** `200` and `200`; **one** row (`INSERT OR IGNORE` + a composite primary key).
- **Q2:** `204` and `204` (the second finds nothing to delete, which is fine).
- **Q3:** **403**. The token is valid (so not 401); the role is wrong.
- **Q4:** **401** (`Missing bearer token`). `?level=Expert` is **422** (`Invalid level`).
- **Q5:** It prints **"got a response"**. `fetch` doesn't throw on a 404.
- **Q6:** **No.** `DELETE` needs a preflight; the browser sends `OPTIONS`, sees no permission and never sends the `DELETE` (same as case 3 in the table).

## Recap

- Request = method + path + headers + body. Response = status + headers + body. HTTP is stateless.
- **Safe** = no change; **idempotent** = same state after repeats (GET, PUT, DELETE yes; POST no).
- 2xx ok, 4xx your fault, 5xx our fault. **401 = who are you, 403 = not allowed**, 409 conflict, 422 validation.
- `fetch` doesn't reject on 4xx/5xx; check `res.ok`.
- **CORS is a browser rule**; preflight `OPTIONS` happens for JSON/`Authorization`/`PUT`/`DELETE`.

## Checklist

- [ ] I can explain safe vs idempotent and give an example of each
- [ ] I can pick the right status code for create, delete, invalid input, no login, no permission, duplicate
- [ ] I can explain 401 vs 403 in one sentence
- [ ] I can explain what a CORS preflight is and who enforces CORS
- [ ] I know `fetch` does not throw on a 404
- [ ] I got Q1 to Q6 right without looking
