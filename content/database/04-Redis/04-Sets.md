# 04. Sets

## What Are Redis Sets?

A Redis Set is an unordered collection of **unique** strings. Sets automatically prevent duplicates and provide extremely fast membership checks (`O(1)`), plus efficient set-algebra operations (union, intersection, difference) — ideal for tags, unique visitor tracking, and relationship modeling.

## Basic Operations

```bash
SADD tags "redis" "database" "nosql"
SADD tags "redis"                       # no-op — already exists, set stays the same
SMEMBERS tags                            # get all members
SCARD tags                                # count of members (set cardinality)
SISMEMBER tags "redis"                     # 1 if present, 0 if not
SREM tags "nosql"                           # remove a member
```

```js
await redis.sadd("tags", "redis", "database", "nosql");
const members = await redis.smembers("tags");
const count = await redis.scard("tags");
const isMember = await redis.sismember("tags", "redis"); // 1 or 0
await redis.srem("tags", "nosql");
```

## Checking Multiple Members at Once

```bash
SMISMEMBER tags "redis" "mongodb"   # [1, 0] — checks multiple values in one call
```

```js
const results = await redis.smismember("tags", "redis", "mongodb"); // [1, 0]
```

## Set Algebra — Union, Intersection, Difference

```bash
SADD set1 "a" "b" "c"
SADD set2 "b" "c" "d"

SUNION set1 set2         # ["a", "b", "c", "d"] — all unique members from both
SINTER set1 set2          # ["b", "c"] — members present in BOTH sets
SDIFF set1 set2            # ["a"] — members in set1 but NOT in set2
```

```js
const union = await redis.sunion("set1", "set2");
const intersection = await redis.sinter("set1", "set2");
const difference = await redis.sdiff("set1", "set2");
```

### Storing the Result of a Set Operation

```bash
SUNIONSTORE result_key set1 set2       # store the union result under a new key
SINTERSTORE result_key set1 set2
SDIFFSTORE result_key set1 set2
```

## Practical Use Case 1: Tags/Categories

```js
async function addTagsToPost(postId, tags) {
  await redis.sadd(`post:${postId}:tags`, ...tags);
}

async function getPostTags(postId) {
  return redis.smembers(`post:${postId}:tags`);
}

async function findPostsWithAllTags(postIds, requiredTags) {
  // find posts whose tag set contains ALL required tags
  // (illustrative — in practice you'd typically maintain a reverse index: tag -> posts)
}
```

## Practical Use Case 2: Unique Visitor Tracking

```js
async function trackVisitor(pageId, userId) {
  await redis.sadd(`page:${pageId}:visitors`, userId);
}

async function getUniqueVisitorCount(pageId) {
  return redis.scard(`page:${pageId}:visitors`); // count of DISTINCT visitors, duplicates ignored automatically
}
```

## Practical Use Case 3: Social Graph — Mutual Friends

```js
async function getMutualFriends(userIdA, userIdB) {
  return redis.sinter(`user:${userIdA}:friends`, `user:${userIdB}:friends`);
}

async function getFriendSuggestions(userId) {
  // friends of friends, minus people already friends with, minus the user themself
  const friends = await redis.smembers(`user:${userId}:friends`);
  // ... combine with SDIFF against existing friends for suggestions
}
```

## Practical Use Case 4: Feature Flags / A-B Test Groups

```js
async function assignToTestGroup(userId, groupName) {
  await redis.sadd(`test_group:${groupName}`, userId);
}

async function isInTestGroup(userId, groupName) {
  return redis.sismember(`test_group:${groupName}`, userId);
}
```

## Random Member Operations

```bash
SRANDMEMBER tags          # get a random member, WITHOUT removing it
SRANDMEMBER tags 3          # get 3 distinct random members
SPOP tags                    # get a random member AND remove it atomically
SPOP tags 2                    # pop 2 random members
```

```js
const randomTag = await redis.srandmember("tags");
const removedRandom = await redis.spop("tags"); // useful for things like random prize draws, shuffled selection
```

### Example: Random Prize Draw (Guaranteed No Duplicates)

```js
async function pickRandomWinners(participantSetKey, count) {
  return redis.spop(participantSetKey, count); // atomically removes and returns `count` distinct random members
}
```

## Iterating Large Sets Safely — `SSCAN`

Just like `KEYS` vs `SCAN` at the top level, avoid `SMEMBERS` on extremely large sets in production (it returns everything at once, potentially blocking); use `SSCAN` to iterate incrementally.

```bash
SSCAN tags 0 MATCH "re*" COUNT 100
```

## Sets vs Lists — When to Use Which

|                        | Set                                            | List                          |
| ---------------------- | ---------------------------------------------- | ----------------------------- |
| Order preserved?       | No                                             | Yes                           |
| Duplicates allowed?    | No — automatically deduplicated                | Yes                           |
| Membership check speed | O(1)                                           | O(N) — must scan              |
| Best for               | Unique collections, tags, relationships, dedup | Queues, stacks, ordered feeds |

## Common Interview-Style Questions

- **What guarantee does a Redis Set provide that a List doesn't?**
  Automatic uniqueness — adding a duplicate value to a Set is a no-op, while a List allows duplicate entries; Sets also provide O(1) membership checks versus O(N) for Lists.

- **How would you find users who are friends with both User A and User B?**
  `SINTER user:A:friends user:B:friends` — Redis's built-in set intersection operation directly computes the mutual friends.

- **How would you count unique visitors to a page without storing every individual visit?**
  Add each visitor's ID to a Set with `SADD` (duplicates are automatically ignored) for that page, then use `SCARD` to get the count of distinct visitors.

- **What's the difference between `SRANDMEMBER` and `SPOP`?**
  `SRANDMEMBER` returns a random member without modifying the set; `SPOP` returns a random member and atomically removes it from the set — useful for tasks like drawing distinct random winners without duplicates.

- **Why avoid `SMEMBERS` on a very large set in a production hot path?**
  It returns the entire set's contents in one call, which can be slow and memory-intensive for very large sets, and could momentarily block other operations; `SSCAN` iterates incrementally instead, similar to how `SCAN` replaces `KEYS` for iterating the overall keyspace.
