# 12. Interview Questions — MongoDB (Comprehensive)

A consolidated set of commonly asked MongoDB interview questions, organized by topic, with concise answers and code where useful.

---

## BSON

**Q: What is BSON, and why does MongoDB use it?**
A binary-encoded superset of JSON used for storage and network transmission; enables faster parsing/traversal via embedded length prefixes and supports richer types (dates, binary, precise decimals) than plain JSON.

**Q: What makes up a default MongoDB `ObjectId`?**
A 4-byte timestamp, 5-byte random value, and 3-byte incrementing counter — roughly time-sortable and unique without central coordination.

**Q: What's the maximum BSON document size, and how does it affect design?**
16MB — discourages unbounded embedded arrays/growth, pushing toward references or GridFS for large/growing data.

---

## Collections & Documents

**Q: How does a MongoDB collection compare to a SQL table?**
A collection groups documents (like a table groups rows), but is schema-less by default — documents within a collection can vary in structure, unlike fixed-column SQL rows.

**Q: What is a capped collection?**
A fixed-size collection that automatically overwrites its oldest documents once full, behaving like a circular buffer — useful for logs/high-throughput event data.

**Q: What's the difference between embedding and referencing?**
Embedding nests related data directly in a document (fast single-query reads, but risks duplication/bloat for unbounded data); referencing links via ID across collections (avoids duplication, better for large/independent/growing relationships, but needs an extra query or `$lookup`).

**Q: Is the `_id` field mutable?**
No — it's immutable once set; "changing" it requires deleting and re-inserting with a new `_id`.

---

## CRUD Operations

**Q: Difference between `updateOne()` and `replaceOne()`?**
`updateOne()` modifies specified fields via operators (`$set`, etc.); `replaceOne()` replaces the entire document content (except `_id`).

**Q: What does `upsert: true` do?**
Inserts a new document based on the filter+update if no document matches, instead of doing nothing.

**Q: `$push` vs `$addToSet`?**
`$push` always appends to an array; `$addToSet` only adds if the value isn't already present.

**Q: Why use `bulkWrite()`?**
Batches multiple operations into a single round trip, improving performance versus many individual calls.

---

## Indexes

**Q: Why are indexes important?**
They let MongoDB jump directly to matching documents (`IXSCAN`) instead of scanning the whole collection (`COLLSCAN`), dramatically improving query performance at scale.

**Q: What is the ESR rule?**
For compound index field ordering: Equality fields first, Sort fields second, Range fields last.

**Q: What is a TTL index?**
An index that automatically deletes documents after a specified time past a date field — used for expiring sessions, tokens, temporary data.

**Q: Downsides of too many indexes?**
Increased storage, slower writes (every index must update on write), and memory pressure if indexes don't fit in RAM.

**Q: How do you check if a query uses an index?**
`.explain("executionStats")` — look for `IXSCAN` vs `COLLSCAN`, and compare `totalDocsExamined` to actual returned document count.

---

## Aggregation Pipeline

**Q: What is the aggregation pipeline?**
A multi-stage data processing framework (`$match`, `$group`, `$sort`, `$lookup`, etc.) where each stage transforms documents and passes results to the next, enabling grouping/joining/complex reshaping beyond what `find()` supports.

**Q: Why put `$match` early in a pipeline?**
Reduces document volume flowing into later expensive stages, and can use indexes if it's the first stage.

**Q: What does `$lookup` do?**
A left-outer-join-style operation pulling in related documents from another collection.

**Q: What does `$unwind` do?**
Deconstructs an array field into separate documents, one per element, so array contents can be processed individually.

**Q: `$project` vs `$addFields`?**
`$project` defines the entire output shape (unlisted fields dropped); `$addFields` adds/overwrites specific fields while keeping everything else.

---

## Transactions

**Q: Why does MongoDB need explicit transactions less often than SQL?**
Single-document operations are atomic by default, and MongoDB's embedding-friendly document model handles many cases that would need a multi-row transaction in SQL.

**Q: What infrastructure is required for transactions?**
The database must run as a replica set (4.0+) or sharded cluster (4.2+) — standalone non-replicated instances can't support transactions.

**Q: What does `readConcern: 'snapshot'` provide?**
A consistent point-in-time view across all reads within the transaction.

**Q: Give an example requiring a multi-document transaction.**
A funds transfer between two account documents, or an order placement that must atomically deduct stock and create an order record.

---

## Replication

**Q: What is a replica set?**
A group of `mongod` instances maintaining copies of the same data — one primary (accepts writes), the rest secondaries (replicate via the oplog) — providing high availability and redundancy.

**Q: What is the oplog?**
A capped collection on the primary recording every write; secondaries tail and apply it to stay synchronized.

**Q: What happens when the primary fails?**
Secondaries detect the loss via heartbeat timeout and hold an election to choose a new primary, typically within seconds.

**Q: Trade-off of reading from secondaries?**
Potential staleness due to replication lag, in exchange for distributing read load or reducing latency.

**Q: What does `writeConcern: { w: "majority" }` guarantee?**
The write is acknowledged only once a majority of replica set members have durably recorded it, protecting against data loss on failover.

---

## Sharding

**Q: What problem does sharding solve that replication doesn't?**
Replication copies the entire dataset for redundancy; it doesn't help when data size or write throughput exceeds a single server's capacity. Sharding horizontally partitions data across multiple shards.

**Q: What is a shard key, and why does it matter so much?**
The field(s) determining which shard a document belongs to; a poor choice (low cardinality, uneven distribution) creates "hot shards," and shard keys are very difficult to change after data is distributed.

**Q: Ranged vs hashed sharding?**
Ranged partitions contiguous value ranges (good for range queries, risks hot shards with monotonic keys); hashed distributes via a hash of the key (excellent write distribution, poor for range queries).

**Q: Targeted vs scatter-gather queries?**
Targeted queries include the shard key and route directly to relevant shard(s); scatter-gather queries lack it, forcing `mongos` to query all shards and merge results — much slower.

**Q: Role of `mongos`?**
Query router the application connects to; consults config server metadata to route queries to the correct shard(s) and merges results.

---

## Atlas

**Q: What is MongoDB Atlas?**
A fully-managed cloud database service handling provisioning, replication, backups, scaling, and patching — removing the operational burden of self-hosting MongoDB.

**Q: Shared vs dedicated tiers?**
Shared tiers (M0-M5) run on shared infrastructure (free/low-cost, good for learning); dedicated tiers (M10+) provide dedicated resources and unlock production features like automated backups and VPC peering.

**Q: What is Atlas Search?**
Built-in full-text search (Apache Lucene-powered) integrated into the aggregation pipeline via `$search`, avoiding a separate search engine deployment for many use cases.

**Q: Why avoid whitelisting `0.0.0.0/0` in Network Access?**
It allows connections from any IP on the internet, significantly increasing attack surface — production should use restricted IP ranges or private connectivity.

---

## Mongoose

**Q: What is Mongoose, and what does it add over the native driver?**
An ODM library adding schema definition, validation, middleware (hooks), and relationship population (`populate()`) on top of the native MongoDB driver.

**Q: Why doesn't validation run automatically on `findByIdAndUpdate`?**
Mongoose update operations bypass document validation by default — you must opt in explicitly with `{ runValidators: true }`.

**Q: What does `populate()` do?**
Resolves a referenced ObjectId field into the actual document(s), similar to a SQL join, at the cost of an additional query.

**Q: Instance method vs static method?**
Instance methods (`schema.methods`) operate on a specific document instance; static methods (`schema.statics`) operate on the model itself.

**Q: When would you use `.lean()`?**
For read-only queries where you don't need Mongoose document features (virtuals, methods, change tracking) — returns plain JS objects, faster and lighter.

---

## Practical / Coding Questions Often Asked Live

**Q: Write a query to find users older than 25, sorted by name, with pagination.**

```js
db.users
  .find({ age: { $gt: 25 } })
  .sort({ name: 1 })
  .skip((page - 1) * limit)
  .limit(limit);
```

**Q: Write an aggregation to get total revenue per customer for completed orders.**

```js
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$customerId", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } },
]);
```

**Q: Write a Mongoose schema with validation and a pre-save password hashing hook.**

```js
const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 8 },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
```

**Q: Write a transaction transferring funds between two accounts using the Node.js driver.**

```js
const session = client.startSession();
try {
  await session.withTransaction(async () => {
    const accounts = client.db("bank").collection("accounts");
    await accounts.updateOne(
      { _id: fromId },
      { $inc: { balance: -amount } },
      { session },
    );
    await accounts.updateOne(
      { _id: toId },
      { $inc: { balance: amount } },
      { session },
    );
  });
} finally {
  await session.endSession();
}
```

**Q: How would you design a schema for a blog with posts and comments — embed or reference?**
Embed a small, bounded number of recent comments directly if reads are comment-heavy and comment count stays low; reference (separate `comments` collection with a `postId` field) if comments can grow unboundedly or need independent querying/pagination — the classic embedding-vs-referencing trade-off based on growth pattern and access pattern.

**Q: How would you optimize a slow query that's doing a full collection scan?**
Run `.explain("executionStats")` to confirm `COLLSCAN`, identify the fields used in the filter/sort, and create an appropriate single-field or compound index (following the ESR rule) covering those fields.
