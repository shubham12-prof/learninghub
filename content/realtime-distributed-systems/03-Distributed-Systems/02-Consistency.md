# 02. Consistency

## What Does "Consistency" Mean in Distributed Systems?

Consistency describes how up-to-date and agreed-upon data is across multiple nodes/replicas in a distributed system. It's not a single binary property — there's a whole spectrum of consistency models, each offering different guarantees with different performance/availability trade-offs.

> Note: "Consistency" in the CAP theorem context (every read sees the latest write) is a distinct concept from "Consistency" in ACID (a transaction moves the database from one valid state to another, respecting constraints) — these are related but not identical ideas, and this distinction is a common source of confusion.

## Strong Consistency

Every read reflects the most recent completed write, no matter which replica serves the request — as if there were only a single copy of the data.

```
Write X=5 to Node A
Immediately after, read X from Node B -> GUARANTEED to return 5, never stale data
```

**How it's achieved:** typically via synchronous replication (the write isn't acknowledged until all/majority replicas confirm) or by routing all reads/writes through a single node (like a partition leader).

**Trade-off:** higher write latency (must wait for replication to complete/confirm) and reduced availability during network issues (a node that can't confirm it's in sync may need to refuse requests).

```js
// Example: reading with strong consistency guarantee (DynamoDB)
const result = await dynamoDb
  .get({
    TableName: "Orders",
    Key: { orderId: "123" },
    ConsistentRead: true, // forces a strongly consistent read, at higher latency/cost than eventual
  })
  .promise();
```

## Eventual Consistency

Given enough time with no new writes, all replicas will **eventually** converge to the same value — but at any given moment, different replicas might return different (stale) results.

```
Write X=5 to Node A
Immediately after, read X from Node B -> might return the OLD value (e.g., 3) briefly,
                                          until replication catches up
Wait a bit... read X from Node B again -> now returns 5
```

**Trade-off:** much lower latency and higher availability (a node doesn't need to coordinate with others before responding), at the cost of temporarily serving stale data.

```js
// DynamoDB example — eventually consistent read (the default, cheaper option)
const result = await dynamoDb
  .get({
    TableName: "Orders",
    Key: { orderId: "123" },
    // ConsistentRead: false (default)
  })
  .promise();
```

## Causal Consistency

A middle ground: writes that are **causally related** (one happened because of, or after seeing, another) are guaranteed to be seen in that same order by all nodes; unrelated (concurrent) writes may be seen in different orders by different nodes.

```
User posts a comment (write A)
User's friend replies to that comment (write B, causally depends on A)

Causal consistency guarantees: no node will ever show reply B without also showing comment A first
(but two unrelated, concurrent posts by different users might appear in a different order on different nodes)
```

This models real-world intuition well — e.g., you should never see a reply before the message it's replying to, even though strict global ordering of every unrelated event isn't necessary.

## Read-Your-Writes Consistency

A specific, practically important guarantee: after a user makes a write, that same user's subsequent reads will always reflect their own write — even if the underlying system is otherwise only eventually consistent for other users.

```
User updates their profile picture
User immediately refreshes their own profile page -> MUST see the new picture
(even if OTHER users viewing that profile might briefly still see the old picture, due to replication lag)
```

**Common implementation approach:** route a given user's reads to the same replica/region that handled their write (session affinity/stickiness), at least for some time window after the write.

## Monotonic Read Consistency

Once a user has seen a particular value, they will never subsequently see an **older** value on a later read — reads only ever move "forward in time" from that user's perspective, even under eventual consistency.

```
User reads X=5
Later, the same user reads X again -> guaranteed to see 5 or newer, NEVER an older value like 3,
                                       even if a different, less-caught-up replica happens to serve the request
```

Without this guarantee, a user could see data appear to "go backward" if their requests happen to be routed to differently-lagged replicas across successive reads — often jarring/confusing from a UX perspective.

## Comparing Consistency Models

| Model            | Guarantee                                                              | Typical Cost                                                      |
| ---------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Strong           | All reads see the latest write, globally                               | Highest latency, lowest availability during partitions            |
| Eventual         | All replicas converge eventually, no ordering guarantee in between     | Lowest latency, highest availability                              |
| Causal           | Causally-related writes are seen in order; unrelated writes may not be | Moderate — more coordination than pure eventual, less than strong |
| Read-your-writes | A user always sees their own writes immediately                        | Achievable cheaply via session-based routing                      |
| Monotonic reads  | A user's reads never "go backward" in time                             | Achievable via sticky routing to a consistently-caught-up replica |

## Practical Application-Level Patterns

### Choosing Consistency Per-Operation

```js
// Strong consistency for a critical read (e.g., checking current inventory before allowing checkout)
const inventory = await db.read("inventory:productX", {
  consistency: "strong",
});

// Eventual consistency for a less critical read (e.g., a "total views" counter display)
const viewCount = await db.read("views:productX", { consistency: "eventual" });
```

### Implementing Read-Your-Writes with Caching

```js
async function updateUserProfile(userId, updates) {
  await db.update(userId, updates);
  await cache.set(`user:${userId}`, updates, { ttl: 5 }); // short-lived local cache override
  // ensures the NEXT read for this user hits the fresh cached value,
  // even if the underlying replicated store hasn't fully caught up yet
}
```

## Consistency and User Experience Trade-offs

Choosing the right consistency model isn't purely a technical decision — it directly shapes what users experience:

| Scenario                    | Consistency Need                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| Bank account balance        | Strong — showing a stale balance could lead to real financial errors                          |
| Social media "like" count   | Eventual is fine — a slightly outdated count is a non-issue                                   |
| A user's own posted comment | Read-your-writes — the user must see their own comment immediately after posting              |
| Chat message ordering       | Causal — replies should never appear before the message they're replying to                   |
| Search index freshness      | Eventual is typically acceptable — a brief delay before new content appears in search results |

## Common Interview-Style Questions

- **What's the difference between strong consistency and eventual consistency?**
  Strong consistency guarantees every read reflects the most recent write, requiring coordination that adds latency and can reduce availability; eventual consistency allows temporarily stale reads on some replicas, converging to the same value over time, in exchange for lower latency and higher availability.

- **What is causal consistency, and why is it a useful middle ground?**
  It guarantees that writes which are causally related (one happening because of or after another) are seen in the correct order by all nodes, while unrelated concurrent writes have no ordering guarantee — this matches real-world intuition (like never seeing a reply before its original message) without requiring the full cost of strict global ordering for every unrelated event.

- **What is "read-your-writes" consistency, and how is it typically implemented?**
  A guarantee that a user always sees their own writes immediately on subsequent reads, even in an otherwise eventually consistent system; commonly implemented via session affinity (routing a user's reads to the same replica/region that handled their write) or short-lived local caching of the just-written value.

- **Why is "Consistency" in CAP a different concept from "Consistency" in ACID?**
  CAP's consistency refers to whether all nodes see the same (most recent) data at a given time across a distributed system; ACID's consistency refers to a single transaction always moving the database from one valid state to another, respecting defined constraints/invariants — related concerns, but not the same guarantee.

- **Give an example of choosing different consistency levels for different parts of the same application.**
  A banking app might use strong consistency for account balance reads (to avoid financial errors from stale data) while using eventual consistency for a less critical feature like a transaction history "recently viewed" cache, where brief staleness has no meaningful negative impact.
