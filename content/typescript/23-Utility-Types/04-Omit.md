# Omit

The inverse of `Pick` — constructs a new type by **excluding** a subset of properties from an existing type, keeping everything else.

```ts
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

type SafeUser = Omit<User, "password">;
// equivalent to: { id: number; name: string; email: string }

function returnUserToClient(user: User): SafeUser {
  const { password, ...safeUser } = user; // strip password at runtime too
  return safeUser;
}
```

**How it's implemented internally (built from `Pick` and `Exclude`):**

```ts
type MyOmit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
// Exclude<keyof T, K> = all keys of T EXCEPT those in K
// Pick<...> then keeps only those remaining keys
```

**Common real-world use — deriving a "create" type that omits server-generated fields:**

```ts
interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

type CreatePostInput = Omit<Post, "id" | "createdAt">;
// { title: string; content: string } — id and createdAt are assigned by the server, not the client

function createPost(input: CreatePostInput): Post {
  return { ...input, id: generateId(), createdAt: new Date() };
}
```

**Pick vs Omit — choosing between them:**

|              | Use when                                            |
| ------------ | --------------------------------------------------- |
| `Pick<T, K>` | you want to name the FEW fields you're keeping      |
| `Omit<T, K>` | you want to keep MOST fields and exclude just a few |

**Interview note:** `Omit`'s type parameter `K extends keyof any` (not `keyof T`) is intentional — it allows omitting keys that DON'T exist on `T` without an error, which is occasionally useful, though `Pick`'s stricter `K extends keyof T` is generally considered safer since it catches typos in key names.
