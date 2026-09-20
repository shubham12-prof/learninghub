# Type Guards

Reusable functions that perform a runtime check and tell TypeScript how to narrow a type based on the result — essentially, custom-defined narrowing logic, packaged for reuse across the codebase.

**User-defined type guards — using a `parameter is Type` return type predicate:**

```ts
interface Cat {
  meow: () => void;
}
interface Dog {
  bark: () => void;
}

function isCat(animal: Cat | Dog): animal is Cat {
  return (animal as Cat).meow !== undefined;
}

function makeSound(animal: Cat | Dog) {
  if (isCat(animal)) {
    animal.meow(); // ✅ TS narrows to Cat here, based on the type predicate
  } else {
    animal.bark(); // ✅ narrowed to Dog
  }
}
```

**Type guards are especially useful for validating unknown/external data:**

```ts
interface User {
  id: number;
  name: string;
}

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value &&
    typeof (value as User).id === "number" &&
    typeof (value as User).name === "string"
  );
}

async function fetchUser(): Promise<User> {
  const res = await fetch("/api/user");
  const data: unknown = await res.json();
  if (!isUser(data)) throw new Error("Invalid user data from API");
  return data; // safely narrowed to User
}
```

**Class-based type guards using `instanceof` don't need a custom function — `instanceof` itself acts as a built-in type guard:**

```ts
class ApiError extends Error {
  statusCode: number = 500;
}

function handleError(err: unknown) {
  if (err instanceof ApiError) {
    console.log(err.statusCode); // narrowed to ApiError
  }
}
```

**Interview note:** custom type guards (`is` predicates) are the standard way to safely narrow `unknown` data from external sources (API responses, `JSON.parse`) into a known type — they put the validation logic in one reusable, testable place instead of scattering ad-hoc `typeof`/`in` checks throughout the codebase.
