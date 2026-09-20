# Object Types

Describing the shape of an object — which properties it has and their types.

```ts
// Inline object type annotation
let user: { name: string; age: number } = { name: "Alice", age: 25 };

// Optional properties with `?`
let config: { debug?: boolean; verbose?: boolean } = {}; // both fields optional

// Readonly properties — can't be reassigned after creation
let point: { readonly x: number; readonly y: number } = { x: 0, y: 0 };
// point.x = 10; // ❌ Cannot assign to 'x' because it is a read-only property

// Nested object types
let profile: { user: { name: string }; settings: { theme: string } } = {
  user: { name: "Alice" },
  settings: { theme: "dark" },
};
```

**Index signatures — for objects with dynamic/unknown keys:**

```ts
let scores: { [username: string]: number } = {
  alice: 95,
  bob: 87,
};
scores["carol"] = 78; // valid — any string key maps to a number
```

**Excess property checks — TS flags typos in object literals assigned directly:**

```ts
function createUser(user: { name: string; age: number }) {}
createUser({ name: "Alice", age: 25, extra: true }); // ❌ 'extra' does not exist on type

const obj = { name: "Alice", age: 25, extra: true };
createUser(obj); // ✅ allowed — excess property checks only apply to object LITERALS, not variables
```

**Interview note:** in practice, most real code uses `interface` or `type` (see their own files) to name and reuse object shapes rather than writing inline object type annotations repeatedly — inline shapes are mainly useful for small, one-off, or very local type descriptions.
