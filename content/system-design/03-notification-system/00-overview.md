# Notification System — Interview Prep Overview

Notes for the "design a notification system" system design interview (the
one that sends push notifications, emails, and SMS on behalf of other
internal services — think of the system behind "you have a new follower" or
"your order has shipped"). This question tests fan-out design, third-party
integration patterns, reliability/retry logic, and scheduling — a
different emphasis than pure data-storage or real-time-transport problems.

## Contents

1. `01-push-notifications.md` — mobile/web push mechanics (APNs, FCM, Web
   Push), device token management.
2. `02-email.md` — transactional email delivery, providers, deliverability
   concerns.
3. `03-sms.md` — SMS delivery via telecom aggregators, cost and
   compliance considerations.
4. `04-retry-logic.md` — handling transient failures, backoff strategies,
   idempotency, dead-letter queues.
5. `05-scheduling.md` — delayed/scheduled notifications, recurring
   notifications, timezone handling.
6. `06-interview-questions.md` — question bank with model answers, plus a
   suggested 45-minute interview walkthrough structure.

## How to use this

- The core architectural shape is the same across all three channels
  (push/email/SMS): an internal service publishes a notification request →
  it lands in a queue → a worker picks it up, resolves user preferences/
  routing, calls the right third-party provider, and handles the result
  (success, retry, or dead-letter). Read the channel-specific notes for
  what's different about _each_ provider integration, then read retry
  logic and scheduling as cross-cutting concerns that wrap all three.
- Practice sketching: Producers → Notification Service (API) → Queue →
  Channel-specific Workers → Third-party Providers (APNs/FCM/SendGrid/
  Twilio) → Delivery status tracking, with a scheduler feeding delayed
  jobs back into the queue at the right time.
