# Scheduling

## What needs to be scheduled

Beyond "send this notification now," a real system needs to support:

- **Delayed/future-dated sends** — e.g., "remind the user tomorrow at 9am,"
  or a marketing send scheduled for a specific future time.
- **Recurring notifications** — e.g., a weekly digest email, a daily
  reminder.
- **Timezone-aware delivery** — "9am" needs to mean 9am _in the user's own
  timezone_, not the server's.
- **Batching/quiet hours** — respecting a do-not-disturb window (e.g.,
  don't push notifications between 10pm-8am local time) even for
  otherwise-immediate notifications.

## Core scheduling mechanism

- A **scheduled job store** holds pending notifications with a
  `scheduled_send_time` (and enough payload/context to construct the
  actual notification at send time).
- A **scheduler/dispatcher process** periodically (e.g., every 30-60
  seconds, or via a more event-driven mechanism) queries for jobs whose
  `scheduled_send_time` has arrived, and enqueues them onto the normal
  send pipeline (the same queue used for immediate notifications) — this
  keeps scheduling as a thin layer on top of the existing send/retry
  infrastructure rather than a separate parallel system.
- For scale, this query needs an index on `scheduled_send_time` (and
  ideally partitioning/sharding by time bucket) so the dispatcher isn't
  scanning a huge table every poll cycle — a common pattern is a
  time-bucketed queue (e.g., sharded by hour) that the dispatcher only
  needs to look at the current/near-future buckets of.

## Recurring notifications

- Store a **recurrence rule** (e.g., cron-like expression, or an RRULE-
  style definition: "every Monday at 9am") rather than a single
  `scheduled_send_time`.
- After each occurrence fires, compute and store the **next occurrence
  time** rather than re-evaluating the rule on every dispatcher poll —
  cheaper and simpler to reason about.
- Need to handle **skips/pauses** (user disables a digest temporarily) and
  **catch-up semantics** if the system was down when an occurrence should
  have fired (usually: skip the missed occurrence rather than sending a
  stale one late, for time-sensitive content like a "today's digest").

## Timezone handling

- Store the user's timezone (or infer from their locale/last known
  location) and store scheduling intent in terms meaningful to the user
  ("9am local") rather than baking in a specific UTC time at creation —
  otherwise daylight saving time transitions or a user changing timezone
  produce wrong send times.
- Practically: compute the concrete next UTC send time from the local-time
  rule + the user's current timezone at (or shortly before) each
  occurrence, rather than storing a single fixed UTC timestamp for a
  recurring rule.

## Quiet hours / send-time throttling

- Even for notifications that aren't explicitly "scheduled" by the
  triggering event (e.g., a real-time alert), many products hold
  non-urgent notifications that would otherwise fire during a user's
  configured quiet hours, and release them at the next allowed time —
  effectively a dynamic scheduling decision applied at send time, not just
  for pre-planned sends.
- Urgent/critical notifications (e.g., security alerts) typically bypass
  quiet hours — worth explicitly calling out priority tiers if the
  interview goes here.

## Scale considerations

- At high volume, a single scheduler process polling a shared table
  becomes a bottleneck/single point of failure. Mitigations: shard the
  scheduled-job store (e.g., by time bucket or user_id hash) with multiple
  dispatcher instances each responsible for a subset, and/or use a
  purpose-built delayed-queue mechanism (some message queues support
  native delayed delivery, avoiding the need for a custom polling
  dispatcher entirely for shorter delays).
- Distinguish **short delays** (seconds to minutes — well suited to
  queue-native delay features) from **long/far-future schedules** (hours to
  months out — better suited to a persistent job store queried
  periodically, since holding hundreds of thousands of far-future messages
  in an active queue is wasteful).

## Interview-relevant talking points

- Explicitly separate "one-off scheduled send" from "recurring rule" as
  different data models — a common thing candidates conflate.
- Bring up timezone/DST handling as a concrete correctness pitfall (fixed
  UTC timestamps break for recurring "local time" schedules) — a strong,
  specific detail to raise unprompted.
- Discuss the short-delay-vs-long-delay distinction and how it affects
  whether you use queue-native delay features vs. a polled job store — a
  good scaling nuance to bring up if asked to handle high scheduling
  volume.
