# 07. Transactions

## What is a Transaction?

A transaction groups multiple SQL statements into a single atomic unit of work — either **all** statements succeed and are committed, or if any fails, **all** changes are rolled back, leaving the database as if none of them happened. This provides the classic **ACID** guarantees.

## ACID Properties

| Property        | Guarantee                                                                      |
| --------------- | ------------------------------------------------------------------------------ |
| **Atomicity**   | All statements in the transaction succeed together, or none do                 |
| **Consistency** | The database moves from one valid state to another, respecting all constraints |
| **Isolation**   | Concurrent transactions don't interfere with each other's intermediate states  |
| **Durability**  | Once committed, changes survive even a crash immediately afterward             |

## Basic Transaction Syntax

```sql
BEGIN;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

COMMIT;
```

If something goes wrong before `COMMIT`:

```sql
BEGIN;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
-- something fails or you change your mind

ROLLBACK; -- undoes everything since BEGIN
```

## Every Statement Outside a Transaction is Implicitly a Transaction

By default, PostgreSQL runs each individual statement in its own implicit transaction (auto-commit mode) — `BEGIN`/`COMMIT` is needed only when you want **multiple** statements to succeed or fail together.

## Using Transactions with Node.js (`pg` library)

```bash
npm install pg
```

```js
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function transferFunds(fromId, toId, amount) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
      [amount, fromId],
    );
    await client.query(
      "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
      [amount, toId],
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release(); // return the connection to the pool
  }
}
```

## Savepoints — Partial Rollback Within a Transaction

Savepoints let you roll back part of a transaction without discarding everything since `BEGIN`.

```sql
BEGIN;

INSERT INTO orders (user_id, total) VALUES (1, 100);

SAVEPOINT before_risky_step;

UPDATE inventory SET stock = stock - 1000 WHERE product_id = 5; -- oops, too much

ROLLBACK TO SAVEPOINT before_risky_step; -- undoes just the inventory update, keeps the order insert

COMMIT; -- commits everything up to (and including) the order insert
```

## Transaction Isolation Levels

Isolation levels control how much one transaction can "see" of another concurrently-running transaction's uncommitted or intermediate changes — a trade-off between consistency guarantees and concurrency/performance.

```sql
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;  -- PostgreSQL's default
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

| Level                      | Prevents                                                            | Notes                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `READ UNCOMMITTED`         | Nothing extra (PostgreSQL treats this the same as `READ COMMITTED`) | PostgreSQL doesn't implement true dirty reads                                                                            |
| `READ COMMITTED` (default) | Dirty reads                                                         | Each statement sees only committed data as of when _that statement_ started                                              |
| `REPEATABLE READ`          | Dirty reads + non-repeatable reads                                  | The entire transaction sees a consistent snapshot from when it _began_                                                   |
| `SERIALIZABLE`             | Dirty reads + non-repeatable reads + phantom reads                  | Strongest — behaves as if transactions ran one at a time, at the cost of possible serialization failures requiring retry |

### Common Concurrency Anomalies

- **Dirty read** — reading another transaction's uncommitted changes (not possible in PostgreSQL at any isolation level — PostgreSQL never allows true dirty reads).
- **Non-repeatable read** — re-reading the same row within a transaction returns different data because another transaction committed a change in between.
- **Phantom read** — re-running the same query within a transaction returns a different _set_ of rows because another transaction inserted/deleted matching rows in between.

```sql
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

SELECT balance FROM accounts WHERE id = 1;
-- ... application logic ...
UPDATE accounts SET balance = balance - 100 WHERE id = 1;

COMMIT;
-- If a conflicting concurrent transaction is detected, PostgreSQL raises a
-- serialization_failure error, and the application must retry the transaction.
```

## Row-Level Locking

```sql
BEGIN;

SELECT * FROM accounts WHERE id = 1 FOR UPDATE; -- locks this row until COMMIT/ROLLBACK

UPDATE accounts SET balance = balance - 100 WHERE id = 1;

COMMIT;
```

`FOR UPDATE` prevents other transactions from modifying (or also locking) the selected row until the current transaction finishes — commonly used to safely implement "read, check a condition, then write" patterns (like verifying sufficient balance before debiting) without a race condition.

```sql
SELECT * FROM accounts WHERE id = 1 FOR SHARE;   -- allows others to also read-lock, but not write
SELECT * FROM accounts WHERE id = 1 FOR UPDATE SKIP LOCKED; -- skip rows already locked by another transaction (useful for job queues)
```

## Deadlocks

Occur when two transactions each hold a lock the other needs, waiting on each other indefinitely. PostgreSQL automatically detects deadlocks and aborts one of the transactions (raising an error), which the application should catch and retry.

```sql
-- Transaction A: locks row 1, then tries to lock row 2
-- Transaction B: locks row 2, then tries to lock row 1
-- -> deadlock detected, one transaction is automatically rolled back with an error
```

**Best practice:** always acquire locks/update rows in a **consistent order** across your application to minimize deadlock risk.

## Transactions and Performance

- Keep transactions **short** — long-running transactions hold locks longer, increasing contention and blocking other operations.
- Avoid unnecessary user-interaction/network waits inside an open transaction (e.g., don't `BEGIN`, wait on an external API call, then `COMMIT` — do the external work first, then transact).
- Batch related writes into a single transaction rather than many tiny auto-committed statements, when they need to succeed/fail together.

## Common Interview-Style Questions

- **What does ACID stand for, and briefly define each property?**
  Atomicity (all-or-nothing), Consistency (valid state transitions respecting constraints), Isolation (concurrent transactions don't interfere), Durability (committed changes survive crashes).

- **What is PostgreSQL's default transaction isolation level, and what does it guarantee?**
  `READ COMMITTED` — each statement within the transaction sees only data committed as of when that specific statement began, preventing dirty reads but still allowing non-repeatable reads across statements in the same transaction.

- **What's the difference between `REPEATABLE READ` and `SERIALIZABLE`?**
  `REPEATABLE READ` guarantees a consistent snapshot throughout the transaction (preventing non-repeatable reads) but can still allow phantom reads in some cases; `SERIALIZABLE` is the strongest level, behaving as if transactions executed one at a time, at the cost of possible serialization failures requiring application-level retry.

- **What does `SELECT ... FOR UPDATE` do, and why use it?**
  It locks the selected row(s) until the transaction commits or rolls back, preventing other transactions from modifying them concurrently — commonly used to safely implement read-then-write patterns (like checking and debiting a balance) without race conditions.

- **What is a deadlock, and how does PostgreSQL handle it?**
  A situation where two or more transactions each hold a lock the other needs, waiting indefinitely; PostgreSQL automatically detects this and aborts one of the transactions with an error, which the application should catch and retry — minimized by acquiring locks in a consistent order.

- **What is a savepoint, and why use one?**
  A named point within a transaction that you can roll back to without discarding the entire transaction — useful for handling a failure in part of a larger multi-step transaction while preserving the successful steps before it.
