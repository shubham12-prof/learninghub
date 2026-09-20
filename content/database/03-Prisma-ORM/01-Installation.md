# 01. Installation

## What is Prisma?

Prisma is a modern **ORM (Object-Relational Mapper)** for Node.js and TypeScript, providing type-safe database access, auto-generated query clients, and a declarative schema-first workflow. It supports PostgreSQL, MySQL, SQLite, SQL Server, MongoDB, and CockroachDB.

Prisma consists of three main tools:

| Tool | Purpose |
|---|---|
| **Prisma Client** | Auto-generated, type-safe query builder used in application code |
| **Prisma Migrate** | Declarative migration system for evolving your database schema |
| **Prisma Studio** | A visual GUI for browsing and editing your database data |

## Installing Prisma

```bash
mkdir my-project && cd my-project
npm init -y
npm install prisma --save-dev
npm install @prisma/client
```

## Initializing Prisma in a Project

```bash
npx prisma init
```

This creates:

```
my-project/
├── prisma/
│   └── schema.prisma      # your data model definition
├── .env                     # DATABASE_URL goes here
```

`.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
```

You can also initialize with a specific datasource provider directly:

```bash
npx prisma init --datasource-provider postgresql
npx prisma init --datasource-provider mysql
npx prisma init --datasource-provider sqlite
npx prisma init --datasource-provider mongodb
```

## The Generated `schema.prisma` File

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

- **`generator`** — configures what Prisma generates (the JS/TS client, by default).
- **`datasource`** — tells Prisma which database to connect to and how.

## Connecting to Your Database

Update `.env` with your actual connection string:

```
# PostgreSQL
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/myapp"

# MySQL
DATABASE_URL="mysql://root:mypassword@localhost:3306/myapp"

# SQLite (great for local prototyping — no server needed)
DATABASE_URL="file:./dev.db"

# MongoDB
DATABASE_URL="mongodb://localhost:27017/myapp"
```

## Pulling an Existing Database Schema (Introspection)

If you already have an existing database and want Prisma to generate the schema from it:

```bash
npx prisma db pull
```

This inspects your live database and writes the corresponding `model` definitions into `schema.prisma` automatically.

## Generating the Prisma Client

After defining or changing your schema, regenerate the client so your application code gets updated types and methods:

```bash
npx prisma generate
```

This creates a generated client (by default inside `node_modules/@prisma/client`) tailored exactly to your schema's models and fields — fully typed if using TypeScript.

## Using the Prisma Client in Code

```js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log(users);
}

main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
```

TypeScript (ESM-style import, common in modern setups):

```ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
```

## Prisma Studio — Visual Database Browser

```bash
npx prisma studio
```

Opens a local web UI (usually at `http://localhost:5555`) for browsing, filtering, and editing your database records visually — very useful during development.

## Typical Project Workflow

```bash
# 1. Define/edit your models in schema.prisma
# 2. Create and apply a migration
npx prisma migrate dev --name init

# 3. Generate the client (also runs automatically after migrate dev)
npx prisma generate

# 4. Use PrismaClient in your application code
```

## Common CLI Commands Cheat Sheet

```bash
npx prisma init                  # initialize a new Prisma setup
npx prisma generate               # regenerate the Prisma Client from schema.prisma
npx prisma migrate dev            # create + apply a migration in development
npx prisma migrate deploy          # apply pending migrations in production
npx prisma db push                 # push schema changes without creating a migration file (prototyping)
npx prisma db pull                 # introspect an existing database into schema.prisma
npx prisma studio                  # open the visual data browser
npx prisma format                  # auto-format schema.prisma
npx prisma validate                # validate the schema file for errors
```

## Prisma with a Framework (Example: Express)

```bash
npm install express @prisma/client
npm install prisma --save-dev
```

```js
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.listen(3000);
```

## Common Interview-Style Questions

- **What are the three main tools that make up Prisma?**
  Prisma Client (type-safe query builder for application code), Prisma Migrate (declarative schema migration system), and Prisma Studio (visual database GUI).

- **What does `npx prisma generate` actually do?**
  It reads `schema.prisma` and generates a fully-typed Prisma Client tailored to your exact data model, which your application code then imports and uses.

- **What's the difference between `prisma db pull` and `prisma db push`?**
  `db pull` introspects an existing database and generates/updates `schema.prisma` to match it; `db push` does the reverse — pushes your `schema.prisma` definitions directly to the database without creating a migration history file (useful for rapid prototyping).

- **Why must you run `npx prisma generate` again after changing your schema?**
  The Prisma Client is auto-generated code tailored to the exact shape of your current schema; without regenerating, your application code would be using outdated types/methods that don't reflect the schema changes.
