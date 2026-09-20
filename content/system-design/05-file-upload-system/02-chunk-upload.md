# Chunk Upload

## What it is, and how it relates to multipart upload

"Chunked upload" is the **client-side strategy** of splitting a file into
pieces before sending; "multipart upload" (previous note) is typically the
**storage-service-level API** those chunks get uploaded through. In
practice they're usually the same mechanism viewed from two ends: your
client-side chunking logic decides how to split the file and manage
progress/retries, while the chunks themselves are sent as multipart-upload
parts to the storage backend. Some designs chunk client-side but funnel
chunks through your own backend instead of directly to cloud storage —
worth distinguishing which architecture you mean when discussing this.

## Core client-side responsibilities

1. **Split the file into chunks** (typically fixed-size, e.g., a few MB
   each) using the browser/client File API's slicing capability — this
   happens without reading the whole file into memory at once, important
   for very large files on memory-constrained clients.
2. **Track upload progress per chunk**, so the UI can show accurate
   progress and so a paused/resumed upload knows exactly which chunks
   still need sending.
3. **Upload chunks**, optionally **in parallel** (e.g., 3-4 concurrent
   chunk uploads) to make better use of available bandwidth than a single
   sequential stream.
4. **Retry failed chunks individually** with backoff, without re-sending
   already-succeeded chunks.
5. **Signal completion** once all chunks are confirmed uploaded, so the
   server (or storage service) can assemble/finalize the object.

## Resumability

This is the headline feature chunk upload enables, and the most commonly
tested concept in this sub-topic:

- If an upload is interrupted (browser closed, network drop, app
  backgrounded on mobile), the client should be able to **resume from
  where it left off** rather than restarting the entire file.
- Requires the client (or a paired server-side record) to persist which
  chunks have already been successfully uploaded — e.g., a local record
  keyed by a stable file identifier (a hash of the file, or a
  server-issued upload session ID) mapping to a list of completed chunk
  indices.
- On resume, the client queries "which chunks do you already have?" (either
  from local state, or by asking the server/storage service, which can be
  more authoritative if local state was lost too — e.g., browser storage
  cleared) and only uploads the missing ones.

## Chunk ordering and reassembly

- Chunks are typically uploaded with an explicit **sequence/part number**,
  not relied upon to arrive or be stored in order — this is what allows
  parallel/out-of-order upload while still letting the server/storage
  service reassemble the file correctly at completion time.
- Reassembly itself (concatenating chunks into the final object) is
  usually handled by the storage service's multipart-complete step
  (previous note) rather than something you build yourself, if uploading
  directly to a cloud provider.

## Integrity verification

- Compute a checksum (e.g., MD5 or a stronger hash) per chunk on the
  client and compare against what the server/storage service reports
  after receiving it, to catch silent corruption in transit — most cloud
  storage multipart APIs support this natively via per-part ETags/checksums.
- Optionally compute a whole-file checksum as a final integrity check after
  assembly.

## Interview-relevant talking points

- Be ready to clearly separate "chunking is a client-side strategy" from
  "multipart upload is the server/storage-side API it typically rides on"
  — conflating the two is a common but noticeable gap.
- Resumability is the concept most likely to get a follow-up question:
  walk through exactly what state needs to persist (which chunks
  succeeded) and where it lives (client-side, server-side, or both, with
  server-side being more robust to client state loss).
- Mention parallel chunk upload as a concrete performance lever, with a
  reasonable concurrency number (not literally "as many as possible,"
  since that can overwhelm the client's or server's connection limits).
