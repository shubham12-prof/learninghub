# Interview Questions — AI SaaS Architecture

Question bank with model answers, plus a suggested time-boxed structure
for a 45-minute interview.

---

## Suggested 45-minute structure

| Time      | Activity                                                                                                                                  |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 0–5 min   | Clarify scope: what's the AI feature (chat, generation, RAG-over-documents)? B2B or consumer? Expected scale? Billing model expectations? |
| 5–10 min  | High-level architecture sketch: auth → API → sync/async split → AI provider layer → storage → billing/monitoring wrapping everything      |
| 10–18 min | Authentication & multi-tenancy: user auth, API keys, plan-gating, tenant isolation                                                        |
| 18–26 min | AI provider integration: abstraction layer, streaming, fallback, retry                                                                    |
| 26–33 min | Queues: sync vs async decision, backpressure, prioritization                                                                              |
| 33–40 min | Billing: metering, quota enforcement, cost/revenue timing mismatch                                                                        |
| 40–45 min | Monitoring & wrap-up: cost/quality monitoring, recap tradeoffs                                                                            |

This interview rewards candidates who treat **cost** as a first-class
architectural concern threaded through auth (plan-gating), billing
(metering), queues (provider capacity limits), and monitoring
(cost-per-request) — rather than bolting a "billing service" on as an
afterthought at the end.

---

## Conceptual

**Q1. What makes AI SaaS architecture different from a typical SaaS
product's architecture?**
A: The core difference is that AI provider calls are slow, expensive, and
variable in a way typical service dependencies aren't — every request has
a real, consumption-based cost (tokens), unpredictable latency (sub-second
to minutes), and non-deterministic output. This ripples through nearly
every layer: billing becomes usage-based instead of flat, queues become
more central (to handle latency variance), monitoring needs a cost and
quality dimension most systems don't track, and provider integration
needs its own abstraction layer for reliability and cost routing.

**Q2. Explain the two layers of authentication in this kind of system.**
A: End users (or their applications, via API keys) authenticate to your
product. Separately, your backend authenticates to the underlying AI
provider(s) using your own credentials — the end user never talks to the
AI provider directly or uses their own provider credentials. Your system
is responsible for metering which end user/org triggered each provider
call, since the provider itself has no visibility into your customers.

**Q3. Why is billing usually usage-based rather than flat-rate in these
products?**
A: Because the underlying cost structure (provider token/compute pricing)
is itself usage-based and can vary enormously between customers — a flat
rate either overcharges light users or risks losing money on heavy users
whose actual provider cost exceeds what they're paying. Usage-based or
credit-based billing keeps revenue aligned with the real, variable cost
being incurred on the customer's behalf.

**Q4. Why is a dedicated AI provider abstraction layer considered a best
practice rather than calling provider SDKs directly from application
code?**
A: It centralizes prompt/version management, enables fallback to a
secondary provider on outage, allows cost/capability-based routing
(cheap model for simple tasks, expensive model for complex ones) without
touching application logic, and makes it tractable to switch or add
providers later — a real, recurring need given how quickly the model
landscape changes. Scattering direct provider calls throughout the
codebase makes all of this much harder to change centrally.

---

## Technical

**Q5. How would you enforce that a free-tier user can't access a
premium-only model, given that they could call your API directly and
bypass any UI restriction?**
A: The check must happen server-side, at the point where the AI call is
about to be dispatched — resolving the user/org's plan and permitted
models as part of the same request path that triggers generation, not
just as a UI-level restriction. This is the same principle as any
server-side authorization check: never trust the client to self-enforce
access control.

**Q6. How do you avoid a race condition where two concurrent requests
both pass a "sufficient quota/credits" check and jointly overspend a
user's balance?**
A: Same class of problem as distributed rate limiting: use an atomic
check-and-decrement operation (e.g., an atomic decrement in Redis, or a
database transaction with proper isolation) rather than a separate
"read balance, then decrement" sequence, which is vulnerable to a
check-then-act race under concurrency.

**Q7. How would you decide whether an AI feature should be synchronous
(with streaming) or asynchronous (via a queue)?**
A: If the user is actively watching and the work is reasonably bounded,
synchronous with streaming keeps it feeling responsive even for requests
taking up to tens of seconds, since output appears progressively. If the
work is long-running/unbounded (batch processing, multi-step agent
workflows) or the user isn't expected to wait and watch, make it
asynchronous: submit to a queue, return a job ID immediately, and notify
or let the client poll on completion.

**Q8. Why can't you just scale up worker concurrency indefinitely to
handle more async AI job throughput?**
A: Throughput is ultimately capped by the AI provider's own rate limits
and by cost — even if you have unlimited worker capacity on your side,
exceeding the provider's rate limits produces 429 errors, and generating
more concurrent completions simply costs proportionally more money.
Worker pool concurrency needs to be tuned against provider-side limits
and budget, not scaled purely based on your own infrastructure capacity.

**Q9. Time-to-first-token vs. total generation time — why track both, and
which matters more for a chat interface?**
A: Time-to-first-token measures how quickly the user starts seeing any
output at all, which dominates perceived responsiveness in a streaming
interface — a chat UI that starts streaming within half a second feels
fast even if the full response takes ten seconds to complete. Total
generation time still matters for capacity planning, cost, and non-
streaming/batch use cases, but for an interactive chat interface,
time-to-first-token is the more important perceived-performance metric.

**Q10. How would you detect that a customer's API key is being misused
(e.g., compromised and used for unrelated, high-volume abuse) before it
causes major cost damage?**
A: Monitor for usage-pattern anomalies per API key/org — sudden spikes in
request volume or token consumption relative to that account's historical
baseline — rather than relying solely on a hard quota limit being hit
(which could still represent significant unwanted cost before the cap is
reached). Alert on anomalies for review, and consider automatic
throttling or temporary suspension pending confirmation for severe,
sudden spikes, similar in spirit to fraud-detection patterns in payment
systems.

---

## Scenario / Design

**Q11. Design the flow for a "chat with your documents" (RAG) feature in
this architecture, touching storage, AI providers, and billing.**
A: User uploads documents (direct-to-object-storage via presigned URL,
per the file-upload pattern); an async pipeline chunks and embeds them,
storing embeddings in a vector store with strict per-tenant filtering.
On a chat query, the backend retrieves relevant chunks (tenant-scoped
vector search), constructs a prompt via the AI-provider abstraction layer,
and streams the response back to the user. Both the embedding-generation
calls and the chat completion calls are metered against the org's usage/
billing, since both consume provider tokens/compute — worth explicitly
calling out that embedding costs, not just generation costs, need to be
tracked.

**Q12. A customer complains their bill is much higher than expected this
month. How would you investigate, and what would you build to prevent
this going forward?**
A: Investigate via per-request cost/usage logs (from metering) broken
down by model, feature, and time — look for anomalous spikes, a routing
bug sending requests to a more expensive model than intended, or
legitimate but unexpectedly high usage (e.g., a new integration calling
the API in a loop). Going forward: usage anomaly alerting (so both you
and, ideally, the customer get notified of spikes proactively rather than
finding out at invoice time), and configurable spend caps/alerts the
customer can set themselves for their own cost control and peace of mind.

**Q13. How would you design this system to support switching from OpenAI
to a different provider (or adding a second provider) with minimal
disruption?**
A: This is exactly what the AI-provider abstraction layer is for — as
long as application code calls the internal `generate()`-style interface
rather than a specific provider's SDK directly, adding or switching
providers is a change contained to that layer (a new provider
implementation behind the same interface), plus any necessary
prompt-format adaptation (different providers can have different optimal
prompting conventions) and updated cost-routing rules — not a
codebase-wide change.

**Q14. What would you monitor to catch a situation where output quality
has silently degraded (e.g., after a provider updates a model version)
without any errors being thrown?**
A: Standard error-rate/uptime monitoring wouldn't catch this, since
nothing is technically failing. Track quality proxies instead: user
regeneration rate (a spike suggests users are unhappy with first-attempt
output), explicit thumbs up/down feedback trends, and/or a sampled
automated quality-scoring pipeline (LLM-as-judge against a fixed rubric)
run periodically against a stable benchmark set — comparing scores over
time to catch drift. Where possible, pin to specific model versions
rather than a "latest" alias, so provider-side updates are an explicit,
observable change on your end rather than a silent one.
