# 06. Indexes

## Why Indexes Matter

Without an index, PostgreSQL must perform a **sequential scan** (`Seq Scan`) — reading every row in a table to find matches. An index creates an auxiliary data structure that lets the query planner jump directly to relevant rows, dramatically speeding up lookups, especially as tables grow.

## Creating a Basic Index

```sql
CREATE INDEX idx_users_email ON users(email);
```

```sql
-- Now this query can use the index instead of scanning the whole table
SELECT * FROM users WHERE email = 'alice@example.com';
```

## Automatic Indexes

PostgreSQL automatically creates an index for:

- `PRIMARY KEY` constraints
- `UNIQUE` constraints

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,      -- automatically indexed
  email VARCHAR(255) UNIQUE   -- automatically indexed
);
```

Foreign keys, notably, are **not** automatically indexed in PostgreSQL — you should typically create an index on foreign key columns manually, since they're constantly used in joins and `WHERE` clauses.

```sql
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

## Composite (Multi-Column) Indexes

```sql
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
```

This index efficiently supports queries filtering on `user_id` alone, or `user_id` + `status` together — but **not** efficiently on `status` alone, since column order matters (the index is only useful as a left-to-right prefix match, similar to MongoDB's compound index behavior).

```sql
-- Uses the index (prefix match on user_id)
SELECT * FROM orders WHERE user_id = 5;

-- Uses the index fully
SELECT * FROM orders WHERE user_id = 5 AND status = 'shipped';

-- Does NOT use this particular index effectively (status isn't the leading column)
SELECT * FROM orders WHERE status = 'shipped';
```

## Unique Indexes

```sql
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);
```

Functionally equivalent to a `UNIQUE` constraint, but created directly as an index (a `UNIQUE` constraint actually creates a unique index under the hood automatically).

## Partial Indexes

Indexes only a subset of rows matching a condition — smaller and faster when you frequently query a specific subset.

```sql
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;
```

```sql
-- This query can use the partial index
SELECT * FROM users WHERE is_active = true AND email = 'alice@example.com';
```

## Expression Indexes

Indexes the result of a function/expression rather than a raw column value — useful for case-insensitive searches or computed lookups.

```sql
CREATE INDEX idx_users_lower_email ON users(LOWER(email));
```

```sql
-- Uses the expression index
SELECT * FROM users WHERE LOWER(email) = 'alice@example.com';
```

## Index Types in PostgreSQL

| Type                                 | Best For                                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| **B-tree** (default)                 | Equality and range queries (`=`, `<`, `>`, `BETWEEN`, sorting) — the vast majority of use cases |
| **Hash**                             | Simple equality comparisons only (`=`) — rarely used since B-tree handles this well too         |
| **GIN** (Generalized Inverted Index) | Full-text search, `JSONB` containment queries, array columns                                    |
| **GiST** (Generalized Search Tree)   | Geometric data, full-text search, range types                                                   |
| **BRIN** (Block Range Index)         | Very large tables with naturally ordered data (e.g., time-series), extremely compact            |

```sql
-- GIN index for fast JSONB containment queries
CREATE INDEX idx_products_metadata ON products USING GIN (metadata);
SELECT * FROM products WHERE metadata @> '{"featured": true}';

-- GIN index for full-text search
CREATE INDEX idx_articles_search ON articles USING GIN (to_tsvector('english', body));
SELECT * FROM articles WHERE to_tsvector('english', body) @@ to_tsquery('postgresql & indexing');
```

## Viewing and Managing Indexes

```sql
\di                          -- list all indexes (psql)
\d users                      -- shows indexes as part of table description

DROP INDEX idx_users_email;
DROP INDEX CONCURRENTLY idx_users_email; -- drop without locking the table (safer on production)
```

## `EXPLAIN` and `EXPLAIN ANALYZE` — Verifying Index Usage

```sql
EXPLAIN SELECT * FROM users WHERE email = 'alice@example.com';
```

```
Index Scan using idx_users_email on users  (cost=0.29..8.31 rows=1 width=64)
  Index Cond: (email = 'alice@example.com'::text)
```

vs without an index:

```
Seq Scan on users  (cost=0.00..18.50 rows=1 width=64)
  Filter: (email = 'alice@example.com'::text)
```

`EXPLAIN ANALYZE` additionally **executes** the query and shows actual timing/row counts, not just the planner's estimate:

```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'alice@example.com';
```

## Building Indexes Without Locking (`CONCURRENTLY`)

By default, `CREATE INDEX` locks the table against writes for its duration. On a production system with an already-large table, use `CONCURRENTLY` to build the index without blocking writes (at the cost of taking longer and requiring extra cleanup if it fails).

```sql
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```

## Index Trade-offs

- **Faster reads**, but **slower writes** — every `INSERT`/`UPDATE`/`DELETE` must also update all relevant indexes on the affected row.
- **Additional storage** — each index consumes disk space, sometimes substantial for large tables.
- Only index columns you actually filter, join, or sort on frequently — indexing every column "just in case" wastes storage and slows down writes unnecessarily.

## Index Maintenance: `REINDEX` and Bloat

Indexes can accumulate "bloat" over time (especially with heavy update/delete activity) as dead entries pile up before being reclaimed. `REINDEX` rebuilds an index from scratch.

```sql
REINDEX INDEX idx_users_email;
REINDEX TABLE users; -- rebuild all indexes on the table
```

`VACUUM` (and `VACUUM ANALYZE`) is PostgreSQL's broader maintenance mechanism for reclaiming space from dead rows/index entries and updating query planner statistics — typically handled automatically by **autovacuum**, but can be run manually when needed.

```sql
VACUUM ANALYZE users;
```

## Common Interview-Style Questions

- **Why aren't foreign key columns automatically indexed in PostgreSQL?**
  Unlike primary key and unique constraints, PostgreSQL doesn't automatically create indexes for foreign keys — since they're heavily used in joins and lookups, it's considered a best practice to manually index them.

- **What's the significance of column order in a composite index?**
  A composite index is only efficiently usable as a left-to-right prefix — a query filtering only on the second/later column(s) without the first (leading) column typically can't use the index effectively.

- **What is a partial index, and when would you use one?**
  An index covering only rows matching a specified condition — useful when you frequently query a well-defined subset of a large table (e.g., only active users), producing a smaller, faster index than indexing the entire table.

- **What's the difference between B-tree and GIN indexes?**
  B-tree is the general-purpose default, best for equality/range queries and sorting; GIN is optimized for indexing composite/multi-value data like `JSONB` containment queries, array columns, and full-text search.

- **Why use `CREATE INDEX CONCURRENTLY` on a production database?**
  Standard `CREATE INDEX` locks the table against writes for its duration; `CONCURRENTLY` avoids this lock (at the cost of a longer build time), preventing write downtime on a live production table.

- **What's the difference between `EXPLAIN` and `EXPLAIN ANALYZE`?**
  `EXPLAIN` shows the query planner's estimated execution plan without running the query; `EXPLAIN ANALYZE` actually executes the query and reports real timing and row counts alongside the plan.
