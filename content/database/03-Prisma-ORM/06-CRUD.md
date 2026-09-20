# 06. CRUD

## Setup

```js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
```

```prisma
model User {
  id    Int    @id @default(autoincrement())
  name  String
  email String @unique
  age   Int?
}
```

## CREATE

### `create()`

```js
const user = await prisma.user.create({
  data: { name: "Alice", email: "alice@example.com", age: 30 },
});
```

### `createMany()`

```js
await prisma.user.createMany({
  data: [
    { name: "Bob", email: "bob@example.com" },
    { name: "Carol", email: "carol@example.com" },
  ],
  skipDuplicates: true, // ignore rows that would violate a unique constraint instead of throwing
});
```

> `createMany()` does not support nested relation writes and (depending on provider) may not return the created records — for that, use multiple `create()` calls or `createManyAndReturn()` (available on newer Prisma versions/providers).

## READ

### `findUnique()` — By a Unique Field

```js
const user = await prisma.user.findUnique({ where: { id: 1 } });
const byEmail = await prisma.user.findUnique({
  where: { email: "alice@example.com" },
});
```

### `findFirst()` — First Match of Arbitrary Criteria

```js
const user = await prisma.user.findFirst({ where: { age: { gt: 25 } } });
```

### `findMany()` — Multiple Records

```js
const allUsers = await prisma.user.findMany();

const adults = await prisma.user.findMany({
  where: { age: { gte: 18 } },
});
```

### Filtering Operators

```js
await prisma.user.findMany({ where: { age: { gt: 25 } } }); // greater than
await prisma.user.findMany({ where: { age: { gte: 25 } } }); // greater than or equal
await prisma.user.findMany({ where: { age: { lt: 65 } } }); // less than
await prisma.user.findMany({ where: { age: { lte: 65 } } }); // less than or equal
await prisma.user.findMany({ where: { age: { not: 30 } } }); // not equal
await prisma.user.findMany({ where: { age: { in: [25, 30, 35] } } });
await prisma.user.findMany({ where: { name: { contains: "Al" } } });
await prisma.user.findMany({ where: { name: { startsWith: "A" } } });
await prisma.user.findMany({ where: { name: { endsWith: "e" } } });
```

### Logical Operators

```js
await prisma.user.findMany({
  where: {
    AND: [{ age: { gte: 18 } }, { age: { lte: 65 } }],
  },
});

await prisma.user.findMany({
  where: {
    OR: [{ age: { lt: 18 } }, { age: { gt: 65 } }],
  },
});

await prisma.user.findMany({
  where: { NOT: { age: 30 } },
});
```

### Sorting, Pagination

```js
await prisma.user.findMany({
  orderBy: { age: "desc" },
  take: 10, // LIMIT
  skip: 20, // OFFSET
});

// Cursor-based pagination
await prisma.user.findMany({
  take: 10,
  cursor: { id: 50 },
  skip: 1, // skip the cursor item itself
  orderBy: { id: "asc" },
});
```

### Selecting Specific Fields

```js
await prisma.user.findMany({
  select: { id: true, name: true }, // only these fields
});
```

### Including Relations

```js
await prisma.user.findMany({
  include: { posts: true }, // eager-load related posts
});

await prisma.user.findUnique({
  where: { id: 1 },
  include: { posts: { where: { published: true } } }, // filtered relation include
});
```

### Counting

```js
const count = await prisma.user.count();
const activeCount = await prisma.user.count({ where: { age: { gte: 18 } } });
```

## UPDATE

### `update()`

```js
const updated = await prisma.user.update({
  where: { id: 1 },
  data: { age: 31 },
});
```

### `updateMany()`

```js
await prisma.user.updateMany({
  where: { age: { lt: 18 } },
  data: { status: "minor" },
});
```

### Atomic Numeric Operations

```js
await prisma.user.update({
  where: { id: 1 },
  data: { age: { increment: 1 } },
});

await prisma.product.update({
  where: { id: 1 },
  data: { stock: { decrement: 5 } },
});

// Also available: multiply, divide, set
```

### `upsert()` — Update if Exists, Create if Not

```js
await prisma.user.upsert({
  where: { email: "alice@example.com" },
  update: { name: "Alice Updated" },
  create: { name: "Alice", email: "alice@example.com" },
});
```

## DELETE

### `delete()`

```js
await prisma.user.delete({ where: { id: 1 } });
```

### `deleteMany()`

```js
await prisma.user.deleteMany({ where: { age: { lt: 18 } } });
await prisma.user.deleteMany({}); // deletes ALL rows (careful!)
```

## Combining Everything: A Realistic Example

```js
async function getUserDashboard(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      posts: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, createdAt: true },
      },
      _count: {
        select: { posts: true }, // count of related posts
      },
    },
  });
}
```

## Error Handling

```js
const { Prisma } = require("@prisma/client");

try {
  await prisma.user.create({
    data: { email: "alice@example.com", name: "Alice" },
  });
} catch (err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      console.log("Unique constraint violation:", err.meta.target);
    }
  }
  throw err;
}
```

Common Prisma error codes:

| Code    | Meaning                                                                   |
| ------- | ------------------------------------------------------------------------- |
| `P2002` | Unique constraint violation                                               |
| `P2025` | Record not found (e.g., on `update`/`delete` targeting a nonexistent row) |
| `P2003` | Foreign key constraint violation                                          |
| `P2014` | Relation violation (would break a required relation)                      |

## Common Interview-Style Questions

- **What's the difference between `findUnique()` and `findFirst()`?**
  `findUnique()` requires a `where` clause based on a field marked `@unique` or `@id`, guaranteeing at most one result by construction; `findFirst()` accepts arbitrary filter criteria and returns the first match, which could match multiple rows in the underlying data.

- **How would you implement "update if exists, otherwise create"?**
  Use `upsert()`, providing a `where` clause to check existence, an `update` payload for the existing-record case, and a `create` payload for the not-found case.

- **How do you perform an atomic increment on a numeric field without a race condition?**
  Use the `{ increment: n }` operator inside the `data` object of an `update()` call, which translates to an atomic `SET column = column + n` at the database level rather than reading, modifying, and writing back in application code.

- **What does Prisma error code `P2002` indicate?**
  A unique constraint violation — attempting to create or update a record in a way that would duplicate a value in a field with a `@unique` constraint.

- **How do you eager-load a related model in a Prisma query?**
  Use the `include` option (to load the full related model) or nest a `select` within a relation field (for more granular field selection on the related model).
