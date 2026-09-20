# 08. Permissions

## What Are Permissions?

Permissions are the fine-grained building blocks of authorization — individual actions a user is (or isn't) allowed to perform, such as `posts:create`, `users:delete`, `billing:view`. Roles (RBAC) are typically just named bundles of permissions.

```
Permission: a single allowed action (e.g., "posts:delete")
Role: a named collection of permissions (e.g., "editor" = ["posts:create", "posts:edit"])
```

## Permission Naming Conventions

A common convention: `resource:action`, optionally with a scope.

```
posts:read
posts:create
posts:update
posts:delete
users:read
users:update:self      -- scoped: only their own record
users:update:any        -- scoped: any user's record (admin-level)
billing:view
billing:manage
```

## Defining Permissions and Roles

```js
const PERMISSIONS = {
  user: ["posts:read", "comments:create"],
  editor: [
    "posts:read",
    "posts:create",
    "posts:update",
    "comments:create",
    "comments:delete",
  ],
  admin: [
    "posts:read",
    "posts:create",
    "posts:update",
    "posts:delete",
    "users:read",
    "users:delete",
  ],
};

function getPermissionsForRole(role) {
  return PERMISSIONS[role] || [];
}
```

## Permission-Checking Middleware

```js
function requirePermission(permission) {
  return (req, res, next) => {
    const userPermissions = getPermissionsForRole(req.user.role);
    if (!userPermissions.includes(permission)) {
      return res
        .status(403)
        .json({ error: `Missing permission: ${permission}` });
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
app.post("/posts", authenticate, requirePermission("posts:create"), createPost);
```

## Multiple Permissions (AND / OR Logic)

```js
function requireAllPermissions(...permissions) {
  return (req, res, next) => {
    const userPermissions = getPermissionsForRole(req.user.role);
    const hasAll = permissions.every((p) => userPermissions.includes(p));
    if (!hasAll)
      return res.status(403).json({ error: "Missing required permissions" });
    next();
  };
}

function requireAnyPermission(...permissions) {
  return (req, res, next) => {
    const userPermissions = getPermissionsForRole(req.user.role);
    const hasAny = permissions.some((p) => userPermissions.includes(p));
    if (!hasAny)
      return res.status(403).json({ error: "Missing required permissions" });
    next();
  };
}
```

## Scoped Permissions ("Own" vs "Any")

Many systems distinguish between acting on your own resources vs any resource — a very common real-world requirement.

```js
function requirePermission(action, resourceGetter) {
  return async (req, res, next) => {
    const userPermissions = getPermissionsForRole(req.user.role);
    const resource = await resourceGetter(req);

    if (userPermissions.includes(`${action}:any`)) {
      req.resource = resource;
      return next();
    }

    if (
      userPermissions.includes(`${action}:own`) &&
      resource.ownerId === req.user.id
    ) {
      req.resource = resource;
      return next();
    }

    return res.status(403).json({ error: "Forbidden" });
  };
}

app.put(
  "/posts/:id",
  authenticate,
  requirePermission("posts:update", (req) => Post.findById(req.params.id)),
  updatePostHandler,
);
```

## Database-Driven Permissions (Dynamic, Admin-Configurable)

Instead of hard-coding a `PERMISSIONS` object in code, store roles/permissions in the database so they can be managed via an admin UI without a redeploy.

```js
// Schema sketch:
// permissions: { id, name }         e.g. "posts:delete"
// roles: { id, name }               e.g. "editor"
// role_permissions: { roleId, permissionId }
// users: { id, roleId }

async function userHasPermission(userId, permissionName) {
  const user = await User.findById(userId).populate("role");
  const rolePermissions = await RolePermission.find({
    roleId: user.role.id,
  }).populate("permission");
  return rolePermissions.some((rp) => rp.permission.name === permissionName);
}

function requirePermission(permissionName) {
  return async (req, res, next) => {
    const allowed = await userHasPermission(req.user.id, permissionName);
    if (!allowed) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
```

## Caching Permission Lookups

Database-driven permission checks add a query per request — cache them (in-memory with TTL, or Redis) to avoid a DB hit on every single protected route.

```js
const permissionCache = new Map(); // simple in-memory example; use Redis in production

async function getCachedPermissions(userId) {
  if (permissionCache.has(userId)) return permissionCache.get(userId);
  const permissions = await fetchPermissionsFromDb(userId);
  permissionCache.set(userId, permissions);
  setTimeout(() => permissionCache.delete(userId), 5 * 60 * 1000); // 5 min TTL
  return permissions;
}
```

> Invalidate the cache immediately when a user's role/permissions change (e.g., on promotion/demotion), not just on TTL expiry, to avoid stale authorization decisions.

## Feature Flags vs Permissions (Related but Different)

- **Permissions** answer: "Is this user _allowed_ to do X?" (authorization)
- **Feature flags** answer: "Is feature X _enabled_ for this user/environment right now?" (rollout control)

They're sometimes implemented with similar mechanisms but serve different purposes — don't conflate access control with gradual feature rollout logic.

## Exposing Permissions to the Frontend

APIs commonly return the current user's permissions/role on login so the frontend can conditionally render UI (though the backend must **always** re-enforce these checks — frontend checks are for UX only, never security).

```js
app.get("/auth/me", authenticate, (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    role: req.user.role,
    permissions: getPermissionsForRole(req.user.role),
  });
});
```

```jsx
// Frontend — UX-only convenience, NOT a security boundary
{
  user.permissions.includes("posts:delete") && <DeleteButton />;
}
```

## Common Interview-Style Questions

- **What's the difference between a role and a permission?**
  A permission is a single fine-grained allowed action (`posts:delete`); a role is a named bundle of permissions assigned to users, simplifying management.

- **How would you support "users can edit their own posts, but editors can edit any post"?**
  Use scoped permissions (`posts:update:own` vs `posts:update:any`), checking resource ownership for the "own" scope and skipping that check for the "any" scope.

- **Why cache permission lookups, and what's the risk of doing so?**
  It avoids a database query on every protected request, improving performance; the risk is serving stale authorization decisions if a user's permissions change and the cache isn't invalidated immediately.

- **Why must permission checks always be enforced server-side, even if the frontend also hides UI based on permissions?**
  Frontend checks are purely for UX (hiding buttons/features) and can be trivially bypassed by any client calling the API directly — the server is the actual security boundary and must independently verify every protected action.
