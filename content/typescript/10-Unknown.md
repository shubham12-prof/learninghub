# Unknown

Like `any`, `unknown` can hold a value of any type — but unlike `any`, TypeScript **won't let you use it** until you've narrowed it to a specific, known type first. It's the type-safe counterpart to `any`.

```ts
let value: unknown = "hello";
value = 42; // ✅ allowed, any type can be assigned
value = true; // ✅ allowed

value.toUpperCase(); // ❌ Object is of type 'unknown' — can't call methods without narrowing first

if (typeof value === "string") {
  value.toUpperCase(); // ✅ allowed — TS knows `value` is a string here, after narrowing
}
```

**Typical use case — typing data from an external/untrusted source (API responses, JSON.parse, catch blocks):**

```ts
async function fetchUser(): Promise<unknown> {
  const res = await fetch("/api/user");
  return res.json(); // we don't actually KNOW the shape until we validate it
}

const data = await fetchUser();
// data.name; // ❌ error — must narrow first

if (typeof data === "object" && data !== null && "name" in data) {
  console.log((data as { name: string }).name); // ✅ after narrowing/asserting
}
```

**`catch` blocks — errors are typed `unknown` (in TS 4.4+ with `useUnknownInCatchVariables`):**

```ts
try {
  riskyOperation();
} catch (err: unknown) {
  if (err instanceof Error) {
    console.log(err.message); // ✅ safely narrowed to Error
  }
}
```

**`any` vs `unknown`:**

|                                | any          | unknown                  |
| ------------------------------ | ------------ | ------------------------ |
| Can be assigned any value?     | Yes          | Yes                      |
| Can be used without narrowing? | Yes (unsafe) | No (must narrow first)   |
| Type safety                    | none         | full — forces validation |

**Interview note:** "When would you use `unknown` over `any`?" — always prefer `unknown` for values whose type genuinely isn't known at that point (API responses, `JSON.parse` results) because it forces you (and anyone maintaining the code later) to validate/narrow the value before using it, preserving type safety instead of silently disabling it.
