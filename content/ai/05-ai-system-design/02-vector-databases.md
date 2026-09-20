# Vector Databases

## What they are

A vector database stores high-dimensional embedding vectors and provides
fast **similarity search** — given a query vector, find the k most similar
stored vectors (nearest neighbors) by a distance metric (cosine similarity,
dot product, or Euclidean/L2 distance). They're the retrieval backbone of
most RAG systems.

## Why not a regular database?

Traditional databases index on exact-match or range queries (B-trees,
hashing). Similarity search over dense vectors needs specialized indexes
because brute-force nearest-neighbor search (comparing the query to every
stored vector) doesn't scale — it's O(n) per query. Vector DBs implement
**approximate nearest neighbor (ANN)** algorithms that trade a small amount
of recall for large speedups.

## Core indexing algorithms

- **HNSW (Hierarchical Navigable Small World)** — a multi-layer graph
  structure where search greedily navigates from coarse to fine layers.
  Very popular default: strong recall/speed tradeoff, but memory-heavy
  (full graph in RAM).
- **IVF (Inverted File Index)** — clusters vectors (e.g., via k-means) into
  buckets ("Voronoi cells"); a query only searches the nearest buckets
  instead of the whole dataset. Often combined with product quantization
  (IVF-PQ) to compress vectors and reduce memory.
- **Product Quantization (PQ)** — compresses vectors into compact codes to
  reduce memory footprint, at some cost to precision — often paired with
  IVF or HNSW.
- **Flat/brute-force index** — exact search, no approximation; fine for
  small datasets or as a correctness baseline, too slow at scale.

## Key parameters/tradeoffs

- **Recall vs. latency vs. memory** — the central tradeoff in every ANN
  index. HNSW: high recall, fast queries, high memory. IVF-PQ: lower
  memory, lower recall, tunable via number of clusters/probes.
- **Distance metric** — cosine similarity (most common for text embeddings,
  scale-invariant), dot product (used when embeddings are normalized;
  faster), Euclidean (used less often for text, more common for image/
  audio embeddings depending on model).
- **Filtering (hybrid search)** — combining vector similarity with metadata
  filters (e.g., `date > X AND source = "internal"`) — implementation
  matters a lot: pre-filtering (filter then search) vs. post-filtering
  (search then filter) affects both recall and latency.
- **Sharding/scaling** — how the index is partitioned across nodes as data
  grows; affects update latency and query fan-out cost.
- **Update/delete support** — some ANN structures (HNSW) handle inserts
  better than deletes; frequent updates can require periodic index rebuilds.

## Common options (as of recent knowledge — verify current state for an

interview)

| Type                                      | Examples                                                                                             |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Dedicated vector DB services              | Pinecone, Weaviate, Qdrant, Milvus/Zilliz                                                            |
| Vector search added to existing DBs       | pgvector (Postgres), Redis (RediSearch), Elasticsearch/OpenSearch (kNN), MongoDB Atlas Vector Search |
| Library-level (in-process, not a full DB) | FAISS, ScaNN, Annoy                                                                                  |

## Interview-relevant talking points

- Be able to explain _why_ ANN is needed (scale) rather than just naming
  algorithms.
- Understand the recall/latency/memory triangle and how to reason about it
  given a workload (e.g., "10M vectors, sub-100ms latency, limited RAM" →
  favor IVF-PQ over flat HNSW).
- Know that vector DB choice is also an infra decision (managed vs.
  self-hosted, existing stack integration, cost model) — not purely an
  algorithms question.
- Understand hybrid search (dense + sparse/BM25) as a common way to fix
  vector search's weakness on exact-match queries (IDs, rare terms, codes).
