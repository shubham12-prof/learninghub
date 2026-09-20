# 11. Performance Tuning

## The Core Diagnostic Tool: `EXPLAIN ANALYZE`

Before optimizing anything, understand what the query planner is actually doing.

```sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 42 AND status = 'shipped';
```

```
Seq Scan on orders  (cost=0.00..1834.00 rows=12 width=64) (actual time=0.02..15.23 rows=8 loops=1)
  Filter: ((user_id = 42) AND (status = 'shipped'::text))
  Rows Removed by Filter: 49992
Planning Time: 0.15 ms
Execution Time: 15.30 ms
```

Key things to check:

- **`Seq Scan` vs `Index Scan`** — a sequential scan on a large table is a red flag if you expect this query to run often.
- **`Rows Removed by Filter`** — high numbers mean the planner is scanning far more rows than it needs to.
- **Estimated (`cost`, `rows`) vs actual (`actual time`, `rows`)** — large discrepancies often indicate stale statistics (see `ANALYZE` below).

## 1. Indexing (The Most Common Fix)

```sql
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
```

```
-- After adding the index:
Index Scan using idx_orders_user_status on orders (cost=0.29..8.31 rows=8 width=64) (actual time=0.02..0.04 rows=8 loops=1)
  Index Cond: ((user_id = 42) AND (status = 'shipped'::text))
Execution Time: 0.06 ms
```

(See the dedicated Indexes notes for full detail on index types, composite indexes, and the ESR-style column ordering principle.)

## 2. Keeping Statistics Fresh: `ANALYZE`

PostgreSQL's query planner relies on statistics about data distribution to choose good execution plans. Stale statistics (e.g., after a large bulk insert/delete) can lead to poor plan choices.

```sql
ANALYZE orders;         -- update statistics for one table
ANALYZE;                 -- update statistics for the whole database
```

Normally handled automatically by **autovacuum**, but worth running manually after a large bulk data change.

## 3. `VACUUM` — Reclaiming Dead Space

PostgreSQL uses MVCC (Multi-Version Concurrency Control) — updates/deletes don't immediately remove old row versions, they mark them as "dead" for later cleanup. `VACUUM` reclaims this space.

```sql
VACUUM orders;             -- reclaim space, doesn't lock the table for reads/writes
VACUUM ANALYZE orders;      -- reclaim space AND update planner statistics together
VACUUM FULL orders;         -- more aggressive, rewrites the table, requires an exclusive lock (use sparingly, during maintenance windows)
```

Autovacuum handles this automatically in the background under normal circumstances, but heavy write workloads or misconfigured autovacuum settings can require manual intervention.

## 4. Avoiding `SELECT *`

```sql
-- BAD — fetches every column, even ones you don't need, increasing I/O and network transfer
SELECT * FROM users WHERE id = 1;

-- GOOD — fetch only what's needed
SELECT id, name, email FROM users WHERE id = 1;
```

This also enables **covering indexes** — if all needed columns exist within an index, PostgreSQL can sometimes avoid touching the actual table (an "index-only scan").

```sql
CREATE INDEX idx_users_covering ON users(id) INCLUDE (name, email);
```

## 5. Query Rewriting: Avoiding N+1 Query Patterns

```sql
-- BAD — one query per user in application code (N+1 problem)
-- for each user: SELECT * FROM orders WHERE user_id = ?

-- GOOD — a single query fetching everything needed at once
SELECT o.* FROM orders o WHERE o.user_id IN (1, 2, 3, 4, 5);

-- Or, using a JOIN to get users + orders together
SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id WHERE u.id = ANY($1);
```

## 6. Connection Pooling

Each PostgreSQL connection has meaningful memory/process overhead. Opening a new connection per request (instead of reusing a pool) is a common, significant performance bottleneck in application code.

```js
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 20 }); // reuse connections
```

For very high-concurrency workloads, an external pooler like **PgBouncer** is commonly deployed in front of PostgreSQL to manage connections more efficiently than the database's native connection handling alone.

## 7. Efficient Pagination

```sql
-- Offset pagination — gets progressively slower on large offsets
SELECT * FROM products ORDER BY id LIMIT 20 OFFSET 10000;

-- Keyset/cursor pagination — consistently fast regardless of position
SELECT * FROM products WHERE id > 10000 ORDER BY id LIMIT 20;
```

(Full trade-off discussion in the REST API Pagination notes — the same principle applies directly to SQL query design.)

## 8. Batching Writes

```sql
-- BAD — many round trips
INSERT INTO logs (message) VALUES ('event 1');
INSERT INTO logs (message) VALUES ('event 2');
-- ... repeated many times

-- GOOD — single round trip, single statement
INSERT INTO logs (message) VALUES ('event 1'), ('event 2'), ('event 3');
```

## 9. `LIMIT` Early, Filter Early

Ensure `WHERE` clauses are as selective as possible and applied before expensive operations (joins, aggregations) wherever the query planner allows — though PostgreSQL's planner will often reorder these automatically, being mindful of filter placement in complex queries still helps, especially with CTEs (see below).

## 10. Common Table Expressions (CTEs) — Materialization Caveat

```sql
WITH recent_orders AS (
  SELECT * FROM orders WHERE created_at > NOW() - INTERVAL '30 days'
)
SELECT * FROM recent_orders WHERE total > 100;
```

In PostgreSQL 12+, non-recursive CTEs are **inlined by default** (like a subquery) unless they're referenced multiple times or explicitly marked, so this is no longer the automatic performance trap it was in older versions — but you can force materialization or inlining explicitly when needed:

```sql
WITH recent_orders AS MATERIALIZED (  -- forces PostgreSQL to compute this once and store it
  SELECT * FROM orders WHERE created_at > NOW() - INTERVAL '30 days'
)
SELECT * FROM recent_orders WHERE total > 100;

WITH recent_orders AS NOT MATERIALIZED ( -- forces inlining, like a subquery
  SELECT * FROM orders WHERE created_at > NOW() - INTERVAL '30 days'
)
SELECT * FROM recent_orders WHERE total > 100;
```

## 11. Monitoring Slow Queries

```sql
-- Enable logging of slow queries in postgresql.conf
log_min_duration_statement = 200  -- log any query taking longer than 200ms
```

The `pg_stat_statements` extension tracks execution statistics for all queries run on the server, making it easy to find your worst-performing queries in aggregate.

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

## 12. Table Partitioning for Very Large Tables

(Covered in detail in Tables notes) — partitioning large time-series-style tables can dramatically improve query performance via partition pruning and simplify maintenance (dropping old partitions instantly instead of slow bulk deletes).

## 13. Choosing Appropriate Data Types

```sql
-- Using the smallest sufficient type reduces storage and improves cache efficiency
age SMALLINT       -- instead of INTEGER, if the range fits
status VARCHAR(20)  -- instead of TEXT, if there's a genuinely bounded set of values (though PostgreSQL TEXT/VARCHAR performance is nearly identical in practice)
```

## 14. `ANALYZE` After Major Schema/Data Changes

Always run `ANALYZE` (or `VACUUM ANALYZE`) after bulk data loads, large deletes, or significant schema changes, to ensure the planner has accurate statistics for future query plans.

## Performance Tuning Checklist

1. Run `EXPLAIN ANALYZE` on slow queries — identify `Seq Scan`s on large tables.
2. Add appropriate indexes (single-column, composite, partial, or expression) based on actual query patterns.
3. Avoid `SELECT *` — fetch only needed columns.
4. Batch writes; avoid N+1 query patterns from application code.
5. Use connection pooling.
6. Keep statistics fresh (`ANALYZE`) and let autovacuum run properly (or tune it for write-heavy tables).
7. Consider partitioning for very large, naturally-partitionable tables.
8. Monitor with `pg_stat_statements` to find the actual worst offenders instead of guessing.

## Common Interview-Style Questions

- **What's the first step you'd take when diagnosing a slow PostgreSQL query?**
  Run `EXPLAIN ANALYZE` on the query to see the actual execution plan, checking for sequential scans on large tables, high "rows removed by filter" counts, and discrepancies between estimated and actual row counts (which can indicate stale statistics).

- **Why does PostgreSQL need `VACUUM`, and what does it do?**
  PostgreSQL's MVCC model doesn't immediately physically remove old row versions on update/delete — it marks them as dead for later cleanup; `VACUUM` reclaims that space, normally handled automatically by autovacuum in the background.

- **Why can `SELECT *` hurt performance, even beyond the obvious "sends more data" concern?**
  It can prevent index-only scans (a covering index that includes all needed columns can't be used if unnecessary columns are also being fetched from the table), and increases I/O/network transfer unnecessarily.

- **What's the performance difference between offset-based and keyset (cursor) pagination in SQL?**
  Offset-based pagination gets progressively slower as the offset grows, since the database must still scan/skip that many rows; keyset pagination anchors to the last-seen value and filters directly (`WHERE id > last_id`), maintaining consistent performance regardless of position.

- **What is `pg_stat_statements`, and why is it useful for performance tuning?**
  A PostgreSQL extension that tracks execution statistics (call counts, total/average execution time) for every distinct query run on the server, making it easy to identify the actual worst-performing queries in aggregate rather than guessing or relying on anecdotal slowness reports.
