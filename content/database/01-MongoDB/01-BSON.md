# 01. BSON

## What is BSON?

BSON (**Binary JSON**) is the binary-encoded serialization format MongoDB uses internally to store documents and communicate over the wire. It's a superset of JSON — every JSON document maps to a BSON document — but BSON adds extra data types and is far more efficient to parse and traverse than plain-text JSON.

```
JSON  -> human-readable text format
BSON  -> binary format MongoDB actually stores/transmits
```

## Why Not Just Store Plain JSON?

|               | JSON                                                   | BSON                                                               |
| ------------- | ------------------------------------------------------ | ------------------------------------------------------------------ |
| Format        | Text                                                   | Binary                                                             |
| Parsing speed | Slower (must parse text)                               | Faster (structure is encoded, lengths are prefixed)                |
| Traversal     | Must scan through characters                           | Can jump directly using embedded byte-length prefixes              |
| Data types    | Limited (string, number, boolean, null, array, object) | Richer (see below)                                                 |
| Size          | Can be smaller for simple data                         | Slightly larger due to type/length metadata, but faster to process |

BSON trades a bit of extra size for much faster machine parsing — a worthwhile trade-off for a database that needs to scan/index documents constantly.

## BSON Data Types (Beyond Plain JSON)

| BSON Type                        | Description                                                    | Example                                       |
| -------------------------------- | -------------------------------------------------------------- | --------------------------------------------- |
| `ObjectId`                       | 12-byte unique identifier, MongoDB's default `_id` type        | `ObjectId("507f1f77bcf86cd799439011")`        |
| `Date`                           | Stored as milliseconds since Unix epoch                        | `ISODate("2026-07-17T00:00:00Z")`             |
| `Double`                         | 64-bit floating point (default JS number type)                 | `19.99`                                       |
| `Int32` / `Int64` (`NumberLong`) | Explicit integer types                                         | `NumberLong(9999999999)`                      |
| `Decimal128`                     | High-precision decimal, for financial data                     | `NumberDecimal("19.99")`                      |
| `Binary Data`                    | Raw binary (e.g., file blobs, encrypted data)                  | `BinData(0, "...")`                           |
| `Regular Expression`             | Stored regex patterns                                          | `/^abc/i`                                     |
| `Timestamp`                      | Internal MongoDB replication timestamp (different from `Date`) | Used internally, not for app-level timestamps |
| `Array`                          | Ordered list of values                                         | `["a", "b", "c"]`                             |
| `Embedded Document`              | Nested BSON document                                           | `{ address: { city: "Delhi" } }`              |
| `Null`                           | Null value                                                     | `null`                                        |
| `Boolean`                        | True/false                                                     | `true`                                        |

## ObjectId — MongoDB's Default `_id`

Every document gets an `_id` field automatically if not provided, typically a 12-byte `ObjectId`:

```
507f1f77bcf86cd799439011
└──┬──┘└──┬─┘└─┬─┘└──┬──┘
 4-byte  5-byte 3-byte
 timestamp random  counter
```

- **4 bytes** — timestamp (seconds since epoch) → ObjectIds are roughly sortable by creation time.
- **5 bytes** — random value (unique per process).
- **3 bytes** — incrementing counter.

```js
const { ObjectId } = require("mongodb");

const id = new ObjectId();
console.log(id.getTimestamp()); // extract creation time directly from the ID
```

## Why `Date` Matters vs Storing Timestamps as Strings

```js
// GOOD — BSON Date type, supports proper date range queries, sorting, indexing
db.orders.insertOne({ createdAt: new Date() });

// BAD — string dates don't sort/compare correctly and lose query capabilities
db.orders.insertOne({ createdAt: "2026-07-17" });
```

```js
db.orders.find({
  createdAt: { $gte: new Date("2026-01-01"), $lt: new Date("2026-02-01") },
});
```

## Why `Decimal128` for Money

JavaScript's native `Number` type (and BSON's default `Double`) is a 64-bit floating point, which can introduce rounding errors for financial calculations.

```js
0.1 + 0.2; // 0.30000000000000004 in JS floating point — problematic for currency

// Use Decimal128 for precise decimal arithmetic in financial documents
db.transactions.insertOne({ amount: NumberDecimal("19.99") });
```

## Inspecting BSON Types from the Shell

```js
db.products.insertOne({
  name: "Widget",
  price: 9.99,
  inStock: true,
  tags: ["a", "b"],
});

db.products.find().forEach((doc) => {
  print(typeof doc.price); // 'number' in JS driver terms
});

// Using $type in a query to filter by BSON type
db.products.find({ price: { $type: "double" } });
db.products.find({ price: { $type: "decimal" } });
```

## BSON Document Size Limit

A single BSON document has a hard limit of **16MB**. This influences schema design decisions — e.g., avoiding unbounded arrays that grow indefinitely (like appending every comment ever made directly into a post document).

```js
// Risky pattern if comments can grow unbounded — could eventually hit the 16MB limit
{
  title: "My Post",
  comments: [ /* thousands of comment objects */ ]
}

// Better: store comments in a separate collection, referencing the post
{ postId: ObjectId("..."), text: "Nice post!", author: "Alice" }
```

For larger binary data (files, images, videos) exceeding practical document sizes, MongoDB provides **GridFS**, which splits large files into chunks stored across multiple documents.

## BSON vs JSON — Common Confusion Points

- BSON is what's stored on disk and sent over the wire; when you interact via `mongosh` or a driver, you're working with a JS/language-native representation that gets serialized to/from BSON automatically — you rarely manipulate raw BSON bytes directly.
- `JSON.stringify()` on a MongoDB document with an `ObjectId` or `Date` field won't automatically give you the right format unless the driver's types implement custom serialization (which the official drivers do handle correctly by default).

## Common Interview-Style Questions

- **What is BSON, and why does MongoDB use it instead of plain JSON?**
  BSON is a binary-encoded superset of JSON that MongoDB uses for storage and network transmission; it enables faster parsing/traversal (via embedded length prefixes) and supports richer data types (dates, binary data, precise decimals) than plain JSON.

- **What are the components of a default MongoDB `ObjectId`?**
  A 4-byte timestamp, a 5-byte random value, and a 3-byte incrementing counter — making ObjectIds roughly time-sortable and highly likely to be unique without central coordination.

- **Why should you use the BSON `Date` type instead of storing dates as strings?**
  Date types support proper range queries, sorting, and indexing; string dates compare lexicographically, which can produce incorrect ordering and can't be used with date-specific query operators reliably.

- **Why might you use `Decimal128` instead of the default `Double` type for storing prices?**
  `Double` is a binary floating-point type prone to rounding errors in decimal arithmetic (common with currency); `Decimal128` provides precise base-10 decimal representation, avoiding those errors.

- **What is the maximum size of a single BSON document, and how does that affect schema design?**
  16MB — this discourages unbounded embedded arrays/growing documents and pushes toward referencing separate collections (or using GridFS for large binary data) when content can grow indefinitely.
