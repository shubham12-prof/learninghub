# 07. RBAC (Role-Based Access Control)

## What is RBAC?

RBAC is an authorization model where permissions are grouped into **roles**, and users are assigned one or more roles. Instead of checking individual permissions per user, you check whether their role(s) permit the action — much easier to manage at scale.

```
User -> has Role(s) -> Role has Permission(s) -> Permission allows/denies an Action
```

## Simple RBAC: Role Stored Directly on the User

```js
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: { type: String, enum: ["user", "editor", "admin"], default: "user" },
});
```

```js
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

app.delete(
  "/posts/:id",
  authenticate,
  authorize("admin", "editor"),
  deletePost,
);
app.get("/admin/dashboard", authenticate, authorize("admin"), getDashboard);
```

## Embedding Role in the JWT

```js
const token = jwt.sign(
  { sub: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "15m" },
);
```

```js
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // includes role
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
```

> **Caution:** If you embed role in the JWT, a role change (e.g., demoting an admin) won't take effect until the token expires or is refreshed — since the old token still carries the stale role. For high-stakes role changes, consider short access-token lifetimes or re-checking role from the DB on sensitive actions.

## Role Hierarchy

Some systems model roles hierarchically, where higher roles inherit lower roles' permissions.

```js
const ROLE_HIERARCHY = {
  user: 1,
  editor: 2,
  admin: 3,
};

function authorizeMinRole(minRole) {
  return (req, res, next) => {
    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole];
    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: "Insufficient role level" });
    }
    next();
  };
}

app.post("/posts", authenticate, authorizeMinRole("editor"), createPost); // editor OR admin
```

## Multiple Roles per User

```js
const userSchema = new mongoose.Schema({
  roles: [{ type: String, enum: ["user", "editor", "admin", "support"] }],
});
```

```js
function authorize(...allowedRoles) {
  return (req, res, next) => {
    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
```

## RBAC with a Dedicated Roles/Permissions Table (Scalable Approach)

For more complex systems, hard-coding role checks in middleware doesn't scale well. A database-driven RBAC model separates roles, permissions, and their mapping.

```js
// Schema sketch
// roles: { id, name }
// permissions: { id, name }  e.g. 'posts:delete', 'users:read'
// role_permissions: { roleId, permissionId }
// user_roles: { userId, roleId }

async function getUserPermissions(userId) {
  const roles = await UserRole.find({ userId }).populate("role");
  const roleIds = roles.map((r) => r.role.id);
  const permissions = await RolePermission.find({
    roleId: { $in: roleIds },
  }).populate("permission");
  return [...new Set(permissions.map((p) => p.permission.name))];
}

function requirePermission(permissionName) {
  return async (req, res, next) => {
    const permissions = await getUserPermissions(req.user.id);
    if (!permissions.includes(permissionName)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

app.delete(
  "/posts/:id",
  authenticate,
  requirePermission("posts:delete"),
  deletePost,
);
```

This decouples "what a role can do" from application code — permissions can be reassigned via an admin panel without redeploying.

## RBAC vs ABAC (Attribute-Based Access Control)

|                    | RBAC                            | ABAC                                                                                |
| ------------------ | ------------------------------- | ----------------------------------------------------------------------------------- |
| Basis for decision | Role assigned to the user       | Attributes of user, resource, and context (time, location, ownership, etc.)         |
| Complexity         | Simpler, easier to reason about | More flexible, but more complex to implement                                        |
| Example rule       | "Admins can delete any post"    | "Users can edit a post only if they created it AND it's within 24 hours of posting" |

```js
// ABAC-style check (attribute-based, not just role-based)
function canEditPost(user, post) {
  const isOwner = post.authorId === user.id;
  const withinEditWindow = Date.now() - post.createdAt < 24 * 60 * 60 * 1000;
  return isOwner && withinEditWindow;
}

app.put("/posts/:id", authenticate, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!canEditPost(req.user, post) && req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  // proceed with update
});
```

Many real-world systems combine both: RBAC for broad role-based gates (admin panel access), ABAC-style ownership checks for fine-grained per-resource rules.

## Resource Ownership Checks (Common RBAC Companion Pattern)

```js
async function requireOwnershipOrAdmin(req, res, next) {
  const resource = await Post.findById(req.params.id);
  if (!resource) return res.status(404).json({ error: "Not found" });

  const isOwner = resource.authorId === req.user.id;
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }
  req.resource = resource; // pass along to avoid a second DB lookup
  next();
}

app.delete("/posts/:id", authenticate, requireOwnershipOrAdmin, (req, res) => {
  req.resource.deleteOne();
  res.status(204).send();
});
```

## Common Interview-Style Questions

- **What is RBAC, and why is it preferred over checking individual permissions per user?**
  Role-Based Access Control groups permissions into named roles assigned to users, making authorization simpler to manage and reason about at scale compared to tracking every permission per individual user.

- **What's a downside of embedding a user's role directly in a JWT?**
  If the role changes (promotion, demotion, revocation), the change won't take effect until the existing token expires or is refreshed, since the token is self-contained and not re-checked against the database on every request.

- **What's the difference between RBAC and ABAC?**
  RBAC grants access based on a user's assigned role; ABAC evaluates access based on broader attributes (user, resource, and context), enabling more fine-grained, conditional rules like resource ownership or time-based restrictions.

- **How would you implement "users can only edit their own posts, but admins can edit any post"?**
  A combined check: verify the resource's owner ID matches the authenticated user's ID, OR the user's role is `admin` — implemented as ownership + role-based authorization middleware.
