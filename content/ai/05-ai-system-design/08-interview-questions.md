# Interview Questions — AI System Design

A mix of conceptual, technical, and scenario/whiteboard-style design
questions with model answers.

---

## Conceptual

**Q1. What is RAG and why would you use it instead of fine-tuning?**
A: RAG (Retrieval-Augmented Generation) retrieves relevant external
information at query time and inserts it into the LLM's context, instead of
baking knowledge into the model's weights. It's preferable when data
changes frequently, needs to be swappable/auditable, or is too large/private
to fine-tune on — updating an index is far cheaper than retraining, and RAG
naturally supports citing sources. Fine-tuning is better suited to changing
behavior/format/tone rather than injecting fast-changing facts; many
systems use both together.

**Q2. What is an embedding, and why do we use vector similarity instead of
exact keyword matching?**
A: An embedding is a dense vector representation of text (or other data)
such that semantically similar inputs land close together in vector space.
Vector similarity captures meaning rather than exact wording, so it can
match a query to relevant text even when the phrasing differs — something
pure keyword matching misses. In practice, hybrid search (dense + keyword)
is often used since embeddings alone are weaker on exact-match needs like
IDs or rare terms.

**Q3. What's the difference between an ANN (approximate nearest neighbor)
index and exact search, and why does it matter?**
A: Exact/brute-force search compares a query vector against every stored
vector — accurate but O(n), too slow at scale. ANN indexes (HNSW, IVF, etc.)
trade a small amount of recall for much faster search by organizing vectors
into structures (graphs, clusters) that let you skip most comparisons. At
production scale (millions+ of vectors) ANN is essentially required.

**Q4. What distinguishes an "agent" from a standard chatbot/LLM call?**
A: An agent can autonomously plan and execute a sequence of actions —
looping through reasoning, tool calls, and observations — to achieve a goal,
rather than producing one response to one input. Tool use, multi-step
planning, and often persistent memory are the defining features.

**Q5. Explain tool calling end-to-end.**
A: The application provides the model with tool definitions (name,
description, parameter schema). Given a request, the model may emit a
structured tool call (name + arguments) instead of free text. The host
application — not the model — executes the actual function/API call, then
returns the result to the model as a new turn, which the model uses to
continue reasoning or produce a final answer.

**Q6. What's the difference between short-term and long-term memory in an
LLM application?**
A: Short-term/working memory is the current conversation held in the
context window — bounded by the model's context length. Long-term memory
persists across sessions (facts, preferences, past interactions) and is
typically stored externally (often in a vector DB or structured store) and
retrieved/injected into context as relevant, rather than kept in the prompt
permanently.

**Q7. What are guardrails, and why can't system prompt instructions alone
be relied on for safety?**
A: Guardrails are mechanisms layered around the model — input filtering,
output validation, permission scoping, human confirmation for risky
actions — that enforce safety/reliability structurally rather than relying
purely on the model choosing to follow instructions. Prompt instructions
can be bypassed (prompt injection, edge cases, model error), so reliable
systems enforce constraints outside the model's discretion wherever
possible (e.g., a refund tool that hard-caps amount, rather than just
telling the model "don't refund more than $50").

---

## Technical

**Q8. How would you choose a chunk size for a RAG pipeline?**
A: It depends on the "natural unit of meaning" for the content and the
downstream use — smaller chunks (e.g., paragraph-level) give more precise
retrieval but risk losing context; larger chunks preserve context but dilute
relevance and add noise/cost. I'd start from structure-aware chunking
(split on headings/paragraphs rather than fixed character counts), add
overlap to avoid cutting key info at boundaries, and then tune empirically
using retrieval metrics (recall@k) on a labeled eval set rather than
guessing a single "right" size.

**Q9. When would you use hybrid search instead of pure vector search?**
A: When queries include exact-match elements embeddings handle poorly —
IDs, product codes, names, rare technical terms — dense retrieval alone can
miss the right document even though a keyword search would find it
trivially. Hybrid search (dense + BM25/keyword, merged via a fusion method
like reciprocal rank fusion) covers both semantic and exact-match cases.

**Q10. What is re-ranking and why add it after initial retrieval?**
A: Initial retrieval (via ANN/dense search) is optimized for speed over
precision — it's a cheap bi-encoder comparison. Re-ranking takes the
top-N candidates from that first pass and scores them with a more accurate
but expensive model (e.g., a cross-encoder that jointly encodes query and
document) to reorder for precision. This two-stage approach balances
overall system latency against retrieval quality.

**Q11. How do you decide between a single-agent loop and a multi-agent
architecture?**
A: Multi-agent decomposition earns its complexity when sub-tasks are
distinct enough to benefit from separate specialized prompts/tools/context
(e.g., a research agent vs. a coding agent), or when sub-tasks can run in
parallel. For most tasks, a single agent with a well-scoped toolset is
simpler, cheaper, and easier to debug — I'd default to single-agent unless
there's a concrete reason (specialization, parallelism, isolation) to add
coordination overhead.

**Q12. What stopping conditions would you build into an agent loop?**
A: A max-iteration/step cap, a timeout, detection of repeated identical
tool calls (loop detection), and an explicit fallback path where the agent
reports it couldn't complete the task rather than looping indefinitely or
guessing. For high-stakes actions, also a required human-confirmation step
that halts autonomous execution.

**Q13. How would you evaluate a RAG system in production?**
A: Split into retrieval and generation metrics. Retrieval: recall@k,
precision@k, MRR against a labeled query-document set. Generation:
faithfulness/groundedness (does the answer stay within retrieved context,
often checked via an LLM-as-judge or entailment model), answer relevance,
and citation accuracy. I'd also track end-to-end user signals (thumbs
up/down, follow-up question rate) as a real-world complement to offline
metrics.

---

## Scenario / Design

**Q14. Design a RAG-based internal documentation assistant for a company
with strict access control (some docs are team-restricted).**
A: Key points to hit: ingestion pipeline that preserves document-level
permission metadata; retrieval must filter by the requesting user's
permissions _before or during_ vector search, not after (to avoid leaking
restricted content into context even transiently); embeddings/index kept
in sync with an access-control source of truth via incremental
re-indexing on permission changes; generation step instructed to answer
only from retrieved (already-filtered) context with citations; logging for
audit; guardrail to refuse answering if retrieval returns nothing (avoid
hallucinating from parametric knowledge).

**Q15. Design a customer-support agent that can look up orders and issue
refunds.**
A: Tools: order lookup (read-only), refund issuance (side-effecting).
Guardrails: refund tool should hard-enforce business rules server-side
(max amount, order eligibility) rather than trusting the model's judgment;
require explicit user confirmation before executing a refund above a
threshold; log every tool call with reasoning for audit; cap autonomous
refund actions per session; fallback to human escalation if the agent is
uncertain or the user disputes the outcome. Memory: short-term
conversation context is enough for most cases; persistent memory of past
support interactions could help context but must respect data retention
and privacy policies.

**Q16. A RAG chatbot is hallucinating answers that sound plausible but
aren't supported by the retrieved documents. How do you debug and fix
this?**
A: First isolate whether it's a retrieval problem (right documents not
retrieved) or a generation problem (right documents retrieved but ignored).
Check retrieval metrics/manually inspect retrieved chunks for a sample of
failing queries. If retrieval is fine: tighten the prompt to require
answering only from context, add a faithfulness/groundedness check as an
output guardrail, and consider requiring inline citations so ungrounded
claims are more visible/detectable. If retrieval is the problem: revisit
chunking, try hybrid search, add re-ranking, or check for an embedding
model/domain mismatch.

**Q17. How would you design the memory system for a personal AI assistant
that should remember user preferences across sessions?**
A: Use a structured/semantic memory store for durable facts (preferences,
recurring constraints) rather than raw transcript storage — more reliable
and compact. A separate lightweight classification step decides what's
memory-worthy from a conversation before writing it, to avoid storing
noise. At the start of a new session, retrieve relevant memories (via
vector search or direct profile lookup) and inject only what's relevant to
the current request, rather than dumping the entire memory store into
context. Include an update/conflict-resolution policy for when new
information contradicts old memory, and give the user visibility/control
to view or delete stored memories.

**Q18. What would you monitor in production for an LLM system with RAG,
tools, and agents all in the pipeline?**
A: Retrieval quality signals (are retrieved chunks relevant — sampled
human review or automated groundedness checks), tool-call success/error
rates, agent loop length/timeout rate, latency and cost per request broken
down by pipeline stage, guardrail trigger rates (to catch both
over-blocking and under-blocking), and user-facing quality signals
(thumbs up/down, escalation rate to human support). Full request tracing
(input → retrieved context → tool calls → output) is essential for root-
causing individual failures reported by users.
