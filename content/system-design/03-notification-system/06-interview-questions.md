# Interview Questions — Notification System

Question bank with model answers, plus a suggested time-boxed structure
for a 45-minute interview.

---

## Suggested 45-minute structure

| Time      | Activity                                                                                                                                      |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 0–5 min   | Clarify scope: which channels (push/email/SMS/all)? Immediate vs. scheduled/recurring? Expected volume? User preference/opt-out requirements? |
| 5–10 min  | Capacity/requirements: rough notification volume, priority tiers, latency expectations per channel                                            |
| 10–20 min | High-level architecture: producers → API → queue → channel workers → providers, plus a status-tracking store                                  |
| 20–28 min | Channel-specific details: at least one deep-dive (commonly push, since it has the most moving parts — tokens, platforms)                      |
| 28–36 min | Retry logic: failure classification, backoff, idempotency, DLQ                                                                                |
| 36–43 min | Scheduling: one-off delays, recurring notifications, timezone handling                                                                        |
| 43–45 min | Recap tradeoffs and mention user-preference/rate-limiting as a cross-cutting concern if time allows                                           |

A strong signal in this interview is treating notification **sending** as a
thin, uniform pipeline (queue → worker → provider) and reserving the real
complexity discussion for the parts that differ: provider-specific quirks,
retry semantics, and scheduling — rather than re-deriving a whole new
architecture per channel.

---

## Conceptual

**Q1. At a high level, how would you architect a notification system that
supports push, email, and SMS?**
A: A central notification API accepts requests from internal producer
services (e.g., "user X placed an order") and publishes a normalized
notification event to a queue. Channel-specific worker pools consume from
the queue, resolve the user's preferences/routing info (which channels
they're opted into, device tokens, email/phone), render the appropriate
content, and call the relevant third-party provider (APNs/FCM for push, an
email provider like SES/SendGrid, an SMS aggregator like Twilio). Delivery
status callbacks from providers update a tracking store, feeding into the
retry pipeline for failures.

**Q2. Why route all three channels through third-party providers instead
of building direct integrations?**
A: Each channel requires deep, ongoing operational expertise your team
likely doesn't want to own: push requires maintaining platform-specific
gateway integrations (APNs/FCM); email requires sender reputation and
deliverability management; SMS requires carrier relationships and
compliance handling. Established providers absorb this complexity and
operational burden, letting your system focus on orchestration, retries,
and business logic instead.

**Q3. How would you let users control which notifications they receive
and through which channel?**
A: Store a preferences model (e.g., per notification-type × channel
opt-in/opt-out, possibly with quiet-hours settings) keyed by user. The
notification worker checks preferences before sending — skip channels the
user has disabled, and skip entirely if all channels for that notification
type are disabled. This should be checked as close to send time as
possible (not just at creation time) so a preference change is respected
even for already-queued notifications.

---

## Technical

**Q4. Push notification delivery fails with an "invalid token" error.
What do you do?**
A: Treat this as a permanent, non-retryable failure — remove the stale
device token from the user's registered tokens immediately, rather than
retrying (retrying against a permanently invalid token wastes resources
and can affect your standing with the push provider). Log/track the
removal for visibility, but don't route it to the retry pipeline or DLQ as
if it were a transient failure.

**Q5. How do you prevent sending the same notification twice if a retry
occurs after the original request actually succeeded but the
acknowledgment was lost?**
A: Use an idempotency key tied to a stable identifier (e.g., the
notification attempt's own ID) rather than generating a new one per
retry, and pass it to the provider if their API supports idempotent
requests. Where the provider doesn't support this natively, track
"already successfully sent" state in your own system (e.g., a status flag
on the notification record) and check it before issuing a retry.

**Q6. Design the retry policy for a failed email send. What determines
whether and how you retry?**
A: First classify the failure: a hard bounce (invalid address) is
permanent — suppress the address and don't retry; a provider 5xx or
timeout is transient — retry with exponential backoff and jitter, up to a
capped number of attempts; a soft bounce (temporary, e.g., full inbox) can
be retried with a longer backoff. After exhausting retries on a transient
failure, move the notification to a dead-letter queue for visibility
rather than dropping it silently.

**Q7. How would you implement a scheduled "send this reminder tomorrow at
9am in the user's local timezone" feature?**
A: Store the schedule as a local-time intent (9am) plus the user's
timezone, not a precomputed fixed UTC timestamp — computing the concrete
UTC send time at (or shortly before) dispatch time avoids bugs from DST
transitions or timezone changes. A scheduler process polls (or uses a
time-bucketed index) for jobs whose computed send time has arrived and
enqueues them onto the normal send pipeline, reusing the same workers and
retry logic as immediate notifications.

**Q8. How would you support a recurring weekly digest email?**
A: Store a recurrence rule (e.g., "every Monday 9am user-local") rather
than a single scheduled time, along with the next computed occurrence.
After each send, compute and persist the next occurrence rather than
re-evaluating the rule on every scheduler poll. Handle pause/resume
(user disables the digest) and decide catch-up semantics explicitly (for
digest-style content, typically skip a missed occurrence rather than
sending a stale one late if the system was down).

**Q9. How do you avoid overwhelming a third-party provider (or getting
rate-limited by them) when a large batch of notifications needs to go out
at once?**
A: Rate-limit outbound calls per provider (e.g., a token-bucket limiter
sized to the provider's documented rate limits) rather than sending all
queued notifications as fast as possible; scale worker concurrency within
that budget. Add jitter to any retry backoff so failed sends don't
re-synchronize into another burst. For very large scheduled batches (e.g.,
a marketing blast), spread the dispatch over a window rather than firing
all at the scheduled instant.

---

## Scenario / Design

**Q10. Design a 2FA (one-time code) SMS flow, focused on reliability and
abuse prevention.**
A: Generate the code, send via SMS through the aggregator, and start a
short expiry timer. Rate-limit code requests per user/phone number and per
IP to prevent SMS-pumping abuse (an attacker triggering repeated sends to
run up costs). If delivery isn't confirmed (via the provider's delivery
webhook) within a short timeout, offer a fallback channel (voice call or,
if available, an authenticated email) rather than silently retrying SMS
indefinitely, since SMS delivery failures for a specific number are often
persistent rather than transient.

**Q11. A product wants "critical" notifications (e.g., security alerts) to
always get through immediately, bypassing quiet hours and using the most
reliable channel available. How would you support this?**
A: Add a priority tier to the notification model. High-priority
notifications bypass quiet-hours suppression and any batching delays.
Consider channel fallback logic specifically for this tier: attempt the
preferred channel, and if delivery isn't confirmed within a short window,
automatically attempt a second channel (e.g., push fails silently or isn't
confirmed → fall back to email) rather than relying on a single channel's
best-effort delivery for something critical.

**Q12. How would you design delivery status tracking so a producer service
can know whether a notification was actually delivered?**
A: Maintain a notification record with a status field progressing through
states (queued → sent → delivered/failed), updated by provider callbacks
where available (email bounce webhooks, SMS delivery receipts) and by
worker-observed send results otherwise (push send acknowledgment from
APNs/FCM, which doesn't guarantee on-device delivery). Expose a status
query API (and/or a callback/webhook back to the producer) so producer
services can react to failures — e.g., an order-shipped email failing
permanently might trigger a fallback SMS.

**Q13. What would you monitor in production for this system?**
A: Per-channel send success/failure rates and latency, retry queue depth
and DLQ growth rate (a leading indicator of provider issues), provider-
specific rate-limit/throttling incidents, scheduler lag (how far behind
scheduled_send_time the dispatcher is running), and cost metrics
specifically for SMS given its per-message cost. Alerting on DLQ growth
rate and provider error-rate spikes is especially important since those
directly indicate messages aren't reaching users.

**Q14. How would you extend this system to support A/B testing different
notification copy or send times?**
A: Add an experiment/variant assignment step before rendering — the
notification service resolves which variant (copy, timing, channel) a
given user/notification falls into based on the experiment configuration,
tags the resulting notification with the variant for later analysis, and
otherwise flows through the same send/retry/scheduling pipeline unchanged.
Keeping experimentation as a thin layer on top of the existing pipeline
(rather than a parallel system) avoids duplicating retry/reliability logic
per experiment.
