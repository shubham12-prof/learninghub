# Advanced Types

More powerful, compositional type system features beyond the basics — mapped types, conditional types, template literal types, and discriminated unions.

**Mapped types — transform every property of an existing type using a rule:**

```ts
type Nullable<T> = { [K in keyof T]: T[K] | null };
type ReadonlyVersion<T> = { readonly [K in keyof T]: T[K] };
type OptionalVersion<T> = { [K in keyof T]?: T[K] };
// (this is essentially how Partial/Readonly are implemented internally)
```

**Conditional types — types that branch based on a condition, using `extends ? :`:**

```ts
type IsString<T> = T extends string ? "yes" : "no";
type A = IsString<string>; // "yes"
type B = IsString<number>; // "no"

// Combined with `infer` to EXTRACT a type from within another type
type ElementType<T> = T extends (infer U)[] ? U : never;
type Item = ElementType<string[]>; // string
```

**Template literal types — build string types by combining literals, like template strings but at the type level:**

```ts
type EventName = "click" | "hover" | "focus";
type HandlerName = `on${Capitalize<EventName>}`;
// "onClick" | "onHover" | "onFocus" — generated automatically from EventName

type Route = `/users/${number}`; // any string matching this exact pattern, e.g. "/users/42"
```

**Discriminated unions — a common pattern combining literal types + union types for exhaustive, safe branching:**

```ts
type LoadingState = { status: "loading" };
type SuccessState = { status: "success"; data: string };
type ErrorState = { status: "error"; error: string };
type State = LoadingState | SuccessState | ErrorState;

function render(state: State) {
  switch (state.status) {
    case "loading":
      return "Loading...";
    case "success":
      return state.data; // narrowed automatically
    case "error":
      return state.error; // narrowed automatically
  }
}
```

**Recursive types — a type that references itself, useful for tree-like or nested structures:**

```ts
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const data: JsonValue = {
  name: "Alice",
  tags: ["admin", "user"],
  meta: { active: true },
};
```

**`keyof` and indexed access types:**

```ts
interface User {
  id: number;
  name: string;
}
type UserKeys = keyof User; // "id" | "name"
type IdType = User["id"]; // number — indexed access, like a runtime property lookup but for types
```

**Interview note:** discriminated unions + exhaustiveness checking (via `never`, see that file) is probably the single most valuable "advanced" pattern to know well for interviews — it shows up constantly in real-world API response modeling, Redux action types, and state machines.
