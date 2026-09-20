# Never

Represents a value that **never occurs** — used for functions that never return normally (either they always throw, or they loop forever), and for exhaustiveness checking in conditional/union type narrowing.

```ts
// Function that always throws — never returns a value
function throwError(message: string): never {
  throw new Error(message);
}

// Function with an infinite loop — never completes
function infiniteLoop(): never {
  while (true) {
    /* ... */
  }
}
```

**Exhaustiveness checking — a very common, practical use of `never`:**

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number };

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.side ** 2;
    default:
      const exhaustiveCheck: never = shape; // if a new Shape variant is added later without
      return exhaustiveCheck; // updating this switch, TS errors HERE at compile time
  }
}
```

**`never` in narrowed union types — when all cases are eliminated:**

```ts
function process(value: string | number) {
  if (typeof value === "string") {
    // value: string
  } else if (typeof value === "number") {
    // value: number
  } else {
    // value: never — TS knows every possible case has already been handled
  }
}
```

**`never` vs `void`:** `void` means "returns nothing meaningful" (but the function DOES complete/return); `never` means "never completes at all" (throws or loops forever).

**Interview note:** the exhaustiveness-check pattern (assigning to a `never`-typed variable in a `default`/`else` branch) is a favorite interview topic — it demonstrates using the type system to catch a real class of bug: forgetting to handle a new case after extending a union type.
