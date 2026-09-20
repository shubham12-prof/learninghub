# 03. Documents

## What is a Document?

A document is MongoDB's fundamental unit of data storage — analogous to a **row** in a SQL table, but structured as a BSON object (conceptually similar to a JSON object) with key-value pairs, capable of nesting and arrays.

```js
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "Alice",
  email: "alice@example.com",
  age: 30,
  address: {                       // embedded/nested document
    city: "Delhi",
    zip: "110001"
  },
  tags: ["premium", "verified"],    // array field
  createdAt: ISODate("2026-07-17T00:00:00Z")
}
```

## The `_id` Field

Every document requires a unique `_id` field, which acts as its primary key within the collection. If not provided at insert time, MongoDB automatically generates an `ObjectId`.

```js
db.users.insertOne({ name: "Bob" });
// automatically gets: _id: ObjectId("...")

db.users.insertOne({ _id: "custom-id-123", name: "Carol" }); // custom _id also allowed
```

`_id` is automatically indexed (unique index) — every collection has this index by default, and it can't be dropped.

## Document Structure Flexibility

Unlike SQL rows, documents within the same collection can have different fields/structures — this is often called being "schema-less" or "schema-flexible."

```js
// All valid within the same "users" collection
{ _id: 1, name: "Alice", email: "alice@example.com" }
{ _id: 2, name: "Bob", age: 30, phone: "555-1234" }
{ _id: 3, name: "Carol", preferences: { theme: "dark", notifications: true } }
```

This flexibility is powerful but requires discipline — application code (or schema validation, or an ODM like Mongoose) usually enforces consistency in practice, since truly arbitrary shapes make querying and reasoning about data harder.

## Embedded Documents (Nesting)

Related data can be nested directly inside a parent document, avoiding the need for a join.

```js
{
  _id: ObjectId("..."),
  name: "Alice",
  address: {
    street: "123 Main St",
    city: "Delhi",
    zip: "110001"
  },
  orders: [
    { productId: ObjectId("..."), quantity: 2, price: 19.99 },
    { productId: ObjectId("..."), quantity: 1, price: 49.99 }
  ]
}
```

Querying into nested fields uses dot notation:

```js
db.users.find({ "address.city": "Delhi" });
db.users.find({ "orders.quantity": { $gt: 1 } });
```

## Embedding vs Referencing — Core Data Modeling Decision

| Approach        | When to Use                                                                                                      | Trade-off                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Embedding**   | Data is tightly coupled, read together often, bounded in size (e.g., an address inside a user)                   | Faster reads (single query), but can duplicate data and hit the 16MB document limit if unbounded |
| **Referencing** | Data is large, shared across documents, grows unboundedly, or updated independently (e.g., a user's many orders) | Requires a second query or `$lookup` (join), but avoids duplication and document bloat           |

```js
// Embedding — good for a bounded, tightly-coupled relationship
{ _id: 1, name: "Alice", address: { city: "Delhi", zip: "110001" } }

// Referencing — good for a large or independently-growing relationship
// users collection:
{ _id: ObjectId("u1"), name: "Alice" }
// orders collection:
{ _id: ObjectId("o1"), userId: ObjectId("u1"), total: 49.99 }
```

## Field Data Types Within a Document

A single document can mix types freely across fields (and BSON types richer than plain JSON — see the BSON notes):

```js
{
  name: "Widget",         // string
  price: 19.99,             // double
  inStock: true,             // boolean
  quantity: NumberInt(50),   // int32
  tags: ["new", "sale"],     // array
  createdAt: new Date(),     // date
  metadata: null,             // null
  details: { weight: 1.2 }    // embedded document
}
```

## Document Size and Depth Limits

- Maximum document size: **16MB** (BSON limit).
- Maximum nesting depth: **100 levels**.

These limits shape schema design — very deeply nested or unbounded-growth structures should be restructured using references instead of embedding.

## Working with Documents (Basic Operations Preview)

```js
// Insert
db.users.insertOne({ name: "Alice", email: "alice@example.com" });

// Find
db.users.findOne({ email: "alice@example.com" });

// Update
db.users.updateOne({ _id: ObjectId("...") }, { $set: { age: 31 } });

// Delete
db.users.deleteOne({ _id: ObjectId("...") });
```

(Full CRUD operation detail in the next notes file.)

## Document Immutability of `_id`

Once set, a document's `_id` field cannot be changed via update — attempting to modify it results in an error. If you need to "change" an ID, you must delete the document and re-insert it with a new `_id`.

```js
db.users.updateOne({ _id: ObjectId("...") }, { $set: { _id: ObjectId() } });
// Error: Performing an update on the path '_id' would modify the immutable field '_id'
```

## Common Interview-Style Questions

- **What is a MongoDB document, and what's its closest SQL equivalent?**
  A document is a BSON-encoded record of key-value pairs (with support for nesting and arrays), roughly analogous to a row in a SQL table, but with flexible structure rather than a fixed column schema.

- **What is the purpose of the `_id` field, and is it required?**
  It's the document's unique primary key within its collection; if not explicitly provided, MongoDB auto-generates an `ObjectId` for it. Every document must have one, and it's automatically indexed.

- **What's the difference between embedding and referencing, and how do you decide which to use?**
  Embedding nests related data directly within a document (faster reads, but risks duplication/document bloat for unbounded data); referencing stores related data in a separate collection linked by ID (avoids duplication, better for large/independently-changing/unboundedly-growing relationships, but requires an extra query or `$lookup`).

- **Can two documents in the same collection have completely different fields?**
  Yes — MongoDB collections are schema-less by default, so documents can vary in structure, though in practice applications or schema validation rules usually enforce a consistent shape.

- **Can you change a document's `_id` after it's created?**
  No — `_id` is immutable once set; changing it requires deleting the document and inserting a new one with a different `_id`.
