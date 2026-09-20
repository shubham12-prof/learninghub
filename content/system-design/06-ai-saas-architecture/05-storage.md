# Storage

## What needs to be stored in an AI SaaS product

- **Structured application data** — users, orgs, plans, billing records,
  job status — standard relational data, same as any SaaS product.
- **Conversation/interaction history** — prompts, generated outputs,
  message threads — often high-volume, append-heavy, read-mostly-recent
  (similar access pattern to the chat-application message storage
  problem).
- **Uploaded source documents/files** — if the product ingests user
  documents (e.g., for RAG-style features) — same considerations as the
  file-upload-system topic: object storage for the bytes, metadata in the
  primary database.
- **Vector embeddings** — for products with retrieval/semantic-search
  features (RAG over the user's own documents/knowledge base) — a vector
  database or vector-search-capable store, as covered in the AI-system-
  design topic.
- **Generated artifacts** — images, audio, longer documents produced by
  the AI — typically stored as blobs in object storage, referenced by
  metadata records, same pattern as file uploads.

## Data model considerations specific to AI SaaS

- **Multi-tenancy isolation at the storage layer, not just the application
  layer** — every query/table should be scoped by org/tenant ID, and this
  should be enforced as close to the data layer as practical (e.g.,
  row-level security in Postgres, or a strict convention/middleware that
  makes it very hard to accidentally write a cross-tenant query) — given
  that stored content here is often sensitive (business documents, private
  conversations), a tenant-isolation bug is a severe incident, not a minor
  bug.
- **Conversation/thread structure** — similar to chat-application message
  storage: messages ordered within a conversation, with a sortable ID or
  timestamp, and reasonably efficient "get the last N messages" access for
  loading a conversation view.
- **Versioning of generated content** — if users can regenerate/edit
  AI outputs, decide whether to keep history (versions) or only the
  latest — relevant for both UX (undo/history) and cost/audit purposes
  (what was actually generated and shown to the user, useful for disputes
  or debugging quality issues).

## Vector storage for RAG-style features

- If the product lets users "chat with their documents" or similar,
  uploaded documents need to be chunked and embedded (see the AI-system-
  design embeddings/RAG notes for the general mechanics), with embeddings
  stored per-tenant (critical: retrieval must never return another
  tenant's chunks — a filtering requirement on every vector search, not
  optional).
- Consider whether embeddings live in a shared multi-tenant vector index
  with strict metadata filtering by tenant, or fully separate indexes per
  tenant (stronger isolation guarantee, more operational overhead at
  scale) — a real tradeoff to name if this comes up, similar to the
  general multi-tenancy data-isolation question but specific to vector
  search implementations, where filter-based isolation is easier to get
  subtly wrong than a hard schema/database boundary.

## Data retention & deletion

- AI SaaS products often have **explicit data retention requirements**
  (contractual, regulatory, or product-driven) — e.g., "delete
  conversation history after 30 days," or "immediately and completely
  delete all data on account deletion, including embeddings and any
  provider-side data if applicable."
- This needs to span every place the data lives: primary DB, object
  storage, vector store, logs/analytics, and potentially caches — a
  deletion request handled in only one of these leaves a real, and
  increasingly regulated, gap (GDPR/CCPA-style "right to deletion"
  obligations are directly relevant here given how much personal/business
  content these products store).
- Some products also need to track/respect whether user data was used to
  train or fine-tune models (a distinct, product-level policy question
  from general data retention) — worth a brief mention if the interview
  touches privacy/compliance.

## Interview-relevant talking points

- Bring up multi-tenant isolation at the storage layer explicitly and
  early — it's the single highest-stakes storage concern specific to this
  domain, more so than in a typical SaaS product, given the sensitivity of
  stored prompts/documents.
- Be ready to discuss the tenant-isolation tradeoff for vector storage
  specifically (shared index + metadata filter vs. separate indexes per
  tenant) if the product has RAG-style features — a good, specific,
  differentiated answer.
- Mention data retention/deletion as spanning multiple storage systems,
  not just the primary database — a detail that shows production/
  compliance awareness.
