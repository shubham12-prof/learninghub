# Retry Logic

## Why retries are central to this design

Every channel (push/email/SMS) depends on a third-party provider that can
fail transiently — network blips, provider rate limiting, temporary
outages. A notification system's core reliability job is handling these
failures gracefully without either silently dropping notifications or
hammering a struggling provider.

## Classifying failures

Not all failures should be retried the same way (or at all):

| Failure type                | Example                                                         | Retry?                                                                                               |
| --------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Transient**               | Network timeout, provider 5xx, rate-limit response (429)        | Yes — with backoff                                                                                   |
| **Permanent/non-retryable** | Invalid device token, hard email bounce, malformed phone number | No — fail immediately, remove the bad target from future sends                                       |
| **Ambiguous**               | Provider returns no response before timeout                     | Retry cautiously, but be aware the original send may have actually succeeded (see idempotency below) |

Correctly classifying the error (usually via the provider's returned error
code) is the first design decision — blindly retrying everything wastes
resources and can cause duplicate sends; never retrying anything drops
messages unnecessarily on ordinary transient blips.

## Backoff strategy

- **Exponential backoff** is the standard approach: wait progressively
  longer between retry attempts (e.g., 1s, 2s, 4s, 8s...) rather than
  retrying immediately, to avoid overwhelming a struggling provider and to
  give transient issues time to resolve.
- **Jitter** — add randomness to the backoff delay so that many failed
  notifications don't all retry at exactly the same moment (which would
  itself cause a synchronized retry spike, potentially triggering the same
  provider throttling all over again — the "thundering herd" problem).
- **Max retry count / retry budget** — cap the number of attempts (e.g., 5) before giving up and routing the notification to a dead-letter queue
  rather than retrying forever.

## Idempotency

- A retry might occur after the original request actually succeeded but
  the success response was lost (network issue on the way back). Without
  idempotency, this causes **duplicate notifications** — mildly annoying
  for a push notification, worse for something like an SMS-based 2FA code
  or a "your payment succeeded" email.
- Mitigation: generate a unique **idempotency key** per notification
  send attempt (e.g., derived from `notification_id` + a fixed value, not
  regenerated per retry) and pass it to the provider if supported (many
  providers, like Stripe-style APIs, support idempotency keys natively);
  where not supported, track "have I already successfully sent this
  notification_id" in your own system before retrying.

## Dead-letter queue (DLQ)

- After exhausting retries, move the failed notification to a **dead-letter
  queue** rather than dropping it silently — this preserves the failure for
  visibility (alerting, dashboards) and allows manual inspection or a
  later reprocessing pass (e.g., after a provider outage is resolved).
- DLQ entries should retain enough context (original payload, error
  history, timestamps) to diagnose why they failed and to safely replay
  them if appropriate.

## Circuit breaking

- If a specific provider is failing at a high rate (e.g., an outage), a
  **circuit breaker** can temporarily stop sending new requests to that
  provider entirely (failing fast into the DLQ or a fallback provider)
  rather than continuing to retry against a system that's clearly down —
  reduces wasted load on both sides and speeds up recovery once the
  provider comes back.
- This pairs naturally with **provider fallback** — e.g., if the primary
  email provider is down, route to a secondary provider rather than
  queuing everything for later.

## Queue-based architecture supporting retries

- Retries are naturally implemented via a **message queue** with either
  built-in delay/visibility-timeout support (e.g., SQS visibility timeout,
  RabbitMQ delayed exchange) or a separate "retry queue" per backoff tier,
  where a failed message is re-enqueued with a computed delay before its
  next attempt, rather than the worker blocking/sleeping in-process (which
  would waste worker capacity).

## Interview-relevant talking points

- Be explicit about _not_ retrying permanent failures — a common mistake
  candidates make is describing a single generic retry policy without
  distinguishing transient vs. permanent errors.
- Bring up idempotency proactively, especially for SMS/email — duplicate
  sends are a real, visible user-facing bug if this is missed.
- Mention DLQ + circuit breaking as the pair of concepts that show
  production-reliability maturity beyond "just retry with backoff."
