# 05. OAuth

## What is OAuth?

OAuth 2.0 is an authorization framework that lets a user grant a third-party application limited access to their data on another service (Google, GitHub, Facebook) **without sharing their password** with that third-party app. It's the standard behind "Login with Google/GitHub/Facebook" buttons.

> OAuth is technically an **authorization** protocol, not an authentication protocol — but in practice, "Login with Google" flows layer identity (via OpenID Connect, built on top of OAuth 2.0) to also authenticate the user.

## Key Roles in OAuth

| Role                     | Description                                                                      |
| ------------------------ | -------------------------------------------------------------------------------- |
| **Resource Owner**       | The user granting access                                                         |
| **Client**               | Your application requesting access                                               |
| **Authorization Server** | The provider verifying identity and issuing tokens (e.g., Google's OAuth server) |
| **Resource Server**      | The API holding the user's data (e.g., Google's People API)                      |

---

## OAuth Flow (Authorization Code Flow — Most Common)

This is the standard flow for server-side web apps.

```
1. User clicks "Login with Google" on your app
2. Your app redirects the user to Google's authorization URL
3. User logs into Google (if not already) and approves the requested permissions
4. Google redirects back to your app's callback URL with an authorization CODE
5. Your server exchanges that code (+ client secret) for an ACCESS TOKEN (and often an ID token) via a server-to-server request
6. Your server uses the access token to fetch the user's profile from Google's API
7. Your app creates/updates a local user record and starts a session (or issues your own JWT)
```

```
┌────────┐                                   ┌──────────────┐
│ Browser│                                   │ Authorization│
│ (User) │                                   │    Server     │
└───┬────┘                                   └──────┬───────┘
    │ 1. Click "Login with Google"                    │
    │ 2. Redirect to Google auth URL                  │
    ├─────────────────────────────────────────────────>
    │ 3. User approves                                │
    │ 4. Redirect back with ?code=xyz                 │
    <─────────────────────────────────────────────────┤
    │                                                  │
┌───▼────┐  5. Exchange code for token (server-side)  │
│  Your  │────────────────────────────────────────────>
│ Server │  6. Access token + user profile returned    │
│        │<────────────────────────────────────────────
└────────┘  7. Create session / issue your own JWT
```

---

## Google Login

### Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com).
2. Configure the OAuth consent screen.
3. Create OAuth 2.0 credentials (Client ID + Client Secret).
4. Add an authorized redirect URI, e.g. `http://localhost:3000/auth/google/callback`.

### Using `passport-google-oauth20`

```bash
npm install passport passport-google-oauth20 express-session
```

```js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0].value,
          });
        }
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    },
  ),
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
```

```js
const app = express();
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(passport.initialize());
app.use(passport.session());

// Step 1: redirect to Google
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

// Step 2: Google redirects back here with the code (handled internally by passport)
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/dashboard"); // successful login
  },
);
```

---

## GitHub Login

### Setup

1. Register an OAuth app at GitHub → Settings → Developer settings → OAuth Apps.
2. Set the callback URL, e.g. `http://localhost:3000/auth/github/callback`.

```bash
npm install passport-github2
```

```js
const GitHubStrategy = require("passport-github2").Strategy;

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/auth/github/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      let user = await User.findOne({ githubId: profile.id });
      if (!user) {
        user = await User.create({
          githubId: profile.id,
          name: profile.displayName || profile.username,
          email: profile.emails?.[0]?.value,
          avatar: profile.photos?.[0]?.value,
        });
      }
      done(null, user);
    },
  ),
);

app.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user:email"] }),
);

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => res.redirect("/dashboard"),
);
```

---

## Facebook Login

### Setup

1. Create an app at [Facebook Developers](https://developers.facebook.com).
2. Add the "Facebook Login" product, configure a valid OAuth redirect URI.

```bash
npm install passport-facebook
```

```js
const FacebookStrategy = require("passport-facebook").Strategy;

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "/auth/facebook/callback",
      profileFields: ["id", "displayName", "emails", "photos"],
    },
    async (accessToken, refreshToken, profile, done) => {
      let user = await User.findOne({ facebookId: profile.id });
      if (!user) {
        user = await User.create({
          facebookId: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0]?.value,
          avatar: profile.photos?.[0]?.value,
        });
      }
      done(null, user);
    },
  ),
);

app.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["email"] }),
);

app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  (req, res) => res.redirect("/dashboard"),
);
```

---

## Issuing Your Own JWT After OAuth Login

Many apps use OAuth purely for identity verification, then issue their **own** JWT for subsequent API auth (decoupling from the provider after initial login).

```js
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    const token = jwt.sign({ sub: req.user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
    res.redirect("/dashboard");
  },
);
```

## Linking Multiple OAuth Providers to One Account

A common real-world requirement: a user might sign up via Google, then later also want to log in via GitHub, both mapping to the same account (matched by verified email).

```js
async function findOrCreateUser(provider, profile) {
  const email = profile.emails?.[0]?.value;
  let user = await User.findOne({ [`${provider}Id`]: profile.id });
  if (user) return user;

  // Try matching by verified email to link accounts
  if (email) {
    user = await User.findOne({ email });
    if (user) {
      user[`${provider}Id`] = profile.id;
      await user.save();
      return user;
    }
  }

  return User.create({
    [`${provider}Id`]: profile.id,
    email,
    name: profile.displayName,
  });
}
```

## Scopes — Requesting Only What You Need

```js
passport.authenticate("google", { scope: ["profile", "email"] }); // minimal, standard
passport.authenticate("github", { scope: ["user:email", "repo"] }); // 'repo' = broader access, request only if truly needed
```

Always request the **minimum** scopes necessary — broader scopes increase both the security surface and user hesitation to grant access.

## Common Interview-Style Questions

- **Is OAuth an authentication protocol or an authorization protocol?**
  Fundamentally an authorization protocol (granting access to resources); "Login with X" flows layer identity verification on top, often formalized via OpenID Connect (built on OAuth 2.0).

- **Walk through the Authorization Code flow at a high level.**
  User is redirected to the provider, approves access, provider redirects back with a short-lived authorization code, your server exchanges that code (plus a client secret) for an access token server-to-server, then uses that token to fetch the user's profile.

- **Why is the code exchanged for a token server-to-server rather than directly in the browser?**
  To keep the client secret confidential — it never touches the browser/client-side code, preventing it from being exposed or stolen.

- **Why request minimal OAuth scopes?**
  To reduce the security surface if a token is compromised, and to increase user trust/consent rate — broad scope requests raise suspicion and risk.

- **How would you support a user logging in via multiple OAuth providers into the same account?**
  Match/link accounts by verified email address during the OAuth callback, storing each provider's ID (`googleId`, `githubId`, etc.) on the same user record.
