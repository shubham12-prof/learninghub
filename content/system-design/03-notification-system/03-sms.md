# SMS Notifications

## What's distinct about SMS in this design

SMS is the most **expensive per-message** and most **regulated** of the
three channels, and delivery goes through telecom carriers rather than an
internet protocol you control end-to-end — this shapes several design
decisions that don't come up for push/email.

## Sending architecture

- Send via an **SMS aggregator/provider** (e.g., Twilio, Amazon SNS/Pinpoint,
  Vonage) rather than integrating directly with individual telecom carriers
  — the aggregator handles routing to the correct carrier based on the
  recipient's number, retries at the carrier level, and delivery status
  callbacks.
- Your notification worker calls the provider's API with the destination
  phone number and message body; the provider returns a message ID you can
  use to track delivery status (often via a webhook callback: queued →
  sent → delivered → failed).

## Cost considerations

- SMS costs real money **per message** (unlike push, and unlike email at
  typical transactional volumes) — often fractions of a cent to several
  cents depending on destination country/carrier. This has direct
  architectural implications:
  - SMS is usually reserved for **high-priority, must-reach-the-user**
    notifications (2FA codes, critical account alerts) rather than general
    engagement notifications, both for cost and because it's more
    intrusive.
  - Systems often implement **per-user and global rate limits/budgets** on
    SMS sends specifically, distinct from push/email, to control cost and
    prevent abuse (e.g., an attacker triggering SMS sends to rack up
    costs — "SMS pumping" fraud is a real, known attack pattern against
    2FA flows).

## Compliance considerations

- **Opt-in requirements** — many jurisdictions (e.g., TCPA in the US)
  require explicit consent before sending marketing/promotional SMS, with
  significant legal penalties for violations; transactional SMS (2FA,
  critical alerts) has more lenient but still relevant rules depending on
  jurisdiction.
- **Opt-out (STOP) handling** — carriers require honoring "STOP" replies to
  unsubscribe a number from future messages; providers typically handle
  the carrier-level mechanics but your system needs to consume the
  opt-out event and suppress future sends to that number, similar to email
  suppression lists.
- **International formatting/routing** — phone numbers need E.164
  normalization (`+<country code><number>`), and delivery reliability/cost
  varies significantly by destination country — worth a brief mention if
  the system needs to be global.

## Delivery status & reliability

- Unlike email's SMTP-level bounce feedback, SMS delivery status comes via
  provider-specific webhook callbacks (delivered, undelivered, failed) —
  your system should consume these to update notification status and
  trigger retries/fallback where appropriate (see retry-logic note).
- Delivery is not instant or guaranteed even when "sent" — carrier-side
  delays and silent failures (e.g., delivering to a number that's been
  reassigned) do happen; critical flows (like 2FA) often pair SMS with a
  fallback channel (voice call, email) if SMS delivery isn't confirmed
  within a timeout.

## Interview-relevant talking points

- Bring up per-message cost explicitly as the main differentiator driving
  design choices (priority-gating SMS use, rate limits/budgets) — this is
  the detail that most clearly separates a thoughtful answer from a
  generic "just call Twilio" answer.
- Mention SMS pumping/toll fraud as a concrete abuse vector worth guarding
  against with rate limiting, if the interview goes into security/abuse
  territory.
- Know that opt-out (STOP) handling is a carrier-level requirement your
  system must still respect at the application layer via a suppression
  list.
