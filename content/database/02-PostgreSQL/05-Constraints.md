# 05. Constraints

## What Are Constraints?

Constraints are rules enforced by the database itself to guarantee data integrity — preventing invalid data from ever being inserted or updated, regardless of what application code does (or fails to do). This is a key advantage of relational databases: integrity is enforced at the data layer, not just in application logic.

## `NOT NULL`

Ensures a column cannot contain `NULL` values.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL
);
```

```sql
INSERT INTO users (email) VALUES (NULL); -- ERROR: null value violates not-null constraint
```

## `UNIQUE`

Ensures all values in a column (or combination of columns) are distinct across the table.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE
);

-- Composite uniqueness — the COMBINATION must be unique, individual columns can repeat
CREATE TABLE enrollments (
  student_id INTEGER,
  course_id INTEGER,
  UNIQUE (student_id, course_id)
);
```

> `NULL` values are treated as distinct from each other by default in a `UNIQUE` constraint — you can insert multiple rows with `NULL` in a unique column, since `NULL` isn't considered equal to another `NULL`.

## `PRIMARY KEY`

A special combination of `NOT NULL` + `UNIQUE`, identifying each row uniquely. Every table should have exactly one primary key (possibly composite, across multiple columns).

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,   -- single-column primary key
  name TEXT NOT NULL
);

CREATE TABLE order_items (
  order_id INTEGER,
  product_id INTEGER,
  PRIMARY KEY (order_id, product_id) -- composite primary key
);
```

## `FOREIGN KEY`

Ensures a column's value matches an existing value in a referenced table's column (typically its primary key) — enforces referential integrity.

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) -- shorthand for FOREIGN KEY
);

-- Explicit named foreign key constraint
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

```sql
INSERT INTO orders (user_id) VALUES (9999); -- ERROR if no user with id=9999 exists
```

## `CHECK` — Custom Validation Rules

Enforces an arbitrary boolean condition on column values.

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  price NUMERIC(10, 2) CHECK (price >= 0),
  discount_percent INTEGER CHECK (discount_percent BETWEEN 0 AND 100)
);

-- Named, multi-column CHECK constraint
CREATE TABLE events (
  start_date DATE,
  end_date DATE,
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);
```

```sql
INSERT INTO products (price) VALUES (-10); -- ERROR: violates check constraint
```

## `DEFAULT` (Technically a Column Attribute, Not a Constraint, but Related)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Adding Constraints to an Existing Table

```sql
ALTER TABLE users ADD CONSTRAINT unique_email UNIQUE (email);
ALTER TABLE users ADD CONSTRAINT check_age CHECK (age >= 0);
ALTER TABLE orders ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
```

## Dropping Constraints

```sql
ALTER TABLE users DROP CONSTRAINT unique_email;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
```

## Naming Constraints Explicitly

If not named explicitly, PostgreSQL auto-generates a constraint name (e.g., `users_email_key`), which can make error messages/management less clear. Naming constraints explicitly is a good practice for maintainability.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  CONSTRAINT users_email_unique UNIQUE (email)
);
```

## Deferrable Constraints

By default, constraints are checked immediately after each statement. `DEFERRABLE` constraints can instead be checked at the end of a transaction — useful for scenarios like inserting mutually-referencing rows within a single transaction.

```sql
CREATE TABLE a (
  id INTEGER PRIMARY KEY,
  b_id INTEGER REFERENCES b(id) DEFERRABLE INITIALLY DEFERRED
);
```

## Constraints vs Application-Level Validation

|                   | Database Constraints                                                                                     | Application-Level Validation                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Enforcement point | The database itself — impossible to bypass                                                               | Only enforced if the application code runs it                                        |
| Coverage          | Applies regardless of which application/service writes to the DB                                         | Only covers writes going through that specific application                           |
| Performance       | Enforced on every write, minor overhead                                                                  | Runs before the write, no DB-level overhead                                          |
| Best practice     | Use for **data integrity guarantees** (uniqueness, required fields, valid ranges, referential integrity) | Use for **user-facing validation** (friendly error messages, complex business rules) |

**Best practice:** use both — application-level validation for a good user experience (clear error messages before hitting the DB), and database constraints as the non-negotiable last line of defense against invalid data, especially important in systems with multiple services/scripts writing to the same database.

## Example: A Fully Constrained Table

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shipped', 'delivered', 'cancelled')),
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_order_reference UNIQUE (id, user_id)
);
```

## Common Interview-Style Questions

- **What's the difference between `PRIMARY KEY` and `UNIQUE`?**
  Both enforce uniqueness, but `PRIMARY KEY` additionally implies `NOT NULL` and a table can have only one primary key (though it can span multiple columns); a table can have multiple `UNIQUE` constraints, and unique columns can allow `NULL` values (with `NULL`s treated as distinct from each other).

- **What does a `FOREIGN KEY` constraint guarantee?**
  That a column's value must match an existing value in the referenced table's column (typically its primary key), enforcing referential integrity and preventing "orphaned" references to non-existent rows.

- **What is a `CHECK` constraint, and give an example use case.**
  A constraint enforcing an arbitrary boolean condition on column values — e.g., ensuring a `price` column is never negative, or that an `end_date` is always after a `start_date`.

- **Why enforce data integrity at the database level instead of relying solely on application-level validation?**
  Database constraints apply universally regardless of which application, script, or service writes to the table, and can't be accidentally bypassed by a bug or missed validation step in application code — they're the ultimate guarantee of data correctness.

- **What does `ON DELETE CASCADE` do in the context of a foreign key constraint?**
  It automatically deletes dependent rows in the referencing table when the referenced row in the parent table is deleted, maintaining referential integrity without leaving orphaned rows.
