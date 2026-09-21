# Nullish Coalescing (`??`)

Returns the right-hand value only if the left-hand value is `null` or `undefined` (unlike `||`, which also treats `0`, `""`, `false`, `NaN` as "empty").

```js
const count = 0;
count || 10; // 10 — WRONG if 0 is a valid value!
count ?? 10; // 0  — correct, 0 is not null/undefined

const name = "";
name || "Guest"; // "Guest"
name ?? "Guest"; // "" — correct if empty string is intentional

// Combined with optional chaining — common real-world pattern
const city = user.profile?.address?.city ?? "Unknown";
```
