# 07. Transactions

## What Are Transactions?

A transaction lets you group multiple operations (across one or more documents, collections, or even databases) into a single atomic unit — either **all** operations succeed and are committed, or **none** of them are (if any fails, everything rolls back). This preserves the classic **ACID** guarantees (Atomicity, Consistency, Isolation, Durability) for multi-document operations.

## Why MongoDB Transactions Matter Less Than in SQL (Usually)

A key MongoDB design principle: **single-document operations are already atomic** by default, without needing an explicit transaction. Because MongoDB encourages embedding related data within a single document, many use cases that would require a multi-row transaction in SQL can be handled with a single atomic document update in MongoDB.

```js
// This ENTIRE update is atomic by default — no transaction needed
db.accounts.updateOne(
  { _id: accountId },
  {
    $inc: { balance: -100 },
    $push: { transactionLog: { type: "debit", amount: 100 } },
  },
);
```

Transactions become necessary when an operation genuinely spans **multiple documents** (often across multiple collections) that must succeed or fail together.

## Classic Use Case: Bank Transfer Between Two Accounts

```js
const session = client.startSession();

try {
  session.startTransaction();

  const accounts = client.db("bank").collection("accounts");

  await accounts.updateOne(
    { _id: fromAccountId },
    { $inc: { balance: -amount } },
    { session },
  );

  await accounts.updateOne(
    { _id: toAccountId },
    { $inc: { balance: amount } },
    { session },
  );

  await session.commitTransaction();
  console.log("Transfer successful");
} catch (error) {
  await session.abortTransaction();
  console.error("Transfer failed, rolled back:", error);
} finally {
  session.endSession();
}
```

If the second `updateOne` fails for any reason (network issue, validation error, etc.), the first `updateOne`'s debit is automatically rolled back — the account balances remain consistent.

## `withTransaction()` — Simplified API with Automatic Retry

MongoDB's driver provides a convenience wrapper that automatically handles retries for certain transient transaction errors (a recommended best practice over manually managing commit/abort logic).

```js
const session = client.startSession();

try {
  await session.withTransaction(async () => {
    const accounts = client.db("bank").collection("accounts");

    await accounts.updateOne(
      { _id: fromAccountId },
      { $inc: { balance: -amount } },
      { session },
    );
    await accounts.updateOne(
      { _id: toAccountId },
      { $inc: { balance: amount } },
      { session },
    );
  });
  console.log("Transfer successful");
} catch (error) {
  console.error("Transfer failed:", error);
} finally {
  await session.endSession();
}
```

## Requirements for Transactions

- MongoDB **4.0+** supports multi-document transactions on **replica sets**.
- MongoDB **4.2+** supports transactions on **sharded clusters** as well.
- The database must be running as a **replica set** (even a single-node replica set works for local development) — a standalone `mongod` instance without replication cannot run transactions.

## Transactions with Mongoose

```js
const mongoose = require("mongoose");

async function transferFunds(fromId, toId, amount) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const from = await Account.findById(fromId).session(session);
      const to = await Account.findById(toId).session(session);

      if (from.balance < amount) throw new Error("Insufficient funds");

      from.balance -= amount;
      to.balance += amount;

      await from.save({ session });
      await to.save({ session });
    });
  } finally {
    session.endSession();
  }
}
```

## Read Concerns and Write Concerns in Transactions

```js
session.startTransaction({
  readConcern: { level: "snapshot" }, // consistent point-in-time view across the transaction
  writeConcern: { w: "majority" }, // wait for majority of replica set members to acknowledge
});
```

- **`readConcern: 'snapshot'`** — all reads within the transaction see a consistent snapshot, as if the transaction happened instantaneously.
- **`writeConcern: { w: 'majority' }`** — ensures the transaction's writes are durably replicated to a majority of nodes before considering it committed, protecting against data loss during a failover.

## Performance Considerations

Transactions are more expensive than single-document operations:

- They hold locks and resources for their duration, increasing contention under high concurrency.
- Long-running transactions increase the risk of conflicts and rollback overhead.
- MongoDB imposes a default transaction time limit (60 seconds by default, configurable) to prevent runaway transactions from holding resources indefinitely.

**Best practice:** keep transactions short, touch as few documents as possible, and prefer redesigning your schema (via embedding) to avoid needing a transaction in the first place, when feasible.

## When You Genuinely Need Transactions

- Financial operations spanning multiple accounts/documents (transfers, ledger entries).
- Inventory management where stock deduction and order creation must succeed/fail together.
- Any workflow requiring "all or nothing" guarantees across multiple documents/collections.

```js
// Example: place an order — deduct stock AND create the order atomically
await session.withTransaction(async () => {
  const product = await db
    .collection("products")
    .findOne({ _id: productId }, { session });
  if (product.stock < quantity) throw new Error("Insufficient stock");

  await db
    .collection("products")
    .updateOne({ _id: productId }, { $inc: { stock: -quantity } }, { session });

  await db
    .collection("orders")
    .insertOne(
      { productId, quantity, userId, createdAt: new Date() },
      { session },
    );
});
```

## When You Don't Need Transactions

- Any operation entirely contained within a single document (already atomic by default).
- Operations where eventual consistency is acceptable (e.g., incrementing a "view count," where an occasional missed increment under a rare failure isn't critical).

## Common Interview-Style Questions

- **Why does MongoDB need explicit transactions less often than SQL databases?**
  Because single-document operations are atomic by default, and MongoDB's document model (embedding related data) naturally handles many cases that would require a multi-row transaction in a relational database.

- **What's required infrastructure-wise to use multi-document transactions in MongoDB?**
  The database must run as a replica set (MongoDB 4.0+) or sharded cluster (4.2+) — a standalone, non-replicated instance cannot support transactions.

- **What does `readConcern: 'snapshot'` provide within a transaction?**
  A consistent point-in-time view of the data across all reads within the transaction, as if the entire transaction executed instantaneously.

- **What's a performance consideration when using transactions?**
  They hold locks/resources for their duration and can increase contention under concurrent load; MongoDB enforces a default time limit (60 seconds) to prevent runaway transactions, and best practice is to keep them short and touch as few documents as possible.

- **Give an example of a scenario that genuinely requires a multi-document transaction.**
  A funds transfer between two separate bank account documents, or an order placement that must atomically deduct inventory stock and create an order record together — both require multiple documents to change together or not at all.
