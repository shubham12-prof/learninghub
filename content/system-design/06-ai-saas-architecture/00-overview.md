# AI SaaS Architecture — Interview Prep Overview

Notes for the "design an AI-powered SaaS product" system design interview
(e.g., "design something like Jasper/Notion AI/an AI coding assistant
product"). This is a newer interview archetype that blends standard SaaS
concerns (auth, billing, multi-tenancy) with AI-specific ones (calling
LLM/model providers reliably and cost-effectively, handling long-running
generation as an async job, managing unpredictable latency and cost).

## Contents

1. `01-authentication.md` — user auth, API keys, multi-tenancy, and
   authorization for AI features specifically.
2. `02-billing.md` — usage-based billing for token/compute consumption,
   metering, plan limits, cost control.
3. `03-ai-providers.md` — integrating LLM/model providers, abstraction
   layers, fallback/multi-provider strategy, streaming.
4. `04-queues.md` — async job processing for long-running AI requests,
   backpressure, priority.
5. `05-storage.md` — storing conversations/documents/generated artifacts,
   vector storage for retrieval, data retention.
6. `06-monitoring.md` — observability for LLM calls specifically: cost,
   latency, quality/drift, and abuse detection.
7. `07-interview-questions.md` — question bank with model answers, plus a
   suggested 45-minute interview walkthrough structure.

## How to use this

- This topic is essentially "SaaS system design" plus a layer of
  AI-specific concerns bolted onto every classic component: auth needs to
  gate AI feature usage per plan, billing needs to meter unpredictable
  token consumption instead of flat seats, storage needs both regular data
  and vector embeddings, monitoring needs to track cost-per-request in
  addition to the usual latency/error metrics. Read each note with that
  "classic concept + AI-specific twist" framing in mind.
- The single idea that recurs most across sections: **AI provider calls
  are slow, expensive, and variable** — this one fact is why billing is
  usage-based rather than flat, why queues matter more here than in a
  typical CRUD SaaS, and why monitoring needs a cost/token dimension most
  systems don't need to track.
- Practice sketching: Client → API/Auth layer → (sync fast paths / async
  queue for long-running generation) → AI Provider abstraction layer
  (with fallback) → Storage (relational + vector) → Billing/metering
  hooked into every AI call → Monitoring wrapping the whole thing.
