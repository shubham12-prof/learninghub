# Monitoring

## What's different about monitoring an AI SaaS product

Standard SaaS observability (latency, error rate, uptime) still applies,
but AI-specific systems need additional dimensions that don't exist in
typical CRUD services: **cost per request**, **output quality/drift**, and
**abuse patterns unique to generative systems**. A monitoring answer that
only covers latency/uptime is incomplete for this interview.

## Cost monitoring

- Track **cost per request/per user/per org**, not just aggregate spend —
  this is unusual relative to typical SaaS monitoring, where infrastructure
  cost isn't normally tied so directly to individual requests. Since every
  AI call has a real, variable provider cost, cost-per-request is close to
  a core business metric here, not just an infra concern.
- **Anomaly detection on usage spikes** — a sudden spike in token
  consumption from one org/API-key can indicate a runaway integration
  (a bug in a customer's code calling your API in a loop), abuse, or a
  compromised API key — worth alerting on independent of whether it's
  hitting a hard quota limit, since damage can accrue before a cap is
  reached (see the billing note on cost/revenue timing mismatch — this is
  the monitoring counterpart to that risk).
- Track cost by model/provider to catch cases where requests are routed to
  a more expensive model than necessary (a routing bug in the AI-providers
  abstraction layer) — a subtle failure mode that pure error-rate
  monitoring wouldn't catch, since nothing is technically "failing," just
  costing more than it should.

## Latency monitoring

- Track latency **separately for different request shapes** — a short
  classification call and a long generation call have very different
  normal latency profiles, so a single aggregate p99 latency metric across
  all AI calls is close to meaningless; segment by request type/model.
- For streaming responses, track **time-to-first-token** (how quickly the
  user starts seeing output) separately from **total generation time** —
  time-to-first-token is usually the more important perceived-performance
  metric for interactive use cases.
- Track provider-side latency separately from your own added latency
  (queueing, auth, pre/post-processing) — helps distinguish "the provider
  is slow today" from "our own pipeline introduced a regression."

## Quality & drift monitoring

- Unlike typical software, an AI feature can "fail" by producing a
  technically-successful (200 OK, no error) response that's simply
  low-quality, wrong, or off-brand — a failure mode invisible to standard
  error-rate monitoring.
- Approaches: sampled human review of outputs, automated quality scoring
  (e.g., an LLM-as-judge pipeline, similar to the evaluation approach
  covered in the AI-system-design RAG note), and tracking user-facing
  quality signals (thumbs up/down, regeneration rate — if a user
  frequently hits "regenerate," that's a strong implicit quality signal
  worth monitoring as a metric in its own right).
- **Drift** — a provider updating/deprecating a model version can silently
  change output quality/behavior without any error on your end; version
  pinning where possible, plus ongoing quality monitoring, helps catch
  this rather than assuming a stable provider means stable output quality
  forever.

## Abuse & misuse detection

- Generative AI products face abuse patterns that don't map cleanly onto
  typical API abuse (e.g., beyond just "too many requests"): prompt
  injection attempts, attempts to extract system prompts, generation of
  policy-violating content, or attempts to use the product's compute for
  purposes unrelated to its intended use (e.g., using a writing assistant's
  API purely as cheap access to a raw LLM). Worth monitoring
  content-moderation trigger rates and flagging accounts with
  unusual patterns for review, similar in spirit to the guardrails
  concept from the AI-system-design topic, but framed here as an
  observability/detection concern rather than a blocking mechanism.

## Standard observability, still needed

- Request tracing across the full pipeline (auth → quota check → queue →
  provider call → storage → response) so a single slow/failed request can
  be root-caused end to end — especially valuable here given how many
  more hops a typical AI request has compared to a simple CRUD request.
- Uptime/error-rate dashboards per provider (to quickly see "is this an
  OpenAI outage or our bug") and per internal component.
- Standard infra metrics (CPU/memory/queue depth for worker pools, DB
  connection pool health, etc.) — unchanged from typical SaaS monitoring,
  but worth mentioning briefly to show you're not neglecting the basics
  in favor of only the AI-specific angle.

## Interview-relevant talking points

- Lead with cost-per-request and quality/drift monitoring as the two
  things a generic SaaS monitoring answer would miss — this is usually
  exactly what differentiates a strong answer in this specific interview.
- Bring up time-to-first-token as a distinct, important metric for
  streaming interactive features — a concrete, AI-specific detail.
- Mention that "success" (200 OK) doesn't mean "good output" for
  generative systems, and propose at least one concrete quality signal
  (regeneration rate, thumbs up/down, or LLM-as-judge sampling).
