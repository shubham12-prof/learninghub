# 09. Raw Queries

## Why Use Raw Queries?

Prisma Client's query API covers the vast majority of use cases, but sometimes you need something it doesn't directly support — complex joins, database-specific functions, advanced window functions, or highly optimized queries. Prisma provides escape hatches for writing raw SQL when needed.

## `$queryRaw` — Raw `SELECT` Queries

Returns typed results (an array of objects) for read queries.

```js
const users = await prisma.$queryRaw`SELECT * FROM "User" WHERE age > ${25}`;
```

Using tagged template literals (backticks) is the **recommended** approach — Prisma automatically parameterizes the interpolated values, protecting against SQL injection.

```js
const minAge = 25;
const users = await prisma.$queryRaw`
  SELECT * FROM "User" WHERE age > ${minAge} ORDER BY name ASC
`;
```

## `$executeRaw` — Raw Write Queries (INSERT/UPDATE/DELETE)

Returns the number of affected rows instead of data.

```js
const affectedRows = await prisma.$executeRaw`
  UPDATE "User" SET status = 'inactive' WHERE last_login < ${cutoffDate}
`;
```

## `$queryRawUnsafe` and `$executeRawUnsafe` — Use with Extreme Caution

These accept a plain string (not a tagged template), meaning **you** are responsible for preventing SQL injection — only use them when the query needs to be built dynamically (e.g., a dynamic table/column name, which parameterization can't handle) and you fully sanitize/validate any interpolated input yourself.

```js
// DANGEROUS if tableName comes from user input without strict validation
const tableName = "User"; // must be validated against a whitelist if dynamic
const results = await prisma.$queryRawUnsafe(
  `SELECT * FROM "${tableName}" LIMIT 10`,
);
```

```js
// NEVER do this with unsanitized user input:
const userInput = req.query.search;
await prisma.$queryRawUnsafe(
  `SELECT * FROM "User" WHERE name = '${userInput}'`,
); // SQL INJECTION RISK
```

**Rule of thumb:** always prefer `$queryRaw`/`$executeRaw` (tagged templates) over the `Unsafe` variants. Only reach for `Unsafe` when you must build the query string dynamically (e.g., a variable identifier), and rigorously whitelist/validate any dynamic input.

## Typed Raw Queries (TypeScript)

```ts
interface UserResult {
  id: number;
  name: string;
  age: number;
}

const users = await prisma.$queryRaw<UserResult[]>`
  SELECT id, name, age FROM "User" WHERE age > ${25}
`;
```

Providing an explicit type parameter gives you compile-time type safety for the raw query's result shape (Prisma doesn't validate this at runtime — it's your responsibility to ensure the query actually returns matching columns).

## When Raw Queries Are Genuinely Needed

```js
// Complex aggregation with window functions — not expressible via Prisma's query API
const results = await prisma.$queryRaw`
  SELECT
    user_id,
    total,
    RANK() OVER (PARTITION BY user_id ORDER BY total DESC) as rank
  FROM "Order"
`;
```

```js
// Full-text search using PostgreSQL-specific tsvector/tsquery
const articles = await prisma.$queryRaw`
  SELECT * FROM "Article"
  WHERE to_tsvector('english', body) @@ to_tsquery('postgresql & performance')
`;
```

```js
// Database-specific function not exposed by Prisma's API
const nearby = await prisma.$queryRaw`
  SELECT * FROM "Place"
  WHERE ST_DWithin(location, ST_MakePoint(${lng}, ${lat})::geography, 5000)
`;
```

## Combining Raw Queries with Regular Prisma Queries

You can mix both approaches within the same application — use Prisma's regular API for typical CRUD, and drop into raw SQL only for the specific queries that need it.

```js
async function getTopSpendersWithDetails() {
  // Raw query for a complex aggregation Prisma's API can't express directly
  const topSpenderIds = await prisma.$queryRaw`
    SELECT user_id, SUM(total) as total_spent
    FROM "Order"
    GROUP BY user_id
    ORDER BY total_spent DESC
    LIMIT 10
  `;

  const ids = topSpenderIds.map((row) => row.user_id);

  // Regular Prisma query to fetch full, typed user details
  return prisma.user.findMany({
    where: { id: { in: ids } },
  });
}
```

## Raw Queries Inside Transactions

Raw queries can participate in Prisma transactions just like regular queries.

```js
await prisma.$transaction([
  prisma.$executeRaw`UPDATE "Account" SET balance = balance - ${amount} WHERE id = ${fromId}`,
  prisma.$executeRaw`UPDATE "Account" SET balance = balance + ${amount} WHERE id = ${toId}`,
]);
```

Or within an interactive transaction:

```js
await prisma.$transaction(async (tx) => {
  await tx.$executeRaw`UPDATE "Account" SET balance = balance - ${amount} WHERE id = ${fromId}`;
  await tx.$executeRaw`UPDATE "Account" SET balance = balance + ${amount} WHERE id = ${toId}`;
});
```

## `Prisma.sql` — Composing Dynamic Raw SQL Fragments Safely

For queries needing conditional pieces (e.g., optional filters), `Prisma.sql` lets you compose fragments safely without falling back to the `Unsafe` variants.

```js
const { Prisma } = require("@prisma/client");

function buildUserQuery(minAge, city) {
  const conditions = [Prisma.sql`age > ${minAge}`];
  if (city) {
    conditions.push(Prisma.sql`city = ${city}`);
  }

  const whereClause = Prisma.join(conditions, " AND ");

  return prisma.$queryRaw`SELECT * FROM "User" WHERE ${whereClause}`;
}
```

This keeps parameterization (and injection protection) intact even while building the query dynamically based on optional conditions.

## Common Interview-Style Questions

- **Why is `$queryRaw` (tagged template) preferred over `$queryRawUnsafe`?**
  `$queryRaw` uses tagged template literals, which automatically parameterize interpolated values, protecting against SQL injection; `$queryRawUnsafe` accepts a plain string, placing the full burden of injection prevention on the developer.

- **What's the difference between `$queryRaw` and `$executeRaw`?**
  `$queryRaw` is for `SELECT` statements and returns the resulting rows; `$executeRaw` is for write operations (`INSERT`/`UPDATE`/`DELETE`) and returns the number of affected rows instead of data.

- **When would you actually need to reach for raw SQL instead of Prisma's regular query API?**
  For complex features Prisma's query builder doesn't directly support — window functions, database-specific functions (like PostGIS spatial queries or full-text search), or highly specific performance-tuned queries.

- **Can raw queries participate in a Prisma transaction?**
  Yes — both `$queryRaw`/`$executeRaw` can be included in the sequential `$transaction([...])` array, or called via the transactional client (`tx`) inside an interactive transaction.

- **What does `Prisma.sql` help with?**
  Composing raw SQL query fragments dynamically (e.g., conditionally including filter clauses) while still preserving safe parameterization, avoiding the need to fall back to unsafe string concatenation.
