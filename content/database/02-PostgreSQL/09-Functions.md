# 09. Functions

## What Are Functions in PostgreSQL?

PostgreSQL lets you define reusable server-side functions (also called stored procedures/routines) written in SQL, PL/pgSQL (PostgreSQL's procedural extension of SQL), or other supported languages. Functions can encapsulate business logic, perform calculations, and be called directly within queries.

## Built-in Functions (You've Already Been Using These)

```sql
SELECT COUNT(*), AVG(price), NOW(), UPPER(name), LENGTH(email) FROM products;
```

| Category        | Examples                                                              |
| --------------- | --------------------------------------------------------------------- |
| Aggregate       | `COUNT()`, `SUM()`, `AVG()`, `MIN()`, `MAX()`                         |
| String          | `UPPER()`, `LOWER()`, `LENGTH()`, `CONCAT()`, `SUBSTRING()`, `TRIM()` |
| Date/Time       | `NOW()`, `CURRENT_DATE`, `DATE_TRUNC()`, `EXTRACT()`, `AGE()`         |
| Math            | `ROUND()`, `CEIL()`, `FLOOR()`, `ABS()`, `POWER()`                    |
| Type conversion | `CAST()`, `::` operator (e.g., `'123'::INTEGER`)                      |

## Creating a Simple SQL Function

```sql
CREATE FUNCTION add_numbers(a INTEGER, b INTEGER)
RETURNS INTEGER AS $$
  SELECT a + b;
$$ LANGUAGE SQL;
```

```sql
SELECT add_numbers(5, 3); -- returns 8
```

## PL/pgSQL Functions — Procedural Logic

PL/pgSQL supports variables, conditionals, loops, and exception handling — needed for logic beyond a single SQL expression.

```sql
CREATE FUNCTION get_user_status(user_age INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF user_age < 13 THEN
    RETURN 'child';
  ELSIF user_age < 18 THEN
    RETURN 'teen';
  ELSE
    RETURN 'adult';
  END IF;
END;
$$ LANGUAGE plpgsql;
```

```sql
SELECT get_user_status(15); -- 'teen'
SELECT name, get_user_status(age) AS status FROM users;
```

## Functions Returning a Table (Set-Returning Functions)

```sql
CREATE FUNCTION get_active_orders(min_total NUMERIC)
RETURNS TABLE (order_id INTEGER, user_name TEXT, total NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, u.name, o.total
  FROM orders o
  JOIN users u ON o.user_id = u.id
  WHERE o.total >= min_total AND o.status = 'active';
END;
$$ LANGUAGE plpgsql;
```

```sql
SELECT * FROM get_active_orders(100);
```

## Functions with Loops and Variables

```sql
CREATE FUNCTION calculate_factorial(n INTEGER)
RETURNS BIGINT AS $$
DECLARE
  result BIGINT := 1;
  i INTEGER;
BEGIN
  FOR i IN 1..n LOOP
    result := result * i;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

```sql
SELECT calculate_factorial(5); -- 120
```

## Exception Handling

```sql
CREATE FUNCTION safe_divide(a NUMERIC, b NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  RETURN a / b;
EXCEPTION
  WHEN division_by_zero THEN
    RAISE NOTICE 'Cannot divide by zero, returning NULL';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

```sql
SELECT safe_divide(10, 0); -- NOTICE: Cannot divide by zero, returning NULL -> NULL
```

## Functions vs Stored Procedures

PostgreSQL (since version 11) distinguishes `FUNCTION` from `PROCEDURE`:

|                     | `FUNCTION`                            | `PROCEDURE`                                                |
| ------------------- | ------------------------------------- | ---------------------------------------------------------- |
| Called via          | `SELECT function_name(...)`           | `CALL procedure_name(...)`                                 |
| Return value        | Must return a value (or `VOID`)       | Doesn't return a value directly (can use `OUT` parameters) |
| Transaction control | Cannot `COMMIT`/`ROLLBACK` internally | Can manage its own transactions internally                 |

```sql
CREATE PROCEDURE archive_old_orders()
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO archived_orders SELECT * FROM orders WHERE created_at < NOW() - INTERVAL '1 year';
  DELETE FROM orders WHERE created_at < NOW() - INTERVAL '1 year';
  COMMIT; -- procedures CAN commit internally, functions cannot
END;
$$;
```

```sql
CALL archive_old_orders();
```

## Using Functions in Queries (Common Practical Use)

```sql
CREATE FUNCTION full_name(first TEXT, last TEXT)
RETURNS TEXT AS $$
  SELECT first || ' ' || last;
$$ LANGUAGE SQL IMMUTABLE;

SELECT full_name(first_name, last_name) AS name FROM users;
```

`IMMUTABLE` tells PostgreSQL the function always returns the same output for the same input (no side effects, no dependency on changing data) — enabling query optimizations like using the function's result in an index.

## Function Volatility Categories

| Category             | Meaning                                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `IMMUTABLE`          | Always returns the same result for the same arguments — enables aggressive optimization, usable in expression indexes                               |
| `STABLE`             | Returns the same result within a single query/scan, but can vary across queries (e.g., depends on a lookup table that could change between queries) |
| `VOLATILE` (default) | Can return different results even within the same query, or have side effects (e.g., `NOW()`, `RANDOM()`, functions that write data)                |

Declaring the correct volatility helps the query planner make better optimization decisions — an overly conservative (`VOLATILE`) declaration for a function that's actually `IMMUTABLE` prevents useful optimizations.

## Common Real-World Use Cases for Functions

```sql
-- Validation logic reusable across constraints/triggers
CREATE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
  SELECT email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
$$ LANGUAGE SQL IMMUTABLE;

ALTER TABLE users ADD CONSTRAINT valid_email CHECK (is_valid_email(email));
```

```sql
-- Computed/derived value used across many queries
CREATE FUNCTION order_total_with_tax(order_id INTEGER)
RETURNS NUMERIC AS $$
  SELECT total * 1.18 FROM orders WHERE id = order_id;
$$ LANGUAGE SQL STABLE;
```

## Dropping and Modifying Functions

```sql
DROP FUNCTION add_numbers(INTEGER, INTEGER); -- must specify parameter types, since functions can be overloaded
CREATE OR REPLACE FUNCTION add_numbers(a INTEGER, b INTEGER) RETURNS INTEGER AS $$ ... $$ LANGUAGE SQL;
```

## Common Interview-Style Questions

- **What's the difference between a `FUNCTION` and a `PROCEDURE` in PostgreSQL?**
  Functions are called within a query context (`SELECT function(...)`) and must return a value; procedures are called with `CALL` and can manage their own internal transactions (`COMMIT`/`ROLLBACK`), which functions cannot do.

- **What does `IMMUTABLE` mean for a function, and why does it matter?**
  It declares that the function always returns the same output for the same input with no side effects — this lets the query planner apply optimizations, such as allowing the function's result to be used in an expression index.

- **Why might you write a PL/pgSQL function instead of a plain SQL function?**
  PL/pgSQL supports procedural constructs (variables, conditionals, loops, exception handling) that a single SQL expression/query can't express — needed for more complex, multi-step logic.

- **What is a set-returning function, and how do you call one?**
  A function that returns a table (multiple rows/columns) rather than a single scalar value, declared with `RETURNS TABLE(...)`; called like a table source, e.g., `SELECT * FROM my_function(args)`.

- **What's the risk of incorrectly declaring a function as `IMMUTABLE` when it isn't truly deterministic?**
  The query planner may cache or reuse its result incorrectly (e.g., in an index), leading to stale or wrong results if the function's actual output can change for the same input over time.
