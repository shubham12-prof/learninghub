# AI Providers

## Why this deserves its own architectural layer

Nearly every AI SaaS product depends on one or more external AI/LLM
providers (OpenAI, Anthropic, etc.) or self-hosted models. These calls are
slower, less predictable, and more failure-prone than a typical internal
service dependency — designing a dedicated abstraction layer around them
(rather than calling provider SDKs directly from scattered application
code) is the standard, expected answer in this interview.

## The provider abstraction layer

- Define an internal interface (e.g., `generate(prompt, params) →
response`) that your application code calls, with **provider-specific
  implementations** behind it — so switching models/providers, or routing
  different requests to different providers, doesn't require changing
  application logic throughout the codebase.
- This abstraction is what makes several other capabilities possible
  cleanly: fallback, multi-provider routing, and swapping providers as
  pricing/capability landscapes change (a real, recurring need in this
  space given how quickly the underlying model landscape shifts).

## Multi-provider strategy & fallback

- **Redundancy:** if your primary provider has an outage or degraded
  performance, automatically fall back to a secondary provider rather than
  failing the request outright — especially valuable given that AI
  providers do have real, sometimes extended outages.
- **Cost/capability routing:** route different request types to different
  models based on need — e.g., a cheaper/faster model for simple
  classification tasks, a more expensive/capable model for complex
  generation — rather than using one model for everything. This is often
  a bigger cost lever than any infrastructure optimization.
- **Circuit breaking:** similar to the pattern in notification-system
  retry logic — if a provider is failing at a high rate, stop sending it
  new requests temporarily (route to fallback / fail fast) rather than
  continuing to retry against a degraded service.

## Handling latency & streaming

- AI generation requests can take anywhere from under a second to tens of
  seconds (or longer for large outputs/complex reasoning) — very different
  from typical API latency profiles.
- **Streaming responses** (token-by-token or chunk-by-chunk, via
  server-sent events or a WebSocket) are the standard way to make this
  feel responsive — the user sees output appearing progressively rather
  than waiting for the entire generation to complete before anything is
  shown. This has architectural implications: your backend needs to
  proxy/relay the provider's stream to the client rather than buffering
  the whole response, and billing/metering needs to handle a request whose
  final token count isn't known until the stream ends (or is cut off).
- For requests that don't need real-time display (e.g., a batch
  summarization job), async/queued processing (see queues note) is more
  appropriate than holding a client connection open for a long-running
  call.

## Retry logic specific to AI calls

- Standard transient-vs-permanent failure classification applies (see the
  notification-system retry-logic note for the general pattern), with
  AI-specific nuances:
  - **Rate limit errors (429)** from the provider are common and expected
    at scale — treat as retryable with backoff, and consider this in
    capacity planning (provider-side rate limits, not just your own, can
    throttle your product's throughput).
  - **Content policy rejections** are permanent for that exact input — not
    retryable as-is; surfacing this clearly to the end user (rather than
    silently retrying and failing repeatedly) is the correct behavior.
  - **Non-determinism** — unlike a typical API, retrying an AI generation
    call with the same input can produce a _different_ (not just delayed)
    result; this is usually fine/expected, but worth noting if the
    interview touches idempotency, since "idempotent retry" doesn't mean
    "identical retry" the way it might for a typical CRUD operation.

## Prompt/context management

- Centralizing prompt templates and system prompts in the provider
  abstraction layer (rather than scattering them through application
  code) makes versioning and testing prompt changes tractable — worth a
  brief mention as good practice, since prompt changes are a frequent,
  ongoing product activity in AI SaaS products, closer to a config/content
  change than a code deploy.

## Interview-relevant talking points

- Lead with the abstraction-layer idea as the answer to "how do you
  integrate with an AI provider" — it's the single architectural decision
  that unlocks fallback, routing, and easier provider migration, and
  interviewers are usually listening for exactly this framing.
- Bring up streaming explicitly and its knock-on effects on billing
  (final token count not known until stream completes) — a good
  cross-cutting detail that connects this note back to billing.
- Be ready to name AI-specific retry nuances (rate limits, content policy
  rejections, non-determinism) rather than just restating generic retry
  logic — shows depth specific to this domain.
