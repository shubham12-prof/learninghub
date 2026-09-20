# 03. Relationships

## Why Relationships Matter

Relational databases model how different entities relate to one another — instead of duplicating data across tables, related data is linked via **foreign keys**, and relationships are resolved at query time using `JOIN`s. This normalization avoids data duplication and keeps data consistent.

## One-to-Many Relationships

The most common relationship type: one row in table A relates to many rows in table B (e.g., one user has many orders).

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  total NUMERIC(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

```sql
-- Get all orders for a specific user
SELECT * FROM orders WHERE user_id = 5;

-- Get a user along with their orders
SELECT u.name, o.id AS order_id, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.id = 5;
```

## One-to-One Relationships

Each row in table A relates to exactly one row in table B — often used to split a table for organizational reasons (e.g., separating rarely-accessed profile data from core user data) or to represent a genuinely exclusive relationship.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE user_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id), -- PRIMARY KEY here enforces one-to-one
  bio TEXT,
  avatar_url TEXT
);
```

The key detail enforcing "one-to-one" (rather than "one-to-many") is making the foreign key column **also** the primary key (or applying a `UNIQUE` constraint on it) — this guarantees at most one matching row in the child table per parent row.

```sql
SELECT u.email, p.bio
FROM users u
JOIN user_profiles p ON u.id = p.user_id
WHERE u.id = 1;
```

## Many-to-Many Relationships

Requires a **junction table** (also called a join/bridge/associative table) since a foreign key column can only reference one row — many-to-many needs an intermediate table holding pairs of foreign keys.

```sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL
);

CREATE TABLE enrollments (         -- junction table
  student_id INTEGER REFERENCES students(id),
  course_id INTEGER REFERENCES courses(id),
  enrolled_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (student_id, course_id) -- composite key prevents duplicate enrollments
);
```

```sql
-- All courses a specific student is enrolled in
SELECT c.title
FROM courses c
JOIN enrollments e ON c.id = e.course_id
WHERE e.student_id = 3;

-- All students enrolled in a specific course
SELECT s.name
FROM students s
JOIN enrollments e ON s.id = e.student_id
WHERE e.course_id = 7;
```

### Junction Tables with Extra Attributes

Junction tables commonly carry extra data about the relationship itself (not just the link):

```sql
CREATE TABLE enrollments (
  student_id INTEGER REFERENCES students(id),
  course_id INTEGER REFERENCES courses(id),
  grade CHAR(1),               -- attribute of the RELATIONSHIP, not either entity
  enrolled_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (student_id, course_id)
);
```

## Foreign Key Constraints and Referential Actions

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id)
    ON DELETE CASCADE     -- delete orders automatically when the referenced user is deleted
    ON UPDATE CASCADE      -- update orders' user_id automatically if the referenced user's id changes
);
```

| `ON DELETE` Option    | Behavior                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| `CASCADE`             | Automatically delete dependent rows too                                                            |
| `RESTRICT`            | Prevent deletion of the parent row if dependent rows exist (default-like strictness)               |
| `SET NULL`            | Set the foreign key column to `NULL` in dependent rows                                             |
| `SET DEFAULT`         | Set the foreign key column to its default value in dependent rows                                  |
| `NO ACTION` (default) | Similar to `RESTRICT`, but checked at the end of the statement/transaction rather than immediately |

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL -- keep orders, but disassociate them
);
```

## Self-Referencing Relationships

A table can reference itself — common for hierarchical data like organizational charts, category trees, or comment threads.

```sql
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  manager_id INTEGER REFERENCES employees(id) -- references the SAME table
);
```

```sql
-- Get an employee along with their manager's name
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
```

## Choosing the Right Relationship Design

| Relationship                  | Implementation                                                       |
| ----------------------------- | -------------------------------------------------------------------- |
| One-to-Many                   | Foreign key on the "many" side, referencing the "one" side           |
| One-to-One                    | Foreign key with a `UNIQUE` (or `PRIMARY KEY`) constraint            |
| Many-to-Many                  | Junction table with two foreign keys (often a composite primary key) |
| Hierarchical/Self-referencing | Foreign key referencing the same table's primary key                 |

## Common Interview-Style Questions

- **How do you model a one-to-many relationship in PostgreSQL?**
  Place a foreign key column on the "many" side's table, referencing the primary key of the "one" side's table.

- **How do you enforce a true one-to-one relationship (not one-to-many) via a foreign key?**
  Make the foreign key column also `UNIQUE` (or use it directly as the primary key of the referencing table), ensuring at most one matching row per parent.

- **Why do many-to-many relationships require a junction table?**
  A single foreign key column can only reference one row; representing "many-to-many" requires an intermediate table holding pairs of foreign keys, one for each side of the relationship, often forming a composite primary key.

- **What's the difference between `ON DELETE CASCADE` and `ON DELETE SET NULL`?**
  `CASCADE` automatically deletes dependent rows when the referenced parent row is deleted; `SET NULL` instead nullifies the foreign key column in dependent rows, keeping them but disassociating them from the deleted parent.

- **What is a self-referencing foreign key, and give an example use case.**
  A foreign key column in a table that references the same table's primary key — commonly used for hierarchical structures like an employee-manager relationship or nested comment threads.
