# Why TypeScript

TypeScript is a superset of JavaScript that adds **static typing**, compiled (transpiled) down to plain JS before running. Every valid JS file is already valid TS — you can adopt it incrementally.

**Problems it solves:**

```js
// Plain JS — this bug is only caught at RUNTIME, possibly in production
function calculateTotal(price, quantity) {
  return price * quantity;
}
calculateTotal("10", 5); // "1010101010" — silent string concatenation, no error until output is wrong
```

```ts
// TypeScript — the SAME bug is caught at COMPILE TIME, before the code ever runs
function calculateTotal(price: number, quantity: number): number {
  return price * quantity;
}
calculateTotal("10", 5); // ❌ Compile error: Argument of type 'string' is not assignable to parameter of type 'number'
```

**Key benefits:**

- **Catches bugs early** — type errors surface while coding/building, not in production.
- **Better editor tooling** — autocomplete, inline documentation, and "go to definition" all work far better with known types.
- **Self-documenting code** — function signatures and object shapes describe themselves, reducing the need for separate docs.
- **Safer refactoring** — renaming a property or changing a function signature immediately flags every affected call site.

```ts
interface User {
  id: number;
  name: string;
  email: string;
}

function greet(user: User) {
  return `Hello, ${user.name}`;
}
// Editor autocompletes user.id / user.name / user.email, and flags typos like user.nmae immediately
```

**Tradeoffs:** TypeScript adds a build/compile step, a learning curve around the type system, and can feel like overhead on very small scripts or prototypes — the payoff grows with codebase size and team size.

**Interview note:** TypeScript provides **compile-time** type safety only — types are fully erased at runtime (see `Declaration Files`/compilation), so it doesn't validate data coming from genuinely untyped sources (API responses, user input, `JSON.parse`) unless you add runtime validation (e.g., with Zod) alongside it.
