# File Upload System — Interview Prep Overview

Notes for the "design a file upload system" system design interview (the
Dropbox/Google Photos/S3-console upload problem). This question tests how
you handle large binary payloads reliably over unreliable networks, offload
storage to specialized services, and process content asynchronously —
different concerns from a typical CRUD/read-heavy data problem.

## Contents

1. `01-multipart-upload.md` — splitting a single large upload into multiple
   HTTP parts, why it exists, mechanics.
2. `02-chunk-upload.md` — client-side chunking, resumability, parallel
   uploads, chunk ordering/reassembly.
3. `03-cloud-storage.md` — object storage architecture, direct-to-storage
   upload patterns, presigned URLs, metadata storage.
4. `04-image-processing.md` — resizing/transcoding pipelines, sync vs.
   async processing, thumbnail generation at scale.
5. `05-interview-questions.md` — question bank with model answers, plus a
   suggested 45-minute interview walkthrough structure.

## How to use this

- The throughline here is: **don't route large file bytes through your own
  application servers if you can avoid it.** Nearly every design decision
  in this topic — multipart upload, chunking, presigned URLs to cloud
  storage, async processing — exists to keep big binary payloads off your
  app servers' request/response cycle and onto infrastructure built for it.
  Keep that principle in mind as the "why" behind each sub-topic.
- Multipart and chunk upload are closely related (multipart is often the
  HTTP-level mechanism used _within_ a chunked-upload strategy) — read them
  back to back and be ready to explain how they relate, not just define
  each separately.
- Practice sketching: Client → (direct presigned upload) → Cloud Object
  Storage → Storage Event → Processing Queue → Workers (resize/transcode/
  scan) → Metadata DB update → CDN for serving.
