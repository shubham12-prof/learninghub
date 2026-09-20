# 08. Seeding

## What is Database Seeding?

Seeding populates your database with initial or sample data — useful for local development (having realistic data to work with), automated testing (consistent known state), and bootstrapping required baseline records in production (like default roles or admin accounts).

## Setting Up a Seed Script

Create a `prisma/seed.js` (or `.ts`) file:

```js
// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice@example.com",
      posts: {
        create: [{ title: "Hello World", published: true }],
      },
    },
  });

  console.log("Seed data created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## Configuring the Seed Command in `package.json`

```json
{
  "prisma": {
    "seed": "node prisma/seed.js"
  }
}
```

For TypeScript projects:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

## Running the Seed Script

```bash
npx prisma db seed
```

Prisma also automatically runs the seed script after:

```bash
npx prisma migrate dev    # runs seed automatically after applying migrations (if configured)
npx prisma migrate reset   # always runs seed after resetting
```

## Idempotent Seeding — Avoiding Duplicate Data on Re-runs

A naive seed script run twice would create duplicate records. Use `upsert()` to make seeding safely repeatable.

```js
async function main() {
  await prisma.user.upsert({
    where: { email: "alice@example.com" }, // must be a unique field
    update: {}, // no-op if it already exists
    create: {
      name: "Alice",
      email: "alice@example.com",
    },
  });
}
```

## Seeding Multiple Related Records

```js
async function main() {
  const categories = await Promise.all(
    ["Tech", "Sports", "Music"].map((name) =>
      prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  const user = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: { name: "Alice", email: "alice@example.com" },
  });

  await prisma.post.create({
    data: {
      title: "Getting Started with Prisma",
      published: true,
      author: { connect: { id: user.id } },
      categories: { connect: categories.map((c) => ({ id: c.id })) },
    },
  });
}
```

## Generating Larger Volumes of Fake Data (`@faker-js/faker`)

For realistic development/testing datasets:

```bash
npm install --save-dev @faker-js/faker
```

```js
const { faker } = require("@faker-js/faker");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = Array.from({ length: 50 }).map(() => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
  }));

  await prisma.user.createMany({ data: users, skipDuplicates: true });

  console.log("Seeded 50 fake users");
}

main().finally(() => prisma.$disconnect());
```

## Clearing Data Before Re-Seeding (Development Only)

```js
async function main() {
  // Delete in an order that respects foreign key dependencies (children before parents)
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // ... then insert fresh seed data
}
```

> Never run destructive clearing logic like this against a production database — reserve it for local/test environments only, typically gated behind an environment check.

```js
if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to run destructive seed script in production");
}
```

## Environment-Specific Seed Data

```js
async function main() {
  if (process.env.NODE_ENV === "development") {
    await seedDevelopmentData(); // lots of fake/sample data
  } else if (process.env.NODE_ENV === "test") {
    await seedTestFixtures(); // minimal, predictable data for automated tests
  } else {
    await seedProductionEssentials(); // e.g., default admin role, required lookup values only
  }
}
```

## Seeding for Automated Tests

A common pattern: reset and reseed the test database before each test suite run, ensuring tests start from a known, consistent state.

```js
// test setup (e.g., in a Jest globalSetup file)
const { execSync } = require("child_process");

module.exports = async () => {
  execSync("npx prisma migrate reset --force --skip-seed", {
    stdio: "inherit",
  });
  execSync("node prisma/seed-test.js", { stdio: "inherit" });
};
```

`--skip-seed` avoids running the default seed script if you want to use a separate, test-specific seed file instead.

## Common Interview-Style Questions

- **What is database seeding, and why is it useful?**
  Populating a database with initial or sample data — useful for local development (realistic working data), automated testing (consistent known state), and bootstrapping essential baseline records in production (default roles, lookup values).

- **How do you configure Prisma to know which script to run for seeding?**
  Add a `"seed"` entry under the `"prisma"` key in `package.json`, pointing to the seed script's execution command (e.g., `node prisma/seed.js`).

- **Why is it important to make a seed script idempotent (safe to run multiple times)?**
  Running a naive `create()`-based seed script repeatedly would generate duplicate records on each run; using `upsert()` instead ensures re-running the script doesn't create duplicates, making it safe to run as part of routine setup or CI without manual cleanup.

- **What command both resets the database and runs the seed script?**
  `npx prisma migrate reset` — it drops and recreates the database, reapplies all migrations, and then runs the configured seed script automatically.

- **Why should you gate destructive seed logic (like deleting all existing data) behind an environment check?**
  To prevent accidentally wiping production data if the seed script is ever mistakenly run against a production database instead of a development/test one.
