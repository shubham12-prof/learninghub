# 08. Views

## What is a View?

A view is a **stored, named query** that behaves like a virtual table — it doesn't store data itself (by default), but re-runs its underlying query each time it's referenced. Views are useful for simplifying complex queries, enforcing consistent business logic, and restricting access to specific columns/rows.

## Creating a Basic View

```sql
CREATE VIEW active_users AS
SELECT id, name, email
FROM users
WHERE is_active = true;
```

```sql
-- Query the view just like a regular table
SELECT * FROM active_users WHERE name LIKE 'A%';
```

## Why Use Views?

1. **Simplify complex/repeated queries** — hide a complicated `JOIN`/aggregation behind a simple `SELECT * FROM view_name`.
2. **Security/access control** — expose only specific columns/rows to certain users without granting access to the full underlying table.
3. **Abstraction** — if the underlying table structure changes, you can often update the view definition without changing every query that depends on it.
4. **Consistency** — centralize business logic (like "what counts as an active user") in one place instead of repeating the same `WHERE` conditions everywhere.

## A More Complex View Example

```sql
CREATE VIEW order_summary AS
SELECT
  u.id AS user_id,
  u.name,
  COUNT(o.id) AS order_count,
  COALESCE(SUM(o.total), 0) AS total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;
```

```sql
SELECT * FROM order_summary WHERE total_spent > 500 ORDER BY total_spent DESC;
```

## Updating and Dropping Views

```sql
CREATE OR REPLACE VIEW active_users AS
SELECT id, name, email, created_at
FROM users
WHERE is_active = true; -- redefines the view

DROP VIEW active_users;
DROP VIEW IF EXISTS active_users;
```

## Updatable Views

Simple views (based on a single table, without aggregation/`DISTINCT`/`GROUP BY`/window functions) can often be directly updated, inserted into, or deleted from — PostgreSQL automatically translates the operation to the underlying table.

```sql
CREATE VIEW active_users AS
SELECT id, name, email FROM users WHERE is_active = true;

UPDATE active_users SET name = 'Alice Updated' WHERE id = 1; -- works, translates to the underlying "users" table
```

More complex views (joins, aggregates) are generally **not** automatically updatable — you'd need an `INSTEAD OF` trigger (see Triggers notes) to make them so.

## Materialized Views — Views That Store Data

Unlike a regular view (which re-runs its query every time), a **materialized view** physically stores its result set, and must be explicitly refreshed to reflect underlying data changes. Ideal for expensive queries/reports that don't need real-time freshness.

```sql
CREATE MATERIALIZED VIEW monthly_sales AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  SUM(total) AS revenue
FROM orders
GROUP BY DATE_TRUNC('month', created_at);
```

```sql
SELECT * FROM monthly_sales ORDER BY month DESC; -- fast — reads pre-computed, stored data
```

### Refreshing a Materialized View

```sql
REFRESH MATERIALIZED VIEW monthly_sales; -- re-runs the query, replaces stored data (locks the view during refresh)

REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales; -- refreshes without locking reads (requires a unique index on the view)
```

`CONCURRENTLY` requires a unique index to exist on the materialized view first:

```sql
CREATE UNIQUE INDEX idx_monthly_sales_month ON monthly_sales(month);
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales;
```

### Scheduling Refreshes

Materialized views don't auto-refresh on their own — you need to trigger refreshes via a cron job, a scheduled task (e.g., using `pg_cron` extension), or application logic.

```sql
-- Using the pg_cron extension to refresh nightly at 2 AM
SELECT cron.schedule('refresh-monthly-sales', '0 2 * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales');
```

## Views vs Materialized Views — Key Trade-off

|                | View                                                    | Materialized View                                                   |
| -------------- | ------------------------------------------------------- | ------------------------------------------------------------------- |
| Data freshness | Always current (re-runs query live)                     | Stale until explicitly refreshed                                    |
| Performance    | Same cost as running the underlying query each time     | Fast — reads pre-computed stored data                               |
| Storage        | None (no data stored)                                   | Stores a full copy of the result set                                |
| Best for       | Simplifying/reusing query logic where freshness matters | Expensive aggregations/reports where slight staleness is acceptable |

## Views for Access Control (Security Pattern)

```sql
-- Underlying table has sensitive columns
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name TEXT,
  salary NUMERIC,
  ssn TEXT
);

-- Expose only non-sensitive columns via a view
CREATE VIEW employee_directory AS
SELECT id, name FROM employees;

-- Grant access to the view, not the underlying table
GRANT SELECT ON employee_directory TO hr_readonly_role;
```

This lets certain database roles query employee names without ever having direct access to salary or SSN data.

## Views and Query Planning

A regular view is essentially "inlined" into the query that references it — PostgreSQL's planner optimizes the combined query as a whole, so there's typically no meaningful performance penalty just from using a well-designed view versus writing the equivalent query directly.

## Common Interview-Style Questions

- **What is a view, and why use one?**
  A stored, named query that behaves like a virtual table, re-executed each time it's queried; used to simplify complex/repeated queries, provide column/row-level access control, and centralize business logic definitions.

- **What's the key difference between a regular view and a materialized view?**
  A regular view always reflects current data (it re-runs its query live each time); a materialized view stores a physical snapshot of the result set that must be explicitly refreshed, trading data freshness for query performance.

- **Are all views automatically updatable (support `INSERT`/`UPDATE`/`DELETE`)?**
  No — simple views based on a single table without aggregation/joins/`DISTINCT` are typically automatically updatable; more complex views require an `INSTEAD OF` trigger to support write operations.

- **Why might you use a materialized view instead of just caching results in your application?**
  It keeps the caching logic within the database itself (consistent, queryable with normal SQL, indexable), rather than building custom application-level caching/invalidation logic — particularly useful for expensive reporting/aggregation queries.

- **How can views be used for access control?**
  By creating a view exposing only specific columns/rows of a sensitive underlying table, then granting database roles access to the view instead of the base table — restricting what data those roles can see without duplicating the data.
