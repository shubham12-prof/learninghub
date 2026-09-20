# Enums

A way to define a set of named constants — makes code more readable than using raw string/number literals scattered throughout.

```ts
enum Direction {
  Up, // 0
  Down, // 1
  Left, // 2
  Right, // 3
}
let move: Direction = Direction.Up;
console.log(Direction.Up); // 0
console.log(Direction[0]); // "Up" — numeric enums support REVERSE mapping
```

**String enums (no reverse mapping, but clearer runtime values — often preferred):**

```ts
enum Status {
  Active = "ACTIVE",
  Inactive = "INACTIVE",
  Pending = "PENDING",
}
let userStatus: Status = Status.Active;
console.log(userStatus); // "ACTIVE" — readable in logs/debugging, unlike numeric enums
```

**Custom numeric values:**

```ts
enum HttpStatus {
  OK = 200,
  NotFound = 404,
  ServerError = 500,
}
```

**`const enum`** — fully inlined at compile time (no runtime object generated), slightly more performant but with some tooling limitations (can't be used with `isolatedModules`, common in modern bundlers):

```ts
const enum Color {
  Red,
  Green,
  Blue,
}
let c = Color.Red; // compiles directly to `let c = 0;` — no Color object exists at runtime
```

**Modern alternative — union of string literals (often preferred over enums):**

```ts
type Status = "ACTIVE" | "INACTIVE" | "PENDING"; // no runtime object at all, pure compile-time type
let userStatus: Status = "ACTIVE";
```

**Enums vs union literal types:**

|                           | enum                      | union literal type       |
| ------------------------- | ------------------------- | ------------------------ |
| Runtime object generated? | Yes (except `const enum`) | No — purely compile-time |
| Bundle size impact        | small overhead            | zero                     |
| Autocomplete/type safety  | Yes                       | Yes                      |

**Interview note:** many modern TS style guides (including some official TS team commentary) now favor **union literal types** over enums for simple cases, since they add zero runtime overhead and integrate more smoothly with tools that process TS types statically without full type-checking (like esbuild/SWC) — but enums remain common in existing codebases and are fine to know well.
