# 01. Authentication vs Authorization

## The Core Distinction

|                        | Authentication (AuthN)                | Authorization (AuthZ)                           |
| ---------------------- | ------------------------------------- | ----------------------------------------------- |
| Question answered      | "Who are you?"                        | "What are you allowed to do?"                   |
| Happens                | First, at login/identity verification | After authentication, on every protected action |
| Example                | Logging in with email/password        | Checking if a logged-in user can delete a post  |
| HTTP status on failure | `401 Unauthorized`                    | `403 Forbidden`                                 |

A simple mental model: **authentication proves identity; authorization grants (or denies) access based on that identity.**

## Authentication in Practice

Verifying a claimed identity — typically via credentials (password), a token (JWT, session ID), or a third-party identity provider (Google, GitHub via OAuth).

```js
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password" }); // AuthN failure
  }

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
  res.json({ token });
});
```

## Authorization in Practice

Once identity is established, authorization determines what that identity can do — usually implemented as middleware checking roles/permissions against the requested action.

```js
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" }); // AuthZ failure
    }
    next();
  };
}

app.delete(
  "/posts/:id",
  authenticate,
  authorize("admin", "editor"),
  deletePostHandler,
);
```

## The Full Request Lifecycle

```
Request -> Authentication (who?) -> Authorization (allowed?) -> Business Logic -> Response
                 |                          |
            401 if fails               403 if fails
```

```js
app.get("/admin/reports", authenticate, authorize("admin"), (req, res) => {
  res.json({ report: "confidential data" });
});
```

Two different clients hitting this route:

1. **No token at all** → `401 Unauthorized` (we don't even know who they are)
2. **Valid token, but role is `'user'`, not `'admin'`** → `403 Forbidden` (we know who they are, they just can't do this)

## Common Real-World Mechanisms

| Authentication Mechanisms         | Authorization Mechanisms              |
| --------------------------------- | ------------------------------------- |
| Username/password + session       | Role-Based Access Control (RBAC)      |
| JWT (stateless tokens)            | Attribute-Based Access Control (ABAC) |
| OAuth 2.0 / social login          | Permission lists / scopes             |
| API keys                          | Access Control Lists (ACL)            |
| Multi-Factor Authentication (MFA) | Resource ownership checks             |

## A Common Mistake: Conflating the Two

```js
// WRONG mental model: "if the token is valid, they can do anything"
app.delete("/users/:id", authenticate, (req, res) => {
  deleteUser(req.params.id); // no authorization check — any logged-in user can delete ANY user!
});
```

```js
// CORRECT: authentication confirms identity, authorization confirms permission
app.delete("/users/:id", authenticate, (req, res) => {
  const isSelf = req.user.id === req.params.id;
  const isAdmin = req.user.role === "admin";
  if (!isSelf && !isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }
  deleteUser(req.params.id);
});
```

## Common Interview-Style Questions

- **What's the difference between authentication and authorization, in one sentence each?**
  Authentication verifies who a user is; authorization determines what that verified user is permitted to do.

- **What HTTP status codes correspond to each failure type?**
  401 for authentication failures (missing/invalid credentials); 403 for authorization failures (valid identity, insufficient permission).

- **Can you have authorization without authentication?**
  Generally no — you need to know who someone is before you can meaningfully decide what they're allowed to do (though some systems allow limited "anonymous" permission levels).

- **Give an example of a system with authentication but no meaningful authorization.**
  A simple app where every logged-in user has identical access to everything — authentication exists (login required) but there's no differentiation of permissions afterward.
