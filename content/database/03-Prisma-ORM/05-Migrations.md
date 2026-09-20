# 05. Migrations

## What Are Prisma Migrations?

Prisma Migrate translates changes in your `schema.prisma` file into SQL migration files, applies them to your database, and keeps a history of every schema change — giving you version-controlled, repeatable database evolution, similar to migration systems in other ORMs (Rails ActiveRecord, Django, Sequelize).

## `prisma migrate dev` — Development Workflow

```bash
npx prisma migrate dev --name add_user_table
```

What this does:

1. Compares your current `schema.prisma` against the database's migration history.
2. Generates a new SQL migration file reflecting the difference.
3. Applies that migration to your development database.
4. Regenerates the Prisma Client automatically.

```
prisma/
├── schema.prisma
└── migrations/
    ├── 20260101000000_init/
    │   └── migration.sql
    └── 20260115120000_add_user_table/
        └── migration.sql
```

Each migration folder is timestamped and contains the raw SQL that was generated and applied.

## Example: Adding a Field

```prisma
model User {
  id    Int    @id @default(autoincrement())
  name  String
  email String @unique
  age   Int?   // newly added field
}
```

```bash
npx prisma migrate dev --name add_user_age
```

Generated SQL (roughly):

```sql
-- migration.sql
ALTER TABLE "User" ADD COLUMN "age" INTEGER;
```

## `prisma migrate deploy` — Production Workflow

```bash
npx prisma migrate deploy
```

- Applies all pending migrations that exist in the `migrations/` folder.
- **Does not** generate new migrations or prompt for anything — purely applies what's already been created and committed.
- Doesn't regenerate the client automatically (run `npx prisma generate` separately, often as part of your build step).

This is the command you run in CI/CD pipelines or production deploy scripts — never `migrate dev` in production, since it can prompt interactively and isn't designed for automated environments.

## `prisma migrate reset` — Resetting the Database

```bash
npx prisma migrate reset
```

Drops the database, recreates it, reapplies all migrations from scratch, and runs the seed script (if configured) — destructive, intended for development only.

## `prisma migrate status` — Checking Migration State

```bash
npx prisma migrate status
```

Shows which migrations have been applied, and whether the database is in sync with your migration history — useful for diagnosing drift.

## Handling Schema Drift

"Drift" occurs when the actual database structure no longer matches what Prisma's migration history says it should be (e.g., someone manually altered a table outside of Prisma).

```bash
npx prisma migrate dev
# Prisma detects drift and may prompt you to reset the database in development,
# since it can't safely reconcile an out-of-band change automatically.
```

In production, drift should be avoided entirely — all schema changes should go through Prisma Migrate, never manual `ALTER TABLE` statements outside the migration system.

## `prisma db push` — Schema Prototyping Without Migration History

```bash
npx prisma db push
```

Pushes your current `schema.prisma` directly to the database, syncing its structure — **without** creating a migration file or history entry. Useful for rapid early-stage prototyping when you don't yet care about migration history, but not recommended once you need reproducible, trackable schema changes (e.g., once you have a team or production data).

|                          | `migrate dev`                                   | `db push`                            |
| ------------------------ | ----------------------------------------------- | ------------------------------------ |
| Creates a migration file | Yes                                             | No                                   |
| Tracks history           | Yes                                             | No                                   |
| Best for                 | Ongoing development with a real migration trail | Early prototyping, throwaway schemas |

## Customizing/Editing a Generated Migration

Sometimes you need to hand-edit a migration (e.g., to add a data-transformation step, not just a schema change) before applying it.

```bash
npx prisma migrate dev --create-only --name backfill_user_status
```

`--create-only` generates the migration SQL file **without** applying it, letting you edit `migration.sql` manually (e.g., add an `UPDATE` statement to backfill data) before running:

```bash
npx prisma migrate dev
```

to actually apply it.

## Example: A Migration with a Manual Data Transformation

```sql
-- migration.sql (hand-edited after --create-only)
ALTER TABLE "User" ADD COLUMN "status" TEXT;

-- Manually added data backfill step
UPDATE "User" SET "status" = 'active' WHERE "status" IS NULL;

ALTER TABLE "User" ALTER COLUMN "status" SET NOT NULL;
```

## Baselining an Existing Database (Adopting Prisma Migrate on a Live DB)

When introducing Prisma Migrate to a database that already has data/structure (not created by Prisma), you need to "baseline" it so Prisma doesn't try to recreate existing tables.

```bash
npx prisma migrate resolve --applied "20260101000000_init"
```

This marks a migration as already applied without actually running its SQL — used to align Prisma's migration history with a database's already-existing structure.

## Migrations and MongoDB

MongoDB is schema-less at the database level, so Prisma Migrate's SQL-based migration system doesn't apply. Instead, use:

```bash
npx prisma db push
```

Prisma manages MongoDB schema changes by pushing the Prisma schema's shape directly, without traditional SQL migrations.

## CI/CD Migration Workflow (Typical Production Setup)

```bash
# In your deploy pipeline:
npx prisma generate      # regenerate the client for the build
npx prisma migrate deploy # apply any pending migrations to the production database
```

## Common Interview-Style Questions

- **What's the difference between `prisma migrate dev` and `prisma migrate deploy`?**
  `migrate dev` is for local development — it generates new migration files based on schema changes, applies them, and regenerates the client, potentially prompting interactively; `migrate deploy` only applies already-existing, committed migrations without generating new ones, designed for CI/CD and production environments.

- **What's the difference between `prisma migrate dev` and `prisma db push`?**
  `migrate dev` creates a tracked, version-controlled migration file as part of a history; `db push` directly syncs the schema to the database without creating any migration file or history — suited for early prototyping rather than production-grade schema evolution.

- **What is schema drift, and why is it a problem?**
  A mismatch between what Prisma's migration history expects the database structure to be and what it actually is (often caused by manual out-of-band changes) — it can prevent Prisma from safely applying new migrations and may require a reset in development.

- **How would you add a data backfill step as part of a schema migration?**
  Generate the migration with `--create-only` (creating the SQL file without applying it), manually edit the generated `migration.sql` to add the necessary data transformation (e.g., an `UPDATE` statement), then run `migrate dev` again to apply it.

- **Why doesn't Prisma Migrate work the same way for MongoDB as it does for SQL databases?**
  MongoDB is schema-less at the database level, so there's no SQL DDL to generate; instead, Prisma uses `db push` to directly sync the Prisma schema's shape to MongoDB without a traditional migration history.
