# 01. SQL Basics

## What is PostgreSQL?

PostgreSQL ("Postgres") is a powerful, open-source **object-relational database management system (ORDBMS)** known for standards compliance, extensibility, and robustness. It uses SQL (Structured Query Language) as its primary interface for defining and manipulating data.

## Connecting to PostgreSQL

```bash
psql -U postgres -d mydb -h localhost -p 5432
```

```sql
\l              -- list databases
\c mydb         -- connect to a database
\dt             -- list tables
\d users        -- describe a table's structure
\q              -- quit
```

## Categories of SQL Commands

| Category                               | Purpose                        | Examples                      |
| -------------------------------------- | ------------------------------ | ----------------------------- |
| **DDL** (Data Definition Language)     | Define/modify schema structure | `CREATE`, `ALTER`, `DROP`     |
| **DML** (Data Manipulation Language)   | Modify data                    | `INSERT`, `UPDATE`, `DELETE`  |
| **DQL** (Data Query Language)          | Query data                     | `SELECT`                      |
| **DCL** (Data Control Language)        | Manage permissions             | `GRANT`, `REVOKE`             |
| **TCL** (Transaction Control Language) | Manage transactions            | `BEGIN`, `COMMIT`, `ROLLBACK` |

## Creating a Database and Table

```sql
CREATE DATABASE myapp;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  age INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## INSERT — Adding Data

```sql
INSERT INTO users (name, email, age) VALUES ('Alice', 'alice@example.com', 30);

INSERT INTO users (name, email, age) VALUES
  ('Bob', 'bob@example.com', 25),
  ('Carol', 'carol@example.com', 35);

-- Insert and return the generated row
INSERT INTO users (name, email) VALUES ('Dave', 'dave@example.com') RETURNING id, created_at;
```

## SELECT — Querying Data

```sql
SELECT * FROM users;
SELECT name, email FROM users;
SELECT name, email FROM users WHERE age > 25;
SELECT DISTINCT age FROM users;
```

### Filtering with `WHERE`

```sql
SELECT * FROM users WHERE age >= 18 AND age <= 65;
SELECT * FROM users WHERE age BETWEEN 18 AND 65;
SELECT * FROM users WHERE name LIKE 'A%';        -- starts with 'A'
SELECT * FROM users WHERE email ILIKE '%example%'; -- case-insensitive LIKE
SELECT * FROM users WHERE age IN (25, 30, 35);
SELECT * FROM users WHERE age IS NULL;
SELECT * FROM users WHERE age IS NOT NULL;
SELECT * FROM users WHERE NOT (age < 18);
```

### Sorting and Limiting

```sql
SELECT * FROM users ORDER BY age DESC;
SELECT * FROM users ORDER BY age DESC, name ASC; -- multi-column sort
SELECT * FROM users LIMIT 10;
SELECT * FROM users LIMIT 10 OFFSET 20; -- pagination
```

## UPDATE — Modifying Data

```sql
UPDATE users SET age = 31 WHERE email = 'alice@example.com';
UPDATE users SET age = age + 1 WHERE name = 'Bob';
UPDATE users SET name = 'Alice Updated', age = 32 WHERE id = 1 RETURNING *;
```

> **Always include a `WHERE` clause** on `UPDATE`/`DELETE` — omitting it applies the change to **every row** in the table.

## DELETE — Removing Data

```sql
DELETE FROM users WHERE id = 5;
DELETE FROM users WHERE age < 18;
DELETE FROM users; -- deletes ALL rows (be careful!)
```

## Aggregate Functions

```sql
SELECT COUNT(*) FROM users;
SELECT AVG(age) FROM users;
SELECT MIN(age), MAX(age) FROM users;
SELECT SUM(age) FROM users;
```

## `GROUP BY` and `HAVING`

```sql
SELECT age, COUNT(*) AS user_count
FROM users
GROUP BY age
ORDER BY user_count DESC;

-- HAVING filters groups (after aggregation); WHERE filters rows (before aggregation)
SELECT age, COUNT(*) AS user_count
FROM users
GROUP BY age
HAVING COUNT(*) > 1;
```

## Common Operators

```sql
=, <>  (or !=), <, >, <=, >=       -- comparison
AND, OR, NOT                       -- logical
LIKE, ILIKE                         -- pattern matching
IN, NOT IN                          -- membership
BETWEEN                             -- range
IS NULL, IS NOT NULL                -- null checks
```

## Data Types Overview

| Category  | Types                                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------- |
| Numeric   | `INTEGER`, `SMALLINT`, `BIGINT`, `DECIMAL`, `NUMERIC`, `REAL`, `DOUBLE PRECISION`, `SERIAL` (auto-incrementing) |
| Text      | `VARCHAR(n)`, `CHAR(n)`, `TEXT`                                                                                 |
| Date/Time | `DATE`, `TIME`, `TIMESTAMP`, `TIMESTAMPTZ`, `INTERVAL`                                                          |
| Boolean   | `BOOLEAN`                                                                                                       |
| JSON      | `JSON`, `JSONB` (binary, indexable, generally preferred)                                                        |
| Array     | `INTEGER[]`, `TEXT[]`, etc.                                                                                     |
| UUID      | `UUID`                                                                                                          |
| Enum      | `CREATE TYPE mood AS ENUM ('happy', 'sad', 'neutral');`                                                         |

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  tags TEXT[],
  metadata JSONB,
  in_stock BOOLEAN DEFAULT true
);
```

## Querying JSONB Fields

```sql
SELECT metadata->>'color' AS color FROM products;      -- extract as text
SELECT * FROM products WHERE metadata->>'brand' = 'Nike';
SELECT * FROM products WHERE metadata @> '{"featured": true}'; -- containment operator
```

## Common Interview-Style Questions

- **What's the difference between `WHERE` and `HAVING`?**
  `WHERE` filters individual rows before any grouping/aggregation occurs; `HAVING` filters groups after aggregation (e.g., filtering on the result of `COUNT()` or `SUM()`).

- **What's the difference between `LIKE` and `ILIKE`?**
  `LIKE` performs case-sensitive pattern matching; `ILIKE` is PostgreSQL's case-insensitive variant.

- **Why should `UPDATE`/`DELETE` always include a `WHERE` clause?**
  Without it, the statement applies to every row in the table — a very common and dangerous mistake if forgotten.

- **What's the difference between `JSON` and `JSONB` in PostgreSQL?**
  `JSON` stores an exact text copy of the input (preserving formatting/whitespace/key order) and is re-parsed on every access; `JSONB` stores a decomposed binary format that's faster to query, supports indexing, but doesn't preserve exact formatting or duplicate keys — `JSONB` is generally preferred for most use cases.

- **What does `RETURNING` do in an `INSERT`/`UPDATE`/`DELETE` statement?**
  It returns the affected row(s) (or specific columns) directly from the statement, avoiding a separate `SELECT` to fetch the data you just modified.
