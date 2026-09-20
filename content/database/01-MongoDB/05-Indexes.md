# 05. Indexes

## Why Indexes Matter

Without an index, MongoDB must perform a **collection scan** — examining every single document to find matches for a query. Indexes create an efficient, sorted data structure (a B-tree) over one or more fields, letting MongoDB jump directly to matching documents instead of scanning the whole collection.

```js
db.users.find({ email: "alice@example.com" }); // without an index: scans EVERY document
```

```js
db.users.createIndex({ email: 1 }); // now the above query is fast, even with millions of documents
```

## The Default `_id` Index

Every collection automatically has a unique index on `_id` — you never need to create this yourself, and it can't be dropped.

## Single-Field Indexes

```js
db.users.createIndex({ email: 1 }); // ascending
db.users.createIndex({ age: -1 }); // descending — direction matters less for single-field indexes, more for sorts/compound indexes
```

## Compound Indexes

An index on multiple fields, useful for queries that filter/sort on more than one field together.

```js
db.orders.createIndex({ userId: 1, createdAt: -1 });
```

This index efficiently supports:

```js
db.orders.find({ userId: id }).sort({ createdAt: -1 }); // uses the full index
db.orders.find({ userId: id }); // uses the index (prefix match)
```

But **not** efficiently:

```js
db.orders.find({ createdAt: { $gte: someDate } }); // doesn't use this index effectively — "createdAt" isn't the prefix field
```

### The ESR Rule (Equality, Sort, Range)

When designing compound indexes, a widely-used guideline for field order is:

1. **Equality** fields first (exact match conditions)
2. **Sort** fields next
3. **Range** fields last

```js
// Query: find orders for a user, sorted by date, within a price range
db.orders
  .find({ userId: id, price: { $gte: 10, $lte: 100 } })
  .sort({ createdAt: -1 });

// Optimal compound index following ESR:
db.orders.createIndex({ userId: 1, createdAt: -1, price: 1 });
```

## Unique Indexes

Enforces that no two documents can have the same value for the indexed field(s).

```js
db.users.createIndex({ email: 1 }, { unique: true });
```

Attempting to insert a duplicate:

```js
db.users.insertOne({ email: "alice@example.com" }); // fails with a duplicate key error (code 11000) if already exists
```

## Text Indexes (Full-Text Search)

```js
db.articles.createIndex({ title: "text", body: "text" });

db.articles.find({ $text: { $search: "mongodb indexing" } });
```

A collection can only have **one** text index (though it can cover multiple fields).

## Geospatial Indexes

```js
db.places.createIndex({ location: "2dsphere" });

db.places.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [77.209, 28.6139] },
      $maxDistance: 5000, // meters
    },
  },
});
```

## Partial Indexes

Indexes only a subset of documents matching a filter — smaller, more efficient index when you only need to query a specific subset frequently.

```js
db.orders.createIndex(
  { customerId: 1 },
  { partialFilterExpression: { status: "active" } },
);
```

## TTL (Time-To-Live) Indexes

Automatically deletes documents after a specified number of seconds past a date field — great for session data, temporary tokens, logs.

```js
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // auto-delete after 1 hour
```

## Multikey Indexes (Indexing Array Fields)

When you index a field that holds an array, MongoDB automatically creates a "multikey index" — one index entry per array element.

```js
db.products.createIndex({ tags: 1 });

db.products.insertOne({ name: "Shirt", tags: ["clothing", "sale", "summer"] });
// creates index entries for "clothing", "sale", and "summer" separately
```

## Viewing and Managing Indexes

```js
db.users.getIndexes(); // list all indexes on a collection
db.users.dropIndex("email_1"); // drop by name
db.users.dropIndexes(); // drop all except the default _id index
```

## Analyzing Query Performance with `explain()`

```js
db.users.find({ email: "alice@example.com" }).explain("executionStats");
```

Key fields to look at in the output:

```
"stage": "COLLSCAN"      -> BAD: full collection scan, no index used
"stage": "IXSCAN"        -> GOOD: index scan used
"totalDocsExamined": ... -> how many documents were actually scanned
"totalKeysExamined": ... -> how many index entries were scanned
"executionTimeMillis": ...
```

A well-optimized query should show `IXSCAN` with `totalDocsExamined` close to (ideally equal to) the number of documents actually returned.

## Index Trade-offs — Not Free

Indexes speed up reads but come with costs:

- **Extra storage** — each index consumes additional disk space.
- **Slower writes** — every insert/update/delete must also update all relevant indexes on that document.
- **Memory usage** — frequently-used indexes should ideally fit in RAM for best performance; large numbers of unused indexes waste memory.

**Rule of thumb:** index fields you actually query/sort/filter on frequently — don't index everything "just in case."

## Covered Queries

A query is "covered" when all the fields it needs (both filter and projection) exist entirely within the index itself, so MongoDB never needs to read the actual documents — extremely fast.

```js
db.users.createIndex({ email: 1, name: 1 });

db.users.find({ email: "alice@example.com" }, { name: 1, _id: 0 }); // covered — everything needed is in the index
```

## Building Indexes on Large Collections

By default, index builds can block other operations. On production systems with large collections, indexes are built in the background (MongoDB 4.2+ builds are optimized to minimize blocking automatically); for older versions or careful production rollouts, consider building during low-traffic windows.

## Common Interview-Style Questions

- **Why are indexes important for query performance?**
  Without an index, MongoDB must scan every document in a collection (`COLLSCAN`) to find matches; an index lets it jump directly to relevant documents (`IXSCAN`), which is dramatically faster at scale.

- **What is the ESR rule for compound index field ordering?**
  Equality fields first, Sort fields second, Range fields last — this ordering maximizes how effectively the index can be used for a given query pattern.

- **What's the difference between a unique index and a regular index?**
  A unique index additionally enforces that no two documents can share the same value for the indexed field(s), rejecting inserts/updates that would violate that constraint.

- **What is a TTL index, and what's a common use case?**
  An index that automatically deletes documents after a specified time has passed since a date field — commonly used for expiring session data, temporary tokens, or time-limited cache entries.

- **What are the downsides of adding too many indexes?**
  Increased storage usage, slower write performance (every index must be updated on every write), and increased memory pressure if indexes don't fit comfortably in RAM.

- **How do you check whether a query is using an index effectively?**
  Run `.explain("executionStats")` on the query and check whether the winning plan uses `IXSCAN` (index scan) rather than `COLLSCAN` (full collection scan), and compare `totalDocsExamined` to the actual number of returned documents.
