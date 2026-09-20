# Image Processing

## Why this is a separate pipeline, not inline upload logic

Resizing, transcoding, thumbnailing, and scanning uploaded media is
CPU-intensive and variable in duration — doing it synchronously inside the
upload request would tie up app server resources, add unpredictable
latency to the upload response, and make the upload path fragile (a
processing failure shouldn't fail the underlying upload that already
succeeded). Standard approach: **decouple upload completion from
processing** using an asynchronous pipeline.

## Standard pipeline

1. **Trigger:** a storage event (object created in the bucket — see
   cloud-storage note) publishes a message to a **processing queue**,
   carrying the storage key/reference and relevant metadata (uploader,
   target formats needed, etc.).
2. **Workers consume the queue**, fetch the original object from storage,
   and perform the needed processing:
   - **Resizing** — generate thumbnails/variants at standard sizes (e.g.,
     small/medium/large, or specific dimensions for known UI slots).
   - **Format conversion/transcoding** — e.g., converting to a
     web-optimized format (WebP/AVIF for images; H.264/HLS renditions for
     video).
   - **Metadata extraction** — dimensions, EXIF data, duration (for
     video/audio), dominant color, etc.
   - **Content scanning** — malware/virus scanning, and/or content
     moderation (detecting policy-violating content) before the file is
     made available to other users.
3. **Write outputs back to storage** (as new objects — e.g.,
   `thumbnails/{id}_small.jpg`), and **update the metadata record** in the
   primary database (processing status → `ready`, plus references to the
   generated variants).
4. **Notify** (if needed) — e.g., push a real-time update to the
   uploading client that processing is complete and variants are
   available, using the same kind of mechanism covered in the chat-app /
   notification-system topics (WebSocket push or a notification).

## Sync vs. async: when is synchronous processing acceptable?

- For **very small, fast operations** (e.g., generating a single small
  thumbnail from a small image) some systems do this synchronously in the
  upload-completion handler for a snappier UX, accepting the added
  latency/coupling.
- For **anything variable-duration or CPU-heavy** (video transcoding,
  processing large images, batch operations) — always async via a queue.
  This is the default answer expected in an interview unless the
  interviewer specifically narrows scope to trivial, fast transformations.

## Handling processing failures

- Processing failures shouldn't be silent — update the metadata record's
  status to `failed` (rather than leaving it stuck at `processing`
  indefinitely) so the client/UI can react (retry option, error message).
- Use the same retry/backoff/dead-letter-queue patterns covered in
  reliability-focused topics (see the notification-system retry-logic
  note for the general pattern) — transient failures (e.g., a worker
  crash mid-job) should retry; permanent failures (e.g., a corrupted or
  unsupported file) should fail fast and surface clearly rather than
  retrying forever.

## Scaling the processing tier

- Worker pools scale independently and horizontally based on queue depth
  — a classic **producer/consumer with backpressure** setup: if uploads
  spike, the queue absorbs the burst and workers catch up at their own
  sustainable rate, rather than the upload path itself being slowed down
  by processing capacity.
- **Prioritization** — some systems prioritize certain jobs (e.g., a
  profile picture upload's thumbnail should process faster than a bulk
  batch-imported photo library) via separate queues or priority fields,
  rather than pure FIFO for everything.
- **Idempotency** — processing jobs should be safe to run twice (e.g., if
  a queue message is redelivered) — writing output to a deterministic
  storage key based on the source object means re-running a job simply
  overwrites the same output rather than creating duplicates.

## Interview-relevant talking points

- Lead with _why_ this must be async (unpredictable duration, CPU cost,
  decoupling from the already-succeeded upload) — this is the framing
  interviewers are listening for before diving into specific
  transformations.
- Be ready to sketch the full loop: storage event → queue → worker →
  storage write → metadata update → optional client notification — this
  end-to-end shape is usually what's actually being tested, more than
  knowledge of specific image algorithms.
- Bring up content/malware scanning as a step in the pipeline even if not
  asked directly — it's a realistic, often-overlooked requirement for any
  system accepting user-uploaded files, and mentioning it shows breadth.
