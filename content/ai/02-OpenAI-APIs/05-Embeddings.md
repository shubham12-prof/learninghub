# OpenAI APIs — Embeddings

## 1. What are Embeddings?

An embedding is a vector (list of floating-point numbers) that represents the semantic meaning of a piece of text (or image, in multimodal models), positioned in a high-dimensional space such that semantically similar inputs have vectors that are close together.

```
"The cat sat on the mat"  -> [0.021, -0.114, 0.83, ..., 0.019]  (e.g., 1536 dimensions)
"A feline rested on a rug" -> [0.019, -0.108, 0.81, ..., 0.022]  (very close to the above vector!)
"The stock market crashed"  -> [-0.55, 0.32, -0.11, ..., 0.44]   (far away from both cat sentences)
```

## 2. Generating Embeddings

```python
from openai import OpenAI
client = OpenAI()

response = client.embeddings.create(
    model="text-embedding-3-small",
    input="The quick brown fox jumps over the lazy dog.",
)

vector = response.data[0].embedding
print(len(vector))  # e.g., 1536
```

### Batch Embeddings (Multiple Texts at Once)

```python
response = client.embeddings.create(
    model="text-embedding-3-small",
    input=[
        "The quick brown fox jumps over the lazy dog.",
        "A fast auburn canine leaps above a sleepy hound.",
        "The stock market saw significant gains today.",
    ],
)

vectors = [item.embedding for item in response.data]
```

## 3. Measuring Similarity — Cosine Similarity

```python
import numpy as np

def cosine_similarity(a, b):
    a, b = np.array(a), np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

sim1 = cosine_similarity(vectors[0], vectors[1])  # cat sentences -> high, e.g. 0.85
sim2 = cosine_similarity(vectors[0], vectors[2])  # unrelated -> low, e.g. 0.15
print(sim1, sim2)
```

OpenAI's `text-embedding-3-*` models are normalized such that cosine similarity and dot product give proportional results (dot product is slightly faster to compute since normalization can be skipped if vectors are already unit length).

## 4. Available Embedding Models (General Guidance)

| Model                    | Notes                                                                        |
| ------------------------ | ---------------------------------------------------------------------------- |
| `text-embedding-3-small` | Cheaper, faster, smaller dimensionality — good default for most use cases    |
| `text-embedding-3-large` | Higher quality/dimensionality, higher cost — for accuracy-critical retrieval |
| `text-embedding-ada-002` | Older generation, largely superseded by the v3 models                        |

Always check the current docs/pricing page for the latest model lineup and dimension counts.

## 5. Reducing Embedding Dimensions

Newer embedding models support truncating dimensions while preserving most of the semantic signal (via "Matryoshka" representation learning) — useful for reducing storage/compute cost.

```python
response = client.embeddings.create(
    model="text-embedding-3-large",
    input="Some text to embed",
    dimensions=256,  # request a smaller vector than the model's default
)
```

## 6. Use Case: Semantic Search

```python
documents = [
    "How to reset your password",
    "Refund and return policy",
    "Shipping times and tracking",
]

doc_embeddings = [
    item.embedding
    for item in client.embeddings.create(model="text-embedding-3-small", input=documents).data
]

def semantic_search(query, documents, doc_embeddings, top_k=2):
    query_embedding = client.embeddings.create(
        model="text-embedding-3-small", input=query
    ).data[0].embedding

    scores = [cosine_similarity(query_embedding, doc_emb) for doc_emb in doc_embeddings]
    ranked = sorted(zip(documents, scores), key=lambda x: x[1], reverse=True)
    return ranked[:top_k]

print(semantic_search("I forgot my login credentials", documents, doc_embeddings))
# [('How to reset your password', 0.71), ('Refund and return policy', 0.18)]
```

## 7. RAG (Retrieval-Augmented Generation) Pipeline

```
1. Chunk documents into passages
2. Embed each chunk, store in a vector database (Pinecone, Weaviate, pgvector, FAISS, etc.)
3. On a user query: embed the query, retrieve top-k most similar chunks
4. Inject retrieved chunks into the prompt as context
5. Generate an answer grounded in that retrieved context
```

```python
def rag_answer(query, vector_db, top_k=3):
    query_embedding = client.embeddings.create(
        model="text-embedding-3-small", input=query
    ).data[0].embedding

    retrieved_chunks = vector_db.similarity_search(query_embedding, top_k=top_k)
    context = "\n\n".join(retrieved_chunks)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": f"Answer using ONLY this context:\n{context}"},
            {"role": "user", "content": query},
        ],
    )
    return response.choices[0].message.content
```

This is the core pattern behind most "chat with your documents" applications — see also `06-File-Search.md` for OpenAI's hosted equivalent that handles chunking/retrieval for you.

## 8. Storing Embeddings — Vector Databases

```python
# Example with a simple in-memory FAISS index
import faiss
import numpy as np

dimension = 1536
index = faiss.IndexFlatL2(dimension)
index.add(np.array(vectors).astype('float32'))

query_vector = np.array([query_embedding]).astype('float32')
distances, indices = index.search(query_vector, k=3)  # top-3 nearest neighbors
```

| Option   | Notes                                               |
| -------- | --------------------------------------------------- |
| FAISS    | Local, fast, in-memory or on-disk, no managed infra |
| Pinecone | Fully managed, cloud-hosted vector DB               |
| Weaviate | Open-source, can self-host or use managed cloud     |
| pgvector | Postgres extension — good if already using Postgres |
| Chroma   | Lightweight, popular for prototyping/local RAG apps |

## 9. Other Use Cases Beyond Search

- **Clustering** — group similar documents/support tickets together (e.g., k-means on embeddings).
- **Classification** — embed text, then train a lightweight classifier (logistic regression) on top of embeddings instead of fine-tuning an LLM.
- **Recommendation** — find "similar items" by embedding product descriptions.
- **Deduplication** — detect near-duplicate content via high cosine similarity.
- **Anomaly detection** — flag outlier embeddings far from typical clusters.

```python
from sklearn.linear_model import LogisticRegression

# Train a simple classifier on top of embeddings (fast, cheap, no fine-tuning needed)
clf = LogisticRegression()
clf.fit(X_train_embeddings, y_train_labels)
predictions = clf.predict(X_test_embeddings)
```

## 10. Best Practices

1. Use `text-embedding-3-small` by default; upgrade to `-large` only if retrieval quality genuinely requires it (test both on your own data/queries).
2. Chunk long documents sensibly (by paragraph/section, with some overlap) before embedding — a single embedding for an entire long document loses fine-grained detail.
3. Cache embeddings for content that doesn't change — re-embedding identical text wastes cost.
4. Normalize your similarity metric choice (cosine similarity is standard and works well with OpenAI's normalized embeddings).
5. Use a proper vector database for production-scale semantic search rather than brute-force comparison for large datasets.
6. Combine embeddings-based retrieval with keyword/BM25 search ("hybrid search") for best results in many real-world RAG systems — pure semantic search can miss exact keyword matches (e.g., product SKUs, names).
