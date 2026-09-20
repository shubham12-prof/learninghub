# Read Receipts

## What they track

Whether a message has been **sent**, **delivered** (reached the
recipient's device), and **read** (seen by the recipient) — the familiar
single-check/double-check/blue-check progression in many chat apps. Unlike
typing indicators, this state matters and should be reasonably durable and
consistent, since users rely on it and expect it to be accurate across
sessions/devices.

## The three states

1. **Sent** — the server has accepted and durably stored the message.
2. **Delivered** — the message has reached at least one of the recipient's
   active devices/connections (pushed over their WebSocket, or fetched on
   reconnect).
3. **Read** — the recipient has actually viewed the message (typically:
   the message became visible in their open conversation view).

## Tracking approach

### Per-conversation "last read" pointer (efficient, common for direct/group chats)

Rather than storing read status per individual message per user (expensive
at scale for group chats — O(messages × members)), store a single
**watermark** per member per conversation:

```
conversation_members
------------------------------------------------
conversation_id
user_id
last_read_message_id     <- the watermark
```

- When a user views a conversation, the client sends "I've read up to
  message X," and the server updates `last_read_message_id` for that user
  in that conversation.
- Any message with `message_id <= last_read_message_id` is considered read
  by that member — no need to store a row per message per reader.
- To show "read by Alice, Bob" in a group, compare each member's watermark
  against the message's ID — cheap to compute on read, no extra storage
  growth as message volume increases.

### Per-message read tracking (only when needed)

Some products want fine-grained per-message, per-reader receipts (e.g.,
"seen by" lists showing exactly who read exactly which message, common in
some group chat products). This requires a separate table:

```
read_receipts
------------------------------------------------
message_id
user_id
read_at
```

This is more storage- and write-heavy (one row per reader per message) —
only justify it if the product actually needs per-message granularity;
otherwise the watermark approach above is simpler and cheaper, and is
sufficient for the common "delivered/read" checkmark UX.

## Delivering the update in real time

- When a user's read watermark advances, notify the _other_ members of
  that conversation who are currently connected, via the same
  connection-registry + pub/sub mechanism used elsewhere (WebSockets note)
  — this is what makes the checkmarks update live on the sender's screen
  without a refresh.
- Like message delivery, this should be **debounced** somewhat (e.g., don't
  fire a network update for every single message scrolled past instantly;
  batch/update the watermark periodically or on scroll-settle) to avoid
  excessive write/broadcast volume during fast scrolling through history.

## Multi-device sync

- A user often has multiple devices (phone, desktop, web). Read state
  needs to be consistent across all of them — if you read a message on
  your phone, it should show as read on your laptop too.
- Since the watermark is stored per `(user_id, conversation_id)` rather
  than per device, this is naturally handled: any device querying the
  current read state gets the same shared watermark, and a read event from
  any one device updates the same shared value for that user.

## Privacy considerations

- Many products let users disable sending read receipts (common privacy
  toggle) — worth mentioning if the interview touches privacy/product
  requirements; typically implemented by simply not broadcasting the
  read-state update to others when the setting is off, while the
  underlying watermark can still be tracked for the user's own multi-device
  sync.

## Interview-relevant talking points

- Explain the "last read watermark" approach as the default, efficient
  design and clearly state _why_ it's chosen over per-message-per-reader
  rows (storage/write cost at group-chat scale).
- Be ready to explain the delivered vs. read distinction and how "delivered"
  is really just "reached a connected device," using the same routing
  mechanism as normal messages.
- Bring up multi-device consistency as a natural consequence of the
  watermark design, and mention the privacy opt-out as a nice product-
  awareness point.
