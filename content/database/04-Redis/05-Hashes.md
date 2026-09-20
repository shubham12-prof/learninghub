# 05. Hashes

## What Are Redis Hashes?

A Redis Hash is a map of field-value pairs stored under a single key — essentially a mini object/record, similar to a dictionary or a row with named columns. Hashes are the natural fit for representing structured entities (like a user or product) in Redis, more space-efficient and semantically clearer than storing an entire JSON-serialized string when you need to access/update individual fields.

## Basic Operations

```bash
HSET user:1000 name "Alice" email "alice@example.com" age 30
HGET user:1000 name              # "Alice"
HGETALL user:1000                  # returns ALL field-value pairs
HDEL user:1000 age                  # remove a specific field
HEXISTS user:1000 email               # 1 if the field exists, 0 if not
```

```js
await redis.hset("user:1000", {
  name: "Alice",
  email: "alice@example.com",
  age: 30,
});
const name = await redis.hget("user:1000", "name");
const allFields = await redis.hgetall("user:1000"); // { name: 'Alice', email: '...', age: '30' }
await redis.hdel("user:1000", "age");
```

## Multiple Fields at Once

```bash
HMGET user:1000 name email          # get multiple specific fields: ["Alice", "alice@example.com"]
```

```js
const [name, email] = await redis.hmget("user:1000", "name", "email");
```

## Checking Field Count and Existence

```bash
HLEN user:1000            # number of fields in the hash
HKEYS user:1000             # all field names
HVALS user:1000              # all values (without field names)
```

```js
const fieldCount = await redis.hlen("user:1000");
const fieldNames = await redis.hkeys("user:1000");
const values = await redis.hvals("user:1000");
```

## Numeric Fields Within a Hash

```bash
HINCRBY user:1000 login_count 1
HINCRBYFLOAT product:5 rating_sum 4.5
```

```js
await redis.hincrby("user:1000", "login_count", 1);
await redis.hincrbyfloat("product:5", "rating_sum", 4.5);
```

Just like `INCR` on a plain string key, these are atomic — safe for concurrent updates without a race condition.

## Why Use a Hash Instead of a JSON String?

```js
// Approach A: JSON-serialized string
await redis.set("user:1000", JSON.stringify({ name: "Alice", age: 30 }));
// To update just the age, you must GET, parse, modify, stringify, and SET the ENTIRE object again

// Approach B: Hash
await redis.hset("user:1000", { name: "Alice", age: 30 });
await redis.hincrby("user:1000", "age", 1); // update just this ONE field, atomically, no read-modify-write needed
```

|                                   | JSON String                                   | Hash                                                                                        |
| --------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Update a single field             | Requires read-modify-write of the whole value | Direct field-level update (`HSET`/`HINCRBY`)                                                |
| Memory efficiency (small objects) | Comparable                                    | Redis hashes are specially optimized for small field counts (`ziplist`/`listpack` encoding) |
| Querying a single field           | Must deserialize the whole value              | `HGET` a single field directly, no deserialization of the rest                              |
| Nesting/complex structures        | Naturally supports nested objects/arrays      | Flat structure only — no native nesting (values are always strings)                         |

**Rule of thumb:** use a Hash when you need to read/update individual fields independently and the structure is relatively flat; use a JSON string when the data is deeply nested or always read/written as a whole unit.

## Practical Use Case 1: Caching a Database Row/Object

```js
async function cacheUser(user) {
  await redis.hset(`user:${user.id}`, {
    name: user.name,
    email: user.email,
    role: user.role,
  });
  await redis.expire(`user:${user.id}`, 3600);
}

async function getCachedUser(id) {
  const data = await redis.hgetall(`user:${id}`);
  return Object.keys(data).length ? data : null; // hgetall returns {} if the key doesn't exist
}
```

## Practical Use Case 2: Shopping Cart

```js
async function addToCart(userId, productId, quantity) {
  await redis.hset(`cart:${userId}`, productId, quantity);
}

async function updateCartQuantity(userId, productId, delta) {
  await redis.hincrby(`cart:${userId}`, productId, delta);
}

async function getCart(userId) {
  return redis.hgetall(`cart:${userId}`); // { productId1: quantity, productId2: quantity, ... }
}

async function removeFromCart(userId, productId) {
  await redis.hdel(`cart:${userId}`, productId);
}
```

## Practical Use Case 3: Counters/Stats Grouped by Entity

```js
async function recordPageStats(pageId, event) {
  await redis.hincrby(`stats:${pageId}`, event, 1); // increments "views", "clicks", "shares" independently
}

async function getPageStats(pageId) {
  return redis.hgetall(`stats:${pageId}`); // { views: '150', clicks: '32', shares: '4' }
}
```

## Field Expiration (Redis 7.4+)

Newer Redis versions support setting a TTL on **individual hash fields**, not just the whole key.

```bash
HEXPIRE user:1000 60 FIELDS 1 temporary_token   # expire just this one field after 60 seconds
```

```js
await redis.hexpire("user:1000", 60, "FIELDS", 1, "temporary_token");
```

(Available only on sufficiently recent Redis versions — check compatibility before relying on this.)

## Common Interview-Style Questions

- **When would you choose a Redis Hash over storing a JSON-serialized string?**
  When you need to read or update individual fields independently — a Hash allows direct field-level access (`HGET`/`HSET`/`HINCRBY`) without the read-modify-write cycle a JSON string requires, and is more memory-efficient for small, flat objects.

- **What's a limitation of Redis Hashes compared to JSON?**
  Hashes are flat — field values are always strings, with no native support for nested objects or arrays within a single hash field, unlike JSON which naturally supports arbitrary nesting.

- **How would you atomically increment a single field within a hash?**
  `HINCRBY key field increment` (or `HINCRBYFLOAT` for non-integer increments) — atomic at the server level, safe under concurrent access.

- **How would you model a shopping cart using a Redis Hash?**
  Use one hash per user (`cart:{userId}`), with each field being a product ID and its value the quantity — allowing independent add/update/remove operations per product without touching the rest of the cart.

- **What does `HGETALL` return if the key doesn't exist?**
  An empty object/hash (`{}`), not an error or `null` — application code should check for emptiness explicitly to distinguish "no data" from "data with all-empty values."
