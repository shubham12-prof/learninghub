# 04. CRUD Operations

## Overview

MongoDB's CRUD API lets you Create, Read, Update, and Delete documents. Examples below use the `mongosh`/driver-style syntax (identical method names in the official Node.js driver).

## CREATE — Inserting Documents

### `insertOne()`

```js
db.users.insertOne({
  name: "Alice",
  email: "alice@example.com",
  age: 30,
});
```

Returns:

```js
{ acknowledged: true, insertedId: ObjectId("...") }
```

### `insertMany()`

```js
db.users.insertMany([
  { name: "Bob", email: "bob@example.com" },
  { name: "Carol", email: "carol@example.com" },
]);
```

By default, `insertMany` stops on the first error (`ordered: true`). To continue inserting remaining documents even if one fails:

```js
db.users.insertMany(docs, { ordered: false });
```

## READ — Querying Documents

### `find()` and `findOne()`

```js
db.users.find(); // all documents
db.users.find({ age: { $gt: 25 } }); // filtered
db.users.findOne({ email: "alice@example.com" }); // single document
```

### Query Operators

```js
db.users.find({ age: { $gt: 25 } }); // greater than
db.users.find({ age: { $gte: 25 } }); // greater than or equal
db.users.find({ age: { $lt: 40 } }); // less than
db.users.find({ age: { $lte: 40 } }); // less than or equal
db.users.find({ age: { $ne: 30 } }); // not equal
db.users.find({ age: { $in: [25, 30, 35] } }); // value in a list
db.users.find({ age: { $nin: [25, 30] } }); // value not in a list
```

### Logical Operators

```js
db.users.find({ $and: [{ age: { $gt: 25 } }, { verified: true }] });
db.users.find({ $or: [{ age: { $lt: 18 } }, { age: { $gt: 65 } }] });
db.users.find({ age: { $not: { $gt: 30 } } });
```

### Projections (Selecting Specific Fields)

```js
db.users.find({}, { name: 1, email: 1 }); // include only name and email (+ _id by default)
db.users.find({}, { password: 0 }); // exclude password, include everything else
db.users.find({}, { name: 1, email: 1, _id: 0 }); // exclude _id explicitly
```

### Sorting, Limiting, Skipping

```js
db.users.find().sort({ age: -1 }); // descending
db.users.find().sort({ age: 1 }); // ascending
db.users.find().limit(10);
db.users.find().skip(20).limit(10); // pagination pattern
```

### Querying Nested Fields and Arrays

```js
db.users.find({ "address.city": "Delhi" });
db.users.find({ tags: "premium" }); // matches if array CONTAINS "premium"
db.users.find({ tags: { $all: ["premium", "verified"] } }); // must contain ALL listed values
db.users.find({ tags: { $size: 3 } }); // array has exactly 3 elements
```

### Regex / Text Search

```js
db.users.find({ name: /^A/i }); // starts with "A", case-insensitive
db.users.find({ name: { $regex: "^A", $options: "i" } });
```

## UPDATE — Modifying Documents

### `updateOne()` and `updateMany()`

```js
db.users.updateOne({ email: "alice@example.com" }, { $set: { age: 31 } });

db.users.updateMany({ verified: false }, { $set: { status: "pending" } });
```

### Common Update Operators

```js
db.users.updateOne({ _id: id }, { $set: { name: "Alice Updated" } }); // set a field
db.users.updateOne({ _id: id }, { $unset: { tempField: "" } }); // remove a field
db.users.updateOne({ _id: id }, { $inc: { loginCount: 1 } }); // increment a number
db.users.updateOne({ _id: id }, { $mul: { price: 1.1 } }); // multiply a number
db.users.updateOne({ _id: id }, { $rename: { oldName: "newName" } }); // rename a field
db.users.updateOne({ _id: id }, { $min: { lowestPrice: 15 } }); // set only if new value is lower
db.users.updateOne({ _id: id }, { $max: { highestScore: 95 } }); // set only if new value is higher
```

### Array Update Operators

```js
db.users.updateOne({ _id: id }, { $push: { tags: "new-tag" } }); // add to array
db.users.updateOne({ _id: id }, { $push: { tags: { $each: ["a", "b"] } } }); // add multiple
db.users.updateOne({ _id: id }, { $pull: { tags: "old-tag" } }); // remove matching value(s)
db.users.updateOne({ _id: id }, { $addToSet: { tags: "unique-tag" } }); // add only if not already present
db.users.updateOne({ _id: id }, { $pop: { tags: 1 } }); // remove last element (-1 for first)
```

### `upsert` — Insert if Not Found

```js
db.users.updateOne(
  { email: "new@example.com" },
  { $set: { name: "New User" } },
  { upsert: true }, // creates the document if no match is found
);
```

### `replaceOne()` — Full Document Replacement

```js
db.users.replaceOne(
  { email: "alice@example.com" },
  { name: "Alice", email: "alice@example.com", age: 32 }, // entirely replaces the matched document (except _id)
);
```

## DELETE — Removing Documents

```js
db.users.deleteOne({ email: "alice@example.com" });
db.users.deleteMany({ verified: false });
db.users.deleteMany({}); // deletes ALL documents in the collection (careful!)
```

## Using the Official Node.js Driver (Not `mongosh`)

```bash
npm install mongodb
```

```js
const { MongoClient, ObjectId } = require("mongodb");

const client = new MongoClient(process.env.MONGO_URI);

async function main() {
  await client.connect();
  const db = client.db("myAppDb");
  const users = db.collection("users");

  // Create
  const insertResult = await users.insertOne({
    name: "Alice",
    email: "alice@example.com",
  });

  // Read
  const user = await users.findOne({ _id: insertResult.insertedId });
  const allUsers = await users.find({ age: { $gt: 25 } }).toArray();

  // Update
  await users.updateOne(
    { _id: insertResult.insertedId },
    { $set: { age: 31 } },
  );

  // Delete
  await users.deleteOne({ _id: insertResult.insertedId });

  await client.close();
}

main();
```

## Bulk Write Operations (Efficient Batch Writes)

```js
await db
  .collection("users")
  .bulkWrite([
    { insertOne: { document: { name: "Dave" } } },
    { updateOne: { filter: { name: "Alice" }, update: { $set: { age: 32 } } } },
    { deleteOne: { filter: { name: "Bob" } } },
  ]);
```

`bulkWrite` sends multiple operations in a single round trip, significantly more efficient than issuing them one at a time when you have many operations to perform.

## `findOneAndUpdate()` — Atomic Read-and-Update

Returns the document (before or after modification) in the same atomic operation — useful for patterns like "claim the next job in a queue."

```js
const result = await db.collection("jobs").findOneAndUpdate(
  { status: "pending" },
  { $set: { status: "processing" } },
  { sortField: { priority: -1 }, returnDocument: "after" }, // 'before' or 'after'
);
```

## Common Interview-Style Questions

- **What's the difference between `updateOne()` and `replaceOne()`?**
  `updateOne()` modifies only the specified fields (using update operators like `$set`); `replaceOne()` replaces the entire matched document's content (except `_id`) with the new document provided.

- **What does the `upsert` option do?**
  If no document matches the filter, it inserts a new document based on the filter + update instead of doing nothing — combining "update if exists, insert if not" into a single atomic operation.

- **How do you add a value to an array only if it's not already present?**
  `$addToSet`, unlike `$push` which always appends regardless of duplicates.

- **Why use `bulkWrite()` instead of multiple individual insert/update/delete calls?**
  It batches multiple operations into a single round trip to the database, significantly improving performance when you have many operations to perform together, versus issuing separate network calls for each.

- **What's a key advantage of `findOneAndUpdate()` over doing a separate `find()` then `update()`?**
  Atomicity — the read and update happen as a single indivisible operation, preventing race conditions where another process could modify the document between a separate find and update call.
