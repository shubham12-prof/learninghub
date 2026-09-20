# 02. Collections

## What is a Collection?

A collection is MongoDB's equivalent of a SQL **table** — a grouping of documents, typically representing the same type of entity (e.g., `users`, `products`, `orders`). Unlike SQL tables, collections are **schema-less by default**: documents within the same collection don't need to share the same structure.

```
Database
 └── Collection: "users"
      ├── Document: { _id: 1, name: "Alice", email: "alice@example.com" }
      ├── Document: { _id: 2, name: "Bob", age: 30 }  <- different shape, still valid
      └── Document: { _id: 3, name: "Carol", email: "carol@example.com", verified: true }
```

## Creating a Collection

Collections are usually created implicitly on first insert, but can also be created explicitly (useful when you need to set options like validation rules or capped size upfront).

```js
// Implicit creation — happens automatically on first insert
db.products.insertOne({ name: "Widget", price: 9.99 });

// Explicit creation
db.createCollection("orders");

// Explicit creation with options
db.createCollection("logs", {
  capped: true,
  size: 5242880, // 5MB max size
  max: 5000, // max 5000 documents
});
```

## Listing and Inspecting Collections

```js
show collections            // in mongosh
db.getCollectionNames()      // programmatic equivalent

db.products.stats();         // storage size, document count, index sizes, etc.
db.products.countDocuments(); // number of documents matching a filter (default: all)
```

## Dropping a Collection

```js
db.products.drop();
```

## Capped Collections

A capped collection is a fixed-size collection that automatically overwrites its oldest documents once it reaches its size limit — behaves like a circular buffer. Useful for logs, caches, or high-throughput event streams where only recent data matters.

```js
db.createCollection("eventLog", { capped: true, size: 10485760 }); // 10MB
```

Characteristics:

- Maintains insertion order automatically (no need for an index to sort by insertion time).
- Extremely fast writes.
- Cannot manually delete individual documents (they're only removed by being overwritten) unless you drop the entire collection.
- Cannot grow beyond the specified size — oldest documents are automatically purged.

## Schema Validation on Collections

Even though MongoDB is schema-less by default, you can enforce structure using **JSON Schema validation** at the collection level — combining flexibility with data-integrity guarantees where needed.

```js
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email"],
      properties: {
        name: {
          bsonType: "string",
          description: "must be a string and is required",
        },
        email: {
          bsonType: "string",
          pattern: "^.+@.+\\..+$",
          description: "must be a valid email and is required",
        },
        age: {
          bsonType: "int",
          minimum: 0,
          description: "must be a non-negative integer",
        },
      },
    },
  },
  validationLevel: "strict", // 'strict' (all inserts/updates validated) or 'moderate' (only validate already-valid docs on update)
  validationAction: "error", // 'error' (reject invalid docs) or 'warn' (log but allow)
});
```

Adding validation to an **existing** collection:

```js
db.runCommand({
  collMod: "users",
  validator: {
    $jsonSchema: {
      /* ... */
    },
  },
});
```

## Collections vs Tables — Key Differences

|                       | SQL Table                                        | MongoDB Collection                                                                   |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Structure enforcement | Enforced by schema (columns, types) at all times | Flexible by default; optional validation rules                                       |
| Relationships         | Foreign keys, joins                              | Embedding or manual references (no native joins by default, though `$lookup` exists) |
| Scaling model         | Vertical, or complex horizontal sharding         | Built-in horizontal sharding support                                                 |
| Document shape        | Every row has identical columns                  | Documents can vary in structure within the same collection                           |

## Naming Conventions

- Typically **plural, lowercase** collection names: `users`, `orders`, `products`.
- Avoid special characters, and note that collection names can't start with `system.` (reserved for internal MongoDB collections).
- Consistency matters more than a single "correct" convention — pick one and stick with it across the project.

## Collections in the Context of a Database

```js
use myAppDb;             // switch to (or create) a database
db.users.insertOne({ name: "Alice" }); // implicitly creates 'users' collection within myAppDb

show dbs;                 // list all databases
db.dropDatabase();        // drop the current database entirely
```

## Common Interview-Style Questions

- **What is a MongoDB collection, and how does it compare to a SQL table?**
  A collection groups documents representing similar entities, analogous to a table, but is schema-less by default — documents within one collection don't need identical structure, unlike SQL table rows which must conform to a fixed column schema.

- **Are collections created explicitly or implicitly?**
  Both — MongoDB implicitly creates a collection on the first insert if it doesn't exist, or you can explicitly create one via `db.createCollection()`, useful when you need to set options upfront (capped size, validation rules).

- **What is a capped collection, and when would you use one?**
  A fixed-size collection that automatically overwrites its oldest documents once full, behaving like a circular buffer — useful for logs or high-throughput event data where only recent entries matter and insertion order is naturally preserved.

- **Can you enforce a schema on a MongoDB collection despite it being schema-less by default?**
  Yes, via `$jsonSchema` validation rules attached to the collection, with configurable strictness (`validationLevel`) and behavior on failure (`validationAction`).
