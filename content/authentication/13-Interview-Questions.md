# 13. Interview Questions — Authentication (Comprehensive)

A consolidated set of commonly asked authentication/authorization interview questions, organized by topic, with concise answers and code where useful.

---

## Authentication vs Authorization

**Q: Difference between authentication and authorization?**
Authentication verifies who a user is; authorization determines what that verified user is allowed to do.

**Q: What HTTP status codes correspond to each failure?**
401 for authentication failures (missing/invalid credentials); 403 for authorization failures (valid identity, insufficient permission).

**Q: Can you have authorization without authentication?**
Generally no — you typically need to know who someone is before deciding what they can do, though some systems allow limited anonymous access levels.

---

## Sessions & Cookies

**Q: How does session-based authentication work?**
The server creates a session record after login (stored server-side) and gives the client a session ID via a cookie; on each request, the client sends the cookie, and the server looks up the session to identify the user.

**Q: Why is `express-session`'s default `MemoryStore` unsuitable for production?**
It doesn't persist across restarts and doesn't scale across multiple server instances — use Redis or a database-backed store instead.

**Q: What is session fixation, and how do you prevent it?**
An attack where an attacker sets/knows a victim's session ID before login and hijacks it after; prevented by regenerating the session ID on successful login.

**Q: What does the `HttpOnly` cookie flag protect against?**
It prevents client-side JavaScript from reading the cookie, mitigating token/session theft via XSS.

**Q: What does `SameSite` protect against?**
CSRF — by controlling whether the cookie is sent on cross-site requests. `Strict` is most secure; `Lax` is a common balanced default.

---

## JWT

**Q: What are the three parts of a JWT?**
Header (algorithm/type), Payload (claims), Signature (integrity verification).

**Q: Is JWT payload data encrypted?**
No — only Base64-encoded and readable by anyone; the signature only prevents tampering, not exposure. Never put secrets in the payload.

**Q: Why use both access and refresh tokens?**
Access tokens are short-lived to limit exposure if stolen; refresh tokens are longer-lived and used only to obtain new access tokens, and can be revoked server-side, balancing security with user convenience.

**Q: Why can't a stateless JWT be revoked before its expiry?**
Verification is purely cryptographic with no server-side lookup — introducing revocation requires a server-side blocklist/allowlist, which reintroduces statefulness.

**Q: What is refresh token rotation?**
Issuing a new refresh token every time the old one is used, invalidating the old one — enables detection of token theft if an old (already-rotated) token is reused.

---

## OAuth

**Q: Is OAuth authentication or authorization?**
Fundamentally authorization (granting access to resources); "Login with X" flows add identity verification on top, often formalized via OpenID Connect.

**Q: Walk through the Authorization Code flow.**
User redirected to provider → approves access → provider redirects back with a short-lived code → server exchanges code + client secret for an access token server-to-server → server fetches user profile with that token.

**Q: Why exchange the code for a token server-to-server instead of in the browser?**
To keep the client secret confidential and never expose it to client-side code.

**Q: Why request minimal OAuth scopes?**
Reduces the security surface if a token is compromised, and increases user trust/consent likelihood.

---

## NextAuth / Auth.js

**Q: What problem does Auth.js solve?**
It abstracts the boilerplate of implementing OAuth flows, session/JWT management, and CSRF protection for full-stack JS apps, with pre-built provider integrations.

**Q: What are the two session strategies in Auth.js?**
`jwt` (stateless) and `database` (stateful, via an adapter).

---

## RBAC & Permissions

**Q: What is RBAC?**
Role-Based Access Control — grouping permissions into named roles assigned to users, simplifying authorization management compared to per-user permission tracking.

**Q: Downside of embedding role directly in a JWT?**
Role changes won't take effect until the token expires/refreshes, since the token isn't re-checked against the database on every request.

**Q: Difference between RBAC and ABAC?**
RBAC grants access based on assigned role; ABAC evaluates broader attributes (user, resource, context) for more fine-grained, conditional rules like ownership or time-based restrictions.

**Q: How would you implement "users can edit their own posts, but admins can edit any post"?**
Check resource ownership (`post.authorId === user.id`) OR role === 'admin' in an authorization middleware/guard before allowing the action.

**Q: Difference between a role and a permission?**
A permission is a single fine-grained action (`posts:delete`); a role is a named bundle of permissions.

**Q: Why must permission checks always be enforced server-side even if the UI also hides based on permissions?**
Frontend checks are for UX only and can be bypassed by any client calling the API directly — the server is the actual security boundary.

---

## Password Hashing

**Q: Why can't you "decrypt" a hashed password?**
Hashing is one-way by design; there's no reverse operation — forgotten passwords require a reset flow, not recovery of the original.

**Q: Why is bcrypt preferred over SHA-256 for passwords?**
Bcrypt is intentionally slow and tunable (cost factor), making brute-force attacks impractical; SHA-256 is optimized for speed, the wrong property for password storage.

**Q: Do you need to store bcrypt's salt separately?**
No — it's embedded directly within the generated hash string.

**Q: Why use a generic error message like "Invalid email or password" instead of specifying which was wrong?**
To prevent user enumeration — avoiding leaking which emails are registered in the system.

---

## Email Verification & Forgot Password

**Q: Why should verification/reset tokens be cryptographically random?**
Predictable tokens could let an attacker guess or forge valid links; randomness makes guessing infeasible.

**Q: Why store a hash of a reset token instead of the raw token?**
Same principle as passwords — if the database is exposed, a raw stored token could be used directly, while a hashed one can't be reversed into a usable token.

**Q: Why invalidate existing sessions/refresh tokens after a password reset?**
The reset is often triggered by suspected compromise — an attacker's existing valid session/tokens would otherwise remain usable even after the password changes.

**Q: Why keep password reset token expiry shorter than email verification token expiry?**
Password reset is a higher-stakes action; a shorter window (e.g., 15 min vs 24 hours) reduces risk if the link is intercepted or leaked.

---

## MFA / 2FA

**Q: What are the three categories of authentication factors?**
Something you know (password), something you have (phone/security key), something you are (biometrics). True MFA combines factors from different categories.

**Q: How does TOTP work?**
A shared secret is established at enrollment; both server and authenticator app independently generate a time-based code from the secret + current time, compared with a small drift tolerance window.

**Q: Why is SMS-based 2FA weaker than TOTP or hardware keys?**
Vulnerable to SIM-swapping attacks, where an attacker transfers the victim's phone number to a device they control.

**Q: Why issue a "pending" token after password verification but before 2FA confirmation?**
To ensure the second factor is genuinely required — the pending token has no real API access, preventing a password-only bypass of 2FA.

**Q: Why offer backup/recovery codes for 2FA?**
Users can lose their phone/authenticator app; backup codes prevent permanent lockout.

---

## Practical / Coding Questions Often Asked Live

**Q: Write authentication middleware that verifies a JWT from a Bearer header.**

```js
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
```

**Q: Write a role-based authorization middleware factory.**

```js
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
```

**Q: Write a login handler using bcrypt and JWT.**

```js
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
  res.json({ token });
});
```

**Q: Write a refresh token endpoint with rotation.**

```js
app.post("/auth/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const stored = await RefreshToken.findOne({ token: refreshToken });
  if (!stored) return res.status(401).json({ error: "Invalid refresh token" });

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.sub);

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  await RefreshToken.deleteOne({ token: refreshToken });
  await RefreshToken.create({ userId: user.id, token: newRefreshToken });

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  res.json({ accessToken: newAccessToken });
});
```

**Q: How would you design an ownership-based authorization check for a DELETE endpoint?**

```js
app.delete("/posts/:id", authenticate, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: "Not found" });
  if (post.authorId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  await post.deleteOne();
  res.status(204).send();
});
```

**Q: How would you design a complete auth system from scratch for a new API?**
Password hashing with bcrypt for credential storage; short-lived JWT access tokens + long-lived, DB-tracked refresh tokens with rotation; email verification on signup; a forgot-password flow with hashed, short-expiry, single-use tokens; RBAC middleware for authorization; optional TOTP-based 2FA for sensitive accounts; rate limiting on all auth endpoints; HttpOnly/Secure/SameSite cookies if using cookie-based token storage; and centralized, consistent error handling that avoids leaking account existence or internal details.
