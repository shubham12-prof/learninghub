# Multipart Upload

## What it is

An upload mechanism (implemented by most cloud object stores, e.g., S3's
Multipart Upload API) that splits a single large file into several
independently-uploaded **parts**, which the storage service later
reassembles into one final object. This is distinct from, but often
implemented using, HTTP `multipart/form-data` — worth clarifying the
terminology if it comes up: `multipart/form-data` is an HTTP encoding for
sending multiple fields (including a file) in one request, while cloud
storage "multipart upload" (S3-style) is an API pattern for uploading one
large object as several separate part-requests, potentially in parallel.
This note focuses on the latter, which is what matters for large-file
system design.

## Why it exists

Uploading a very large file (e.g., a multi-GB video) as a single HTTP
request has real problems:

- **A single network blip fails the entire upload**, forcing a full
  restart from byte zero — expensive and frustrating for large files on
  unreliable connections.
- **No parallelism** — a single request uploads sequentially, even if the
  client has enough bandwidth to push multiple streams at once.
- Many HTTP infrastructure components (load balancers, proxies) impose
  **request size or duration limits** that a single huge upload can hit.

Multipart upload solves all three: each part is a separate, independently
retryable request, parts can be sent in parallel, and each part stays
under any single-request size/time limits.

## Mechanics (S3-style, as the canonical example)

1. **Initiate:** client (or backend on the client's behalf) calls
   `CreateMultipartUpload`, receiving an `upload_id` that ties all parts
   together.
2. **Upload parts:** client splits the file into parts (each typically
   5MB–5GB per S3's constraints, chosen by the client/app), and uploads
   each part with `UploadPart(upload_id, part_number, data)` — these can
   be sent in parallel and in any order. Each successful part upload
   returns an **ETag** identifying that part.
3. **Complete:** once all parts are uploaded, the client calls
   `CompleteMultipartUpload(upload_id, [list of part_number + ETag
pairs])`, and the storage service assembles the parts into the final
   object.
4. **Abort (failure path):** if the upload is abandoned, an
   `AbortMultipartUpload` call (or a lifecycle policy that auto-expires
   incomplete uploads after N days) cleans up the partially-uploaded parts
   so they don't silently accumulate storage cost forever.

## Retry behavior

- If a single part upload fails, only **that part** needs to be retried —
  not the entire file. This is the core reliability benefit and the thing
  to emphasize when asked "why multipart upload" in an interview.
- Parts are idempotent by `part_number` — re-uploading part 5 simply
  overwrites the previous attempt for part 5, so retries are safe without
  special deduplication logic.

## Choosing part size

- Larger parts: fewer requests/overhead, but a failed part costs more to
  re-upload and parallelism is coarser.
- Smaller parts: finer-grained retry and parallelism, but more requests
  and per-request overhead (and most providers impose a minimum part size,
  e.g., S3 requires parts to be at least 5MB except the last one).
- A common practical approach: pick a part size based on the file size
  and target part count (e.g., ~10-50MB parts), balancing overhead against
  retry granularity.

## Interview-relevant talking points

- Be precise about what problem multipart upload solves (retry
  granularity, parallelism, request size limits) — this is usually the
  first thing asked and rewards specificity over a vague "it's better for
  big files."
- Clarify the terminology distinction from HTTP `multipart/form-data` if
  it comes up — shows precision.
- Mention cleanup of abandoned multipart uploads (lifecycle policies) —
  a detail that signals production experience, since incomplete uploads
  silently cost storage money if left unmanaged.
