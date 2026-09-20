# AI System Design — Interview Prep Overview

Notes covering the core building blocks interviewers expect for "AI system
design" interviews — the LLM-application analogue of traditional system
design rounds. Focus is on RAG pipelines, agentic systems, and the
supporting infrastructure (vector DBs, embeddings, memory, tool calling,
guardrails).

## Contents

1. `01-rag.md` — Retrieval-Augmented Generation: architecture, pipeline
   stages, failure modes.
2. `02-vector-databases.md` — how vector DBs work, indexing algorithms,
   comparison of options.
3. `03-embeddings.md` — what embeddings are, how they're produced and
   evaluated, chunking strategy.
4. `04-ai-agents.md` — agent architectures, planning loops, multi-agent
   systems.
5. `05-memory.md` — short-term vs long-term memory, memory architectures for
   agents.
6. `06-tool-calling.md` — function/tool calling mechanics, design patterns,
   failure handling.
7. `07-guardrails.md` — safety, reliability, and correctness guardrails for
   production AI systems.
8. `08-interview-questions.md` — question bank spanning conceptual,
   architectural, and scenario/design questions, with model answers.

## How to use this

- These topics build on each other: embeddings → vector DBs → RAG → agents
  that use RAG and tools → memory that persists across agent turns →
  guardrails that wrap the whole system. Read roughly in this order if
  you're building up from scratch.
- For system-design-style interviews, practice sketching the architecture
  end-to-end (ingestion → retrieval → generation → guardrails) out loud —
  interviewers care as much about how you reason about tradeoffs as the
  final answer.
- Use the question bank at the end for whiteboard-style design prompts, not
  just definitions.
