# Cloud Storage

## The central architectural decision: don't proxy file bytes through your app servers

The single most important design choice in this whole topic: route the
actual file bytes **directly from the client to object storage** (e.g.,
S3, GCS, Azure Blob Storage), not through your application servers. If
every upload's bytes pass through your app servers, they become a
bottleneck (bandwidth, memory, connection count) for something that's
purely data transfer and doesn't need application logic in the middle.

## The presigned URL pattern

This is how direct-to-storage upload is achieved without giving clients
your storage credentials:

1. **Client requests an upload authorization** from your backend (a normal,
   lightweight API call): "I want to upload a file named X, this large,
   this content-type."
2. **Backend validates the request** (auth, permissions, quota checks,
   file type/size limits) and generates a **presigned URL** (or a
   presigned POST policy) — a temporary, cryptographically signed URL that
   grants time-limited permission to upload directly to a specific
   location in your storage bucket, without needing your storage
   provider's actual credentials.
3. **Client uploads directly to storage** using that presigned URL —
   bytes never touch your application servers.
4. **Backend is notified of completion**, either via the client calling
   back your API after a successful upload, or (more robustly) via a
   **storage event notification** (e.g., S3 event → SQS/Lambda) that fires
   when the object actually lands in the bucket — the event-based approach
   is more reliable since it doesn't depend on the client reliably calling
   back (client could crash/close the tab right after the upload
   succeeds).
5. **Backend records metadata** (owner, filename, size, storage key,
   upload timestamp) in your primary database, associating the stored
   object with your application's data model.

## Why event-based completion notification is preferred over client callback

- The client's job (uploading bytes) and your system's job (knowing an
  upload completed and reacting to it — updating metadata, triggering
  processing) are decoupled. If you only rely on the client calling back,
  a crashed client leaves your metadata store unaware of a successfully
  uploaded file (an orphaned object with no corresponding DB record) or,
  worse, could be used to fake completion by calling the callback API
  without actually uploading. Storage-level events are the source of truth
  because they only fire when the object provably exists in storage.

## Metadata storage

- Store file metadata (owner, name, size, MIME type, storage key/path,
  processing status, created_at) in your primary database, **separately**
  from the file bytes themselves — the database should never hold the
  actual file content, only a reference (the storage key/URL) to it.
- This metadata table is also where processing status lives (e.g.,
  `pending → processing → ready → failed`) if the file needs async
  post-processing (see image-processing note).

## Access control for uploaded/stored files

- Storage buckets should default to **private**, not publicly readable.
- Serving files back to authorized users is typically done via
  **presigned download URLs** as well (short-lived, scoped to a specific
  object) rather than exposing the bucket publicly — the same
  signed-URL pattern used for uploads, mirrored for reads.
- For frequently-accessed public content (e.g., served images), a **CDN**
  in front of the storage bucket (or in front of a public-read subset of
  it) reduces latency and offloads repeat-read traffic from the storage
  service directly.

## Storage tiering / lifecycle

- Cloud object stores typically offer storage classes/tiers with different
  cost/latency/durability tradeoffs (e.g., S3 Standard vs. Infrequent
  Access vs. Glacier) — worth mentioning if the interview touches cost
  optimization: automatically transitioning older, rarely-accessed files
  to cheaper cold storage tiers via lifecycle policies.

## Interview-relevant talking points

- Lead with "don't proxy bytes through app servers" as the core principle
  — nearly everything else in this note is a consequence of that one
  decision, and stating it explicitly upfront is a strong opening move in
  this interview.
- Be ready to fully explain the presigned URL flow step by step, including
  where validation (auth, quota, file-type checks) happens — it must
  happen _before_ issuing the presigned URL, since you lose the ability to
  intercept/validate the actual upload once it goes direct-to-storage.
- Explain why storage-event-based completion notification is more robust
  than trusting a client callback — a common, well-targeted follow-up
  question.
