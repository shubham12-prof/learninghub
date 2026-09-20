# 04. Joins

## What is a JOIN?

A `JOIN` combines rows from two or more tables based on a related column, letting you query across relationships instead of manually stitching data together in application code.

## Sample Tables Used Throughout

```sql
-- users: id, name
-- orders: id, user_id, total

INSERT INTO users (name) VALUES ('Alice'), ('Bob'), ('Carol');
INSERT INTO orders (user_id, total) VALUES (1, 50.00), (1, 30.00), (2, 20.00);
-- Note: Carol (id 3) has no orders
```

## INNER JOIN — Only Matching Rows

Returns rows where there's a match in **both** tables. Rows without a match on either side are excluded.

```sql
SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id;
```

Result: Alice (x2), Bob — **Carol is excluded** (no matching orders).

> `JOIN` alone (without a qualifier) defaults to `INNER JOIN` in PostgreSQL.

## LEFT JOIN (LEFT OUTER JOIN) — All Rows from the Left Table

Returns all rows from the left table, with matching rows from the right table where available, and `NULL`s where there's no match.

```sql
SELECT u.name, o.total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;
```

Result: Alice (x2), Bob, **Carol with `total = NULL`** — Carol is included even without orders.

### Common Pattern: Find Rows with No Match

```sql
SELECT u.name
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.id IS NULL; -- users with NO orders
```

## RIGHT JOIN (RIGHT OUTER JOIN) — All Rows from the Right Table

The mirror image of `LEFT JOIN` — all rows from the right table, matched rows from the left, `NULL`s where no match.

```sql
SELECT u.name, o.total
FROM users u
RIGHT JOIN orders o ON u.id = o.user_id;
```

In practice, `RIGHT JOIN` is used less often than `LEFT JOIN` — most people just swap table order and use `LEFT JOIN` for readability/consistency.

## FULL JOIN (FULL OUTER JOIN) — All Rows from Both Tables

Returns all rows from both tables, with `NULL`s filled in wherever there's no match on either side.

```sql
SELECT u.name, o.total
FROM users u
FULL JOIN orders o ON u.id = o.user_id;
```

Includes every user (even without orders) AND every order (even if, hypothetically, its user_id didn't match any user).

## CROSS JOIN — Cartesian Product

Combines every row from the first table with every row from the second table — no join condition, resulting in `N × M` rows. Used rarely, but useful for generating combinations (e.g., all possible size/color combinations for a product).

```sql
SELECT s.size, c.color
FROM sizes s
CROSS JOIN colors c;
```

## SELF JOIN — Joining a Table to Itself

Uses table aliases to treat the same table as if it were two separate tables, commonly for hierarchical data.

```sql
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
```

## Joining Multiple Tables

```sql
SELECT u.name, o.id AS order_id, p.name AS product_name, oi.quantity
FROM users u
JOIN orders o ON u.id = o.user_id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE u.id = 1;
```

## Visual Summary of Join Types

```
INNER JOIN:      A ∩ B                (only matching rows)
LEFT JOIN:       A + (A ∩ B)          (all of A, matched B or NULL)
RIGHT JOIN:      B + (A ∩ B)          (all of B, matched A or NULL)
FULL JOIN:       A ∪ B                (everything, NULLs where unmatched)
CROSS JOIN:      A × B                (every combination, no condition)
```

## `USING` — Shorthand for Equal Column Names

If the join columns have the exact same name in both tables, `USING` is more concise than `ON`.

```sql
-- Equivalent to: ON u.id = o.user_id (only works if column is literally named the same, e.g., both "id")
SELECT * FROM users JOIN orders USING (id); -- only valid if both tables actually share a column literally named "id"
```

In practice, foreign key columns are often named differently (`user_id` vs `id`), so `ON` is more commonly used than `USING`.

## Joins with Aggregation

```sql
SELECT u.name, COUNT(o.id) AS order_count, COALESCE(SUM(o.total), 0) AS total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name
ORDER BY total_spent DESC;
```

`COALESCE` here replaces `NULL` (for users with no orders) with `0`, since `SUM()` over zero matched rows returns `NULL`, not `0`.

## Join Performance Considerations

- Always ensure **foreign key columns are indexed** — joins filter/match on these columns constantly, and an unindexed foreign key forces a full scan of the joined table for every row.
- Use `EXPLAIN ANALYZE` to inspect the actual join strategy PostgreSQL chooses (nested loop, hash join, merge join) and verify indexes are being used effectively.

```sql
EXPLAIN ANALYZE
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.id = 5;
```

## Common Interview-Style Questions

- **What's the difference between `INNER JOIN` and `LEFT JOIN`?**
  `INNER JOIN` returns only rows with matches in both tables; `LEFT JOIN` returns all rows from the left table regardless of a match, filling in `NULL` for unmatched right-table columns.

- **How would you find all users who have never placed an order?**
  `LEFT JOIN` users to orders on the foreign key, then filter with `WHERE orders.id IS NULL` to isolate users with no matching order.

- **What is a `CROSS JOIN`, and when would you use one?**
  It produces the Cartesian product of two tables (every row from one paired with every row from the other, no condition) — used rarely, mainly for generating all possible combinations of two independent sets.

- **What is a self join, and give a common use case.**
  Joining a table to itself (using aliases to distinguish the two "copies") — commonly used for hierarchical relationships like an employee-manager structure within a single `employees` table.

- **Why is it important to index foreign key columns used in joins?**
  Without an index, PostgreSQL must scan the entire joined table to find matching rows for each row being joined, which is slow at scale; an index lets it look up matches efficiently.
