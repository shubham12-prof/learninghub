# 11. Forgot Password

## The General Flow

```
1. User clicks "Forgot Password" and submits their email
2. Server generates a short-lived, single-use reset token
3. Server emails a link containing that token: https://app.com/reset-password?token=xyz
4. User clicks the link, enters a new password
5. Server validates the token, updates the password hash, invalidates the token
6. (Recommended) Server invalidates all existing sessions/refresh tokens for that user
```

## Data Model

```js
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: String,
  resetToken: String, // stores a HASH of the token, not the raw token
  resetTokenExpires: Date,
});
```

> **Important:** Store a **hash** of the reset token in the database, not the raw token itself — just like passwords. If your database is ever read (breach, backup leak), a raw stored token could be used directly to reset any account; a hashed token can't be reversed to forge a valid reset link.

## Step 1: Request a Password Reset

```js
const crypto = require("crypto");

function generateResetToken() {
  const rawToken = crypto.randomBytes(32).toString("hex"); // sent to the user via email
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex"); // stored in DB
  return { rawToken, hashedToken };
}

app.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same way whether or not the account exists —
  // prevents leaking which emails are registered (user enumeration).
  const genericResponse = {
    message:
      "If an account with that email exists, a reset link has been sent.",
  };

  if (!user) return res.json(genericResponse);

  const { rawToken, hashedToken } = generateResetToken();
  user.resetToken = hashedToken;
  user.resetTokenExpires = Date.now() + 15 * 60 * 1000; // 15-minute expiry — short window for security
  await user.save();

  const resetUrl = `${process.env.APP_URL}/reset-password?token=${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your password",
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 15 minutes.</p>
           <p>If you didn't request this, you can safely ignore this email.</p>`,
  });

  res.json(genericResponse);
});
```

## Step 2: Validate the Token and Set a New Password

```js
app.post("/auth/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ error: "Token and new password are required" });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetToken: hashedToken,
    resetTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ error: "Invalid or expired reset link" });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  await user.save();

  // Invalidate all existing sessions/refresh tokens — critical security step
  await RefreshToken.deleteMany({ userId: user.id });

  await sendEmail({
    to: user.email,
    subject: "Your password was changed",
    html: `<p>Your password was just changed. If this wasn't you, contact support immediately.</p>`,
  });

  res.json({
    message: "Password reset successful. Please log in with your new password.",
  });
});
```

## Why Invalidate Sessions/Refresh Tokens After a Reset

If an attacker gained access to the account (which is often _why_ the user is resetting their password), simply changing the password isn't enough — any existing valid sessions or refresh tokens the attacker already holds would otherwise remain usable. Revoking them forces re-authentication everywhere.

## Rate Limiting the Forgot-Password Endpoint

Prevents abuse: flooding a victim's inbox, or brute-forcing tokens by requesting many reset emails.

```js
const rateLimit = require("express-rate-limit");

app.post(
  "/auth/forgot-password",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3, // max 3 reset requests per 15 minutes per IP
  }),
  forgotPasswordHandler,
);
```

## Password Reset Token Best Practices Checklist

- Use a cryptographically random token (`crypto.randomBytes`), never a predictable value.
- Store only a **hash** of the token in the database.
- Set a **short expiry** (typically 15 minutes to 1 hour).
- Make the token **single-use** — clear it immediately after a successful reset.
- Respond **identically** whether or not the email exists (prevent user enumeration).
- **Invalidate existing sessions/refresh tokens** after a successful reset.
- Notify the user via email that their password was changed (in case it wasn't them).
- **Rate limit** both the request and confirm steps.

## Enforcing Password Strength on Reset

```js
const { z } = require("zod");

const newPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128);

app.post("/auth/reset-password", async (req, res) => {
  const result = newPasswordSchema.safeParse(req.body.newPassword);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }
  // ...proceed with reset
});
```

## Alternative: JWT-Based Reset Tokens

Similar trade-off to email verification — a signed JWT avoids a separate DB-stored token but is harder to invalidate before natural expiry unless you also track token usage server-side.

```js
const resetToken = jwt.sign(
  { sub: user.id, purpose: "password-reset" },
  process.env.JWT_SECRET,
  { expiresIn: "15m" },
);

app.post("/auth/reset-password", async (req, res) => {
  try {
    const decoded = jwt.verify(req.body.token, process.env.JWT_SECRET);
    if (decoded.purpose !== "password-reset")
      throw new Error("Wrong token type");

    const user = await User.findById(decoded.sub);
    user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch {
    res.status(400).json({ error: "Invalid or expired reset link" });
  }
});
```

Even with JWTs, it's good practice to track a "used" flag or a `passwordChangedAt` timestamp on the user so a reset token can't be reused twice even within its validity window.

```js
// Include a marker of the user's last password change in the JWT verification logic:
if (decoded.iat < user.lastPasswordResetAt) {
  return res
    .status(400)
    .json({ error: "This reset link has already been used" });
}
```

## Common Interview-Style Questions

- **Why should you store a hash of the reset token instead of the raw token in the database?**
  Just like passwords — if the database is ever exposed, a raw stored token could be used directly to reset any account; a hashed value can't be reversed into a usable token.

- **Why respond identically to a forgot-password request whether or not the email exists?**
  To prevent user enumeration — leaking which email addresses have registered accounts.

- **Why should you invalidate existing sessions/refresh tokens after a successful password reset?**
  Because the reset is often triggered due to a suspected account compromise; simply changing the password doesn't revoke sessions/tokens an attacker may have already obtained, so those must be explicitly invalidated.

- **Why keep reset token expiry short (e.g., 15 minutes) compared to something like email verification (24 hours)?**
  Password reset is a higher-stakes, security-sensitive action — a shorter window reduces the risk if the reset email is intercepted or the link is accidentally shared/leaked.
