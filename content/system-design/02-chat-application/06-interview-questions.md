# Interview Questions — Chat Application

Question bank with model answers, plus a suggested time-boxed structure for
a 45-minute interview.

---

## Suggested 45-minute structure

| Time      | Activity                                                                                                          |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| 0–5 min   | Clarify scope: 1:1 only or group chat? Media support? Delivery/read receipts required? Scale target?              |
| 5–10 min  | High-level architecture sketch: clients, WebSocket gateways, message service, presence service, database, pub/sub |
| 10–20 min | Real-time transport: justify WebSockets, explain connection registry + cross-gateway routing                      |
| 20–30 min | Message storage: schema, ordering, delivery guarantees, group fan-out                                             |
| 30–38 min | Presence, typing indicators, read receipts — treat these as variations on the same broadcast pattern              |
| 38–45 min | Scaling/failure discussion: gateway failures, reconnection, sharding, and a recap of tradeoffs                    |

Interviewers in this problem specifically look for whether you understand
**stateful connection management** — that's the part that differs most from
typical CRUD-service design, so make sure it gets real airtime rather than
rushing to schema design.

---

## Conceptual

**Q1. Why use WebSockets instead of HTTP polling for a chat app?**
A: Chat requires the server to push data (incoming messages, presence/
typing updates) to clients without the client asking first, and messaging
is inherently bidirectional and latency-sensitive. WebSockets provide a
persistent, full-duplex connection with low per-message overhead, unlike
polling (wasteful, higher latency) or SSE (one-directional only).

**Q2. What's the fundamental architectural challenge WebSockets introduce
that a stateless REST API doesn't have?**
A: A WebSocket connection is stateful and pinned to a specific server
instance — unlike a stateless HTTP request, any given server can only push
to the clients it's currently holding connections for. This means the
system needs a way to know _which_ server holds a given user's connection
and route messages/events to that specific server — typically solved with
a shared connection registry plus a pub/sub layer between gateway servers.

**Q3. How would you handle a user connected on multiple devices at once?**
A: Track multiple active connections per user (e.g., `user_id → [list of
(gateway_id, connection_id)]` rather than a single value) and fan out
relevant events to all of that user's active connections. Read state
should be synced via a shared per-conversation watermark (see read
receipts) rather than tracked per device, so reading on one device is
reflected on all others.

**Q4. Why shouldn't typing indicators be treated with the same reliability
guarantees as messages?**
A: Typing indicators are ephemeral and low-stakes — losing one has a
trivial, momentary UI impact, unlike a lost message. Treating them as
fire-and-forget over the live pub/sub layer (no persistence, no retry, no
durable delivery guarantee) is a deliberate simplification appropriate to
their actual requirements, and avoids unnecessary load on the durable
message pipeline.

---

## Technical

**Q5. How does a message get from Alice (connected to Gateway A) to Bob
(connected to Gateway B)?**
A: Gateway A looks up Bob's current connection location in a shared
connection registry (commonly Redis: `user_id → gateway_id`). Gateway A
then publishes the message on a pub/sub channel Gateway B subscribes to
(or an equivalent broker mechanism); Gateway B receives it and pushes it
down Bob's open WebSocket connection. The message is also durably written
to storage independent of this live-delivery path, so it's available even
if Bob is offline at the moment it's sent.

**Q6. How do you guarantee message ordering in a conversation?**
A: Avoid relying on wall-clock timestamps alone, since clock skew across
servers can cause visible out-of-order artifacts. Use a sortable ID scoped
at least per-conversation — either an atomically incremented per-
conversation sequence number, or a Snowflake-style distributed ID
(timestamp + node ID + local counter) that's globally unique and roughly
time-ordered without needing a central counter.

**Q7. What delivery guarantee do chat systems typically aim for, and how
do you handle duplicates?**
A: At-least-once delivery with client-side deduplication, rather than
exactly-once — exactly-once over an unreliable network is expensive to
guarantee and usually unnecessary. Each message carries a unique
(often client-generated) ID; if a client retries a send after a timeout,
the server can detect and ignore the duplicate ID, and a client receiving
a duplicate push can dedupe by ID before rendering.

**Q8. How would you detect that a user has gone offline if their app
crashes without sending a disconnect signal?**
A: Use a heartbeat + TTL mechanism: the client periodically sends a small
ping over the WebSocket, refreshing a TTL on the user's presence entry in
an in-memory store. If heartbeats stop (crash, dropped network), the TTL
expires and the user is treated as offline automatically — more reliable
than depending solely on an explicit disconnect event, which doesn't
always arrive.

**Q9. Why store read receipts as a "last read message ID" watermark rather
than one row per message per reader?**
A: Per-message-per-reader rows grow as O(messages × group members), which
gets expensive fast in active group chats. A single watermark per
(user, conversation) is cheap to store and update, and lets you compute
"read by X" for any message by comparing message IDs to watermarks —
sufficient for the standard read-receipt UX. Per-message granularity is
only justified if the product specifically needs a detailed "seen by" list
per message.

**Q10. How would you scale to support very large group conversations
(thousands of members)?**
A: Naive fan-out-on-write (push every message to every member's connection
immediately) gets expensive at that scale. A common mitigation is
fan-out-on-read for oversized groups/broadcast channels — members pull
recent messages when they open the conversation rather than every message
being actively pushed to every connection — trading a bit of live-push
immediacy for much lower write/broadcast amplification.

---

## Scenario / Design

**Q11. Design the reconnection experience for a mobile client with a flaky
network.**
A: The client tracks a cursor (last-seen message ID or timestamp) per
conversation. On reconnect, rather than relying solely on live push having
worked while disconnected, the client calls a catch-up endpoint —
"give me everything since cursor X" — to backfill any missed messages,
presence changes, etc. Presence, on the server side, treats a dropped
connection past TTL as offline automatically, so no special-casing is
needed there beyond the heartbeat mechanism.

**Q12. A user reports messages sometimes appear out of order in a group
chat. How would you debug this?**
A: First check the ordering key being used for display — if it's a raw
client-side or server wall-clock timestamp, clock skew across servers or
clients is the likely cause; the fix is switching to a sortable
server-assigned ID (per-conversation sequence or Snowflake-style ID) as
the authoritative sort key instead of timestamps. If a proper sortable ID
is already in use, check whether the issue is on the client (rendering
messages as they arrive over the wire rather than sorting by ID before
display) — a subtle but common bug.

**Q13. How would you add end-to-end encryption to this design, and what
does it change architecturally?**
A: Message content is encrypted client-side before sending and decrypted
client-side on receipt, so the server only ever stores/routes opaque
ciphertext — it can't read message content. This changes what the server
can do: search-by-content, server-side content moderation, and rich
previews all become impossible (or require different techniques, like
client-side processing) since the server has no access to plaintext.
Delivery/ordering/storage mechanics stay essentially the same, since
those don't require reading content — only the payload itself is treated
as opaque, and key exchange/management becomes a new subsystem to design.

**Q14. What would you monitor in production for this system?**
A: WebSocket connection counts and churn rate per gateway (to catch
capacity issues), message delivery latency (send-to-receive, including the
cross-gateway pub/sub hop), reconnection rate and catch-up fetch volume
(a proxy for network reliability issues), presence store hit rate/TTL
expiry patterns, and error/dropped-message rates in the pub/sub layer.
Also track fan-out latency specifically for large group conversations,
since that's the most likely place a hidden bottleneck shows up first.
