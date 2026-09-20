# 07. Transactions

## Why Transactions Matter in Prisma

Just like in raw SQL, Prisma transactions ensure multiple database operations succeed or fail together as a single atomic unit — critical for operations spanning multiple related writes (e.g., transferring funds, placing an order that also updates inventory).

Prisma offers two main transaction APIs: the **sequential (array) API** and the **interactive transaction API**.

## 1. Sequential Transactions — `$transaction([...])`

Pass an array of prepared Prisma Client operations; Prisma executes them all within a single database transaction.

```js
const [user, post] = await prisma.$transaction([
  prisma.user.create({ data: { name: "Alice", email: "alice@example.com" } }),
  prisma.post.create({ data: { title: "Hello World", authorId: 1 } }),
]);
```

If any operation in the array fails, **all** operations are rolled back — none of them take effect.

### Example: Bank Transfer

```js
async function transferFunds(fromId, toId, amount) {
  await prisma.$transaction([
    prisma.account.update({
      where: { id: fromId },
      data: { balance: { decrement: amount } },
    }),
    prisma.account.update({
      where: { id: toId },
      data: { balance: { increment: amount } },
    }),
  ]);
}
```

### Limitation of the Sequential API

The array of operations is prepared **before** execution — you can't run application logic (like conditionally deciding what to do next) _between_ the operations based on the result of an earlier one within the same transaction. For that, you need interactive transactions.

## 2. Interactive Transactions — `$transaction(async (tx) => { ... })`

Provides a callback with a transactional Prisma Client instance (`tx`), letting you run arbitrary logic — including conditionals and reads that inform subsequent writes — all within a single atomic transaction.

```js
async function transferFunds(fromId, toId, amount) {
  await prisma.$transaction(async (tx) => {
    const fromAccount = await tx.account.findUnique({ where: { id: fromId } });

    if (fromAccount.balance < amount) {
      throw new Error("Insufficient funds"); // throwing inside rolls back the whole transaction
    }

    await tx.account.update({
      where: { id: fromId },
      data: { balance: { decrement: amount } },
    });

    await tx.account.update({
      where: { id: toId },
      data: { balance: { increment: amount } },
    });
  });
}
```

**Critical detail:** use `tx.model` (the transactional client passed into the callback), **not** `prisma.model` (the outer client), inside the callback — otherwise your operations run outside the transaction.

## Example: Order Placement with Inventory Check

```js
async function placeOrder(productId, quantity, userId) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });

    if (product.stock < quantity) {
      throw new Error("Insufficient stock");
    }

    await tx.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    });

    const order = await tx.order.create({
      data: { productId, quantity, userId },
    });

    return order;
  });
}
```

If `placeOrder` throws at any point, both the stock decrement and the order creation are rolled back together.

## Transaction Options: Timeout and Isolation Level

```js
await prisma.$transaction(
  async (tx) => {
    // ... transactional logic
  },
  {
    maxWait: 5000, // max time to wait for a transaction slot (ms)
    timeout: 10000, // max time the transaction itself is allowed to run (ms)
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  },
);
```

## Nested Writes as Implicit Transactions

Nested writes (creating a parent and related child records together) are automatically wrapped in a transaction by Prisma — you don't need `$transaction` explicitly for these.

```js
// Automatically atomic — Prisma wraps this nested write in a transaction internally
await prisma.user.create({
  data: {
    name: "Alice",
    email: "alice@example.com",
    posts: {
      create: [{ title: "First Post" }, { title: "Second Post" }],
    },
  },
});
```

## Batch Operations Are Also Implicitly Atomic (Per-Query)

```js
// updateMany itself runs as a single atomic operation at the database level
await prisma.user.updateMany({
  where: { role: "guest" },
  data: { status: "inactive" },
});
```

## When to Choose Sequential vs Interactive Transactions

| Use Sequential (`$transaction([...])`) when...                        | Use Interactive (`$transaction(async (tx) => {...})`) when...       |
| --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| All operations are known upfront, independent of each other's results | You need to read data and make decisions based on it before writing |
| Simpler, slightly more efficient                                      | More flexible, required for conditional/branching transaction logic |
| No custom application logic needed between steps                      | Need `if` statements, loops, or calculations between DB operations  |

## Performance Considerations

- Keep interactive transactions **short** — they hold a database connection and locks for their entire duration.
- Avoid doing slow, non-database work (like calling an external API) inside a transaction callback — it unnecessarily extends how long locks/connections are held.
- The default transaction timeout is 5 seconds (`timeout` option) — increase only if genuinely necessary, rather than as a default habit.

## Common Interview-Style Questions

- **What's the difference between Prisma's sequential and interactive transaction APIs?**
  The sequential API (`$transaction([...])`) takes an array of pre-built operations executed atomically together, with no ability to branch logic based on intermediate results; the interactive API (`$transaction(async (tx) => {...})`) provides a callback with a transactional client, allowing arbitrary logic — including reads that inform subsequent writes — within a single atomic transaction.

- **Why is it important to use `tx.model` instead of `prisma.model` inside an interactive transaction callback?**
  `tx` is the transactional client bound to that specific transaction; using the outer `prisma` client instead would run those operations outside the transaction, breaking atomicity.

- **How does throwing an error inside an interactive transaction callback affect the transaction?**
  It causes Prisma to automatically roll back the entire transaction — none of the operations performed via `tx` up to that point are committed.

- **Are nested writes (like creating a user with related posts in one `create()` call) automatically transactional?**
  Yes — Prisma automatically wraps nested writes in an implicit transaction, so you don't need to manually use `$transaction` for that specific pattern.

- **Why should transactions be kept as short as possible?**
  They hold database connections and row/table locks for their entire duration; long-running transactions increase contention, risk of timeouts, and reduce overall database throughput under concurrent load.
