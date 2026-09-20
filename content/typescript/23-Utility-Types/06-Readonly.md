# Readonly

Makes all properties of a type **immutable** — they can be read but not reassigned after the object is created.

```ts
interface Point {
  x: number;
  y: number;
}

type ReadonlyPoint = Readonly<Point>;
// equivalent to: { readonly x: number; readonly y: number }

const point: ReadonlyPoint = { x: 10, y: 20 };
// point.x = 5; // ❌ Cannot assign to 'x' because it is a read-only property
```

**How it's implemented internally (a mapped type with the `readonly` modifier):**

```ts
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K];
};
```

**Important: `Readonly` (and TS `readonly` in general) is SHALLOW — nested objects can still be mutated:**

```ts
interface Config {
  settings: { debug: boolean };
}
const config: Readonly<Config> = { settings: { debug: false } };
// config.settings = {}; // ❌ blocked — top-level property
config.settings.debug = true; // ✅ allowed! — nested object isn't itself readonly
```

**Related — `as const` produces a deeply readonly literal for object/array literals:**

```ts
const point = { x: 10, y: 20 } as const; // deeply readonly AND narrows to literal types (10, 20)
```

**Common real-world use — enforcing immutability for function parameters (preventing accidental mutation of caller's data):**

```ts
function printUser(user: Readonly<User>) {
  // user.name = "changed"; // ❌ compiler enforces this function can't mutate the input
  console.log(user.name);
}
```

**Interview note:** `readonly` (and `Readonly<T>`) is a **compile-time-only** guarantee — it's completely erased at runtime, so nothing actually prevents mutation via `JSON.parse(JSON.stringify(obj))`-style tricks or by casting with `as` — it protects against accidental mutation in normal typed code, not determined/malicious bypasses.
