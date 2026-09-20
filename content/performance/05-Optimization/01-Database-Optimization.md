# Database Optimization

## 1. Why Database Optimization Matters

The database is often the biggest bottleneck in an application because disk I/O and query processing are orders of magnitude slower than in-memory operations. A slow query on a small table might be fine; the same query pattern on millions of rows can take the app down.

```
[App Server] --query--> [Database]
                            |
                     Slow query = blocked connection = thread pool exhaustion
                     = cascading slowdowns across the whole app
```

## 2. Indexing

### What is an Index?

A data structure (typically a **B-Tree**, sometimes a **Hash Index**) that lets the database find rows without scanning the entire table.

```
Without index: SELECT * FROM users WHERE email = 'a@b.com';
  -> Full table scan: O(n), checks every row

With index on `email`:
  -> B-Tree lookup: O(log n), jumps directly to matching rows
```

### Creating Indexes

```sql
-- Single column index
CREATE INDEX idx_users_email ON users(email);

-- Composite index (order matters!)
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- Unique index (also enforces uniqueness)
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Partial index (Postgres) - only index a subset of rows
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;
```

### Composite Index Column Order Rule

A composite index on `(a, b, c)` can efficiently serve queries filtering on `a`, `(a,b)`, or `(a,b,c)` — but NOT on `b` alone or `c` alone (leftmost prefix rule).

```sql
-- Index: (user_id, status)
SELECT * FROM orders WHERE user_id = 5;                    -- Uses index ✓
SELECT * FROM orders WHERE user_id = 5 AND status = 'paid'; -- Uses index ✓
SELECT * FROM orders WHERE status = 'paid';                 -- Does NOT use index ✗
```

### When Indexes Hurt

- Every `INSERT`/`UPDATE`/`DELETE` must also update all indexes → write overhead.
- Too many indexes waste storage and slow down writes.
- Indexing low-cardinality columns (e.g., a boolean `is_active`) rarely helps.

### Finding Missing/Unused Indexes

```sql
-- Postgres: check query plan
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 5;

-- Look for "Seq Scan" (bad, full table scan) vs "Index Scan" (good)
```

```sql
-- Postgres: find unused indexes
SELECT indexrelname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0;
```

## 3. Query Optimization

### Avoid `SELECT *`

```sql
-- BAD: fetches unnecessary columns, more I/O and network transfer
SELECT * FROM users WHERE id = 1;

-- GOOD: fetch only what's needed
SELECT id, name, email FROM users WHERE id = 1;
```

### Avoid N+1 Query Problem

```js
// BAD: 1 query for posts + N queries for each post's author (N+1 problem)
const posts = await db.query("SELECT * FROM posts");
for (const post of posts) {
  post.author = await db.query("SELECT * FROM users WHERE id = ?", [
    post.author_id,
  ]);
}

// GOOD: single JOIN query
const posts = await db.query(`
  SELECT posts.*, users.name AS author_name
  FROM posts
  JOIN users ON posts.author_id = users.id
`);
```

```js
// GOOD (ORM alternative): eager loading / batching
const posts = await Post.findAll({ include: [{ model: User, as: "author" }] });
```

### Use `EXPLAIN` to Understand Query Plans

```sql
EXPLAIN ANALYZE
SELECT o.id, u.name
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.status = 'pending';
```

Look for: `Seq Scan` (bad on large tables), high `cost`, high `rows` estimate mismatches, nested loops on large datasets.

### Pagination — Avoid `OFFSET` on Large Tables

```sql
-- BAD: OFFSET forces DB to scan and discard all preceding rows
SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET 100000;

-- GOOD: keyset/cursor pagination - uses index, O(log n) regardless of page depth
SELECT * FROM posts
WHERE created_at < '2026-01-01T00:00:00Z'
ORDER BY created_at DESC
LIMIT 20;
```

### Batch Writes Instead of One-by-One

```js
// BAD: 1000 round trips
for (const user of users) {
  await db.query("INSERT INTO users (name, email) VALUES (?, ?)", [
    user.name,
    user.email,
  ]);
}

// GOOD: single batched insert
await db.query("INSERT INTO users (name, email) VALUES ?", [
  users.map((u) => [u.name, u.email]),
]);
```

## 4. Schema Design

### Normalization vs Denormalization

```
Normalized (avoids duplication, easier consistency):
  orders(id, user_id, total)
  users(id, name, email)

Denormalized (faster reads, avoids JOINs, some duplication):
  orders(id, user_id, user_name, user_email, total)
```

Use normalization for write-heavy, consistency-critical systems; denormalize for read-heavy systems where JOIN cost outweighs duplication cost (common in analytics/reporting tables, NoSQL).

### Choosing Data Types Carefully

```sql
-- BAD: oversized types waste storage & memory, slow comparisons
CREATE TABLE users (id BIGINT, age VARCHAR(255), is_active VARCHAR(10));

-- GOOD: right-sized types
CREATE TABLE users (id INT, age TINYINT, is_active BOOLEAN);
```

## 5. Connection Pooling

Opening a new DB connection per request is expensive (TCP handshake, auth). Use a pool of reusable connections.

```js
// Node.js with `pg` (Postgres)
const { Pool } = require("pg");
const pool = new Pool({
  host: "localhost",
  max: 20, // max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

app.get("/users/:id", async (req, res) => {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [
    req.params.id,
  ]);
  res.json(result.rows[0]);
});
```

## 6. Caching Layer (Reduce DB Load)

```js
// Cache-aside pattern with Redis (see Caching notes for full detail)
async function getUser(id) {
  const cached = await redis.get(`user:${id}`);
  if (cached) return JSON.parse(cached);

  const user = await db.query("SELECT * FROM users WHERE id = ?", [id]);
  await redis.set(`user:${id}`, JSON.stringify(user), "EX", 3600);
  return user;
}
```

## 7. Read Replicas & Sharding

### Read Replicas

```
[Primary DB] --replication--> [Replica 1] [Replica 2] [Replica 3]

Writes -> Primary only
Reads  -> Load-balanced across replicas
```

```js
const writePool = new Pool({ host: "primary-db-host" });
const readPool = new Pool({ host: "replica-db-host" });

async function createUser(data) {
  return writePool.query("INSERT INTO users ...", data);
}
async function getUser(id) {
  return readPool.query("SELECT * FROM users WHERE id = $1", [id]);
}
```

### Sharding (Horizontal Partitioning)

```
Shard by user_id % 4:
  Shard 0: user_id 0, 4, 8, 12...
  Shard 1: user_id 1, 5, 9, 13...
  Shard 2: user_id 2, 6, 10, 14...
  Shard 3: user_id 3, 7, 11, 15...
```

Used when a single database instance can't handle the data volume/write throughput even with indexing and replicas.

## 8. Transactions & Locking

```sql
-- Keep transactions short to avoid holding locks too long
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

```sql
-- Use appropriate isolation level - don't default to the strictest if not needed
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

## 9. Monitoring & Diagnosing Slow Queries

```sql
-- Postgres: enable slow query logging
-- postgresql.conf
log_min_duration_statement = 200  -- log queries slower than 200ms
```

```sql
-- MySQL: slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 0.2;
```

```sql
-- Postgres: find the slowest queries currently
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## 10. Best Practices

1. Index columns used in `WHERE`, `JOIN`, and `ORDER BY` clauses — but don't over-index.
2. Always check `EXPLAIN ANALYZE` before shipping a new query on a large table.
3. Avoid `SELECT *`; fetch only needed columns.
4. Eliminate N+1 queries with JOINs or batched/eager loading.
5. Use keyset pagination instead of large `OFFSET` values.
6. Use connection pooling; never open a raw connection per request.
7. Cache frequently-read, rarely-changed data (see Caching notes).
8. Scale reads with replicas before reaching for sharding; shard only when truly necessary (adds significant complexity).
9. Keep transactions short to minimize lock contention.
10. Monitor slow query logs continuously, not just during initial development.
