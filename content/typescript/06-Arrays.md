# Arrays

Typed lists — every element must match the declared element type.

```ts
let numbers: number[] = [1, 2, 3];
let names: Array<string> = ["Alice", "Bob"]; // generic syntax, equivalent to string[]

numbers.push(4); // ✅ ok
// numbers.push("5"); // ❌ Argument of type 'string' is not assignable to parameter of type 'number'
```

**Arrays of objects:**

```ts
interface User {
  id: number;
  name: string;
}
let users: User[] = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];
```

**Arrays of union types:**

```ts
let mixed: (string | number)[] = [1, "two", 3, "four"]; // each element can be EITHER type
```

**Readonly arrays — prevent mutation:**

```ts
let ids: readonly number[] = [1, 2, 3];
// ids.push(4); // ❌ Property 'push' does not exist on type 'readonly number[]'

const frozen: ReadonlyArray<number> = [1, 2, 3]; // equivalent, generic form
```

**Multi-dimensional arrays:**

```ts
let matrix: number[][] = [
  [1, 2, 3],
  [4, 5, 6],
];
```

**Type inference with arrays:**

```ts
let nums = [1, 2, 3]; // inferred as number[]
let empty = []; // inferred as any[] (widened) — annotate explicitly if needed:
let empty2: number[] = [];
```

**Interview note:** `T[]` and `Array<T>` are functionally identical — `T[]` is more common/concise for simple element types, while `Array<T>` (or `ReadonlyArray<T>`) is sometimes preferred for readability with more complex generic types.
