# Billing (for AI SaaS)

## Why billing is harder here than in typical SaaS

Classic SaaS billing is usually flat/seat-based (charge $X per user per
month) with predictable costs. AI SaaS products have a **variable,
consumption-based cost structure** — every AI provider call costs real
money based on tokens processed (or compute-seconds, or images generated),
and that cost is incurred _whether or not_ you successfully charge the
customer for it. This mismatch between "cost incurred" and "revenue
collected" timing is the central challenge this topic tests.

## Metering usage

- Every AI provider call must be **metered**: record tokens consumed
  (input + output, since providers typically price them differently),
  which model was used (different models have different per-token costs),
  and which user/org/API-key triggered it.
- This metering event should be emitted **at the point of the AI call
  itself** (e.g., logged immediately after the provider response returns
  with actual usage numbers) rather than estimated after the fact — most
  providers return exact token counts in the response, which is the
  authoritative source, not a client-side estimate.
- Metering data feeds two separate downstream needs: (1) real-time balance/
  quota enforcement, and (2) the billing/invoicing pipeline — worth
  designing as one event stream consumed by both, rather than two separate
  tracking mechanisms.

## Billing models

- **Usage-based (pay-as-you-go):** charge directly proportional to
  consumption (e.g., $X per 1,000 tokens), often via a payment provider's
  metered billing feature (e.g., Stripe's usage-based billing/metered
  subscriptions).
- **Credits/quota model:** sell a bundle of "credits" (an abstraction over
  raw token cost, often marked up and simplified for the customer) that
  get consumed by usage; users top up or subscribe to a recurring credit
  allotment. This is very common in consumer-facing AI products since it's
  easier for customers to reason about than raw token pricing, and gives
  you a buffer/markup between your actual provider cost and what you
  charge.
- **Tiered plans with usage caps:** a flat subscription fee that includes
  a usage allowance, with either hard cutoff or overage charges once
  exceeded — common for B2B products.
- Many products combine these: a flat subscription tier that unlocks
  access, plus usage-based charges or credit consumption on top.

## Real-time quota enforcement

- Before allowing an AI call to proceed, the system needs to check "does
  this user/org have remaining quota/credits/budget" — this needs to be a
  **fast, low-latency check** (since it sits in front of every AI request)
  and consistent even under concurrent requests (avoiding the same
  race-condition problem covered in rate-limiter design: two concurrent
  requests both checking "sufficient balance" before either decrements it
  could both proceed and overspend).
- A common approach: maintain a cached/fast-access balance (e.g., in
  Redis) that's atomically decremented pre-request (optimistic
  reservation) or immediately post-request based on actual usage, with
  periodic reconciliation against the authoritative billing ledger to
  catch drift.

## Handling the cost/revenue timing mismatch

- Since provider costs are incurred immediately but revenue collection
  (especially for postpaid/invoiced usage) can lag, systems need **cost
  guardrails** independent of billing: hard spend caps per user/org (to
  prevent a single runaway integration or a compromised API key from
  generating unbounded provider costs before billing catches up), and
  monitoring/alerting on anomalous usage spikes (see monitoring note).
- **Prepaid credits** sidestep much of this risk (you've already been
  paid before cost is incurred) — a reason many AI products default to a
  credits-first model, especially for self-serve/consumer tiers, reserving
  postpaid usage-based billing for larger, trusted enterprise customers.

## Handling failed/partial AI calls

- If an AI call fails outright (provider error, timeout) before producing
  output, the user generally shouldn't be charged — but if a request is
  cut off _partway_ through a streamed response (partial output already
  generated and consumed), decide explicitly whether to charge for the
  partial tokens actually generated (matches actual provider cost incurred)
  or waive it (better UX, but a cost leak if it happens often) — a real
  product/policy decision worth surfacing rather than assuming.

## Interview-relevant talking points

- Lead with the cost/revenue timing mismatch as the defining challenge —
  it's the detail that most clearly distinguishes this from "just add a
  Stripe subscription."
- Be ready to explain metering as capturing exact provider-reported usage
  at call time, not an estimate — a concrete, correct detail interviewers
  listen for.
- Discuss hard spend caps / real-time quota checks as a cost-control
  guardrail distinct from the billing/invoicing pipeline itself — billing
  determines what to charge; quota enforcement determines whether to even
  allow the call, and the two need to be designed together but aren't the
  same mechanism.
