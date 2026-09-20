# Generic Constraints

Restricts what types can be used with a generic, using `extends`, so you can safely rely on certain properties/methods existing on the generic type.

```ts
// Without a constraint, T could be ANYTHING, so `.length` isn't guaranteed to exist
function logLength<T>(item: T) {
  // console.log(item.length); // ❌ Property 'length' does not exist on type 'T'
}

// With a constraint — T must have a `.length` property
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(item: T) {
  console.log(item.length); // ✅ safe — every T is guaranteed to have `.length`
}

logLength("hello"); // ✅ strings have .length
logLength([1, 2, 3]); // ✅ arrays have .length
// logLength(42);            // ❌ number doesn't have .length
```

**Constraining to keys of an object — the classic `keyof` pattern, used heavily in utility types:**

```ts
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "Alice", age: 25 };
getProperty(user, "name"); // ✅ returns string
getProperty(user, "age"); // ✅ returns number
// getProperty(user, "email");   // ❌ 'email' is not a key of user's type
```

**Default type parameters:**

```ts
interface ApiResponse<T = unknown> {
  data: T;
  status: number;
}
const response: ApiResponse = { data: "anything", status: 200 }; // T defaults to unknown
```

**Constraining to a specific set of related types:**

```ts
function merge<T extends object, U extends object>(a: T, b: U): T & U {
  return { ...a, ...b };
}
const merged = merge({ name: "Alice" }, { age: 25 }); // { name: string } & { age: number }
```

**Interview note:** `<T extends keyof SomeObject>` is one of the most practically important generic-constraint patterns in TypeScript — it's exactly how built-in utility types like `Pick<T, K>` and `Omit<T, K>` (see the Utility Types folder) safely restrict `K` to only valid property names of `T`.
