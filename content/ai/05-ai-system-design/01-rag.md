# Retrieval-Augmented Generation (RAG)

## What RAG is and why it exists

RAG combines an LLM with an external retrieval step so the model can answer
using information it wasn't trained on (private docs, recent data, large
corpora) without fine-tuning. Instead of relying purely on parametric
knowledge, the system retrieves relevant text at query time and inserts it
into the prompt as context.

## Why not just fine-tune instead?

- Fine-tuning bakes knowledge into weights — expensive to update, doesn't
  scale to fast-changing data, and models still hallucinate facts they
  "learned" imprecisely.
- RAG keeps knowledge external and swappable: update the index, not the
  model. It also gives natural **citations/provenance** — you know exactly
  which document supported an answer.
- In practice, many production systems use both: fine-tuning for behavior/
  format/tone, RAG for facts.

## Standard RAG pipeline

1. **Ingestion (offline):**
   - Load documents → clean/parse → **chunk** into passages → generate
     **embeddings** for each chunk → store in a **vector database** (plus
     metadata for filtering).
2. **Retrieval (online, per query):**
   - Embed the user's query with the same embedding model.
   - Run a similarity search (ANN — approximate nearest neighbor) against
     the vector DB to get the top-k most relevant chunks.
   - Optionally **re-rank** the candidates with a more expensive cross-
     encoder for better precision.
3. **Augmentation:**
   - Insert the retrieved chunks into the prompt, usually with instructions
     like "answer using only the following context."
4. **Generation:**
   - The LLM generates an answer grounded in the retrieved context, ideally
     with citations back to source chunks.

## Key design decisions

- **Chunk size/overlap** — too large: irrelevant text dilutes the context
  and wastes tokens; too small: loses surrounding context needed to
  interpret a passage correctly. Overlap between chunks helps avoid cutting
  key information at a boundary.
- **Retrieval method** — pure dense vector search vs. hybrid search
  (dense + keyword/BM25) — hybrid often outperforms pure dense retrieval on
  exact-match queries (IDs, names, codes) that embeddings handle poorly.
- **Re-ranking** — a cheap first-pass retrieval (bi-encoder/ANN) followed by
  a more accurate but expensive re-ranking model (cross-encoder) on the
  top-N candidates is a common accuracy/cost tradeoff.
- **Top-k** — how many chunks to retrieve; too few misses relevant info, too
  many adds noise and cost.
- **Metadata filtering** — combining vector search with structured filters
  (date, source, permissions) for more precise, access-controlled retrieval.

## Advanced RAG patterns

- **Query rewriting/expansion** — using the LLM to reformulate a vague user
  query into a better search query before retrieval.
- **HyDE (Hypothetical Document Embeddings)** — generate a hypothetical
  answer first, embed _that_, and use it to retrieve — often better aligned
  with the target documents' embedding space than the raw question.
- **Multi-hop / iterative retrieval** — retrieve, read, decide if more
  information is needed, retrieve again (common in agentic RAG).
- **Graph RAG** — retrieving from a knowledge graph in addition to/instead
  of flat text chunks, useful for relationship-heavy queries.
- **Self-RAG / reflection** — the model critiques its own retrieved context
  or draft answer and re-retrieves if it judges the support to be weak.

## Common failure modes

| Symptom                            | Likely cause                                                           | Mitigation                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Hallucinated answer despite RAG    | Retrieval returned irrelevant chunks, or model ignored context         | Improve retrieval quality/re-ranking; add "answer only from context" instruction; add citation requirement |
| Missed obviously relevant document | Chunking split it awkwardly, or embedding model mismatch               | Tune chunk size/overlap; try hybrid search                                                                 |
| Slow responses                     | Large index, no ANN index, expensive re-ranking on too many candidates | Use approximate search indexes (HNSW/IVF), reduce re-rank candidate count                                  |
| Stale answers                      | Index not updated with new data                                        | Incremental re-indexing pipeline                                                                           |
| Answers leak unauthorized data     | No access-control filtering at retrieval time                          | Enforce permission metadata filters before returning chunks                                                |

## Evaluation

- **Retrieval metrics:** recall@k, precision@k, MRR (mean reciprocal rank).
- **Generation metrics:** faithfulness/groundedness (does the answer stay
  within the retrieved context), answer relevance, citation accuracy.
- Frameworks like RAGAS formalize these into an automated eval pipeline.
