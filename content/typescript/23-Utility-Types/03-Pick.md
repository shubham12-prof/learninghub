# Pick

Constructs a new type by selecting a **subset of properties** (keys) from an existing type.

```ts
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

type PublicUser = Pick<User, "id" | "name" | "email">;
// equivalent to: { id: number; name: string; email: string }
// notice `password` is deliberately excluded

function getPublicProfile(user: User): PublicUser {
  return { id: user.id, name: user.name, email: user.email };
}
```

**How it's implemented internally:**

```ts
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};
// K extends keyof T ensures you can only pick keys that actually exist on T
```

**Common real-world use — deriving a narrower "view" type for a specific use case (e.g., an API response that shouldn't leak sensitive fields):**

```ts
type UserSummary = Pick<User, "id" | "name">; // for a compact list view
type UserForEdit = Pick<User, "name" | "email">; // for an edit form
```

**Interview note:** `Pick` is the go-to tool for deriving a smaller, purpose-specific type FROM a larger canonical type (like a full DB model) — rather than manually redefining and duplicating a subset of fields, which would go out of sync as the original type evolves.
