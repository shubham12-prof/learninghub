# Redis Cluster

Used here as the canonical concrete example of a real distributed cache
implementation — most interviewers are happy with Redis Cluster as the
running example, since it's widely used and its design decisions are well
documented and instructive.

## Partitioning: hash slots, not a pure hash ring

Redis Cluster doesn't use classic consistent hashing directly — instead it
divides the keyspace into **16,384 fixed hash slots**. Every key is
assigned to a slot via `CRC16(key) % 16384`, and each slot is owned by
exactly one node (a **primary**) at a time. Cluster nodes each own a
subset of the 16,384 slots (e.g., in a 3-node cluster, roughly slots
0-5460, 5461-10922, 10923-16383, though the split doesn't have to be even).

This achieves the same goal as consistent hashing (avoiding near-total
remapping on topology changes) via a different, simpler mechanism: since
slot ownership is tracked explicitly (not derived from a hash-ring
walk), adding/removing a node just means **explicitly reassigning a
specific set of slots** to/from it — a controlled, administrator- or
tool-driven operation rather than an automatic ring recalculation. This is
a good point of comparison/contrast to bring up if asked how Redis Cluster
relates to the general consistent-hashing concept.

## Hash tags: co-locating related keys

Since a single command generally can't span multiple slots (e.g., Redis
doesn't support multi-key operations across different slots by default),
Redis Cluster supports **hash tags**: if a key contains a substring inside
`{}` (e.g., `user:{1234}:profile` and `user:{1234}:settings`), only that
substring is hashed to determine the slot — letting you deliberately force
related keys onto the same slot/node so multi-key operations on them work.
Worth mentioning as the mechanism for handling the "how do you do
multi-key transactions in a sharded cache" follow-up question.

## Client request routing

- A client can send a command to **any** node in the cluster; if that node
  doesn't own the relevant slot, it responds with a `MOVED` redirect
  pointing the client to the correct node.
- Redis-Cluster-aware clients cache the slot-to-node mapping locally (after
  learning it once) so subsequent requests go directly to the right node,
  avoiding a redirect round-trip on every request — an important
  performance detail, since routing every single request through an extra
  redirect hop would defeat much of the purpose of clustering.
- This differs from a **proxy-based** architecture (used by some other
  distributed cache designs, e.g., Twemproxy in front of plain Redis
  instances), where a proxy layer handles routing and clients don't need
  to be cluster-aware at all — a good contrast to mention: client-side
  routing (Redis Cluster's native approach) avoids a proxy hop and single
  point of failure, at the cost of requiring cluster-aware client
  libraries.

## Cluster topology & gossip

- Nodes communicate cluster state (which nodes exist, which slots they
  own, node health) via a **gossip protocol** over a dedicated cluster bus
  port, rather than relying on a separate external coordination service —
  each node maintains its own view of the cluster and propagates updates
  to others.
- This decentralized approach avoids a single external dependency (like
  ZooKeeper in some other distributed systems) for cluster membership, at
  the cost of eventual (not instant) consistency in each node's view of
  cluster state during topology changes.

## Resharding / adding-removing nodes

- Adding a node: some slots are explicitly migrated to it from existing
  nodes (via `CLUSTER SETSLOT` and key migration commands), typically
  orchestrated by an admin tool (e.g., `redis-cli --cluster reshard`)
  rather than happening fully automatically — worth noting this is a more
  operationally hands-on process than "just add a node and it
  auto-balances instantly."
- During migration, a slot can be in a transitional state
  (`MIGRATING`/`IMPORTING`) where the source and destination node
  coordinate so client requests for keys mid-migration are still served
  correctly (checked on the source first, then redirected if already
  moved) — a detail worth knowing if asked how consistency is maintained
  during rebalancing.

## Interview-relevant talking points

- Be ready to explain the hash-slot model (16,384 fixed slots) as a
  distinct-but-related mechanism to classic consistent hashing — many
  candidates conflate them; showing you know the actual difference is a
  strong signal.
- Bring up hash tags proactively if multi-key operations come up — a
  common, natural follow-up in a sharded-cache design.
- Contrast client-side routing (Redis Cluster) with proxy-based routing
  (other systems) explicitly if asked about routing architecture options.
