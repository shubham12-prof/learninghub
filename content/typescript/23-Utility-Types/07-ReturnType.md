# ReturnType

Extracts the **return type** of a function type — useful for deriving a type from an existing function instead of manually duplicating/re-declaring it (keeping them in sync automatically).

```ts
function createUser(name: string, age: number) {
  return { id: Date.now(), name, age, createdAt: new Date() };
}

type User = ReturnType<typeof createUser>;
// equivalent to: { id: number; name: string; age: number; createdAt: Date }
// automatically derived — no manual interface needed, and stays in sync if createUser changes
```

**How it's implemented internally (uses `infer` in a conditional type):**

```ts
type MyReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : never;
// "if T is a function, INFER its return type as R, and give back R"
```

**Common real-world use — typing the result of a third-party or auto-generated function without redeclaring it:**

```ts
function fetchConfig() {
  return { apiUrl: "https://api.example.com", timeout: 5000, retries: 3 };
}
type AppConfig = ReturnType<typeof fetchConfig>;

function useConfig(config: AppConfig) {
  /* fully typed, derived automatically */
}
```

**Related utility types in the same family:**

```ts
type Parameters<T extends (...args: any) => any> = ...   // tuple of a function's parameter types
type InstanceType<T extends new (...args: any) => any> = ... // instance type of a class constructor

function greet(name: string, times: number) {}
type GreetParams = Parameters<typeof greet>; // [string, number]
```

**Interview note:** `ReturnType<typeof fn>` (note the `typeof` — you need it because `fn` is a value, not a type) is especially valuable for avoiding **type drift**: if you manually wrote a separate `interface User {...}` matching `createUser`'s return shape, the two could silently diverge over time as `createUser` changes; deriving it with `ReturnType` keeps them permanently in sync.
