# Memory (for LLM Applications & Agents)

## Why memory is needed

LLMs are stateless between calls — each request only "knows" what's in its
context window. Memory systems give an application continuity: recalling
earlier parts of a conversation, facts about the user, or outcomes of past
sessions, without re-sending everything every time (which doesn't scale with
context window limits and cost).

## Types of memory

### 1. Short-term / working memory

- The current conversation's message history, held directly in the context
  window.
- Limited by the model's context window size; long conversations eventually
  need trimming, summarization, or retrieval instead of raw inclusion.

### 2. Long-term memory

- Persists across sessions: facts about the user, past decisions,
  preferences, prior task outcomes.
- Usually implemented as an external store (often a vector DB, sometimes a
  structured DB) that's queried and injected into context as needed, rather
  than kept in the prompt permanently.

### 3. Episodic memory

- Records of specific past events/interactions ("last Tuesday the user
  asked about X and we did Y") — useful for continuity and for agents that
  need to learn from past task attempts.

### 4. Semantic memory

- Distilled facts/knowledge extracted from interactions (e.g., "user prefers
  metric units," "user's timezone is PST") rather than raw transcripts —
  more compact and more directly useful for personalization.

### 5. Procedural memory

- "How to do things" — learned strategies, tool-use patterns, or successful
  workflows an agent can reuse, as opposed to facts.

## Common implementation patterns

- **Sliding window + summarization** — keep the most recent N messages
  verbatim, periodically summarize older messages into a compact block to
  preserve context without hitting token limits.
- **Retrieval-based memory** — store memory items as embeddings in a vector
  DB; at each turn, retrieve the most relevant past memories given the
  current query (essentially RAG, but the corpus is the user's own history).
- **Structured memory / key-value facts** — extract discrete facts into a
  structured store (e.g., a user-profile table) rather than raw text —
  more reliable for things like preferences or settings that shouldn't
  drift or be "forgotten" due to imperfect retrieval.
- **Memory write policy** — deciding _what_ to persist (not everything is
  worth remembering) — often a separate LLM call classifies whether a piece
  of conversation is memory-worthy before writing it to long-term storage.
- **Memory conflict resolution** — new information can contradict old
  memory (user changes their preference); systems need an update/overwrite
  policy rather than blindly appending forever.

## Design considerations

- **Precision vs. recall in retrieval-based memory** — retrieving too much
  irrelevant memory pollutes context and can confuse the model; too little
  misses relevant continuity.
- **Staleness** — old memories can become outdated (a stated preference may
  no longer hold); systems may need expiry, confidence decay, or
  re-confirmation strategies.
- **Privacy/user control** — users often need to view, correct, or delete
  what's been remembered about them — a product and compliance
  requirement, not just a technical one.
- **Cost** — every memory retrieval is an extra lookup (and often an extra
  embedding call); write-time filtering (deciding what's worth
  remembering) helps control both storage and retrieval cost.

## Interview-relevant talking points

- Distinguish short-term (context window) memory from long-term
  (persisted, retrieved) memory clearly — a very common opening question.
- Be able to describe how you'd design memory for a specific product (e.g.,
  a coding assistant remembering a user's coding style preferences across
  sessions) — what to store, how to store it, when to retrieve it.
- Discuss the tradeoff between raw transcript storage (complete but noisy,
  expensive to retrieve well) and distilled/structured facts (compact,
  reliable, but lossy).
