# 03. Models

## What is a Prisma Model?

A `model` block in `schema.prisma` defines an entity in your application's data — it maps directly to a database table (SQL) or collection (MongoDB), and Prisma generates a fully-typed API for it in the client.

```prisma
model User {
  id    Int    @id @default(autoincrement())
  name  String
  email String @unique
}
```

This single model definition generates, among others:

```ts
prisma.user.findMany();
prisma.user.findUnique({ where: { id: 1 } });
prisma.user.create({ data: { name: "Alice", email: "alice@example.com" } });
prisma.user.update({ where: { id: 1 }, data: { name: "Alice Updated" } });
prisma.user.delete({ where: { id: 1 } });
```

Note that the model name `User` (PascalCase, singular) generates a client accessor `prisma.user` (camelCase) — Prisma follows this naming convention automatically.

## Naming Conventions

|                           | Convention           | Example                          |
| ------------------------- | -------------------- | -------------------------------- |
| Model names               | PascalCase, singular | `User`, `BlogPost`               |
| Field names               | camelCase            | `firstName`, `createdAt`         |
| Generated client accessor | camelCase, singular  | `prisma.user`, `prisma.blogPost` |

While Prisma doesn't strictly enforce these, following them keeps your schema idiomatic and consistent with what most Prisma tooling/documentation expects.

## Full Model Example with Common Field Patterns

```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  sku         String   @unique
  inStock     Boolean  @default(true)
  category    String
  tags        String[] // array field (PostgreSQL supports native arrays)
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category])
}
```

## Scalar Lists (Arrays)

```prisma
model Post {
  id   Int      @id @default(autoincrement())
  tags String[] // array of strings
}
```

```ts
await prisma.post.create({
  data: { tags: ["tech", "news", "javascript"] },
});

await prisma.post.findMany({
  where: { tags: { has: "tech" } }, // contains a specific value
});
```

> Native array fields are supported on PostgreSQL and CockroachDB, but not on MySQL/SQLite — check provider compatibility.

## Model-Level Attributes (`@@`)

```prisma
model Enrollment {
  studentId Int
  courseId  Int
  grade     String?

  @@id([studentId, courseId])          // composite primary key
  @@unique([studentId, courseId])       // (redundant here since it's already the PK, shown for illustration)
  @@index([courseId])                    // index on a specific field
  @@map("enrollments")                    // custom table name
}
```

## Field-Level vs Model-Level Attributes

```prisma
model User {
  id    Int    @id @default(autoincrement())  // field-level attributes: apply to ONE field
  email String @unique

  @@index([email])  // model-level attribute: can span multiple fields, prefixed with @@
}
```

## Multiple Models and Their Interactions (Preview)

```prisma
model User {
  id    Int    @id @default(autoincrement())
  name  String
  posts Post[] // one-to-many relation — see Relations notes for full detail
}

model Post {
  id       Int  @id @default(autoincrement())
  title    String
  author   User @relation(fields: [authorId], references: [id])
  authorId Int
}
```

## Working with Models via the Client

```js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Every model in schema.prisma gets a corresponding property on the client
async function demo() {
  const allUsers = await prisma.user.findMany();
  const allProducts = await prisma.product.findMany();
}
```

## Selecting Specific Fields

```js
const users = await prisma.user.findMany({
  select: { id: true, name: true }, // only fetch these fields
});
```

## Custom Type Mapping with `@db`

Override the exact native database column type when Prisma's default mapping isn't precise enough.

```prisma
model Product {
  id    Int     @id @default(autoincrement())
  price Decimal @db.Decimal(10, 2)   // exact SQL NUMERIC/DECIMAL precision
  code  String  @db.VarChar(10)       // exact VARCHAR length, instead of default TEXT
}
```

## Model Documentation Comments

```prisma
/// Represents a registered user of the platform.
model User {
  /// The user's unique email address, used for login.
  email String @unique
}
```

Triple-slash (`///`) comments are picked up by Prisma tooling (like generated documentation or IDE hints) — regular `//` comments are just plain comments, not attached to the schema element.

## Ignoring a Table (For Introspected/Legacy Schemas)

```prisma
model LegacyLogs {
  id Int @id

  @@ignore // excludes this model from the generated Prisma Client
}
```

Useful after `prisma db pull` introspects tables you don't want Prisma to manage/expose (e.g., a table without a usable primary key, or one you deliberately want to leave untouched).

## Common Interview-Style Questions

- **What does a Prisma `model` block correspond to in the underlying database?**
  A table in a SQL database, or a collection in MongoDB.

- **What naming convention does Prisma expect for models, and how does it affect the generated client?**
  PascalCase, singular model names (e.g., `User`) generate a camelCase, singular accessor on the client (`prisma.user`).

- **What's the difference between a field-level attribute and a model-level attribute?**
  Field-level attributes (single `@`) apply to one specific field (e.g., `@unique`); model-level attributes (double `@@`) can span multiple fields or apply configuration to the model as a whole (e.g., `@@index([field1, field2])`, `@@map("table_name")`).

- **How would you handle a legacy database table that Prisma shouldn't manage after introspection?**
  Mark the model with `@@ignore`, excluding it from the generated Prisma Client while keeping it documented in the schema.

- **How do you override Prisma's default database type mapping for a field?**
  Use a native type attribute like `@db.VarChar(255)` or `@db.Decimal(10, 2)` to specify the exact underlying database column type.
