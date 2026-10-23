# 04 - Database Basics: Tables, SQL, Keys, Indexes, Transactions, Injection

> **Time to learn:** ~60 min | **Level:** Core concept | **Interview frequency:** High
> Every query and error message below was run in SQLite via Node 22's built-in `node:sqlite` (run with `node --no-warnings`). The concepts are the same in PostgreSQL and MySQL; only small syntax details differ.

## 1. The one idea

A relational database stores data in **tables** (rows and columns). You ask questions in **SQL**. The database enforces **rules** (constraints) so bad data can't get in, even if your code has a bug.

## 2. Analogy

Spreadsheets with superpowers: each sheet (table) has a fixed set of columns, every row has a unique id, one sheet can **point** to rows of another (foreign key), and the spreadsheet itself refuses nonsense (a negative number of hours, a duplicate email).

## 3. The schema we use

```sql
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE courses (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  slug  TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  hours INTEGER NOT NULL CHECK (hours > 0),
  free  INTEGER NOT NULL DEFAULT 0            -- SQLite has no boolean: 0 or 1
);

CREATE TABLE saved_courses (                    -- a "join table": many users <-> many courses
  user_id    INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  course_id  INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, course_id)               -- the pair is unique: you can't save a course twice
);

CREATE INDEX idx_courses_level ON courses(level);
```

Vocabulary:

| Term                           | Meaning                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| **Primary key**                | the column(s) that identify one row uniquely                                          |
| **Foreign key**                | a column that must match a row in another table (`saved_courses.user_id -> users.id`) |
| **UNIQUE**                     | no two rows may share this value (`users.email`)                                      |
| **NOT NULL / CHECK / DEFAULT** | rules on every row                                                                    |
| **Join table**                 | a table that links two others (many-to-many)                                          |
| **Index**                      | a sorted lookup structure that makes searches fast                                    |
| **Transaction**                | a group of changes that all happen or none do                                         |

Relationships: one user has **many** saved rows (1:N); users and courses are **many-to-many** through `saved_courses`.

## 4. The SQL you must know

```sql
SELECT id, title FROM courses WHERE level = ? ORDER BY id LIMIT 5 OFFSET 10;   -- read, filter, sort, page
INSERT INTO courses (slug, title, level, hours) VALUES (?, ?, ?, ?);            -- create
UPDATE courses SET hours = ? WHERE id = ?;                                       -- change (ALWAYS with WHERE!)
DELETE FROM saved_courses WHERE user_id = ? AND course_id = ?;                   -- remove (ALWAYS with WHERE!)
```

**JOIN** (combine rows from two tables), the query behind `GET /api/me/saved`:

```sql
SELECT c.id, c.title
  FROM saved_courses s JOIN courses c ON c.id = s.course_id
 WHERE s.user_id = ?;
```

Result for a user who saved courses 1 and 2: `HTML Foundations` and `CSS Layout with Flexbox and Grid`.

**GROUP BY** (aggregate):

```sql
SELECT level, COUNT(*) AS n FROM courses GROUP BY level ORDER BY level;
-- Advanced 1 | Beginner 5 | Intermediate 6
```

`WHERE` filters **rows before** grouping; `HAVING` filters **groups after**. `INNER JOIN` keeps only matching rows; `LEFT JOIN` keeps every row from the left table even with no match.

## 5. Constraints protect you (I triggered each one)

| I tried                                            | Error                                                                              |
| -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| a second user with the same email                  | `UNIQUE constraint failed: users.email`                                            |
| a saved row for a user that doesn't exist (id 999) | `FOREIGN KEY constraint failed`                                                    |
| a course with `level = 'Expert'`                   | `CHECK constraint failed: level IN ('Beginner', 'Intermediate', 'Advanced')`       |
| deleting a user who has saved courses              | their `saved_courses` rows were **deleted too** (`ON DELETE CASCADE`): 0 rows left |

In the API a `UNIQUE` violation becomes **409**, and validation failures become **422**. The route checks first for a friendly message, but the **constraint is the real guarantee** (two requests at the same moment can both pass a check; only the database can stop the second).

> SQLite quirk: foreign keys are enforced only when `PRAGMA foreign_keys = ON` for that connection. The project sets it. When I turned it off in the broken version (`08`), the cascade silently stopped working. PostgreSQL and MySQL (InnoDB) enforce them always.

## 6. Indexes

Without an index the database **scans every row**; with one it **jumps** to the matches. `EXPLAIN QUERY PLAN` shows which:

```
WHERE title = 'x'            -> SCAN courses                                       (reads every row)
WHERE level = 'Beginner'     -> SEARCH courses USING INDEX idx_courses_level (level=?)
```

Rules of thumb: index the columns you **filter, join and sort** on; primary keys and `UNIQUE` columns are indexed automatically; indexes **speed up reads but slow down writes** and use space, so don't index everything; an index on a column with very few distinct values (like a boolean) rarely helps.

## 7. Transactions

A transaction makes several statements **atomic** (all or nothing). The classic example is moving money, but the same applies to "create an order and its items".

```js
db.exec("BEGIN");
db.prepare(
  "INSERT INTO courses (slug, title, level, hours) VALUES ('tx','tx','Beginner',1)",
).run();
db.exec("ROLLBACK"); // undo: the row is gone (I counted: 0 rows)   // or COMMIT to keep it
```

**ACID**: **A**tomic (all or nothing), **C**onsistent (constraints always hold), **I**solated (concurrent transactions don't see each other's half-finished work), **D**urable (once committed it survives a crash).

## 8. SQL injection: the one security topic everyone asks about

Never build SQL by joining strings with user input. Use **parameters** (`?`).

```js
const evil = "' OR '1'='1";
db.prepare(`SELECT id, email FROM users WHERE email = '${evil}'`).all(); // UNSAFE: returned 1 row (the whole table matched)
db.prepare("SELECT id, email FROM users WHERE email = ?").all(evil); // SAFE: returned 0 rows
```

With a parameter, the value is sent **separately from the SQL text**, so it can only ever be **data**, never part of the query. The API's search (`?q=`) builds the SQL from fixed fragments and passes the user's text as a `?` value; a test sends a classic injection string and gets a normal empty result. (You can't parameterise identifiers like column names: for `ORDER BY ${column}` use an **allow-list**.)

## 9. SQL vs NoSQL in one paragraph

SQL (PostgreSQL, MySQL, SQLite): structured tables, relationships, constraints, joins, transactions: the default for most apps. NoSQL (MongoDB document store, Redis key-value, DynamoDB): flexible shape and easy horizontal scaling, but you handle relationships and consistency more yourself. Pick by the **shape of the data and queries**, not by fashion.

## 10. Common mistakes

1. `UPDATE`/`DELETE` **without `WHERE`** (changes every row).
2. Building SQL with string concatenation (**injection**).
3. No index on a column used in every `WHERE`; or indexing everything.
4. Relying on application checks only, without `UNIQUE`/`FOREIGN KEY`/`CHECK`.
5. `SELECT *` in application code (returns the password hash, breaks when columns change).
6. Storing a list in one column (`"1,2,3"`) instead of a join table.
7. The **N+1 query** problem: one query for the list, then one more per row. Use a `JOIN` or a single `WHERE id IN (...)`.
8. Forgetting transactions when several writes must succeed together.
9. Storing money in floating point (use integers of cents).
10. Using `OFFSET` for deep pagination on huge tables.

## 11. Predict the output

**Q1** The same user tries to save course 1 twice with plain `INSERT INTO saved_courses ...`. What happens on the second insert?

**Q2** You run `DELETE FROM users WHERE id = 1`. The user had two saved courses. How many rows are left in `saved_courses` for that user, and why?

**Q3** Which of these can use `idx_courses_level`: `WHERE level = 'Beginner'` or `WHERE title = 'x'`?

**Q4** What does `db.prepare("SELECT ... WHERE email = ?").all("' OR '1'='1")` return when no such email exists?

**Q5** A transaction does `BEGIN`, inserts a row, then `ROLLBACK`. Is the row there afterwards?

## 12. Answers

- **Q1:** it **fails** with a primary-key violation (the `(user_id, course_id)` pair already exists). That's why the API uses `INSERT OR IGNORE` (see the PUT route).
- **Q2:** **0.** `ON DELETE CASCADE` removes the dependent rows (with foreign keys switched on).
- **Q3:** only `WHERE level = 'Beginner'` (`SEARCH ... USING INDEX`); `WHERE title = 'x'` is a full `SCAN`.
- **Q4:** **no rows**. The string is treated as plain data.
- **Q5:** **No.** Rollback undoes it (0 rows counted).

## Recap

- Tables, **primary keys**, **foreign keys**, **constraints**; many-to-many needs a **join table**.
- `SELECT / INSERT / UPDATE / DELETE`, `JOIN`, `GROUP BY`. Always `WHERE` on updates and deletes.
- **Indexes** speed reads (`SCAN` becomes `SEARCH`) but cost writes.
- **Transactions** = all or nothing (ACID).
- **Always use parameters (`?`)**: that is what stops SQL injection.

## Checklist

- [ ] I can write a JOIN and a GROUP BY from memory
- [ ] I can explain primary vs foreign key and when to use a join table
- [ ] I can explain what an index does and its cost
- [ ] I can explain a transaction and ACID
- [ ] I can show an injection and the parameterised fix
- [ ] I got Q1 to Q5 right without looking
