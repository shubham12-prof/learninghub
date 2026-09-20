# OpenAI APIs — File Search

> Note: File Search is a hosted tool available through the Assistants API and the newer Responses API. Check current docs for exact parameter names/limits, as this feature has evolved across API generations.

## 1. What is File Search?

File Search is OpenAI's **managed retrieval-augmented generation (RAG)** tool — you upload documents, OpenAI handles chunking, embedding, indexing, and retrieval automatically, and the model can cite/reference relevant passages when answering questions. This saves you from building your own chunking + vector database + retrieval pipeline (compare to the manual `Embeddings` approach in the previous doc).

```
[Your Documents] --upload--> [Vector Store] (OpenAI-managed: chunking + embedding + indexing)
                                    |
[User Question] -----------> [Model + file_search tool] --retrieves relevant chunks--> [Grounded Answer]
```

## 2. Uploading Files

```python
from openai import OpenAI
client = OpenAI()

file = client.files.create(
    file=open("company_policy.pdf", "rb"),
    purpose="assistants",  # or the current purpose value for file search per docs
)
print(file.id)  # 'file-abc123'
```

## 3. Creating a Vector Store

```python
vector_store = client.vector_stores.create(name="Company Knowledge Base")

client.vector_stores.files.create(
    vector_store_id=vector_store.id,
    file_id=file.id,
)
```

### Batch Upload

```python
file_ids = []
for path in ["policy.pdf", "faq.pdf", "handbook.pdf"]:
    f = client.files.create(file=open(path, "rb"), purpose="assistants")
    file_ids.append(f.id)

batch = client.vector_stores.file_batches.create(
    vector_store_id=vector_store.id,
    file_ids=file_ids,
)
```

## 4. Using File Search in the Responses API

```python
response = client.responses.create(
    model="gpt-4o",
    input="What is our policy on late returns?",
    tools=[{
        "type": "file_search",
        "vector_store_ids": [vector_store.id],
    }],
)

print(response.output_text)
```

## 5. Inspecting Citations / Source Chunks

```python
for item in response.output:
    if item.type == "message":
        for content in item.content:
            if hasattr(content, "annotations"):
                for annotation in content.annotations:
                    print("Cited file:", annotation.file_citation.file_id)
```

File Search responses typically include annotations pointing back to which uploaded file (and often which chunk) supported a given claim — useful for building "show sources" UI, similar to citation-style answers.

## 6. Filtering by Metadata

```python
client.vector_stores.files.create(
    vector_store_id=vector_store.id,
    file_id=file.id,
    attributes={"department": "HR", "year": 2026},
)

response = client.responses.create(
    model="gpt-4o",
    input="What's the vacation policy?",
    tools=[{
        "type": "file_search",
        "vector_store_ids": [vector_store.id],
        "filters": {"type": "eq", "key": "department", "value": "HR"},
    }],
)
```

Metadata filtering lets you scope retrieval to a subset of documents (e.g., only search documents belonging to the current user's organization, or a specific category), which is important for multi-tenant applications.

## 7. Managing Vector Stores

```python
# List files in a vector store
files = client.vector_stores.files.list(vector_store_id=vector_store.id)

# Remove a file from a vector store (doesn't delete the underlying file)
client.vector_stores.files.delete(vector_store_id=vector_store.id, file_id=file.id)

# Delete the vector store entirely
client.vector_stores.delete(vector_store.id)

# Delete an uploaded file
client.files.delete(file.id)
```

## 8. Supported File Types (General Guidance)

Common formats: PDF, DOCX, TXT, Markdown, HTML, PPTX, and various code file extensions. There are size limits per file and per vector store — always check current documentation for exact limits, as they change with API updates.

## 9. File Search vs Manual Embeddings/RAG Pipeline

|                                | File Search (Managed)                      | Manual Embeddings + Vector DB                              |
| ------------------------------ | ------------------------------------------ | ---------------------------------------------------------- |
| Setup effort                   | Low — upload files, call the tool          | High — build chunking, embedding, storage, retrieval logic |
| Control over chunking strategy | Limited (some configuration available)     | Full control                                               |
| Cost                           | Storage + retrieval costs via OpenAI       | Your own vector DB hosting + embedding API costs           |
| Best for                       | Fast time-to-market, standard document Q&A | Custom retrieval logic, hybrid search, full infra control  |

## 10. Combining File Search with Other Tools

```python
response = client.responses.create(
    model="gpt-4o",
    input="Compare our current return policy to industry best practices online.",
    tools=[
        {"type": "file_search", "vector_store_ids": [vector_store.id]},
        {"type": "web_search"},
    ],
)
```

The model can combine internal document knowledge with live web search results in a single response when multiple tools are provided.

## 11. Common Use Cases

- **Internal knowledge base chatbots** (HR policies, engineering docs, onboarding materials).
- **Customer support assistants** grounded in product documentation/FAQs.
- **Legal/contract Q&A** over uploaded contracts.
- **Research assistants** searching across a corpus of uploaded papers/reports.

## 12. Best Practices

1. Organize documents into separate vector stores per logical domain/tenant when building multi-tenant applications, or use metadata filtering within a shared store.
2. Use metadata/attributes to enable precise filtering (department, date, access level) rather than relying purely on semantic relevance.
3. Surface citations/source annotations in your UI so users can verify claims against the original document.
4. Clean up unused files/vector stores to avoid unnecessary storage costs.
5. For highly custom retrieval needs (custom chunking strategies, hybrid keyword+semantic search, non-standard file types), consider a manual embeddings pipeline instead (see `05-Embeddings.md`).
6. Test retrieval quality with representative real user questions before shipping — chunking/retrieval defaults may not perfectly suit every document structure.
