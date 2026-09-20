# 10. Email Verification

## Why Verify Email Addresses?

- Confirms the user actually owns/controls the email they registered with.
- Prevents spam/fake sign-ups and abuse of email-dependent features (password reset, notifications).
- Often a prerequisite before granting full account access (e.g., "please verify your email to continue").

## The General Flow

```
1. User signs up
2. Server creates the account (often marked unverified) and generates a verification token
3. Server emails a link containing that token: https://app.com/verify-email?token=xyz
4. User clicks the link
5. Server validates the token, marks the account as verified
```

## Data Model

```js
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: String,
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationTokenExpires: Date,
});
```

## Generating a Verification Token

Use a cryptographically random token — not a predictable value like a sequential ID.

```js
const crypto = require("crypto");

function generateVerificationToken() {
  return crypto.randomBytes(32).toString("hex"); // 64-char random hex string
}
```

## Signup: Creating an Unverified Account and Sending the Email

```js
const bcrypt = require("bcrypt");

app.post("/auth/signup", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = generateVerificationToken();

    const user = await User.create({
      email,
      passwordHash,
      isVerified: false,
      verificationToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    const verifyUrl = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: "Verify your email address",
      html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email. This link expires in 24 hours.</p>`,
    });

    res.status(201).json({
      message:
        "Account created. Please check your email to verify your account.",
    });
  } catch (err) {
    next(err);
  }
});
```

## Sending Email (Example with Nodemailer)

```bash
npm install nodemailer
```

```js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

async function sendEmail({ to, subject, html }) {
  await transporter.sendMail({
    from: '"MyApp" <no-reply@myapp.com>',
    to,
    subject,
    html,
  });
}
```

In production, many teams use a transactional email service (SendGrid, Postmark, AWS SES, Resend) instead of raw SMTP for better deliverability and analytics.

## Verifying the Token

```js
app.get("/auth/verify-email", async (req, res) => {
  const { token } = req.query;
  if (!token)
    return res.status(400).json({ error: "Missing verification token" });

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: Date.now() }, // must not be expired
  });

  if (!user) {
    return res
      .status(400)
      .json({ error: "Invalid or expired verification link" });
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  res.json({ message: "Email verified successfully" });
});
```

## Resending the Verification Email

Users often lose the original email or let it expire — always provide a resend option.

```js
app.post("/auth/resend-verification", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Respond identically whether the user exists or not, to avoid leaking account existence
  if (!user || user.isVerified) {
    return res.json({
      message: "If an account exists, a verification email has been sent.",
    });
  }

  user.verificationToken = generateVerificationToken();
  user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
  await user.save();

  const verifyUrl = `${process.env.APP_URL}/verify-email?token=${user.verificationToken}`;
  await sendEmail({
    to: user.email,
    subject: "Verify your email address",
    html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`,
  });

  res.json({
    message: "If an account exists, a verification email has been sent.",
  });
});
```

## Restricting Unverified Accounts

Depending on your product, you may fully block unverified users, or allow limited access with a reminder banner.

```js
function requireVerified(req, res, next) {
  if (!req.user.isVerified) {
    return res
      .status(403)
      .json({ error: "Please verify your email to access this feature" });
  }
  next();
}

app.post("/posts", authenticate, requireVerified, createPost);
```

## Rate Limiting the Resend Endpoint

Prevent abuse (email bombing a victim's inbox, or spamming your email provider's sending limits).

```js
const rateLimit = require("express-rate-limit");

app.post(
  "/auth/resend-verification",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3, // max 3 resend requests per 15 minutes per IP
  }),
  resendVerificationHandler,
);
```

## Using JWT Instead of a Random Token (Alternative Approach)

Some implementations use a signed JWT as the verification token instead of a random string stored in the DB — avoids a DB lookup/index for the token itself, at the cost of being harder to invalidate early.

```js
const verificationToken = jwt.sign(
  { sub: user.id, purpose: "email-verification" },
  process.env.JWT_SECRET,
  { expiresIn: "24h" },
);

// Verification:
app.get("/auth/verify-email", async (req, res) => {
  try {
    const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
    if (decoded.purpose !== "email-verification")
      throw new Error("Wrong token type");

    await User.findByIdAndUpdate(decoded.sub, { isVerified: true });
    res.json({ message: "Email verified" });
  } catch {
    res.status(400).json({ error: "Invalid or expired verification link" });
  }
});
```

> Tagging the token payload with a `purpose` field (as above) prevents a token generated for one purpose (e.g., password reset) from being reused for another (e.g., email verification) if you reuse the same signing secret across token types.

## Common Interview-Style Questions

- **Why should verification tokens be cryptographically random rather than predictable?**
  Predictable tokens (sequential IDs, easily guessable values) could let an attacker verify or hijack accounts they don't own; random tokens make guessing computationally infeasible.

- **Why give verification tokens an expiration time?**
  To limit the window an intercepted or leaked link remains usable, and to encourage users to complete signup promptly; expired tokens require requesting a fresh one.

- **Why respond identically whether or not an account exists when handling "resend verification"?**
  To avoid leaking which email addresses are registered in your system (user enumeration).

- **What's a security consideration when using JWTs for both email verification and password reset with the same secret?**
  Without differentiating the token's intended purpose (e.g., a `purpose` claim), a token issued for one flow could potentially be reused for the other if the verification logic doesn't check what it was originally issued for.
