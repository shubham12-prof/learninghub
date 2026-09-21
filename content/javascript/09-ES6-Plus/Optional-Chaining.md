# Optional Chaining (`?.`)

Safely access deeply nested properties without manual null checks — short-circuits to `undefined` if any link is `null`/`undefined`.

```js
const user = { profile: { address: null } };

user.profile.address.city; // ❌ TypeError: Cannot read properties of null
user.profile?.address?.city; // ✅ undefined — no error

user.profile?.getBio?.(); // safely calls a method only if it exists
arr?.[0]; // safe array access
```
