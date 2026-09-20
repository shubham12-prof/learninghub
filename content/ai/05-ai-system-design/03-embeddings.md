# Embeddings

## What embeddings are

An embedding is a dense numerical vector representation of a piece of data
(text, image, audio) such that semantically similar inputs are mapped to
nearby points in the vector space. Distance/similarity between vectors
approximates semantic similarity between the original inputs.

## How text embedding models are trained (high level)

- Typically a transformer encoder (or a repurposed decoder) trained with a
  **contrastive objective**: pull embeddings of semantically related pairs
  (e.g., a question and its correct answer passage) closer together, push
  unrelated pairs apart.
- Trained on large corpora of paired/related text (search query-document
  pairs, paraphrase pairs, NLI pairs, etc.).
- Output is usually a fixed-size vector (e.g., 384, 768, 1536, 3072
  dimensions) via pooling the token representations (mean pooling, or a
  dedicated `[CLS]`-style token).

## Choosing an embedding model

- **Dimensionality** — higher dimensions can capture more nuance but cost
  more storage/compute at scale; many modern models offer configurable
  dimensions (e.g., via Matryoshka representation learning) to trade
  quality for size.
- **Domain fit** — general-purpose embedding models vs. domain-tuned ones
  (legal, medical, code). Code search benefits from code-specific embedding
  models, for instance.
- **Symmetric vs. asymmetric tasks** — some models are optimized for
  query-to-document retrieval (asymmetric: short query, long document) vs.
  semantic similarity between same-length texts (symmetric) — using the
  wrong type can hurt retrieval quality.
- **Multilingual support** — needed if the corpus/queries span languages.
- **Cost and latency** — API-based embedding calls vs. self-hosted open
  models; batch embedding throughput matters at ingestion scale.

## Chunking strategy (directly affects embedding quality)

- **Fixed-size chunking** — simplest, splits every N tokens/characters,
  often with overlap; can awkwardly cut sentences/ideas.
- **Semantic/structure-aware chunking** — split on natural boundaries
  (paragraphs, headings, sentences) so each chunk is a coherent unit of
  meaning — generally produces better embeddings than arbitrary fixed
  splits.
- **Recursive chunking** — try large boundaries first (sections), fall back
  to smaller ones (paragraphs, sentences) if a chunk is still too large.
- **Overlap** — repeating a bit of text between consecutive chunks so
  information near a chunk boundary isn't lost from either chunk's context.
- Chunk size should roughly match the "unit of meaning" you want to
  retrieve — a FAQ entry might be one chunk; a legal contract might need
  clause-level chunks.

## Evaluating embeddings

- **Intrinsic:** benchmark suites like MTEB (Massive Text Embedding
  Benchmark) across retrieval, clustering, classification tasks.
- **Extrinsic (task-specific):** recall@k / MRR / NDCG on your own labeled
  query-document pairs — the most reliable signal for a specific RAG use
  case, since general benchmarks may not reflect your domain.
- **Drift monitoring:** if you change the embedding model, you must
  re-embed the entire corpus — old and new embeddings aren't comparable in
  the same vector space.

## Interview-relevant talking points

- Explain the difference between symmetric and asymmetric embedding tasks
  and why using the wrong model type hurts retrieval.
- Explain why chunking strategy matters as much as the embedding model
  itself — bad chunking can sabotage even a great embedding model.
- Be ready to discuss the operational cost of switching embedding models
  (full re-index required) as a system design consideration, not just a
  quality one.
