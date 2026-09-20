# 11. Distributed Lock

## What is a Distributed Lock?

A distributed lock coordinates access to a shared resource across multiple processes/servers, ensuring only one of them can perform a critical operation at a time — the distributed-systems equivalent of a mutex, needed because a normal in-process lock only protects against concurrency within a single process, not across multiple servers.

## Why Redis for Distributed Locks?

Redis's atomic `SET ... NX` operation (set only if the key doesn't already exist) is the fundamental building block — it lets multiple clients race to "claim" a lock, with Redis guaranteeing only one wins, atomically.

## Basic Lock — `SET NX EX`

```js
async function acquireLock(resource, ttlSeconds) {
  const lockValue = crypto.randomUUID(); // unique token identifying THIS lock holder
  const acquired = await redis.set(
    `lock:${resource}`,
    lockValue,
    "NX",
    "EX",
    ttlSeconds,
  );
  return acquired === "OK" ? lockValue : null;
}

async function releaseLock(resource, lockValue) {
  await redis.del(`lock:${resource}`);
}
```

```js
const lockValue = await acquireLock("inventory:product123", 10);
if (lockValue) {
  try {
    // critical section — only one process can be here at a time for this resource
    await updateInventory("product123");
  } finally {
    await releaseLock("inventory:product123", lockValue);
  }
} else {
  console.log(
    "Could not acquire lock — another process is already handling this resource",
  );
}
```

## Why the TTL Matters

Without a TTL, a lock held by a process that crashes (or hangs) before releasing it would remain locked **forever**, permanently blocking that resource. The TTL guarantees the lock eventually expires even if the holder never explicitly releases it — a critical safety net for distributed systems where partial failures are inevitable.

```js
await redis.set(`lock:${resource}`, lockValue, "NX", "EX", 10); // auto-releases after 10s even if the process crashes
```

## The Critical Bug: Releasing Someone Else's Lock

A naive `DEL` on release doesn't verify you're actually the current lock holder — if your lock expired (TTL ran out) while you were still working, and another process acquired it in the meantime, your late `DEL` call would incorrectly release **their** lock.

```js
// DANGEROUS — doesn't check ownership before deleting
async function releaseLockUnsafe(resource) {
  await redis.del(`lock:${resource}`); // could delete a DIFFERENT process's lock!
}
```

### Fix: Verify Ownership Before Releasing (Using a Lua Script for Atomicity)

```js
const releaseLockScript = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
`;

async function releaseLockSafe(resource, lockValue) {
  const result = await redis.eval(
    releaseLockScript,
    1,
    `lock:${resource}`,
    lockValue,
  );
  return result === 1; // true if this process actually held (and released) the lock
}
```

A Lua script is necessary here (rather than a plain `GET` then `DEL` from application code) because those two steps need to be **atomic** — otherwise there's a race window between checking ownership and deleting where another process could acquire the lock in between.

## Full Safe Lock Pattern

```js
const crypto = require("crypto");

async function withLock(resource, ttlSeconds, fn) {
  const lockValue = crypto.randomUUID();
  const acquired = await redis.set(
    `lock:${resource}`,
    lockValue,
    "NX",
    "EX",
    ttlSeconds,
  );

  if (acquired !== "OK") {
    throw new Error(`Could not acquire lock for ${resource}`);
  }

  try {
    return await fn();
  } finally {
    await releaseLockSafe(resource, lockValue); // only releases if we still own it
  }
}

// Usage
await withLock("order:checkout:user123", 10, async () => {
  await processCheckout(userId);
});
```

## Retry Logic for Lock Acquisition

```js
async function acquireLockWithRetry(
  resource,
  ttlSeconds,
  maxRetries = 5,
  retryDelayMs = 100,
) {
  const lockValue = crypto.randomUUID();

  for (let i = 0; i < maxRetries; i++) {
    const acquired = await redis.set(
      `lock:${resource}`,
      lockValue,
      "NX",
      "EX",
      ttlSeconds,
    );
    if (acquired === "OK") return lockValue;

    await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (i + 1))); // simple backoff
  }

  return null; // gave up after max retries
}
```

## Lock Extension ("Watchdog" Pattern) for Long-Running Operations

If a critical section might take longer than the lock's TTL, periodically extend ("heartbeat") the lock while the work is still in progress.

```js
const extendLockScript = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("EXPIRE", KEYS[1], ARGV[2])
else
  return 0
end
`;

function startLockWatchdog(resource, lockValue, ttlSeconds) {
  const interval = setInterval(
    async () => {
      await redis.eval(
        extendLockScript,
        1,
        `lock:${resource}`,
        lockValue,
        ttlSeconds,
      );
    },
    (ttlSeconds * 1000) / 2,
  ); // extend at roughly half the TTL interval

  return () => clearInterval(interval); // call this to stop the watchdog when done
}
```

## Redlock — Redis's Official Algorithm for Robust Distributed Locking

For higher-stakes use cases, a single Redis instance is a single point of failure — if it crashes right after granting a lock but before that's replicated, a failover could result in a new primary that doesn't know about the lock, allowing a second client to acquire it too. **Redlock** addresses this by acquiring the lock across **multiple independent Redis instances**, requiring a majority to agree.

```bash
npm install redlock
```

```js
const Redlock = require("redlock").default;
const Redis = require("ioredis");

const redisInstances = [
  new Redis({ host: "redis1" }),
  new Redis({ host: "redis2" }),
  new Redis({ host: "redis3" }),
];

const redlock = new Redlock(redisInstances, {
  retryCount: 3,
  retryDelay: 200,
});

async function criticalSection(resource) {
  const lock = await redlock.acquire([`lock:${resource}`], 10000); // 10 second TTL

  try {
    await doCriticalWork();
  } finally {
    await lock.release();
  }
}
```

> Redlock's correctness under all failure scenarios has been a subject of genuine debate among distributed systems experts (notably Martin Kleppmann's critique versus Redis's response). For most applications, a single well-configured Redis instance (or a properly-replicated Redis Sentinel/Cluster setup) with the safe ownership-verified lock pattern is sufficient — reach for full Redlock only when the cost of a rare lock-safety violation is genuinely severe (e.g., financial transactions).

## Common Practical Use Cases for Distributed Locks

| Use Case                                                                      | Why a Lock Is Needed                                                                    |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Preventing duplicate scheduled job execution across multiple worker instances | Only one worker should run a given cron-like job at a time                              |
| Inventory/stock deduction                                                     | Prevent overselling when multiple requests try to purchase the last item simultaneously |
| Leader election                                                               | Ensure only one instance performs a particular coordinating role at a time              |
| Idempotent webhook processing                                                 | Prevent the same webhook event from being processed twice concurrently                  |

## Common Interview-Style Questions

- **What Redis command forms the foundation of a basic distributed lock, and why?**
  `SET key value NX EX ttl` — the `NX` flag ensures only one client can successfully set the key if it doesn't already exist (atomically, at the server level), effectively "claiming" the lock; `EX` attaches a TTL so the lock is never held forever.

- **Why is a TTL essential for a distributed lock?**
  Without it, a process that crashes or hangs while holding the lock would leave it locked permanently, since nothing would ever call the release; a TTL guarantees the lock eventually expires and becomes available again even after an unexpected failure.

- **What's the bug in releasing a lock with a plain `DEL`, and how do you fix it?**
  A plain `DEL` doesn't verify the caller actually still owns the lock — if the TTL expired and another process acquired it in the meantime, an unconditional `DEL` could delete that other process's lock; the fix is to store a unique token as the lock's value and only delete it if the current value still matches that token, done atomically via a Lua script (since a separate GET-then-DEL from application code would itself introduce a race condition).

- **What problem does Redlock solve that a single-instance lock doesn't?**
  It addresses the risk of a single Redis instance being a point of failure — if that instance crashes right after granting a lock but before replicating the change, a failover could allow a second client to acquire the "same" lock on the new primary; Redlock requires acquiring the lock across a majority of multiple independent Redis instances to guard against this.

- **How would you handle a critical section that might run longer than your lock's TTL?**
  Use a "watchdog"/heartbeat pattern — periodically extend the lock's TTL (atomically verifying ownership first) while the work is still in progress, stopping once the work completes.
