# 03 - Authentication: Passwords, Sessions, JWT, Authorization

> **Time to learn:** ~60 min | **Level:** Core concept | **Interview frequency:** Almost guaranteed
> Read `01-http-methods-status-codes.md` first. Every output below was produced by running the code (Node 22, `jsonwebtoken` 9.0.3).

## 1. Two different questions

|                            | Question                      | Failure                        | Code    |
| -------------------------- | ----------------------------- | ------------------------------ | ------- |
| **Authentication (authn)** | _Who are you?_                | no/invalid/expired credentials | **401** |
| **Authorization (authz)**  | _What are you allowed to do?_ | logged in, but not permitted   | **403** |

Authn always comes first; authz needs to know who you are.

## 2. Analogy

A concert. The **wristband** you get at the gate after showing your ticket and ID is authentication. The **colour** of the wristband (general, VIP, crew) decides which areas you may enter: authorization. A wristband that is forged, or that expired at midnight, gets you stopped at the gate.

## 3. Passwords: never store them

Store a **salted, slow hash**, never the password (and never encrypted: encryption can be reversed).

```js
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password) {
  const salt = randomBytes(16); // unique per user: same password -> different hash
  const hash = scryptSync(password, salt, 64); // deliberately slow: makes guessing expensive
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
  return timingSafeEqual(actual, expected); // constant-time compare
}
```

Why each piece: **salt** defeats pre-computed tables and hides that two users share a password; **slow** (scrypt, bcrypt, argon2) makes brute force costly (a fast hash like SHA-256 alone is the wrong tool); **timingSafeEqual** avoids leaking information through comparison time. The test suite checks that two hashes of the same password differ and both verify. In production use a maintained library (argon2, bcrypt) rather than hand-rolling.

Login uses the **same message** for "unknown email" and "wrong password" (`Invalid email or password`), so attackers can't discover which emails are registered.

## 4. Sessions vs JWT

|                             | **Session (cookie)**         | **JWT (token)**                                                |
| --------------------------- | ---------------------------- | -------------------------------------------------------------- |
| What the client holds       | a random **session id**      | a signed token **containing the claims**                       |
| Where the data lives        | **server** (memory/Redis/DB) | **in the token**                                               |
| Each request                | server looks up the session  | server **verifies the signature** (no lookup)                  |
| Revoke / log out everywhere | easy: delete the session     | hard: valid until it expires (needs a deny-list or short life) |
| Scaling across servers      | needs a shared store         | stateless: any server can verify                               |
| Typical storage             | `HttpOnly` cookie            | memory, or an `HttpOnly` cookie                                |
| Good for                    | classic web apps             | APIs, mobile apps, microservices                               |

Neither is "more secure" by itself; the details (storage, expiry, HTTPS) decide.

## 5. What a JWT is

Three **base64url** parts separated by dots: `header.payload.signature`.

I decoded a real token issued by the login route:

```
header   { alg: 'HS256', typ: 'JWT' }
payload  { role: 'student', iat: 1792642289, exp: 1792643189, sub: '1' }
signature (43 characters)
```

- **`sub`** = subject (the user id), **`iat`** = issued at, **`exp`** = expiry (seconds since 1970). Here `exp - iat = 900` seconds = **15 minutes**.
- The signature is `HMAC-SHA256(base64url(header) + "." + base64url(payload), secret)`.
- **The payload is only encoded, NOT encrypted.** Anyone can read it. Never put passwords or secrets in it.
- **Signed means tamper-proof, not secret.** If someone edits the payload, the signature no longer matches.

```js
import jwt from "jsonwebtoken";

const token = jwt.sign({ role: user.role }, secret, {
  subject: String(user.id),
  expiresIn: "15m",
  algorithm: "HS256",
});
const payload = jwt.verify(token, secret, { algorithms: ["HS256"] }); // checks signature AND expiry, or throws
```

### The attacks I ran (and what stopped them)

| Attack                                                                        | Result                                                |
| ----------------------------------------------------------------------------- | ----------------------------------------------------- |
| Change `"role":"student"` to `"admin"` in the payload, keep the old signature | `401 Invalid token` (the signature no longer matches) |
| Verify with the wrong secret                                                  | `JsonWebTokenError: invalid signature`                |
| Header `{"alg":"none"}` and no signature (forged admin)                       | `JsonWebTokenError: jwt signature is required`        |
| Use an expired token                                                          | `TokenExpiredError: jwt expired`                      |
| `jwt.decode(token)` on an untrusted token                                     | **returns the payload without checking anything**     |

Lessons: always use **`verify`**, never `decode`, to trust a token; **pin the algorithm** (`algorithms: ["HS256"]`) so an attacker can't pick `none`; keep the **secret** long, random and out of the code (the server in `08` refuses to start without `JWT_SECRET`).

## 6. The middleware

```js
function requireAuth(req, res, next) {
  const header = req.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) throw unauthorized("Missing bearer token");
  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    req.user = { id: Number(payload.sub), role: payload.role };
    next();
  } catch (err) {
    throw unauthorized(
      err.name === "TokenExpiredError" ? "Token expired" : "Invalid token",
    );
  }
}

const requireRole = (role) => (req, res, next) => {
  if (req.user?.role !== role) throw forbidden(`Requires role: ${role}`);
  next();
};

app.post("/api/courses", requireAuth, requireRole("admin"), createCourse); // authn, then authz, then the handler
```

What I observed: no header -> `401 Missing bearer token`; `Bearer garbage` -> `401 Invalid token`; a student on the admin route -> `403 Requires role: admin`.

## 7. Where does the client keep the token?

| Storage                                         | XSS (injected script) can read it? | CSRF (a forged request from another site)?            |
| ----------------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| JS variable / `sessionStorage` / `localStorage` | **yes**                            | no (you attach it by hand)                            |
| `HttpOnly` cookie                               | **no**                             | **yes**, unless you add `SameSite` and/or CSRF tokens |

The demo UI in `08` uses `sessionStorage` for simplicity. A common production pattern: a **short-lived access token** (5 to 15 minutes) plus a longer-lived **refresh token** in an `HttpOnly; Secure; SameSite` cookie, so a stolen access token expires quickly and the user is not logged out every 15 minutes.

## 8. Common mistakes

1. Storing plain or fast-hashed passwords.
2. Using `jwt.decode` where `jwt.verify` is needed.
3. Not pinning `algorithms`, or accepting `none`.
4. Putting secrets or personal data in the payload (it is **readable**).
5. A **long-lived** token with no revocation plan.
6. A hard-coded or short secret committed to git.
7. Returning **403 for a missing login** or 401 for a missing permission.
8. Checking the role in the **UI only**. The UI hides the button, but the **server** must enforce it.
9. Telling the attacker which part failed ("no such user").
10. Sending tokens over plain HTTP. Always HTTPS.

## 9. Predict the output

**Q1** A JWT has `exp` in the past. `jwt.verify` is called. What happens?

**Q2** A student edits their token payload to `role: "admin"` and sends it with the original signature. Status and message?

**Q3** Is this safe? Why or why not?

```js
const user = jwt.decode(req.get("authorization").split(" ")[1]);
if (user.role === "admin") grantAccess();
```

**Q4** Two users register with the same password `correct-horse-1`. Are the stored hashes equal?

**Q5** Can you read the `sub` and `role` from a token without the secret?

**Q6** A logged-in student calls `POST /api/courses`. 401 or 403?

## 10. Answers

- **Q1:** it **throws** `TokenExpiredError: jwt expired` (the middleware answers `401 Token expired`).
- **Q2:** **`401 Invalid token`**: the signature is checked against the edited payload and fails.
- **Q3:** **Not safe.** `decode` doesn't check the signature or expiry, so anyone can forge `role: "admin"`. Use `jwt.verify`.
- **Q4:** **No.** Each hash has its own random salt (verified by a test).
- **Q5:** **Yes.** The payload is only base64url-encoded. Signed does not mean secret.
- **Q6:** **403.** The user is authenticated; they just lack the role.

## Recap

- **401** = not authenticated, **403** = authenticated but not allowed.
- Hash passwords with a **salt** and a **slow** algorithm; compare in constant time.
- JWT = `header.payload.signature`; **signed, not encrypted**. Always `verify`, pin the algorithm, keep it short-lived.
- Sessions: easy to revoke; JWT: stateless but hard to revoke.
- Enforce authorization on the **server**, in middleware, after authentication.

## Checklist

- [ ] I can explain authn vs authz and 401 vs 403
- [ ] I can explain why passwords are salted and slow-hashed
- [ ] I can draw a JWT and say what `sub`, `iat`, `exp` mean
- [ ] I can name two JWT attacks and what blocks them
- [ ] I can compare sessions and JWTs, including revocation
- [ ] I got Q1 to Q6 right without looking
