# Primitive Types

TypeScript's basic building-block types, mirroring JS's primitive values but checked at compile time.

```ts
let username: string = "Alice";
let age: number = 25;
let isActive: boolean = true;
let bigNumber: bigint = 100n;
let id: symbol = Symbol("id");
let notAssigned: undefined = undefined;
let empty: null = null;
```

**Type inference — TypeScript infers types automatically, so explicit annotations are often unnecessary:**

```ts
let username = "Alice"; // inferred as `string`, no annotation needed
// username = 42;         // ❌ Type 'number' is not assignable to type 'string'
```

**`strictNullChecks` (part of `strict: true`) affects `null`/`undefined`:**

```ts
let name: string = null; // ❌ error, with strictNullChecks on
let name: string | null = null; // ✅ explicitly allow null via a union type
```

**Type annotations on function parameters and return values:**

```ts
function add(a: number, b: number): number {
  return a + b;
}
```

**Interview note:** prefer letting TypeScript **infer** types where the initial value makes it obvious (`let count = 0`) and reserve explicit annotations for function signatures, complex object shapes, and cases where inference alone wouldn't be clear — over-annotating obvious cases just adds noise.
