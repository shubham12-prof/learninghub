# Interview Questions — File Upload System

Question bank with model answers, plus a suggested time-boxed structure
for a 45-minute interview.

---

## Suggested 45-minute structure

| Time      | Activity                                                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 0–5 min   | Clarify scope: max file size, file types, expected volume, need for resumability, is processing (thumbnails/transcoding) required? |
| 5–10 min  | State the core principle up front: direct-to-storage upload via presigned URLs, bytes never touch app servers                      |
| 10–20 min | Upload flow deep-dive: presigned URL generation, multipart/chunked upload for large files, completion detection                    |
| 20–28 min | Metadata storage and data model; access control for stored files                                                                   |
| 28–36 min | Processing pipeline: async workers, queue, thumbnail/transcode generation, failure handling                                        |
| 36–43 min | Scaling & reliability: CDN for serving, storage tiering, retry/backoff, resumable uploads on flaky networks                        |
| 43–45 min | Recap tradeoffs (e.g., sync vs async processing choices made)                                                                      |

The strongest signal in this interview is stating the "don't proxy bytes
through your app servers" principle early and explicitly, then showing
how every subsequent design decision (presigned URLs, event-driven
completion, async processing) follows from it.

---

## Conceptual

**Q1. Why shouldn't file uploads be proxied through your application
servers?**
A: App servers are optimized for request/response application logic, not
raw data transfer — proxying large file bytes through them consumes
bandwidth, memory, and connection capacity that scales linearly with
upload volume and file size, for no benefit (the app server doesn't need
to _do_ anything with the raw bytes mid-transfer). Object storage services
are purpose-built and horizontally scaled for exactly this. The standard
fix is direct-to-storage upload via presigned URLs, with the app server
only involved in authorization and metadata bookkeeping.

**Q2. Explain the presigned URL upload flow end to end.**
A: Client asks the backend for permission to upload a specific file; the
backend validates the request (auth, quota, allowed file type/size) and
generates a time-limited, cryptographically signed URL scoped to a
specific storage location. The client uploads directly to storage using
that URL — the backend and app servers are not in the data path. Once the
object lands in storage, a storage event notifies the backend
asynchronously (more reliable than trusting a client callback), which then
records metadata and can trigger downstream processing.

**Q3. What's the difference between chunked upload and multipart
upload, and how do they relate?**
A: Chunked upload is the client-side strategy of splitting a file into
pieces to manage progress, retries, and resumability. Multipart upload is
typically the storage-service-side API (e.g., S3's Multipart Upload) that
those chunks get sent through as independently-uploaded, independently-
retryable parts, later assembled into the final object. In most real
designs, they're two views of the same overall mechanism.

**Q4. Why should image/video processing be asynchronous rather than
happening inline during the upload request?**
A: Processing duration is variable and can be CPU-intensive (especially
video transcoding or batch operations), which would add unpredictable
latency to the upload response and tie up resources synchronously. It also
couples two things that should be independent: the upload already
succeeded once bytes reach storage, and a later processing failure
shouldn't retroactively fail it. Decoupling via a queue and async workers
keeps the upload path fast and resilient, letting processing scale and
retry independently.

---

## Technical

**Q5. A large file upload fails partway through on a flaky mobile
connection. How does your design handle this without forcing a full
restart?**
A: The file is uploaded in chunks (client-side), each sent as an
independent multipart-upload part. On failure, only the in-flight
chunk(s) need retrying — not the whole file. On resume (e.g., after the
app is reopened), the client checks which chunks have already been
successfully uploaded (via local state or by querying the server/storage
service for already-received parts) and only uploads what's missing.

**Q6. How do you decide on chunk/part size for large uploads?**
A: Balance retry granularity against overhead: smaller parts mean less
data lost per failed part and finer-grained parallelism, but more
requests and per-request overhead; larger parts reduce request count but
make a failed part more expensive to retry. Most cloud storage providers
also impose a minimum part size (e.g., S3 requires 5MB except the final
part). A common practical choice is parts in the tens-of-MB range, tuned
to the expected file sizes and network conditions.

**Q7. How would you validate file type/size before allowing an upload,
given that the upload itself bypasses your app servers?**
A: Validation has to happen at presigned-URL generation time — before the
client ever gets a URL to upload to — since you lose the ability to
intercept the actual byte stream once it goes direct-to-storage. This
means checking declared file size/type against policy in that
authorization step (and constraining the presigned URL/policy itself,
e.g., an S3 presigned POST can enforce content-length-range and
content-type conditions). Deeper validation (actual content matches
claimed type, virus scanning) happens after the fact in the async
processing pipeline, and files should be treated as unverified/quarantined
until that scan completes.

**Q8. How do you avoid orphaned metadata records or orphaned storage
objects (each existing without the other)?**
A: Orphaned metadata (a DB record with no actual uploaded object) is
avoided by only creating/finalizing the metadata record from the
storage-event notification — the trigger that proves the object actually
exists — rather than trusting a client-side "I'm done" callback that could
fire without a real upload happening. Orphaned storage objects (uploaded
but never linked to metadata, e.g., an abandoned multipart upload) are
cleaned up via storage lifecycle policies that auto-expire incomplete
uploads and unreferenced objects after a set period.

**Q9. How would you serve uploaded images efficiently to many users
without hammering your storage backend on every request?**
A: Put a CDN in front of the (public-read subset of the) storage bucket
or in front of presigned-download-served content, so repeat reads are
served from edge caches close to users rather than hitting storage
directly each time. For private content, presigned download URLs can
still be used with the CDN caching the response for their validity
window, or a signed-cookie/signed-URL CDN feature can enforce access
control at the edge.

---

## Scenario / Design

**Q10. Design the upload flow for a photo-sharing app that needs to
generate multiple thumbnail sizes for every uploaded photo.**
A: Client requests a presigned URL, uploads the original directly to
storage. A storage-created event enqueues a processing job. A worker pool
picks up the job, downloads the original, generates the required
thumbnail sizes, writes each as a new object in storage (deterministic
keys, e.g. `{id}_thumb_small.jpg`), and updates the photo's metadata
record with references to each generated variant and a status of `ready`.
The client can poll or receive a push notification when processing
completes, and the UI shows the appropriate size per context once
available.

**Q11. How would you support very large file uploads (e.g., multi-GB video
files) reliably?**
A: Use chunked/multipart upload with a meaningful chunk size (large enough
to limit request count, small enough to keep retry cost reasonable),
parallel chunk upload to use available bandwidth, and persisted
per-chunk progress so the upload is resumable across app restarts or
network drops — critical at this file size, since restarting a multi-GB
upload from scratch on failure is a poor experience. Processing (e.g.,
video transcoding into multiple renditions) is necessarily asynchronous
given the duration involved, with clear status tracking so the user knows
when their video is actually ready to view/share.

**Q12. A user reports their upload appears "stuck" at 90% and never
completes. How would you debug this?**
A: Check whether all chunks actually reached storage — if one or more
parts failed silently on the client side without triggering a proper
retry, the multipart upload would never be completed/finalized. Check the
storage service for an incomplete/abandoned multipart upload matching
that file. Separately, check the processing pipeline — if all bytes
uploaded successfully and the multipart upload was completed, but the
metadata status is stuck at `processing`, the issue is more likely a
stuck or failed worker job rather than an upload problem — worth having
distinguishable status states (`uploading`, `uploaded`, `processing`,
`ready`, `failed`) precisely so this kind of issue is diagnosable from
the status field alone.

**Q13. What would you monitor in production for this system?**
A: Upload success/failure rates and abandonment rate (uploads started but
never completed), average and p99 upload duration by file size bucket,
presigned-URL generation error rate (often reveals quota/auth issues
upstream of the actual transfer), processing queue depth and worker
failure/retry rate, and storage cost/growth trends (including orphaned-
object cleanup effectiveness). A rising abandoned-multipart-upload count
is a good specific signal that client-side retry/resumability logic has a
gap worth investigating.
