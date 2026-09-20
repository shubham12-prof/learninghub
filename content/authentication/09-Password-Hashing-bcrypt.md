# 09. Password Hashing (bcrypt)

## Why You Must Never Store Plain-Text Passwords

If your database is ever breached, plain-text passwords immediately compromise every user account — and since people reuse passwords across sites, the damage extends far beyond your own app. Passwords must always be **hashed** before storage, using an algorithm specifically designed to be slow and resistant to brute-force/rainbow-table attacks.

## Hashing vs Encryption — Important Distinction

- **Encryption** is reversible (you can decrypt it back with a key) — used for data you need to read again later.
- **Hashing** is one-way (you cannot "unhash" a hash back into the original password) — used for verification, not retrieval. You never "recover" a forgotten password; you only ever compare a new hash against the stored one.

## Why Not Just Use SHA-256/MD5?

General-purpose hash functions like SHA-256 or MD5 are designed to be **fast** — great for checksums, terrible for password storage, since that speed lets attackers brute-force billions of guesses per second on modern GPUs. Password hashing algorithms (bcrypt, scrypt, argon2) are deliberately **slow** and **tunable**, making brute-force attacks impractically expensive.

## What is bcrypt?

bcrypt is a widely-used, battle-tested password hashing algorithm that:

- Automatically generates and embeds a random **salt** per password (defeats rainbow table attacks, since identical passwords produce different hashes).
- Has a configurable **cost factor** (also called salt rounds) controlling how computationally expensive hashing is — can be tuned as hardware gets faster.

## Installing and Basic Usage

```bash
npm install bcrypt
```

```js
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12; // higher = more secure but slower; 10-12 is a common production range

// Hashing a password (e.g., during signup)
async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

// Verifying a password (e.g., during login)
async function verifyPassword(plainPassword, storedHash) {
  return bcrypt.compare(plainPassword, storedHash);
}
```

## Full Signup/Login Example

```js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.post("/auth/signup", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash });

    res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    next(err);
  }
});

app.post("/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    // Use a generic error message for both "no user" and "wrong password" —
    // don't reveal which one failed, to avoid leaking which emails are registered.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (err) {
    next(err);
  }
});
```

## Anatomy of a bcrypt Hash

```
$2b$12$KIXhPfnG8Y1L3z8N9QwXeuYRj7fJZ1mF5c8sV9dQwXeuYRj7fJZ1m
 └┬┘└┬┘└──────────┬──────────┘└─────────────┬────────────┘
  │  │             │                          │
  │  │        22-char salt              31-char hash
  │  └─ cost factor (2^12 rounds)
  └─ algorithm identifier (bcrypt variant)
```

The salt is stored **as part of the hash string itself**, so `bcrypt.compare()` can extract it automatically — you never need to store the salt separately.

## Choosing a Salt Round Count

| Rounds | Approx. Time per Hash (varies by hardware) | Use Case                                           |
| ------ | ------------------------------------------ | -------------------------------------------------- |
| 10     | ~65ms                                      | Minimum acceptable for most apps                   |
| 12     | ~250ms                                     | Good default for production (2024–2026 hardware)   |
| 14     | ~1s                                        | High-security applications, less latency-sensitive |

Higher rounds mean more CPU time per login/signup — balance security against your acceptable latency and server load.

## Never Do This

```js
// BAD — plain text
await User.create({ email, password: req.body.password });

// BAD — fast, unsalted (or manually salted) generic hash
const hash = crypto.createHash("sha256").update(password).digest("hex");

// BAD — comparing hashes with a naive string comparison for anything security-sensitive
// (bcrypt.compare already handles timing-safe comparison internally — always use it)
if (hash === storedHash) {
  /* ... */
}
```

## Password Strength Requirements (Complementary, Not a Replacement for Hashing)

Enforce reasonable complexity/length requirements at signup — but remember these are a UX/policy layer, not a substitute for proper hashing.

```js
const { z } = require("zod");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[0-9]/, "Must contain a number");
```

> Modern guidance (NIST 800-63B) actually favors **length over complexity rules** — encouraging long passphrases and checking against known-breached password lists, rather than forcing arbitrary special-character requirements that often lead to predictable patterns (`Password1!`).

## Checking Against Known Breached Passwords

```bash
npm install hibp
```

```js
const { pwnedPassword } = require("hibp");

app.post("/auth/signup", async (req, res) => {
  const breachCount = await pwnedPassword(req.body.password);
  if (breachCount > 0) {
    return res
      .status(400)
      .json({
        error:
          "This password has appeared in a known data breach. Please choose another.",
      });
  }
  // proceed with hashing and account creation
});
```

## Rehashing on Login (Upgrading Cost Factor Over Time)

If you increase `SALT_ROUNDS` later, existing hashes remain valid (bcrypt embeds the original cost factor), but you can opportunistically re-hash on next successful login to migrate users to the new standard.

```js
app.post("/auth/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const isValid = await bcrypt.compare(req.body.password, user.passwordHash);
  if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

  const currentRounds = bcrypt.getRounds(user.passwordHash);
  if (currentRounds < 12) {
    user.passwordHash = await bcrypt.hash(req.body.password, 12); // upgrade silently
    await user.save();
  }

  // issue token...
});
```

## argon2 — A Modern Alternative

`argon2` (winner of the 2015 Password Hashing Competition) is considered by many security experts to be an even stronger choice than bcrypt today, with better resistance to GPU/ASIC cracking due to its memory-hardness.

```bash
npm install argon2
```

```js
const argon2 = require("argon2");

const hash = await argon2.hash(password); // memory-hard, tunable
const isValid = await argon2.verify(hash, password);
```

Both bcrypt and argon2 are acceptable modern choices; bcrypt remains extremely common and well-supported, while argon2 is increasingly recommended for new systems.

## Common Interview-Style Questions

- **Why can't you just decrypt a hashed password if a user forgets it?**
  Hashing is a one-way function by design — there's no reverse operation. "Forgot password" flows work by issuing a new password reset token, never by recovering the original password.

- **Why is bcrypt preferred over a fast hash like SHA-256 for passwords?**
  Bcrypt is intentionally slow and computationally expensive (tunable via cost factor), making large-scale brute-force attacks impractical; SHA-256 is optimized for speed, which is exactly the wrong property for password storage.

- **Do you need to store the salt separately when using bcrypt?**
  No — bcrypt embeds the salt directly within the generated hash string, so it's automatically available for verification via `bcrypt.compare()`.

- **Why use a generic "Invalid email or password" error message instead of specifying which one was wrong?**
  To avoid leaking whether a given email is registered in your system (user enumeration), which could otherwise aid targeted attacks or privacy violations.

- **What does the bcrypt "cost factor" (salt rounds) control?**
  How computationally expensive each hash operation is — higher values increase security against brute-force attacks at the cost of more CPU time per hash operation.
