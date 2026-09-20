# 03. Lists

## What Are Redis Lists?

A Redis List is an ordered collection of strings, implemented internally as a linked list — optimized for fast insertion/removal at **both ends** (head and tail), making it ideal for queues, stacks, and recent-activity feeds.

## Basic Operations

```bash
LPUSH mylist "a"          # push to the LEFT (head)
RPUSH mylist "b"          # push to the RIGHT (tail)
LRANGE mylist 0 -1          # get all elements (0 to -1 = entire list)
LLEN mylist                  # get list length
```

```js
await redis.lpush("mylist", "a");
await redis.rpush("mylist", "b");
const all = await redis.lrange("mylist", 0, -1);
const length = await redis.llen("mylist");
```

## Popping Elements

```bash
LPOP mylist          # remove and return the LEFT-most (first) element
RPOP mylist           # remove and return the RIGHT-most (last) element
LPOP mylist 2          # pop multiple elements at once
```

```js
const first = await redis.lpop("mylist");
const last = await redis.rpop("mylist");
```

## Implementing a Queue (FIFO)

Push to one end, pop from the other — First In, First Out.

```js
// Producer: add a job to the queue
async function enqueueJob(job) {
  await redis.rpush("job_queue", JSON.stringify(job));
}

// Consumer: process jobs in the order they were added
async function dequeueJob() {
  const jobData = await redis.lpop("job_queue");
  return jobData ? JSON.parse(jobData) : null;
}
```

## Implementing a Stack (LIFO)

Push and pop from the same end — Last In, First Out.

```js
async function pushToStack(item) {
  await redis.lpush("my_stack", JSON.stringify(item));
}

async function popFromStack() {
  const item = await redis.lpop("my_stack");
  return item ? JSON.parse(item) : null;
}
```

## Blocking Pop — `BLPOP` / `BRPOP` (Building a Real Job Queue Worker)

Instead of polling repeatedly for new items, a worker can block until an item becomes available — much more efficient than a polling loop.

```bash
BLPOP job_queue 0    # block indefinitely (0 = no timeout) until an item is available
BLPOP job_queue 5     # block for up to 5 seconds, then return nil if nothing arrives
```

```js
async function workerLoop() {
  while (true) {
    const result = await redis.blpop("job_queue", 0); // blocks until a job arrives
    const [queueName, jobData] = result;
    const job = JSON.parse(jobData);
    await processJob(job);
  }
}
```

This pattern is the foundation of many simple Redis-backed job queue libraries (like Bull/BullMQ, which build much more robust functionality — retries, delayed jobs, concurrency — on top of these primitives).

## Capped Lists — Keeping Only the Most Recent N Items

```bash
LPUSH recent_activity "user logged in"
LTRIM recent_activity 0 99   # keep only the most recent 100 items, discard the rest
```

```js
async function logActivity(message) {
  await redis.lpush("recent_activity", message);
  await redis.ltrim("recent_activity", 0, 99); // cap at 100 most recent entries
}
```

### Example: Recent Activity Feed

```js
async function addToFeed(userId, activity) {
  const key = `feed:${userId}`;
  await redis.lpush(
    key,
    JSON.stringify({ ...activity, timestamp: Date.now() }),
  );
  await redis.ltrim(key, 0, 49); // keep only the 50 most recent activities
}

async function getFeed(userId) {
  const key = `feed:${userId}`;
  const items = await redis.lrange(key, 0, -1);
  return items.map(JSON.parse);
}
```

## Inserting at Arbitrary Positions

```bash
LINSERT mylist BEFORE "b" "new_item"   # insert "new_item" right before the first occurrence of "b"
LINSERT mylist AFTER "b" "new_item"
```

## Accessing/Modifying by Index

```bash
LINDEX mylist 0      # get the element at index 0
LSET mylist 0 "updated_value"  # replace the element at a specific index
```

```js
const first = await redis.lindex("mylist", 0);
await redis.lset("mylist", 0, "updated_value");
```

## Removing Specific Values

```bash
LREM mylist 1 "b"      # remove the first occurrence of "b" (count=1, searching head to tail)
LREM mylist -1 "b"      # remove the last occurrence (negative count searches tail to head)
LREM mylist 0 "b"        # remove ALL occurrences of "b"
```

## Moving Elements Between Lists

```bash
RPOPLPUSH source destination   # atomically pop from the tail of source, push to the head of destination
LMOVE source destination LEFT RIGHT  # more general/modern version, specify both ends explicitly
```

Useful for reliable queue processing patterns — move a job to a "processing" list atomically so it isn't lost if a worker crashes mid-processing.

```js
async function reliableDequeue() {
  // Atomically move from "pending" queue to "processing" list
  const jobData = await redis.rpoplpush(
    "job_queue:pending",
    "job_queue:processing",
  );
  if (!jobData) return null;

  const job = JSON.parse(jobData);
  try {
    await processJob(job);
    await redis.lrem("job_queue:processing", 1, jobData); // remove once successfully processed
  } catch (err) {
    // job remains in "processing" list — can be recovered/retried by a monitoring process
    throw err;
  }
  return job;
}
```

## Common List Use Cases

| Use Case                  | Pattern                                                  |
| ------------------------- | -------------------------------------------------------- |
| Simple job queue          | `RPUSH` (producer) + `LPOP`/`BLPOP` (consumer)           |
| Recent activity feed      | `LPUSH` + `LTRIM` to cap length                          |
| Undo history / stack      | `LPUSH` + `LPOP` (same end)                              |
| Reliable queue processing | `RPOPLPUSH`/`LMOVE` between pending and processing lists |

## Performance Characteristics

- `LPUSH`/`RPUSH`/`LPOP`/`RPOP` (operations at the ends) are **O(1)** — very fast regardless of list size.
- `LINDEX`/`LINSERT`/`LSET` at an arbitrary position, and `LRANGE` over a large range, are **O(N)** — avoid using lists as a substitute for random-access arrays at scale; they're optimized for the two ends.

## Common Interview-Style Questions

- **Why are Redis Lists well-suited for implementing queues and stacks?**
  They're implemented as linked lists internally, offering O(1) push/pop operations at both ends — a queue uses opposite ends (`RPUSH`/`LPOP`), a stack uses the same end (`LPUSH`/`LPOP`).

- **What's the advantage of `BLPOP` over a polling loop that repeatedly calls `LPOP`?**
  `BLPOP` blocks the client until an item becomes available (or a timeout elapses), avoiding wasted CPU/network overhead from constantly polling an empty queue.

- **How would you keep a list capped at a fixed maximum size (e.g., only the 100 most recent items)?**
  Push new items, then call `LTRIM` to trim the list down to the desired range (e.g., `LTRIM key 0 99` to keep only the first 100 elements).

- **Why is `RPOPLPUSH`/`LMOVE` useful for building a reliable job queue?**
  It atomically moves an item from one list to another in a single operation, so a job can be moved into a "processing" list without risk of being lost between a separate pop and push — if a worker crashes mid-processing, the job remains recoverable in the processing list rather than disappearing.

- **Why should you avoid using `LINDEX`/`LRANGE` over large ranges as a substitute for random access on very large lists?**
  Unlike operations at the head/tail (O(1)), accessing or scanning arbitrary positions in a Redis List is O(N) — lists are optimized for operations at the two ends, not efficient random access like an array.
