# 10. Triggers

## What is a Trigger?

A trigger automatically executes a specified function in response to a database event (`INSERT`, `UPDATE`, `DELETE`, or `TRUNCATE`) on a table — without needing the application to explicitly call it. Triggers enforce logic at the data layer, guaranteeing it runs no matter which application/script performs the write.

## Trigger Components

A trigger has two parts:

1. A **trigger function** — the logic to execute (written in PL/pgSQL, returning a special `TRIGGER` type).
2. A **trigger definition** — specifies when/how the function is called (`CREATE TRIGGER`).

## Basic Example: Auto-Updating an `updated_at` Timestamp

```sql
-- Step 1: the trigger function
CREATE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: attach it to a table
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
```

Now, every `UPDATE` on `users` automatically refreshes `updated_at`, without any application code needing to remember to set it.

```sql
UPDATE users SET name = 'Alice Updated' WHERE id = 1;
-- updated_at is automatically set to NOW(), even though we never mentioned it in the UPDATE statement
```

## `NEW` and `OLD` — Row Values Inside a Trigger

| Variable | Available In       | Represents                                        |
| -------- | ------------------ | ------------------------------------------------- |
| `NEW`    | `INSERT`, `UPDATE` | The row being inserted/the new version of the row |
| `OLD`    | `UPDATE`, `DELETE` | The row before modification/the row being deleted |

```sql
CREATE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price <> NEW.price THEN
    INSERT INTO price_history (product_id, old_price, new_price, changed_at)
    VALUES (OLD.id, OLD.price, NEW.price, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_price_changes
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION log_price_change();
```

## `BEFORE` vs `AFTER` Triggers

|                     | `BEFORE`                                                                                  | `AFTER`                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Timing              | Runs before the operation is applied                                                      | Runs after the operation is applied                                              |
| Can modify the row? | Yes — by changing `NEW` and returning it                                                  | No — the row is already committed to that point; typically used for side effects |
| Common use cases    | Validation, auto-setting fields (timestamps, defaults), preventing the operation entirely | Logging/auditing, cascading updates to other tables, sending notifications       |

```sql
-- BEFORE trigger example: validation/prevention
CREATE FUNCTION prevent_negative_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.balance < 0 THEN
    RAISE EXCEPTION 'Balance cannot be negative';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_balance
BEFORE UPDATE ON accounts
FOR EACH ROW
EXECUTE FUNCTION prevent_negative_balance();
```

```sql
-- AFTER trigger example: audit logging
CREATE FUNCTION audit_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO deleted_users_log (user_id, name, email, deleted_at)
  VALUES (OLD.id, OLD.name, OLD.email, NOW());
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_deletion
AFTER DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION audit_user_deletion();
```

## `FOR EACH ROW` vs `FOR EACH STATEMENT`

```sql
-- FOR EACH ROW: fires once per affected row
CREATE TRIGGER row_trigger
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION some_function();

-- FOR EACH STATEMENT: fires once per statement, regardless of how many rows it affects
CREATE TRIGGER statement_trigger
AFTER INSERT ON orders
FOR EACH STATEMENT
EXECUTE FUNCTION some_other_function();
```

`FOR EACH STATEMENT` is useful when you need to react to a bulk operation as a whole (e.g., "an insert batch just happened") rather than reacting to every individual row — and it doesn't have access to `NEW`/`OLD` (since multiple rows could be involved).

## Conditional Triggers (`WHEN` Clause)

```sql
CREATE TRIGGER notify_low_stock
AFTER UPDATE ON products
FOR EACH ROW
WHEN (NEW.stock < 10 AND OLD.stock >= 10) -- only fires when crossing this threshold
EXECUTE FUNCTION send_low_stock_alert();
```

The `WHEN` clause avoids unnecessary function calls, improving performance by filtering at the trigger level rather than inside the function body.

## `INSTEAD OF` Triggers (For Views)

Since complex views (joins, aggregates) aren't automatically updatable, `INSTEAD OF` triggers let you define custom logic for what should happen when someone tries to `INSERT`/`UPDATE`/`DELETE` against such a view.

```sql
CREATE VIEW user_order_summary AS
SELECT u.id, u.name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;

CREATE FUNCTION handle_summary_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET name = NEW.name WHERE id = NEW.id; -- redirect the "update" to the real table
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_via_view
INSTEAD OF UPDATE ON user_order_summary
FOR EACH ROW
EXECUTE FUNCTION handle_summary_update();
```

## Preventing an Operation Entirely

Raising an exception inside a `BEFORE` trigger stops the operation from happening at all.

```sql
CREATE FUNCTION prevent_deletion_of_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'admin' THEN
    RAISE EXCEPTION 'Cannot delete admin users';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_admins
BEFORE DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION prevent_deletion_of_admin();
```

## Managing Triggers

```sql
\dS+ users              -- (psql) shows triggers as part of table description

ALTER TABLE users DISABLE TRIGGER set_updated_at;
ALTER TABLE users ENABLE TRIGGER set_updated_at;

DROP TRIGGER set_updated_at ON users;
```

## Common Real-World Trigger Use Cases

| Use Case                                                    | Trigger Type                 |
| ----------------------------------------------------------- | ---------------------------- |
| Auto-updating `updated_at` timestamps                       | `BEFORE UPDATE`              |
| Auditing/logging changes                                    | `AFTER INSERT/UPDATE/DELETE` |
| Enforcing complex business rules beyond `CHECK` constraints | `BEFORE INSERT/UPDATE`       |
| Maintaining denormalized/cached summary columns             | `AFTER INSERT/UPDATE/DELETE` |
| Cascading custom logic (not covered by `ON DELETE CASCADE`) | `AFTER DELETE`               |
| Making complex views writable                               | `INSTEAD OF`                 |

## Performance Considerations

- Triggers add overhead to every affected write — keep trigger logic efficient, especially for `FOR EACH ROW` triggers on high-throughput tables.
- Overusing triggers for business logic can make application behavior harder to trace/debug, since the logic isn't visible in application code — document trigger-based side effects clearly.
- Prefer `CHECK` constraints for simple validation (faster, more transparent) and reserve triggers for logic that genuinely requires procedural complexity or side effects (auditing, cross-table updates).

## Common Interview-Style Questions

- **What is a trigger, and why use one instead of handling logic in application code?**
  A trigger automatically executes a function in response to a table event (`INSERT`/`UPDATE`/`DELETE`), guaranteeing the logic runs regardless of which application or script performs the write — useful for auditing, enforcing invariants, and maintaining derived data consistently at the database layer.

- **What's the difference between `BEFORE` and `AFTER` triggers?**
  `BEFORE` triggers run before the operation is applied and can modify the row (via `NEW`) or prevent the operation entirely (by raising an exception); `AFTER` triggers run after the change is applied and are typically used for side effects like logging, since the row can no longer be altered.

- **What do `NEW` and `OLD` represent inside a trigger function?**
  `NEW` represents the incoming/new version of the row (available in `INSERT`/`UPDATE` triggers); `OLD` represents the row's state before the change (available in `UPDATE`/`DELETE` triggers).

- **What's the difference between `FOR EACH ROW` and `FOR EACH STATEMENT`?**
  `FOR EACH ROW` fires once per affected row (with access to `NEW`/`OLD`); `FOR EACH STATEMENT` fires once per SQL statement regardless of how many rows it affects, and doesn't have row-level `NEW`/`OLD` access.

- **What is an `INSTEAD OF` trigger, and when is it needed?**
  A trigger that replaces the default behavior of a write operation, commonly used to make complex (non-automatically-updatable) views support `INSERT`/`UPDATE`/`DELETE` by redirecting the operation to the appropriate underlying table(s).
