# 01. Data Structures

## What is Redis?

Redis (**RE**mote **DI**ctionary **S**erver) is an open-source, in-memory data structure store, used as a database, cache, message broker, and streaming engine. Its defining characteristic: data lives primarily in RAM, making reads/writes extremely fast (sub-millisecond typical latency), with optional persistence to disk.

## Why Redis Is Different From a Typical Database

|                 | Traditional DB (PostgreSQL/MongoDB) | Redis                                                               |
| --------------- | ----------------------------------- | ------------------------------------------------------------------- |
| Primary storage | Disk (with caching)                 | RAM (with optional disk persistence)                                |
| Data model      | Tables/documents                    | Rich in-memory data structures (strings, lists, sets, hashes, etc.) |
| Typical use     | System of record                    | Cache, session store, queues, real-time features, rate limiting     |
| Query language  | SQL / query API                     | Simple command-based API per data type                              |
| Latency         | Milliseconds                        | Sub-millisecond typical                                             |

Redis is generally **not** meant to replace your primary database — it complements it, handling scenarios needing extreme speed, ephemeral data, or specific data structure operations that would be awkward/slow in a relational or document database.

## The Core Redis Data Structures — Overview

Redis isn't just a key-value string store; each key can hold one of several distinct data types, each with its own specialized command set:

| Data Structure  | Redis Type                    | Typical Use Cases                                 |
| --------------- | ----------------------------- | ------------------------------------------------- |
| **String**      | `STRING`                      | Caching values, counters, simple key-value data   |
| **List**        | `LIST`                        | Queues, activity feeds, recent items              |
| **Set**         | `SET`                         | Unique collections, tags, membership checks       |
| **Hash**        | `HASH`                        | Objects/records (like a mini row), grouped fields |
| **Sorted Set**  | `ZSET`                        | Leaderboards, priority queues, ranked data        |
| **Stream**      | `STREAM`                      | Event logs, message queues (Kafka-like)           |
| **Bitmap**      | (via `STRING` + bit commands) | Compact boolean flags, analytics                  |
| **HyperLogLog** | `HLL` (via `STRING`)          | Approximate unique counts at massive scale        |
| **Geospatial**  | (via `ZSET` internally)       | Location-based queries                            |

## Connecting to Redis

```bash
redis-cli
```

```bash
redis-cli PING  # -> PONG, confirms the server is reachable
```

### From Node.js

```bash
npm install ioredis
# or
npm install redis
```

```js
// ioredis — commonly preferred, feature-rich client
const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL); // e.g., "redis://localhost:6379"

async function demo() {
  await redis.set("greeting", "hello");
  const value = await redis.get("greeting");
  console.log(value); // 'hello'
}
```

```js
// node-redis — the official client, also widely used
const { createClient } = require("redis");
const client = createClient({ url: process.env.REDIS_URL });
await client.connect();

await client.set("greeting", "hello");
const value = await client.get("greeting");
```

## Basic Key Operations (Apply Across All Data Types)

```bash
SET key value          # (string-specific, shown for reference)
EXISTS key              # 1 if the key exists, 0 otherwise
DEL key                 # delete a key
EXPIRE key seconds       # set a TTL (time-to-live) on a key
TTL key                  # check remaining TTL in seconds (-1 = no expiry, -2 = key doesn't exist)
PERSIST key               # remove a TTL, making the key permanent again
TYPE key                  # returns the data type stored at a key (string, list, set, hash, zset, ...)
KEYS pattern               # find keys matching a pattern (AVOID in production — see below)
SCAN cursor                 # safe, incremental way to iterate keys in production
RENAME key newkey            # rename a key
```

## Why `KEYS *` Is Dangerous in Production

```bash
KEYS *          # BLOCKS the entire Redis server while it scans all keys — O(N) operation
```

Redis is single-threaded for command execution — a long-running `KEYS` command on a large dataset blocks every other client until it finishes. Use `SCAN` instead, which iterates incrementally without blocking.

```bash
SCAN 0 MATCH user:* COUNT 100
```

```js
// Iterating safely with ioredis
const stream = redis.scanStream({ match: "user:*", count: 100 });
stream.on("data", (keys) => console.log(keys));
stream.on("end", () => console.log("done"));
```

## Key Naming Conventions

Redis has no built-in namespacing, so a consistent naming convention (colon-delimited hierarchy) is the community standard:

```
user:1000
user:1000:profile
session:abc123
cache:products:category:shoes
ratelimit:login:192.168.1.1
```

## Persistence Options (Since Redis Is Primarily In-Memory)

| Method                                            | Description                                                                                  |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **RDB** (snapshotting)                            | Periodic point-in-time snapshots of the dataset saved to disk                                |
| **AOF** (Append-Only File)                        | Logs every write operation, replayed on restart — more durable, larger files                 |
| **Both (recommended for most production setups)** | Combines RDB's fast restarts with AOF's stronger durability guarantees                       |
| **No persistence**                                | Pure in-memory cache — data lost entirely on restart (acceptable for pure caching use cases) |

```bash
# redis.conf snippets
save 900 1        # RDB: save if at least 1 key changed in 900 seconds
appendonly yes      # enable AOF
```

## Memory Management

Since Redis holds data in RAM, memory is a finite, valuable resource requiring active management.

```bash
CONFIG SET maxmemory 256mb
CONFIG SET maxmemory-policy allkeys-lru  # eviction policy when memory limit is reached
```

| Eviction Policy  | Behavior                                                               |
| ---------------- | ---------------------------------------------------------------------- |
| `noeviction`     | Returns errors on writes once memory is full — no automatic eviction   |
| `allkeys-lru`    | Evicts the least-recently-used key across all keys                     |
| `volatile-lru`   | Evicts the least-recently-used key, but only among keys with a TTL set |
| `allkeys-random` | Evicts a random key                                                    |
| `volatile-ttl`   | Evicts the key with the shortest remaining TTL first                   |

For a pure cache use case, `allkeys-lru` or `volatile-lru` is typical; for a data store where losing data unexpectedly would be a real problem, `noeviction` (paired with proper capacity planning/monitoring) is safer.

## Common Interview-Style Questions

- **What makes Redis fundamentally different from a traditional database?**
  Redis stores data primarily in RAM rather than on disk, trading some durability/complexity guarantees for extremely low latency; it's typically used to complement a primary database (as a cache, session store, queue, etc.) rather than replace it entirely.

- **What are the core Redis data structures, and why does having multiple types matter?**
  Strings, Lists, Sets, Hashes, Sorted Sets, Streams, and more specialized types (Bitmaps, HyperLogLog, Geospatial) — having purpose-built structures lets you model problems (queues, leaderboards, unique counting, rate limiting) far more efficiently than forcing everything into plain key-value strings.

- **Why is `KEYS *` discouraged in production, and what should you use instead?**
  Redis is single-threaded for command execution, so `KEYS` blocks the entire server for the duration of its O(N) scan across all keys; `SCAN` iterates incrementally in small batches without blocking other clients.

- **What's the difference between RDB and AOF persistence?**
  RDB takes periodic point-in-time snapshots of the dataset (faster restarts, but can lose recent writes since the last snapshot); AOF logs every write operation and replays them on restart (stronger durability, larger file size, slightly slower restart time). Many production setups use both together.

- **What happens when Redis reaches its configured `maxmemory` limit?**
  Behavior depends on the configured eviction policy — it can reject further writes (`noeviction`), evict least-recently-used keys (`allkeys-lru`/`volatile-lru`), evict randomly, or evict based on shortest remaining TTL, depending on the use case's tolerance for data loss.
