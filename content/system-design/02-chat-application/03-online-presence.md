# Online Presence

## What presence means

Tracking and broadcasting whether a user is online, offline, or in some
other state (away, "last seen 5 minutes ago"), and notifying the relevant
other users (contacts, conversation members) when that status changes.

## Where presence state lives

- Presence is **highly volatile, frequently-updated state** — a poor fit
  for a traditional database as the primary store, given the write volume
  (every connect/disconnect/heartbeat is a state change) and the fact that
  it's inherently ephemeral (a stale row doesn't matter much once the user
  reconnects).
- Standard approach: keep presence state in an **in-memory store** (Redis
  is a very common choice) as `user_id → {status, last_seen, gateway_id}`,
  with a **TTL** — the entry expires automatically if not refreshed,
  naturally handling the case where a client disconnects ungracefully
  (crash, network drop) without an explicit "I'm going offline" message.

## Detecting online/offline transitions

1. **On connect:** the WebSocket gateway sets `user_id → online` in the
   presence store (with a TTL) when a client establishes a connection.
2. **Heartbeats:** the client periodically sends a small heartbeat/ping
   over the WebSocket; each heartbeat refreshes the TTL. If heartbeats stop
   (network drop, app killed) the TTL expires and the user is treated as
   offline — this is more reliable than waiting for a clean disconnect
   event, which doesn't always arrive.
3. **On explicit disconnect:** the gateway immediately marks the user
   offline rather than waiting for the TTL to expire, for a snappier UX.

## Broadcasting presence changes

When a user's status changes, who needs to know?

- Naively broadcasting to _everyone_ the user has ever talked to doesn't
  scale for users with large contact/friend lists.
- Common approach: only notify users who are **currently viewing a
  relevant screen** — e.g., contacts who have that user's conversation
  open, or who are looking at a shared "online now" list — using the same
  connection-registry + pub/sub mechanism described in the WebSockets note,
  rather than pushing to the entire contact list unconditionally.
- Alternative/complementary approach: **pull-based presence** — instead of
  proactively pushing every status change, let clients query "is this user
  online?" when they actually need to know (e.g., when opening a
  conversation), reducing the push fan-out cost at the expense of slightly
  staler information until the next query.

## Presence at scale

- With a large user base, presence updates can be very high-frequency in
  aggregate (many users connecting/disconnecting/heartbeating constantly).
  Keeping this entirely in a fast in-memory store (rather than the primary
  durable database) is what makes this tractable — presence data doesn't
  need durability guarantees the way messages do.
- Sharding the presence store by `user_id` (similar to other systems in
  this space) distributes this load.

## "Last seen" semantics

- On going offline, record a `last_seen_at` timestamp (this one _can_ live
  in a more durable store, or just persist the last value before the TTL
  entry expires) so the UI can show "last seen 5 minutes ago" instead of
  just "offline."
- Many products let users opt out of sharing last-seen/online status — a
  privacy consideration worth mentioning if the interview goes there.

## Interview-relevant talking points

- Justify why presence lives in a fast, ephemeral, TTL-based store rather
  than the primary database — tie it to the write volume and the fact that
  stale presence data is low-stakes compared to stale messages.
- Explain the heartbeat + TTL mechanism as the standard way to detect
  "silent" disconnects (crashes, dropped networks) that never send an
  explicit disconnect signal.
- Discuss the fan-out cost of broadcasting presence to large contact lists
  and at least one mitigation (scoped broadcast to active viewers, or
  pull-based queries).
