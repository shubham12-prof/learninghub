# Message Storage

## Core schema

A minimal message store, assuming 1:1 and group conversations share a
`conversation_id` abstraction:

```
conversations
------------------------------------------------
conversation_id   BIGINT/UUID   PRIMARY KEY
type              ENUM('direct','group')
created_at        TIMESTAMP

conversation_members
------------------------------------------------
conversation_id   FK -> conversations
user_id           FK -> users
joined_at         TIMESTAMP
last_read_message_id   BIGINT   (see read-receipts note)

messages
------------------------------------------------
message_id        BIGINT (sortable, see ordering below)   PRIMARY KEY
conversation_id   FK -> conversations, INDEXED
sender_id         FK -> users
content           TEXT (or reference to encrypted blob)
created_at        TIMESTAMP
status             ENUM('sent','delivered','read')  (or tracked separately, see read-receipts note)
```

## Message ordering

Ordering matters a lot in chat — messages must display in a consistent
order per conversation, even under concurrent writes from multiple
servers.

- **Don't rely on wall-clock timestamps alone** as the sort key — clock
  skew across servers can cause messages to appear out of order even when
  they weren't sent that way.
- **Use a sortable, (ideally) monotonically increasing ID** per message,
  scoped at least per-conversation. Common approaches:
  - A **per-conversation sequence number**, incremented atomically for
    each new message in that conversation (simple to reason about, but a
    write hotspot for very high-traffic conversations, and requires
    coordination if the conversation's messages are sharded across nodes).
  - A **Snowflake-style distributed ID** (timestamp + shard/machine ID +
    local sequence) — globally unique, roughly time-ordered, and doesn't
    require a central sequence counter, at the cost of only being
    approximately ordered across different generating nodes (acceptable
    for most chat UX, since true global total order usually isn't
    required — only per-conversation order needs to feel exact).

## Delivery guarantees

Chat systems typically aim for **at-least-once delivery** with
**client-side deduplication**, rather than exactly-once, because
exactly-once delivery across an unreliable network is expensive to
guarantee and usually unnecessary:

- Each message gets a unique ID (often client-generated, e.g. a UUID, sent
  along with the message) so if a client retries a send after a timeout
  (not knowing if the first attempt succeeded), the server can detect the
  duplicate ID and avoid inserting the same message twice.
- On the receive side, if a message is delivered twice due to a retry, the
  client can deduplicate by message ID before rendering it.

## Storage engine choice

- **Access pattern:** mostly append-only writes, and reads that are heavily
  skewed toward _recent_ messages in a conversation (scrolling back further
  is rarer and can tolerate higher latency).
- This favors a **wide-column / NoSQL store** (e.g., Cassandra, DynamoDB,
  HBase) partitioned by `conversation_id` and sorted by `message_id` within
  a partition — a very natural fit, since it directly matches "give me the
  last N messages in this conversation" as a fast range scan within a
  single partition.
- A relational database works fine at smaller scale too, with an index on
  `(conversation_id, message_id)` — the tradeoff is mainly about
  horizontal write/read scalability at very large message volumes, not
  correctness.

## Handling large group conversations / fan-out

When a message is sent to a group conversation with many members, it needs
to reach every online member's connection and be durably stored for every
member's read history.

- **Fan-out on write:** when a message arrives, immediately push it to
  every currently-connected member's gateway server (via the pub/sub
  mechanism from the WebSockets note), and write one durable copy per
  message (not per-recipient) referenced by `conversation_id` — recipients
  read from the shared conversation history rather than each having a
  private copy.
- For **very large groups/broadcast channels** (thousands+ of members),
  naive fan-out to every connection at write time can be expensive; some
  systems switch to a **fan-out on read** model for oversized groups
  (recipients pull recent messages when they open the conversation, rather
  than every message being actively pushed to every member instantly) —
  a good tradeoff to raise if asked to scale to very large groups.

## Media/attachments

- Store large media (images, video, files) in blob storage (e.g., S3), not
  in the message row itself — the message row stores a reference/URL. This
  keeps the message table light and fast, and lets media be served
  efficiently (e.g., via a CDN) independent of the chat backend.

## Interview-relevant talking points

- Explain clearly why wall-clock timestamps alone are an ordering pitfall,
  and propose a concrete alternative (per-conversation sequence or
  Snowflake ID).
- Be ready to discuss at-least-once delivery + client dedup as the
  practical, standard tradeoff versus the much harder problem of
  exactly-once delivery.
- Bring up fan-out on write vs. fan-out on read explicitly when asked about
  scaling group chats — a strong differentiator answer.
