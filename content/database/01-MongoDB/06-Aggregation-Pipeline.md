# 06. Aggregation Pipeline

## What is the Aggregation Pipeline?

The aggregation pipeline is MongoDB's framework for transforming and analyzing data through a sequence of **stages**, each taking the output of the previous stage as its input — conceptually similar to a Unix pipeline, or a chain of SQL `GROUP BY`/`JOIN`/`WHERE` operations combined.

```js
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$customerId", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } },
]);
```

## Common Pipeline Stages

### `$match` — Filtering (like `find()`/`WHERE`)

```js
db.orders.aggregate([
  { $match: { status: "completed", amount: { $gt: 100 } } },
]);
```

> Place `$match` as early as possible in the pipeline — it reduces the number of documents flowing into subsequent, more expensive stages, and can use indexes if it's the first stage.

### `$group` — Grouping and Aggregating (like `GROUP BY`)

```js
db.orders.aggregate([
  {
    $group: {
      _id: "$customerId", // group key
      totalSpent: { $sum: "$amount" },
      orderCount: { $sum: 1 },
      avgOrderValue: { $avg: "$amount" },
      maxOrder: { $max: "$amount" },
      minOrder: { $min: "$amount" },
    },
  },
]);
```

### `$sort`

```js
db.orders.aggregate([{ $sort: { totalSpent: -1 } }]); // descending
```

### `$project` — Reshaping Documents (Select/Rename/Compute Fields)

```js
db.orders.aggregate([
  {
    $project: {
      customerId: 1,
      amount: 1,
      amountWithTax: { $multiply: ["$amount", 1.18] },
      _id: 0,
    },
  },
]);
```

### `$limit` and `$skip`

```js
db.orders.aggregate([{ $sort: { amount: -1 } }, { $skip: 10 }, { $limit: 5 }]);
```

### `$unwind` — Deconstructing Arrays

Turns each element of an array field into its own separate document, useful when you need to group/filter/analyze array elements individually.

```js
// Document: { _id: 1, name: "Order A", items: ["pen", "notebook", "eraser"] }

db.orders.aggregate([{ $unwind: "$items" }]);

// Result: 3 separate documents, one per item:
// { _id: 1, name: "Order A", items: "pen" }
// { _id: 1, name: "Order A", items: "notebook" }
// { _id: 1, name: "Order A", items: "eraser" }
```

### `$lookup` — Joining Collections

MongoDB's equivalent of a SQL `LEFT JOIN`, letting you pull in related data from another collection.

```js
db.orders.aggregate([
  {
    $lookup: {
      from: "users", // collection to join
      localField: "userId", // field in "orders"
      foreignField: "_id", // field in "users"
      as: "customer", // output array field name
    },
  },
]);
```

Result: each order document gains a `customer` array field containing matching user document(s).

```js
// To get a single object instead of an array (when you expect exactly one match):
db.orders.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "customer",
    },
  },
  { $unwind: "$customer" },
]);
```

### `$addFields` — Adding Computed Fields Without Removing Others

```js
db.orders.aggregate([
  { $addFields: { totalWithTax: { $multiply: ["$amount", 1.18] } } },
]);
```

Unlike `$project`, `$addFields` keeps all existing fields by default and just adds/overwrites the specified ones.

### `$count`

```js
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $count: "completedOrderCount" },
]);
// -> [{ completedOrderCount: 42 }]
```

### `$facet` — Multiple Sub-Pipelines in Parallel

Useful for computing several different aggregations (e.g., paginated results + total count) in a single database round trip.

```js
db.products.aggregate([
  {
    $facet: {
      paginatedResults: [{ $skip: 20 }, { $limit: 10 }],
      totalCount: [{ $count: "count" }],
      categoryCounts: [{ $group: { _id: "$category", count: { $sum: 1 } } }],
    },
  },
]);
```

## A Complete Real-World Example

Find total revenue per customer, only for completed orders in 2026, sorted by revenue descending, with customer details joined in, top 10 only:

```js
db.orders.aggregate([
  {
    $match: {
      status: "completed",
      createdAt: { $gte: ISODate("2026-01-01"), $lt: ISODate("2027-01-01") },
    },
  },
  {
    $group: {
      _id: "$customerId",
      totalRevenue: { $sum: "$amount" },
      orderCount: { $sum: 1 },
    },
  },
  { $sort: { totalRevenue: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "customer",
    },
  },
  { $unwind: "$customer" },
  {
    $project: {
      customerName: "$customer.name",
      totalRevenue: 1,
      orderCount: 1,
      _id: 0,
    },
  },
]);
```

## Aggregation Expression Operators (Used Inside Stages)

| Category    | Examples                                              |
| ----------- | ----------------------------------------------------- |
| Arithmetic  | `$sum`, `$avg`, `$multiply`, `$divide`, `$subtract`   |
| String      | `$concat`, `$toUpper`, `$toLower`, `$substr`, `$trim` |
| Date        | `$year`, `$month`, `$dayOfWeek`, `$dateToString`      |
| Conditional | `$cond`, `$ifNull`, `$switch`                         |
| Array       | `$size`, `$arrayElemAt`, `$filter`, `$map`            |
| Comparison  | `$eq`, `$gt`, `$lt`, `$in`                            |

```js
db.orders.aggregate([
  {
    $project: {
      month: { $month: "$createdAt" },
      status: {
        $cond: {
          if: { $gte: ["$amount", 100] },
          then: "high-value",
          else: "standard",
        },
      },
    },
  },
]);
```

## Using the Node.js Driver

```js
const results = await db
  .collection("orders")
  .aggregate([
    { $match: { status: "completed" } },
    { $group: { _id: "$customerId", total: { $sum: "$amount" } } },
  ])
  .toArray();
```

## Performance Considerations

1. **`$match` early** — filter as much as possible before expensive stages like `$group` or `$lookup`.
2. **Indexes help `$match` and `$sort`** — an early `$match`/`$sort` stage can leverage existing indexes just like a regular query.
3. **`$project` early to trim fields** you don't need, reducing the data volume flowing through later stages.
4. **Avoid unnecessary `$unwind`** on large arrays — it multiplies document count temporarily, which can be expensive.
5. Use `.explain()` on aggregation pipelines too, to check whether early stages are using indexes.

```js
db.orders.aggregate([...]).explain("executionStats");
```

## Aggregation vs Plain `find()` — When to Use Which

| Use `find()` when...                  | Use Aggregation when...                    |
| ------------------------------------- | ------------------------------------------ |
| Simple filtering, sorting, projection | Grouping, joining, complex transformations |
| No need to reshape/compute new fields | Need computed fields, multi-stage logic    |
| Straightforward CRUD-style queries    | Reporting, analytics, dashboards           |

## Common Interview-Style Questions

- **What is the aggregation pipeline, and how does it differ from a simple `find()` query?**
  It's a multi-stage data processing framework where each stage transforms documents and passes results to the next stage, enabling grouping, joining, and complex reshaping that a simple `find()` query can't perform — `find()` handles basic filtering/sorting/projection only.

- **Why should `$match` typically appear early in a pipeline?**
  It reduces the number of documents flowing into later, potentially more expensive stages, and — if it's the very first stage — can leverage existing indexes just like a regular query.

- **What does `$lookup` do, and what's its SQL equivalent?**
  It performs a left-outer-join-style operation, pulling in related documents from another collection based on a matching field — the closest SQL equivalent is a `LEFT JOIN`.

- **What does `$unwind` do, and why might you use it?**
  It deconstructs an array field into separate documents, one per array element — useful when you need to filter, group, or otherwise process array elements individually rather than as a whole array.

- **What's the difference between `$project` and `$addFields`?**
  `$project` explicitly defines the entire output document shape (fields not listed are dropped unless included); `$addFields` adds or overwrites specific fields while keeping all other existing fields intact.
