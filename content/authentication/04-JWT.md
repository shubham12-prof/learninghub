# 04. JWT (JSON Web Tokens)

## What is a JWT?

A JWT (JSON Web Token) is a compact, self-contained, cryptographically signed token used to represent claims (data) about a user or entity. It enables **stateless authentication** — the server doesn't need to look up a session store to verify who a request is from; it just verifies the token's signature.

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcxOTk5OTk5OSwiZXhwIjoxNzIwMDAwODk5fQ.4f8j3...
```

---

## Structure

A JWT consists of three Base64URL-encoded parts, separated by dots: `header.payload.signature`.

### 1. Header

Describes the algorithm and token type.

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### 2. Payload (Claims)

The actual data — user info and metadata. **Not encrypted**, only encoded — never put secrets in it.

```json
{
  "sub": "42",
  "role": "admin",
  "iat": 1719999999,
  "exp": 1720000899
}
```

Common standard claims:

| Claim | Meaning                       |
| ----- | ----------------------------- |
| `sub` | Subject — usually the user ID |
| `iat` | Issued At (timestamp)         |
| `exp` | Expiration time (timestamp)   |
| `iss` | Issuer                        |
| `aud` | Audience (intended recipient) |

### 3. Signature

Computed by signing the header + payload with a secret (HMAC) or private key (RSA/ECDSA):

```
HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

The signature ensures the token wasn't tampered with — any change to the header/payload invalidates the signature.

### Creating and Verifying a JWT (Node.js)

```bash
npm install jsonwebtoken
```

```js
const jwt = require("jsonwebtoken");

// Create
const token = jwt.sign(
  { sub: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "15m" },
);

// Verify
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log(decoded); // { sub: '42', role: 'admin', iat: ..., exp: ... }
} catch (err) {
  console.log("Invalid or expired token");
}
```

> **Important:** The payload is Base64-encoded, not encrypted — anyone can decode and read it (try jwt.io). Never put passwords, secrets, or sensitive PII directly in the payload.

---

## Access Token

A **short-lived** token sent with every API request to prove identity, typically via the `Authorization: Bearer <token>` header.

```js
function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }, // short-lived — minutes, not days
  );
}
```

Using it:

```js
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired access token" });
  }
}

app.get("/profile", authenticate, (req, res) => res.json(req.user));
```

Short expiry limits the damage window if an access token is stolen — even if compromised, it becomes useless within minutes.

---

## Refresh Token

A **long-lived** token used only to obtain a new access token when the current one expires — it's never sent with regular API requests, only to a dedicated `/refresh` endpoint.

```js
function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }, // long-lived — days/weeks
  );
}
```

### Why Two Separate Tokens?

|           | Access Token                         | Refresh Token                             |
| --------- | ------------------------------------ | ----------------------------------------- |
| Lifetime  | Short (minutes)                      | Long (days/weeks)                         |
| Sent with | Every API request                    | Only to the refresh endpoint              |
| Storage   | Memory or short-lived cookie         | HttpOnly cookie or secure storage         |
| Purpose   | Prove identity for API calls         | Obtain a new access token                 |
| If leaked | Limited damage window (expires soon) | Bigger risk — needs revocation capability |

### Storing Refresh Tokens Server-Side (for Revocation)

Pure stateless JWTs can't be revoked before expiry. A common hybrid approach stores refresh tokens (or their hashes) in the database, so they can be invalidated on logout, password change, or suspected compromise.

```js
// On login: store the refresh token (or a hash of it) in the DB, tied to the user
await RefreshToken.create({ userId: user.id, token: refreshToken, expiresAt: /* ... */ });

// On logout: delete it
await RefreshToken.deleteOne({ token: refreshToken });

// On refresh: verify it still exists in the DB before issuing a new access token
const stored = await RefreshToken.findOne({ token: refreshToken });
if (!stored) return res.status(401).json({ error: 'Refresh token revoked or invalid' });
```

---

## Expiry

Choosing appropriate expiry times balances security (shorter = safer) against user experience (longer = fewer re-logins).

```js
jwt.sign(payload, secret, { expiresIn: "15m" }); // 15 minutes
jwt.sign(payload, secret, { expiresIn: "1h" }); // 1 hour
jwt.sign(payload, secret, { expiresIn: "7d" }); // 7 days
```

| Token Type               | Typical Expiry      |
| ------------------------ | ------------------- |
| Access token             | 5–15 minutes        |
| Refresh token            | 7–30 days           |
| Password reset token     | 15 minutes – 1 hour |
| Email verification token | 24 hours            |

### Handling Expiry on the Client

```js
try {
  const decoded = jwt.verify(token, secret);
} catch (err) {
  if (err.name === "TokenExpiredError") {
    // trigger refresh flow
  } else {
    // invalid token — force re-login
  }
}
```

---

## Refresh Flow

The full cycle of using short-lived access tokens backed by a long-lived refresh token.

```
1. User logs in -> server issues { accessToken (15m), refreshToken (7d) }
2. Client stores accessToken (memory) and refreshToken (HttpOnly cookie)
3. Client calls API with accessToken in Authorization header
4. Access token expires -> API returns 401
5. Client calls POST /auth/refresh with the refreshToken
6. Server verifies refreshToken, issues a NEW accessToken (and often a new refreshToken — "rotation")
7. Client retries the original request with the new accessToken
```

### Implementation

```js
// Login
app.post("/auth/login", async (req, res) => {
  const user = await authenticateUser(req.body);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await RefreshToken.create({ userId: user.id, token: refreshToken });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken });
});

// Refresh
app.post("/auth/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: "No refresh token" });

  const stored = await RefreshToken.findOne({ token: refreshToken });
  if (!stored) return res.status(401).json({ error: "Refresh token revoked" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.sub);

    const newAccessToken = generateAccessToken(user);

    // Refresh token rotation — issue a new one, invalidate the old
    const newRefreshToken = generateRefreshToken(user);
    await RefreshToken.deleteOne({ token: refreshToken });
    await RefreshToken.create({ userId: user.id, token: newRefreshToken });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});

// Logout
app.post("/auth/logout", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) await RefreshToken.deleteOne({ token: refreshToken });
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
});
```

### Refresh Token Rotation (Security Best Practice)

Each time a refresh token is used, issue a **brand new** refresh token and invalidate the old one. If a stolen refresh token is ever reused after rotation, the mismatch reveals the theft, and you can revoke the entire token family.

```js
if (stored.used) {
  // Reuse detected! This refresh token was already rotated once — possible theft.
  await RefreshToken.deleteMany({ userId: stored.userId }); // revoke everything, force re-login
  return res.status(401).json({ error: "Security alert: please log in again" });
}
```

## Common Interview-Style Questions

- **What are the three parts of a JWT?**
  Header (algorithm/type), Payload (claims/data), and Signature (verifies integrity).

- **Is a JWT payload encrypted?**
  No — it's only Base64-encoded, meaning anyone can decode and read it. Never store secrets or sensitive data directly in it; the signature only protects against tampering, not exposure.

- **Why use both an access token and a refresh token instead of one long-lived token?**
  It balances security and usability: the access token is short-lived to limit exposure if stolen, while the refresh token allows re-authentication without forcing the user to log in repeatedly, and can be revoked server-side.

- **Why can't you truly "revoke" a stateless JWT before it expires?**
  Because verification is purely cryptographic (no server-side lookup) — the token remains valid until its `exp` claim passes, unless you introduce a server-side blocklist/allowlist, which reintroduces state.

- **What is refresh token rotation, and why is it recommended?**
  Issuing a new refresh token every time the old one is used (and invalidating the old one) — this lets the server detect token theft, since a stolen-and-reused old token after rotation signals a breach, prompting full revocation.
