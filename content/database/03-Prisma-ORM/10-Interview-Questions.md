# 10. Interview Questions — Prisma ORM (Comprehensive)

A consolidated set of commonly asked Prisma ORM interview questions, organized by topic, with concise answers and code where useful.

---

## Installation & Setup

**Q: What are the three main tools that make up Prisma?**
Prisma Client (type-safe query builder for application code), Prisma Migrate (declarative schema migration system), and Prisma Studio (visual database GUI).

**Q: What does `npx prisma generate` do?**
Reads `schema.prisma` and generates a fully-typed Prisma Client tailored to the exact data model, which application code then imports and uses.

**Q: Difference between `prisma db pull` and `prisma db push`?**
`db pull` introspects an existing database and updates `schema.prisma` to match it; `db push` pushes schema definitions directly to the database without creating a migration file.

---

## Schema

**Q: What are the three main blocks in `schema.prisma`?**
`generator` (client generation config), `datasource` (database connection), and `model` blocks (data model definitions).

**Q: How do you make a field optional?**
Append `?` to the field type (e.g., `bio String?`), making it nullable in the database.

**Q: What does `@updatedAt` do?**
Automatically sets the field to the current timestamp on every record update, without manual application code.

**Q: How do you map a Prisma model to a differently-named existing table?**
`@@map("actual_table_name")` at the model level, and `@map("actual_column_name")` for individual fields.

---

## Models

**Q: What does a Prisma `model` correspond to in the database?**
A table (SQL databases) or a collection (MongoDB).

**Q: Field-level vs model-level attributes?**
Field-level (single `@`) applies to one field (`@unique`); model-level (double `@@`) can span multiple fields or configure the model as a whole (`@@index([...])`, `@@map(...)`).

**Q: How do you exclude a table from the generated client after introspection?**
Mark the model with `@@ignore`.

---

## Relations

**Q: How does Prisma distinguish one-to-one from one-to-many?**
By whether the foreign key field also has `@unique` — without it, it's one-to-many; with it, at most one related row can exist per parent.

**Q: Implicit vs explicit many-to-many?**
Implicit relations let Prisma auto-manage a hidden join table (no extra data); explicit relations require a defined join model, needed when the relationship itself carries additional attributes.

**Q: Why are named relations required for self-relations?**
A model relating to itself has two distinct relation fields pointing to the same model — a name disambiguates which field represents which side.

**Q: `connect` vs `create` in a nested write?**
`connect` links to an existing related record by unique identifier; `create` creates a brand-new related record simultaneously.

**Q: How do you find all users with no posts?**
`prisma.user.findMany({ where: { posts: { none: {} } } })`.

---

## Migrations

**Q: `migrate dev` vs `migrate deploy`?**
`migrate dev` generates new migrations from schema changes, applies them, and regenerates the client (development, can prompt interactively); `migrate deploy` only applies already-existing committed migrations, designed for CI/CD and production.

**Q: `migrate dev` vs `db push`?**
`migrate dev` creates a tracked migration file as part of version-controlled history; `db push` directly syncs schema to the database with no migration file or history — for prototyping only.

**Q: What is schema drift?**
A mismatch between what Prisma's migration history expects the database structure to be and what it actually is, often from manual out-of-band changes — can block safe migration application.

**Q: How do you add a data backfill as part of a migration?**
Generate with `--create-only` to produce the SQL file without applying it, manually add the transformation (e.g., an `UPDATE`), then run `migrate dev` to apply it.

---

## CRUD

**Q: `findUnique()` vs `findFirst()`?**
`findUnique()` requires a `@unique`/`@id` field in `where`, guaranteeing at most one result by construction; `findFirst()` accepts arbitrary criteria and returns the first match among potentially many.

**Q: How do you implement "update if exists, otherwise create"?**
`upsert()`, with `where` for existence check, `update` for the existing case, `create` for the not-found case.

**Q: How do you atomically increment a numeric field?**
`data: { field: { increment: n } }` — translates to an atomic `SET column = column + n` at the database level.

**Q: What does Prisma error `P2002` mean?**
A unique constraint violation.

**Q: How do you eager-load a related model?**
The `include` option (full related model) or a nested `select` within a relation field for granular field selection.

---

## Transactions

**Q: Sequential vs interactive transactions?**
Sequential (`$transaction([...])`) executes a pre-built array of operations atomically with no branching logic; interactive (`$transaction(async (tx) => {...})`) provides a callback with a transactional client, allowing reads/conditionals to inform subsequent writes.

**Q: Why use `tx.model` instead of `prisma.model` inside an interactive transaction?**
`tx` is bound to that specific transaction; using the outer client would run those operations outside the transaction, breaking atomicity.

**Q: Are nested writes automatically transactional?**
Yes — Prisma automatically wraps nested writes (e.g., creating a user with related posts in one call) in an implicit transaction.

**Q: What happens if you throw an error inside an interactive transaction callback?**
Prisma automatically rolls back the entire transaction — nothing performed via `tx` is committed.

---

## Seeding

**Q: How do you configure Prisma's seed command?**
Add a `"seed"` entry under the `"prisma"` key in `package.json` pointing to the seed script.

**Q: Why make a seed script idempotent?**
So re-running it (e.g., in CI, or after `migrate reset`) doesn't create duplicate records — achieved via `upsert()` instead of `create()`.

**Q: What command resets the database and reseeds it?**
`npx prisma migrate reset`.

---

## Raw Queries

**Q: Why prefer `$queryRaw` over `$queryRawUnsafe`?**
`$queryRaw` uses tagged template literals that automatically parameterize interpolated values, protecting against SQL injection; `$queryRawUnsafe` takes a plain string, making injection prevention entirely the developer's responsibility.

**Q: `$queryRaw` vs `$executeRaw`?**
`$queryRaw` is for `SELECT` statements, returning rows; `$executeRaw` is for writes (`INSERT`/`UPDATE`/`DELETE`), returning the affected row count.

**Q: When would you need raw SQL instead of Prisma's query API?**
For complex features not directly supported — window functions, database-specific functions (full-text search, spatial queries), or highly performance-tuned queries.

**Q: Can raw queries run inside a transaction?**
Yes — via the sequential `$transaction([...])` array or the transactional client (`tx`) inside an interactive transaction.

---

## Practical / Coding Questions Often Asked Live

**Q: Write a Prisma schema modeling a one-to-many blog (User has many Posts).**

```prisma
model User {
  id    Int    @id @default(autoincrement())
  name  String
  posts Post[]
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  author   User   @relation(fields: [authorId], references: [id])
  authorId Int
}
```

**Q: Write a query to get the top 5 users by number of posts.**

```js
const topUsers = await prisma.user.findMany({
  take: 5,
  orderBy: { posts: { _count: "desc" } },
  include: { _count: { select: { posts: true } } },
});
```

**Q: Write an interactive transaction that safely places an order, checking stock first.**

```js
async function placeOrder(productId, quantity, userId) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (product.stock < quantity) throw new Error("Insufficient stock");

    await tx.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    });

    return tx.order.create({ data: { productId, quantity, userId } });
  });
}
```

**Q: Write an idempotent seed script creating a default admin user.**

```js
async function main() {
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { name: "Admin", email: "admin@example.com", role: "ADMIN" },
  });
}
```

**Q: How would you migrate a required field onto a table that already has existing rows?**
Add the field as optional first (or with a `@default`), run a migration, backfill existing rows via a manual `UPDATE` (using `--create-only` to edit the migration SQL), then run a follow-up migration making the field required (`NOT NULL`) once all rows have a value.
