# Union Types

A value that can be **one of several types**, expressed with `|`.

```ts
let id: string | number;
id = "abc123"; // ✅
id = 123; // ✅
// id = true;    // ❌ boolean isn't part of the union

function printId(id: string | number) {
  console.log(id);
}
```

**Using a union value requires narrowing before accessing type-specific members (see Type Narrowing file):**

```ts
function formatId(id: string | number) {
  if (typeof id === "string") {
    return id.toUpperCase(); // ✅ safe — TS knows it's a string here
  }
  return id.toFixed(2); // ✅ safe — TS knows it's a number here
}
```

**Union of object types (often combined with a discriminant property — "discriminated unions"):**

```ts
type Circle = { kind: "circle"; radius: number };
type Square = { kind: "square"; side: number };
type Shape = Circle | Square;

function area(shape: Shape): number {
  if (shape.kind === "circle") return Math.PI * shape.radius ** 2;
  return shape.side ** 2;
}
```

**Union with `null`/`undefined` — the standard way to express optional/nullable values:**

```ts
function findUser(id: number): User | null {
  // returns null if not found, User otherwise
  return users.find((u) => u.id === id) ?? null;
}
```

**Interview note:** union types model "OR" relationships between types, while intersection types (next file) model "AND" — a common interview question is explaining this distinction with a concrete example, since confusing the two is a frequent beginner mistake.
