# 06. Sorted Sets

## What Are Redis Sorted Sets (ZSets)?

A Sorted Set combines the uniqueness of a Set with an associated **score** for each member, keeping all members automatically ordered by that score. This makes Sorted Sets the go-to structure for leaderboards, priority queues, ranked data, and range-based queries (like "top 10" or "everything between these two values").

## Basic Operations

```bash
ZADD leaderboard 100 "alice"
ZADD leaderboard 85 "bob"
ZADD leaderboard 92 "carol"

ZSCORE leaderboard "alice"        # 100 — get a specific member's score
ZRANK leaderboard "bob"             # rank (0-indexed, ascending order) of a member
ZREVRANK leaderboard "bob"           # rank in descending order
ZCARD leaderboard                     # total number of members
```

```js
await redis.zadd("leaderboard", 100, "alice");
await redis.zadd("leaderboard", 85, "bob");
await redis.zadd("leaderboard", 92, "carol");

const score = await redis.zscore("leaderboard", "alice"); // '100'
const rank = await redis.zrank("leaderboard", "bob"); // ascending rank
```

## Retrieving Ranges

```bash
ZRANGE leaderboard 0 -1                    # all members, ascending score order
ZRANGE leaderboard 0 -1 WITHSCORES          # include scores in the output
ZREVRANGE leaderboard 0 2                    # top 3, descending score order (highest first)
ZREVRANGE leaderboard 0 2 WITHSCORES
```

```js
const top10 = await redis.zrevrange("leaderboard", 0, 9, "WITHSCORES");
```

### Example: Leaderboard — Top N Players

```js
async function getTopPlayers(n) {
  // returns an array like ['alice', '100', 'carol', '92', 'bob', '85']
  const results = await redis.zrevrange("leaderboard", 0, n - 1, "WITHSCORES");

  const players = [];
  for (let i = 0; i < results.length; i += 2) {
    players.push({ name: results[i], score: Number(results[i + 1]) });
  }
  return players;
}
```

## Updating Scores

```bash
ZINCRBY leaderboard 10 "alice"    # add 10 to alice's current score (atomic)
```

```js
await redis.zincrby("leaderboard", 10, "alice");
```

### Example: Real-Time Score Update

```js
async function addPoints(playerId, points) {
  const newScore = await redis.zincrby("leaderboard", points, playerId);
  return Number(newScore);
}
```

## Getting a Player's Rank and Score Together (Common Leaderboard Pattern)

```js
async function getPlayerStanding(playerId) {
  const [rank, score] = await Promise.all([
    redis.zrevrank("leaderboard", playerId), // 0-indexed rank, highest score = rank 0
    redis.zscore("leaderboard", playerId),
  ]);
  return {
    rank: rank !== null ? rank + 1 : null,
    score: score ? Number(score) : null,
  }; // convert to 1-indexed for display
}
```

## Range Queries by Score

```bash
ZRANGEBYSCORE leaderboard 90 100              # members with scores between 90 and 100 (inclusive)
ZRANGEBYSCORE leaderboard "(90" 100             # exclusive lower bound (score > 90)
ZCOUNT leaderboard 90 100                        # count of members in that score range, without retrieving them
```

```js
const midRange = await redis.zrangebyscore("leaderboard", 90, 100);
const count = await redis.zcount("leaderboard", 90, 100);
```

## Removing Members

```bash
ZREM leaderboard "bob"                    # remove a specific member
ZREMRANGEBYRANK leaderboard 0 2             # remove the bottom 3 by rank
ZREMRANGEBYSCORE leaderboard 0 50            # remove all members with score <= 50
```

## Lexicographical Range Queries (Same Score — Alphabetical Ordering)

When all members share the same score, `ZRANGEBYLEX` enables alphabetical range queries — useful for building features like autocomplete.

```bash
ZADD autocomplete 0 "apple" 0 "app" 0 "application" 0 "banana"
ZRANGEBYLEX autocomplete "[app" "[appz"    # all entries starting with "app"
```

```js
const suggestions = await redis.zrangebylex("autocomplete", "[app", "[appz");
```

## Practical Use Case 1: Gaming Leaderboard

```js
async function updateScore(playerId, points) {
  await redis.zincrby("game:leaderboard", points, playerId);
}

async function getLeaderboard(limit = 10) {
  const raw = await redis.zrevrange(
    "game:leaderboard",
    0,
    limit - 1,
    "WITHSCORES",
  );
  const result = [];
  for (let i = 0; i < raw.length; i += 2) {
    result.push({ playerId: raw[i], score: Number(raw[i + 1]) });
  }
  return result;
}
```

## Practical Use Case 2: Priority Queue

Lower score = higher priority (processed first) is a common convention.

```js
async function addJob(jobId, priority) {
  await redis.zadd("job_priority_queue", priority, jobId);
}

async function getNextJob() {
  const result = await redis.zpopmin("job_priority_queue"); // atomically removes and returns the LOWEST-scored member
  return result.length ? result[0] : null;
}
```

```bash
ZPOPMIN job_priority_queue     # remove and return the member with the LOWEST score
ZPOPMAX job_priority_queue      # remove and return the member with the HIGHEST score
```

## Practical Use Case 3: Rate Limiting (Sliding Window Log)

Sorted Sets are a common building block for a precise sliding-window rate limiter, using timestamps as scores.

```js
async function isAllowed(userId, limit, windowSeconds) {
  const key = `ratelimit:${userId}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  await redis.zremrangebyscore(key, 0, windowStart); // drop requests outside the window
  const count = await redis.zcard(key);

  if (count < limit) {
    await redis.zadd(key, now, `${now}-${Math.random()}`); // unique member per request
    await redis.expire(key, windowSeconds);
    return true;
  }
  return false;
}
```

(Full detail and alternative rate-limiting algorithms in the dedicated Rate Limiting notes.)

## Practical Use Case 4: Time-Decayed / Trending Content

```js
async function recordVote(postId) {
  const score = Date.now(); // newer posts naturally rank higher with a timestamp-based score
  await redis.zadd("trending_posts", score, postId);
}

async function getTrending(limit = 10) {
  return redis.zrevrange("trending_posts", 0, limit - 1);
}
```

## Sorted Sets vs Sets vs Lists

|                                | Set              | List                  | Sorted Set                                             |
| ------------------------------ | ---------------- | --------------------- | ------------------------------------------------------ |
| Ordered?                       | No               | Yes (insertion order) | Yes (by score)                                         |
| Unique members?                | Yes              | No                    | Yes                                                    |
| Ranking/range queries by value | No               | No                    | Yes — the key differentiator                           |
| Best for                       | Membership, tags | Queues, feeds         | Leaderboards, priority queues, ranked/time-series data |

## Common Interview-Style Questions

- **What makes a Sorted Set different from a regular Set?**
  Every member in a Sorted Set has an associated numeric score, and Redis automatically maintains members in score order — enabling efficient rank/range queries that a plain Set (unordered) can't support.

- **How would you build a real-time leaderboard showing the top 10 players?**
  Use `ZINCRBY`/`ZADD` to update scores as events occur, and `ZREVRANGE leaderboard 0 9 WITHSCORES` to retrieve the top 10 players in descending score order.

- **How would you find a specific player's current rank on a leaderboard efficiently?**
  `ZREVRANK leaderboard playerId` — Redis's sorted set implementation (a skip list internally) supports this in logarithmic time, far more efficient than manually sorting all entries.

- **How can Sorted Sets be used to implement a priority queue?**
  Use the score as the priority value; `ZADD` to enqueue with a priority, and `ZPOPMIN` (or `ZPOPMAX`, depending on convention) to atomically dequeue the highest-priority item.

- **How can Sorted Sets support a sliding-window rate limiter?**
  Store each request as a member with its timestamp as the score; on each check, remove entries older than the window (`ZREMRANGEBYSCORE`), then count remaining entries (`ZCARD`) against the limit — giving a precise, per-request sliding window rather than a coarser fixed-window counter.
