# Email Notifications

## What's distinct about email in this design

Email is generally the most **reliable and durable** of the three channels
(push is best-effort, SMS is costly and rate-limited by carriers), but has
its own concerns: deliverability (avoiding spam folders), templating, and
provider-level rate limits/reputation management.

## Sending architecture

- Almost never send directly from your own mail server in a modern system
  — use a **transactional email provider** (e.g., SendGrid, Amazon SES,
  Mailgun, Postmark) via their API. They handle the hard parts: IP/domain
  reputation management, SPF/DKIM/DMARC setup, retry against receiving mail
  servers, and bounce/complaint processing.
- Your notification worker calls the provider's API with the rendered
  email (or a template ID + template variables, if using provider-side
  templating) and the recipient address; the provider handles actual SMTP
  delivery to the recipient's mail server.

## Deliverability concerns (why email is harder than it looks)

- **SPF/DKIM/DMARC** — DNS-level authentication records that prove your
  emails are legitimately sent on behalf of your domain; missing/misconfigured
  records are a top cause of emails landing in spam.
- **Sender reputation** — mailbox providers (Gmail, Outlook) track your
  sending domain/IP's bounce rate, spam-complaint rate, and engagement;
  poor reputation gets future emails throttled or spam-filtered regardless
  of content. This is a strong reason to use an established provider with
  good shared/dedicated IP reputation management rather than rolling your
  own.
- **Bounce handling** — hard bounces (invalid address) should immediately
  suppress future sends to that address; soft bounces (temporary failure,
  e.g., full inbox) can be retried. Providers send bounce webhooks/events
  your system should consume to keep your own suppression list accurate.
- **Unsubscribe/suppression lists** — required both for compliance (CAN-
  SPAM, GDPR) and reputation — every marketing email needs a working
  unsubscribe path, and your system must honor it on all future sends,
  including checking the suppression list before every send.
- Note: **transactional** emails (password resets, receipts, "your order
  shipped") are generally exempt from marketing-unsubscribe requirements,
  but this distinction matters for which emails need unsubscribe links and
  which don't — worth clarifying with the interviewer if scope is
  ambiguous.

## Templating

- Store reusable templates (HTML + plain-text fallback) with variable
  placeholders (`{{user_name}}`, `{{order_id}}`) rather than constructing
  raw HTML per send — separates content/design work from the sending
  pipeline, and many providers support server-side template rendering
  directly via their API.
- Always include a plain-text version alongside HTML — improves
  deliverability and accessibility.

## Rate limits & batching

- Providers impose sending rate limits (and pricing tiers based on
  volume); a notification worker pool should respect these limits (e.g.,
  via a token-bucket rate limiter per provider account) rather than
  bursting all queued emails at once, which can trigger throttling or even
  temporary account holds.

## Interview-relevant talking points

- Explain _why_ you'd use a third-party provider instead of your own SMTP
  server — reputation management is the crux of the answer, not just
  "convenience."
- Be ready to explain hard vs. soft bounce handling and why immediate
  suppression on hard bounce matters (protects sender reputation, avoids
  wasted retries).
- Know the difference between transactional and marketing email
  requirements if asked about compliance/unsubscribe.
