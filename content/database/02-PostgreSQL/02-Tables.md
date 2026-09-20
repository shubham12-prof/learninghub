# 02. Tables

## What is a Table?

A table is the fundamental structure for storing data in PostgreSQL — a collection of rows, each conforming to a fixed set of typed columns defined in the table's schema. Unlike MongoDB collections, PostgreSQL tables strictly enforce their column structure on every row.

## Creating a Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  age INTEGER CHECK (age >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Column Definition Syntax

```
column_name  data_type  [constraints]  [default_value]
```

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  category_id INTEGER REFERENCES categories(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## `SERIAL` vs `IDENTITY` (Auto-Incrementing Primary Keys)

```sql
-- Traditional approach — SERIAL under the hood creates a sequence
CREATE TABLE orders (
  id SERIAL PRIMARY KEY
);

-- Modern, SQL-standard approach (PostgreSQL 10+) — GENERATED IDENTITY
CREATE TABLE orders (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
);
```

`GENERATED ALWAYS AS IDENTITY` is the SQL-standard-compliant, currently recommended approach over `SERIAL` for new schemas, since it behaves more predictably and integrates better with standard SQL tooling.

## `ALTER TABLE` — Modifying an Existing Table

```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users DROP COLUMN phone;
ALTER TABLE users ALTER COLUMN age SET NOT NULL;
ALTER TABLE users ALTER COLUMN age DROP NOT NULL;
ALTER TABLE users ALTER COLUMN age SET DEFAULT 18;
ALTER TABLE users RENAME COLUMN name TO full_name;
ALTER TABLE users RENAME TO app_users;
ALTER TABLE users ALTER COLUMN price TYPE NUMERIC(12, 2); -- change data type
```

## Dropping a Table

```sql
DROP TABLE users;
DROP TABLE IF EXISTS users; -- won't error if it doesn't exist
DROP TABLE users CASCADE;   -- also drops dependent objects (foreign keys, views referencing it)
```

## Truncating vs Deleting All Rows

```sql
DELETE FROM users;      -- removes all rows, logged row-by-row, slower, can be rolled back mid-way, resets nothing
TRUNCATE TABLE users;    -- removes all rows instantly, resets any SERIAL/IDENTITY counter, much faster for large tables
```

`TRUNCATE` is generally preferred for quickly clearing a large table when you don't need row-level transaction logging, though it still respects transactions (can be rolled back if inside one).

## `NOT NULL` and `DEFAULT`

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  signup_date DATE DEFAULT CURRENT_DATE
);
```

## Composite Primary Keys

```sql
CREATE TABLE order_items (
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  PRIMARY KEY (order_id, product_id) -- combination must be unique
);
```

## Table Inheritance (PostgreSQL-Specific Feature)

PostgreSQL supports table inheritance, letting a child table inherit columns from a parent — occasionally used for certain partitioning-like patterns, though modern **declarative partitioning** (see below) is generally preferred for that use case today.

```sql
CREATE TABLE vehicles (id SERIAL PRIMARY KEY, brand TEXT);
CREATE TABLE cars (doors INTEGER) INHERITS (vehicles);
```

## Table Partitioning (For Large Tables)

Splits a large table into smaller physical pieces ("partitions") while still being queried as a single logical table — useful for very large datasets (e.g., time-series data), improving query performance and maintenance (like dropping old partitions instead of deleting rows).

```sql
CREATE TABLE events (
  id SERIAL,
  event_type TEXT,
  created_at TIMESTAMP NOT NULL
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2026_q1 PARTITION OF events
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');

CREATE TABLE events_2026_q2 PARTITION OF events
  FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
```

Queries against `events` automatically route to the relevant partition(s) based on the filter conditions (**partition pruning**), and old partitions can be dropped instantly (`DROP TABLE events_2025_q1`) instead of running a slow bulk `DELETE`.

## Temporary Tables

```sql
CREATE TEMP TABLE session_data (
  id SERIAL PRIMARY KEY,
  data JSONB
);
-- Automatically dropped at the end of the database session
```

Useful for intermediate results within complex data-processing scripts/transactions without polluting the permanent schema.

## Inspecting Table Structure

```sql
\d users             -- psql: describe table structure, constraints, indexes

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users';
```

## Common Interview-Style Questions

- **What's the difference between `SERIAL` and `GENERATED ALWAYS AS IDENTITY`?**
  Both provide auto-incrementing integer columns; `SERIAL` is a PostgreSQL-specific convenience that creates a backing sequence, while `GENERATED ALWAYS AS IDENTITY` is the SQL-standard-compliant approach (added in PostgreSQL 10), now generally recommended for new schemas.

- **What's the difference between `DELETE FROM table` and `TRUNCATE TABLE`?**
  `DELETE` removes rows one at a time (fully logged, can use a `WHERE` clause, doesn't reset sequences); `TRUNCATE` removes all rows instantly (minimal logging, resets identity/serial counters), but can't filter specific rows — it always clears the entire table.

- **What is table partitioning, and why use it?**
  Splitting a large logical table into smaller physical partitions (commonly by a range like date), improving query performance via partition pruning and simplifying maintenance like bulk-dropping old data.

- **What does `DROP TABLE ... CASCADE` do?**
  It drops the table along with any dependent objects that reference it (like foreign key constraints from other tables, or views built on top of it) — without `CASCADE`, PostgreSQL would refuse the drop if dependencies exist.
