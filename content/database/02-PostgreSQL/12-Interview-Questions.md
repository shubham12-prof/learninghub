# 12. Interview Questions — PostgreSQL (Comprehensive)

A consolidated set of commonly asked PostgreSQL interview questions, organized by topic, with concise answers and code where useful.

---

## SQL Basics

**Q: What's the difference between `WHERE` and `HAVING`?**
`WHERE` filters individual rows before grouping/aggregation; `HAVING` filters groups after aggregation (e.g., filtering on `COUNT()`/`SUM()` results).

**Q: `LIKE` vs `ILIKE`?**
`LIKE` is case-sensitive pattern matching; `ILIKE` is PostgreSQL's case-insensitive variant.

**Q: `JSON` vs `JSONB`?**
`JSON` stores an exact text copy (preserves formatting, re-parsed each access); `JSONB` stores a decomposed binary format (faster to query, indexable) — `JSONB` is generally preferred.

**Q: What does `RETURNING` do?**
Returns affected row(s)/columns directly from an `INSERT`/`UPDATE`/`DELETE`, avoiding a separate `SELECT`.

---

## Tables

**Q: `SERIAL` vs `GENERATED ALWAYS AS IDENTITY`?**
Both provide auto-incrementing integers; `SERIAL` is PostgreSQL-specific (backed by a sequence), while `GENERATED ALWAYS AS IDENTITY` is the SQL-standard-compliant approach, now generally recommended.

**Q: `DELETE FROM table` vs `TRUNCATE TABLE`?**
`DELETE` removes rows individually (fully logged, supports `WHERE`, doesn't reset sequences); `TRUNCATE` clears the entire table instantly (minimal logging, resets identity counters), no row filtering.

**Q: What is table partitioning, and why use it?**
Splitting a large logical table into smaller physical partitions (often by date range), improving query performance via partition pruning and simplifying maintenance like bulk-dropping old data.

---

## Relationships

**Q: How do you model one-to-many, one-to-one, and many-to-many relationships?**
One-to-many: foreign key on the "many" side. One-to-one: foreign key with a `UNIQUE`/primary key constraint. Many-to-many: a junction table with two foreign keys, often forming a composite primary key.

**Q: `ON DELETE CASCADE` vs `ON DELETE SET NULL`?**
`CASCADE` automatically deletes dependent rows; `SET NULL` nullifies the foreign key column in dependent rows instead, keeping them but disassociating from the deleted parent.

**Q: What is a self-referencing foreign key?**
A foreign key column referencing the same table's primary key — used for hierarchical data like employee-manager relationships.

---

## Joins

**Q: `INNER JOIN` vs `LEFT JOIN`?**
`INNER JOIN` returns only rows with matches in both tables; `LEFT JOIN` returns all rows from the left table, with `NULL` for unmatched right-table columns.

**Q: How do you find rows with no matching related row?**
`LEFT JOIN` then filter `WHERE right_table.id IS NULL`.

**Q: What is a self join?**
Joining a table to itself using aliases, commonly for hierarchical structures within a single table.

**Q: Why index foreign key columns used in joins?**
Without an index, PostgreSQL must scan the entire joined table for matches on every row — an index enables efficient lookups instead.

---

## Constraints

**Q: `PRIMARY KEY` vs `UNIQUE`?**
Both enforce uniqueness; `PRIMARY KEY` also implies `NOT NULL` and only one per table (though it can span multiple columns); `UNIQUE` allows multiple constraints and permits `NULL` values (treated as distinct from each other).

**Q: What does a `CHECK` constraint do?**
Enforces an arbitrary boolean condition on column values, e.g., ensuring a price is never negative.

**Q: Why enforce integrity at the database level rather than only in application code?**
Database constraints apply universally regardless of which application/script writes to the table and can't be bypassed by a missed validation step.

---

## Indexes

**Q: Why aren't foreign keys automatically indexed in PostgreSQL?**
Unlike primary/unique constraints, PostgreSQL doesn't auto-index foreign keys — best practice is to manually index them since they're heavily used in joins.

**Q: Significance of column order in a composite index?**
Usable efficiently only as a left-to-right prefix — queries filtering only on non-leading columns typically can't use it effectively.

**Q: What is a partial index?**
An index covering only rows matching a condition — smaller/faster for frequently-queried subsets.

**Q: B-tree vs GIN index?**
B-tree is the general-purpose default (equality/range/sorting); GIN is optimized for composite/multi-value data like `JSONB` containment and full-text search.

**Q: `EXPLAIN` vs `EXPLAIN ANALYZE`?**
`EXPLAIN` shows the estimated plan without running the query; `EXPLAIN ANALYZE` actually executes it and reports real timing/row counts.

---

## Transactions

**Q: Define ACID.**
Atomicity (all-or-nothing), Consistency (valid state transitions), Isolation (concurrent transactions don't interfere), Durability (committed changes survive crashes).

**Q: PostgreSQL's default isolation level?**
`READ COMMITTED` — each statement sees only data committed as of when that statement began.

**Q: `REPEATABLE READ` vs `SERIALIZABLE`?**
`REPEATABLE READ` gives a consistent snapshot for the whole transaction but can still allow phantom reads in some cases; `SERIALIZABLE` is strongest, behaving as if transactions ran sequentially, at the cost of possible retry-requiring serialization failures.

**Q: What does `SELECT ... FOR UPDATE` do?**
Locks selected rows until commit/rollback, preventing concurrent modification — used for safe read-then-write patterns.

**Q: What is a deadlock, and how is it handled?**
Two transactions holding locks the other needs, waiting indefinitely; PostgreSQL auto-detects and aborts one with an error for the app to retry — minimized by consistent lock acquisition order.

---

## Views

**Q: What's the difference between a view and a materialized view?**
A view always reflects current data (re-runs its query live); a materialized view stores a physical snapshot that must be explicitly refreshed, trading freshness for performance.

**Q: Are all views automatically updatable?**
No — only simple, single-table views without aggregation/joins; complex views need an `INSTEAD OF` trigger to support writes.

**Q: How can views support access control?**
By exposing only specific columns/rows of a sensitive table and granting access to the view instead of the base table.

---

## Functions

**Q: `FUNCTION` vs `PROCEDURE`?**
Functions are called in query context and must return a value; procedures are called with `CALL` and can manage their own transactions (`COMMIT`/`ROLLBACK`), unlike functions.

**Q: What does `IMMUTABLE` mean for a function?**
Declares the function always returns the same output for the same input with no side effects, enabling optimizations like use in expression indexes.

**Q: What is a set-returning function?**
A function returning a table (`RETURNS TABLE(...)`), callable like a table source in a `FROM` clause.

---

## Triggers

**Q: Why use a trigger instead of application-level logic?**
Guarantees the logic runs regardless of which application/script performs the write — useful for auditing, invariant enforcement, and derived data maintenance.

**Q: `BEFORE` vs `AFTER` triggers?**
`BEFORE` runs before the change is applied and can modify the row or prevent the operation; `AFTER` runs after the change and is typically used for side effects like logging.

**Q: `NEW` vs `OLD`?**
`NEW` is the incoming/new row version (in `INSERT`/`UPDATE`); `OLD` is the row before change (in `UPDATE`/`DELETE`).

**Q: What is an `INSTEAD OF` trigger?**
A trigger that replaces default write behavior, commonly used to make complex views support `INSERT`/`UPDATE`/`DELETE` by redirecting to underlying tables.

---

## Performance Tuning

**Q: First step when diagnosing a slow query?**
Run `EXPLAIN ANALYZE` to inspect the actual execution plan, checking for sequential scans, high filtered-row counts, and estimate-vs-actual discrepancies.

**Q: Why does PostgreSQL need `VACUUM`?**
MVCC doesn't immediately remove old row versions on update/delete; `VACUUM` reclaims that dead space, normally handled by autovacuum.

**Q: Why can `SELECT *` hurt performance beyond obvious data transfer?**
It can prevent index-only scans, since a covering index can't satisfy the query if extra unnecessary columns must also be fetched from the table.

**Q: Offset vs keyset pagination performance?**
Offset pagination slows down as the offset grows (must scan/skip that many rows); keyset pagination anchors to the last-seen value and maintains consistent performance.

**Q: What is `pg_stat_statements`?**
An extension tracking execution statistics for every distinct query, making it easy to identify actual worst-performing queries in aggregate.

---

## Practical / Coding Questions Often Asked Live

**Q: Write a query to find the top 5 customers by total order value.**

```sql
SELECT u.name, SUM(o.total) AS total_spent
FROM users u
JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name
ORDER BY total_spent DESC
LIMIT 5;
```

**Q: Write a query to find users with no orders.**

```sql
SELECT u.*
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.id IS NULL;
```

**Q: Write a transaction that safely transfers funds, preventing a negative balance.**

```sql
BEGIN;
SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;
-- application checks: is balance >= amount?
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

**Q: Write a trigger that prevents deleting the last admin user.**

```sql
CREATE FUNCTION prevent_last_admin_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'admin' AND (SELECT COUNT(*) FROM users WHERE role = 'admin') <= 1 THEN
    RAISE EXCEPTION 'Cannot delete the last admin user';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_last_admin
BEFORE DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION prevent_last_admin_deletion();
```

**Q: How would you design a schema for a many-to-many "tags on posts" feature?**

```sql
CREATE TABLE posts (id SERIAL PRIMARY KEY, title TEXT);
CREATE TABLE tags (id SERIAL PRIMARY KEY, name TEXT UNIQUE);
CREATE TABLE post_tags (
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
```

**Q: How would you diagnose and fix a slow query filtering on a non-indexed column?**
Run `EXPLAIN ANALYZE` to confirm a `Seq Scan`, identify the filtered/sorted columns, then `CREATE INDEX` (using `CONCURRENTLY` in production) on those columns, re-run `EXPLAIN ANALYZE` to confirm it switches to an `Index Scan`.
