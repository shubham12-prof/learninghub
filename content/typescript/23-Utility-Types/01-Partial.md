# Partial

Makes all properties of a type **optional**. Useful for update/patch operations where you only need to supply a subset of fields.

```ts
interface User {
  id: number;
  name: string;
  email: string;
}

type PartialUser = Partial<User>;
// equivalent to: { id?: number; name?: string; email?: string }

function updateUser(id: number, updates: Partial<User>) {
  // caller can pass any subset of User's fields
}
updateUser(1, { name: "New Name" });          // ✅ only updating name
updateUser(1, { email: "new@example.com" });     // ✅ only updating email
```

**How it's implemented internally (a mapped type with the `?` modifier):**
```ts
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};
```

**Common real-world pattern — merging partial updates into an existing object:**
```ts
function applyUpdates<T>(original: T, updates: Partial<T>): T {
  return { ...original, ...updates };
}
```

**Interview note:** `Partial<T>` is one of the most frequently used utility types in real codebases — especially for PATCH-style API request bodies, form state that fills in gradually, and default/options objects where every field has a sensible fallback.
