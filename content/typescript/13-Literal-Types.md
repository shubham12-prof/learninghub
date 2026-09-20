# Literal Types

Instead of a general type like `string`, a literal type restricts a value to one **exact** value (or a small fixed set of them, via unions).

```ts
let direction: "up" | "down" | "left" | "right"; // union of string literal types
direction = "up"; // ✅
// direction = "north"; // ❌ Type '"north"' is not assignable

let statusCode: 200 | 404 | 500; // numeric literal types
statusCode = 200; // ✅
// statusCode = 201; // ❌

let isEnabled: true; // boolean literal type — can ONLY be `true`, never `false`
```

**Literal types with `const` vs `let` — inference differs:**

```ts
const direction = "up"; // inferred as the LITERAL type "up" (since const can't change)
let direction2 = "up"; // inferred as the WIDER type `string` (since let could be reassigned)

function move(dir: "up" | "down") {}
move(direction); // ✅ works — "up" literal matches
move(direction2); // ❌ error — `string` is too wide, might not be "up" or "down"
```

**`as const` — forces literal (narrow) typing on an object/array, not just primitives:**

```ts
const config = { mode: "dark", version: 2 };
// config.mode inferred as `string`, config.version as `number` — too wide

const configLiteral = { mode: "dark", version: 2 } as const;
// configLiteral.mode inferred as `"dark"`, configLiteral.version as `2` — exact literal types
// and all properties become readonly
```

**Common real-world use — discriminated unions rely on literal types (see Advanced Types file):**

```ts
type Success = { status: "success"; data: string };
type Failure = { status: "error"; message: string };
type Result = Success | Failure; // "status" literal acts as a tag to distinguish the variants
```

**Interview note:** literal types are what make string-union APIs (like `"up" | "down"` instead of a loose `string`) type-safe — combined with `as const`, they're the foundation of discriminated unions, one of TypeScript's most powerful patterns for modeling variant data.
