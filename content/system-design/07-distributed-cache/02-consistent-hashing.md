# Consistent Hashing

## The problem it solves

A distributed cache needs to decide, for any given key, which node in the
cluster stores it. The naive approach — `node = hash(key) % N` (where N is
the number of nodes) — works fine until N changes (a node is added or
removed, which happens constantly in practice: scaling, failures, deploys).

**Why naive modulo hashing fails:** changing N changes the result of
`hash(key) % N` for almost _every_ key, not just the keys that need to
move. Adding one node to a 10-node cluster remaps roughly 90% of all keys
to a different node — meaning the cache is almost entirely invalidated
(everything now misses and has to be refetched from the source of truth)
just from one small topology change. This is the specific, concrete
failure mode you should be able to state precisely in an interview.

## The consistent hashing idea

Instead of hashing keys directly onto a fixed range `[0, N)`, map both
**nodes** and **keys** onto the same fixed, large circular hash space
(commonly visualized as a ring, e.g., hash values from 0 to 2^32 - 1):

1. Hash each node's identifier (e.g., its address) to a position on the
   ring.
2. Hash each key the same way, to a position on the ring.
3. A key belongs to the **first node found by walking clockwise** from the
   key's position on the ring.

## Why this fixes the remapping problem

When a node is added or removed, only the keys that fall between that
node's ring position and its predecessor's need to move — **not the entire
keyspace**. Adding a node to an N-node cluster remaps roughly `1/N` of the
keys (specifically, the portion previously owned by its immediate
neighbor), regardless of how large N is. This dramatically reduces cache
churn on topology changes compared to naive modulo hashing — this
comparison (constant/proportional remapping vs. near-total remapping) is
the single most important thing to be able to explain clearly.

## Virtual nodes (the practical refinement)

Plain consistent hashing (one ring position per physical node) has two
practical problems:

- **Uneven load distribution** — with few physical nodes, their random
  ring positions can be unevenly spaced, so some nodes end up owning a
  much larger arc of the ring (and therefore much more data/traffic) than
  others purely by chance.
- **Uneven redistribution on node changes** — when a node leaves, all of
  its keys go to exactly one neighbor, potentially overloading it.

**Virtual nodes (vnodes)** fix this: each physical node is mapped to many
positions on the ring (e.g., 100-200 virtual points per physical node,
each with a distinct hash), rather than just one. This has two effects:

1. **Smooths out load distribution** — with many points per node spread
   around the ring, the law of large numbers makes each physical node's
   total owned arc converge toward a fair, roughly-equal share.
2. **Spreads redistribution across many nodes** — when a node leaves, its
   many small vnode arcs are scattered around the ring, so its keys get
   redistributed across _many_ other nodes rather than dumped onto one
   neighbor.

## Interview-relevant talking points

- Be ready to state the naive-modulo-hashing failure mode with a concrete
  number (e.g., "adding one node to a 10-node cluster remaps ~90% of
  keys") — specificity here is a strong signal.
- Explain the ring mechanism precisely: hash both nodes and keys onto the
  same space, walk clockwise to find ownership — this is frequently asked
  as a "walk me through it" explanation, sometimes literally on a
  whiteboard/diagram.
- Don't stop at plain consistent hashing — proactively bring up virtual
  nodes as the practical refinement almost every real system uses (Redis
  Cluster included, via a related but distinct hash-slot mechanism — see
  the Redis Cluster note), since plain consistent hashing's uneven-load
  problem is a natural, expected follow-up question.
