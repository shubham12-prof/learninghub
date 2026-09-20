# 02. Schema

## What is `schema.prisma`?

The `schema.prisma` file is the single source of truth for your Prisma setup — it defines your database connection, client generation config, and your entire data model. Everything else (migrations, the generated client, Prisma Studio) derives from this file.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id    Int    @id @default(autoincrement())
  name  String
  email String @unique
}
```

## The Three Building Blocks

### 1. `generator` Block

Configures what Prisma generates from your schema.

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/client" // optional custom output location
}
```

### 2. `datasource` Block

Defines the database connection.

```prisma
datasource db {
  provider = "postgresql"   // "mysql", "sqlite", "sqlserver", "mongodb", "cockroachdb"
  url      = env("DATABASE_URL")
}
```

Always reference the connection string via `env()` rather than hard-coding it — keeps secrets out of source control.

### 3. `model` Blocks

Define your data model — each `model` maps to a database table (or MongoDB collection).

```prisma
model Product {
  id    Int     @id @default(autoincrement())
  name  String
  price Decimal
}
```

## Field Types

| Prisma Type | Maps To (PostgreSQL example) |
| ----------- | ---------------------------- |
| `String`    | `TEXT` / `VARCHAR`           |
| `Int`       | `INTEGER`                    |
| `BigInt`    | `BIGINT`                     |
| `Float`     | `DOUBLE PRECISION`           |
| `Decimal`   | `DECIMAL`                    |
| `Boolean`   | `BOOLEAN`                    |
| `DateTime`  | `TIMESTAMP`                  |
| `Json`      | `JSONB`                      |
| `Bytes`     | `BYTEA`                      |

```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  price       Decimal  @db.Decimal(10, 2)
  inStock     Boolean  @default(true)
  metadata    Json?
  createdAt   DateTime @default(now())
}
```

## Field Attributes

```prisma
model User {
  id        Int      @id @default(autoincrement())  // primary key, auto-incrementing
  email     String   @unique                          // unique constraint
  name      String                                     // required by default
  bio       String?                                    // "?" makes it optional/nullable
  role      String   @default("user")                  // default value
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt                         // auto-updates on every save
}
```

| Attribute             | Meaning                                                   |
| --------------------- | --------------------------------------------------------- |
| `@id`                 | Marks the field as the primary key                        |
| `@default(value)`     | Sets a default value                                      |
| `@unique`             | Enforces uniqueness                                       |
| `@updatedAt`          | Auto-populates with the current timestamp on every update |
| `@map("column_name")` | Maps a field to a different actual DB column name         |
| `@@map("table_name")` | Maps a model to a different actual DB table name          |
| `@db.VarChar(255)`    | Native database type override                             |

## Optional vs Required Fields

```prisma
model User {
  id       Int     @id @default(autoincrement())
  name     String            // required — NOT NULL in the database
  nickname String?           // optional — nullable in the database
}
```

## Using UUIDs Instead of Auto-Increment IDs

```prisma
model User {
  id String @id @default(uuid())
}
```

```prisma
// Or cuid() — Prisma's collision-resistant ID generator, an alternative to UUID
model User {
  id String @id @default(cuid())
}
```

## Enums

```prisma
enum Role {
  USER
  ADMIN
  MODERATOR
}

model User {
  id   Int  @id @default(autoincrement())
  role Role @default(USER)
}
```

> Note: enums aren't supported on every database provider (e.g., not natively on SQLite) — check provider support before relying on them.

## Mapping to Existing Table/Column Names

```prisma
model User {
  id    Int    @id @default(autoincrement()) @map("user_id")
  email String @unique

  @@map("users") // the actual table is named "users", not "User"
}
```

Useful when adopting Prisma on top of an existing database with a different naming convention (e.g., `snake_case` tables) than Prisma's PascalCase model convention.

## Composite Primary Keys and Unique Constraints

```prisma
model Enrollment {
  studentId Int
  courseId  Int
  grade     String?

  @@id([studentId, courseId])        // composite primary key
}

model Product {
  id       Int    @id @default(autoincrement())
  sku      String
  vendorId Int

  @@unique([sku, vendorId])           // composite unique constraint
}
```

## Indexes in the Schema

```prisma
model Order {
  id       Int      @id @default(autoincrement())
  userId   Int
  status   String
  createdAt DateTime @default(now())

  @@index([userId])                    // single-field index
  @@index([userId, status])            // composite index
}
```

## Validating and Formatting the Schema

```bash
npx prisma validate   # checks for schema errors without touching the database
npx prisma format      # auto-formats schema.prisma consistently
```

## A Complete Example Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())

  @@index([authorId])
  @@map("posts")
}
```

(Relations like `@relation` are covered in depth in the Relations notes.)

## Common Interview-Style Questions

- **What are the three main blocks in a `schema.prisma` file?**
  `generator` (configures client generation), `datasource` (defines the database connection), and one or more `model` blocks (define your data model/tables).

- **How do you make a field optional in a Prisma model?**
  Append `?` to the field type (e.g., `bio String?`), making it nullable in the underlying database.

- **What does the `@updatedAt` attribute do?**
  Automatically sets the field to the current timestamp every time the record is updated, without needing to set it manually in application code.

- **How would you map a Prisma model to an existing database table with a different name?**
  Use `@@map("actual_table_name")` at the model level (and `@map("actual_column_name")` for individual fields) to align Prisma's naming with an existing schema's conventions.

- **How do you define a composite primary key in Prisma?**
  Using `@@id([field1, field2])` at the model level, rather than a single field's `@id` attribute.
