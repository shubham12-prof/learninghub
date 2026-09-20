# 02. Connection Pooling

## What is Connection Pooling?

Connection pooling maintains a reusable set of open connections (typically to a database) rather than opening a brand-new connection for every single request and closing it afterward. Establishing a connection (especially a database connection, involving TCP handshake, authentication, and session setup) is relatively expensive — pooling amortizes that cost across many requests instead of paying it repeatedly.

```
Without pooling:  every request -> open NEW connection -> query -> CLOSE connection
                   (connection setup/teardown overhead on EVERY single request)

With pooling:       app maintains a POOL of N already-open connections
                     request -> BORROW a connection from the pool -> query -> RETURN it to the pool
                     (connection setup cost paid ONCE per pooled connection, reused many times)
```

## Why Connection Setup Is Expensive

```
TCP handshake:          network round trip(s)
TLS negotiation:           (if encrypted) additional round trips, cryptographic overhead
Authentication:              credential verification against the database
Session initialization:        database-side setup for the new connection
```

For a database handling many requests per second, repeating this entire process on every single query would be a massive, unnecessary tax on both latency and database server resources.

## Setting Up a Connection Pool (PostgreSQL Example — `pg`)

```js
const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  database: "myapp",
  user: "postgres",
  password: process.env.DB_PASSWORD,
  max: 20, // maximum number of connections in the pool
  idleTimeoutMillis: 30000, // close idle connections after 30s
  connectionTimeoutMillis: 2000, // fail fast if a connection can't be acquired within 2s
});

async function getUser(id) {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0];
}
```

Note that `pool.query()` automatically handles borrowing and returning a connection — you don't manually manage the checkout/checkin lifecycle for simple queries.

### Manual Connection Checkout (For Transactions)

```js
async function transferFunds(fromId, toId, amount) {
  const client = await pool.connect(); // explicitly borrow a connection
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
    client.release(); // CRITICAL — always return the connection to the pool, even on error
  }
}
```

**Critical detail:** a transaction must use the _same_ connection for all its queries (to maintain the transaction context) — this is why transactions require manually checking out a specific client rather than using the pool's automatic per-query borrowing.

> Forgetting `client.release()` (especially in an error path) is one of the most common connection pool bugs — it "leaks" a connection out of the pool permanently, eventually exhausting the pool entirely under sustained load.

## Choosing the Right Pool Size

```
Pool size TOO SMALL:  requests queue waiting for an available connection, adding latency
                        even though the database itself has spare capacity

Pool size TOO LARGE:    the database server itself can become overwhelmed managing too many
                          concurrent connections, and/or each application instance's pool
                          consuming disproportionate database-side resources
```

```
A common starting heuristic: pool_size = ((core_count * 2) + effective_spindle_count)
(from PostgreSQL's own documentation — a STARTING point for tuning, not a universal formula)
```

**Practical guidance:** pool size should be determined empirically (via load testing and monitoring actual connection utilization/wait times), not just picked arbitrarily — and must account for the _total_ number of application instances × their individual pool sizes, since that combined total is what actually hits the database.

```
10 application instances × pool size 20 each = 200 TOTAL possible connections to the database
                                                  -> must not exceed the database's max_connections setting
```

## Connection Pool Exhaustion — A Common Production Incident

If every connection in the pool is currently checked out (e.g., due to slow queries, a connection leak, or genuinely high concurrent load exceeding capacity), new requests must wait — and if they wait too long, they time out.

```
Symptoms of pool exhaustion:
  - Requests suddenly become slow/timeout, even though the database itself isn't necessarily overloaded
  - Error messages like "timeout exceeded when trying to connect" or "pool is full"
```

```js
pool.on("error", (err) => {
  logger.error("Unexpected pool error", err);
});

// Monitoring pool health
setInterval(() => {
  logger.info(
    `Pool stats: total=${pool.totalCount}, idle=${pool.idleCount}, waiting=${pool.waitingCount}`,
  );
}, 10000);
```

A consistently high `waitingCount` is a strong signal the pool is undersized (or queries are taking too long, effectively holding connections longer than they should) relative to actual demand.

## Connection Pooling for MongoDB

```js
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI, {
  maxPoolSize: 20, // maximum connections in the pool
  minPoolSize: 5, // maintain at least this many, even when idle
});

await client.connect();
const db = client.db("myapp");
```

MongoDB drivers (and most modern database drivers generally) implement connection pooling by default/internally — often requiring less manual configuration than the more explicit pooling setup typical of SQL drivers like `pg`.

## PgBouncer — External Connection Pooling at Scale

For very high-scale systems, especially with many application instances (each maintaining their own in-process pool), an external, dedicated pooler like **PgBouncer** sits between the application layer and the database, multiplexing many application-level connections onto a smaller, more manageable set of actual database connections.

```
Without PgBouncer:  100 app instances × 20 connections each = 2,000 connections hitting Postgres directly
                     -> likely exceeds practical database connection limits

With PgBouncer:        100 app instances -> PgBouncer (multiplexes) -> a much smaller pool of
                        actual connections to Postgres (e.g., 50-100)
```

```ini
# pgbouncer.ini (simplified)
[databases]
myapp = host=localhost port=5432 dbname=myapp

[pgbouncer]
pool_mode = transaction   # or session, or statement — controls HOW aggressively connections are shared
max_client_conn = 1000
default_pool_size = 50
```

`pool_mode = transaction` is a common, aggressive setting — a connection is only held for the duration of a single transaction, then immediately returned to the pool for another client to use, maximizing connection reuse efficiency (though it has some compatibility caveats with certain session-level Postgres features).

## Connection Pooling for HTTP Clients Too — Not Just Databases

The same underlying principle applies to outbound HTTP connections to external services/APIs — reusing TCP connections (via HTTP keep-alive) avoids repeated connection setup overhead for frequent calls to the same external service.

```js
const https = require("https");

const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 50, // similar concept to a database pool's max connections
});

const response = await fetch("https://api.example.com/data", { agent });
```

## Common Interview-Style Questions

- **Why is connection pooling necessary, given that a database driver could just open a new connection per request?**
  Establishing a new connection involves real overhead — a TCP handshake, potentially TLS negotiation, authentication, and session setup on the database side; paying this cost on every single request would add unnecessary latency and load, especially at high request volumes. Pooling amortizes this cost by reusing a set of already-established connections.

- **Why must database transactions use a manually checked-out connection rather than the pool's automatic per-query handling?**
  All statements within a transaction must execute on the exact same underlying connection to maintain the transaction's context (BEGIN/COMMIT/ROLLBACK apply to a specific session); automatic per-query pooling could route different statements to different connections, breaking the transaction entirely.

- **What's a common, serious bug related to connection pooling, and what does it cause?**
  Forgetting to release a manually checked-out connection back to the pool (especially in an error-handling path) — this "leaks" the connection permanently out of the pool's available set, and repeated leaks eventually exhaust the entire pool under sustained load, causing requests to hang/timeout waiting for a connection that will never become available.

- **How should you determine an appropriate connection pool size, and what must you account for across multiple application instances?**
  Pool size should be determined empirically through load testing and monitoring actual connection utilization/wait times, rather than picked arbitrarily; critically, you must account for the _total_ connections across all running application instances (instance count × per-instance pool size), since that combined total is what actually hits the database and must stay within its configured connection limit.

- **What problem does an external pooler like PgBouncer solve that in-process application pooling alone doesn't?**
  When many application instances each maintain their own connection pool, the total number of connections reaching the database can be very high (instance count × pool size per instance), potentially exceeding what the database can practically handle; an external pooler multiplexes many application-level connections onto a smaller, shared set of actual database connections, reducing the total database-side connection count regardless of how many application instances are running.
