# 04. Streaming

## What is Streaming?

Streaming processes and transmits data incrementally, in chunks, as it becomes available — rather than loading an entire dataset/file/response into memory before sending anything at all. This is critical for handling large payloads efficiently, reducing memory usage, and improving perceived responsiveness (the client starts receiving data immediately, rather than waiting for the entire response to be ready).

```
Without streaming:  read ENTIRE 500MB file into memory -> THEN send it all at once
                     -> high memory usage, client waits for the ENTIRE file to be ready
                        before receiving ANY of it

With streaming:        read and send the file in small CHUNKS, as they become available
                        -> low, constant memory usage regardless of file size,
                           client starts receiving data almost immediately
```

## Node.js Streams — The Foundation

Node.js has built-in support for streams as a core primitive, used throughout its APIs (file I/O, HTTP, compression).

```
Readable stream:   a source of data you can read FROM (a file, an HTTP request body, a database cursor)
Writable stream:     a destination you can write data TO (a file, an HTTP response, stdout)
Duplex stream:         both readable AND writable (a TCP socket)
Transform stream:       a duplex stream that MODIFIES data as it passes through (compression, encryption)
```

## Streaming a File Response — A Basic Example

```js
const fs = require("fs");

// BAD — loads the entire file into memory before sending anything
app.get("/download", (req, res) => {
  const data = fs.readFileSync("large-file.zip");
  res.send(data);
});

// GOOD — streams the file in chunks, constant memory usage regardless of file size
app.get("/download", (req, res) => {
  const stream = fs.createReadStream("large-file.zip");
  stream.pipe(res);
});
```

`.pipe()` is the classic, simple way to connect a readable stream directly to a writable stream — automatically handling the chunk-by-chunk data flow, including backpressure (covered below).

## Streaming Large API Responses

For large JSON datasets, streaming avoids building the entire response in memory before sending — particularly valuable for exports, reports, or large query results.

```js
const { pipeline } = require("stream/promises");
const { Transform } = require("stream");

app.get("/export/orders", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.write("[");

  let isFirst = true;
  const cursor = db.collection("orders").find().stream(); // a database CURSOR, not a full result array

  for await (const order of cursor) {
    if (!isFirst) res.write(",");
    res.write(JSON.stringify(order));
    isFirst = false;
  }

  res.write("]");
  res.end();
});
```

Using a database **cursor** (rather than fetching all matching documents into an array upfront) means the application never holds the entire result set in memory at once — it processes and streams out one record at a time.

## Streaming File Uploads

```js
const multer = require("multer");

// Streaming directly to disk/cloud storage rather than buffering the entire upload in memory first
const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ message: "Uploaded", file: req.file.filename });
});
```

For very large uploads, streaming directly to cloud storage (S3, etc.) as data arrives — rather than buffering the entire file in the application server's memory first — avoids memory pressure and lets uploads begin processing before they're even fully received.

```js
const { PassThrough } = require("stream");

app.post("/upload-to-s3", (req, res) => {
  const passthrough = new PassThrough();
  req.pipe(passthrough); // pipe the incoming request body DIRECTLY toward S3, without buffering it all first

  s3.upload({ Bucket: "my-bucket", Key: "file.zip", Body: passthrough })
    .promise()
    .then(() => res.json({ status: "uploaded" }));
});
```

## Backpressure — A Critical Streaming Concept

Backpressure occurs when a writable stream's destination can't consume data as fast as the readable stream is producing it — without handling this correctly, memory can balloon as unconsumed data piles up in internal buffers.

```
Fast readable stream (e.g., reading a local file quickly)
         +
Slow writable stream (e.g., writing over a slow network connection)
         =
Backpressure — the writable side signals "slow down," and a properly-implemented pipe respects this
```

```js
// .pipe() and pipeline() automatically handle backpressure correctly
readable.pipe(writable); // pauses the readable stream if the writable stream's internal buffer is full

// Manual streaming WITHOUT proper backpressure handling is a common source of memory issues:
readable.on("data", (chunk) => {
  writable.write(chunk); // if writable is slower, this can cause UNBOUNDED memory growth,
  // since nothing here signals the readable side to pause
});
```

```js
const { pipeline } = require("stream/promises");

// The modern, recommended approach — pipeline() handles backpressure AND error propagation correctly
await pipeline(
  fs.createReadStream("input.txt"),
  transformStream,
  fs.createWriteStream("output.txt"),
);
```

`pipeline()` (from `stream/promises`) is generally preferred over manually chaining `.pipe()` calls, since it correctly propagates errors across the entire chain (a common gap when manually piping — an error partway through the chain can otherwise go unhandled) and properly cleans up all streams if any part fails.

## Server-Sent Events (SSE) — Streaming Real-Time Updates to the Client

For one-way, server-to-client streaming of ongoing updates (without needing full WebSocket bidirectionality), Server-Sent Events use the same underlying streaming HTTP response concept.

```js
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);
  }, 1000);

  req.on("close", () => clearInterval(interval)); // clean up when the client disconnects
});
```

## Streaming Transformations — Processing Data Without Full Buffering

```js
const { Transform } = require("stream");

const upperCaseTransform = new Transform({
  transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase());
  },
});

fs.createReadStream("input.txt")
  .pipe(upperCaseTransform)
  .pipe(fs.createWriteStream("output.txt"));
```

Any data transformation (compression, encryption, format conversion, filtering) can be implemented as a stream Transform, letting large datasets be processed chunk-by-chunk without ever holding the full dataset in memory — the same principle underlies Node's built-in `zlib` compression streams, for instance.

```js
const zlib = require("zlib");

fs.createReadStream("large-file.txt")
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream("large-file.txt.gz"));
```

## When Streaming Matters Most

```
Large file downloads/uploads     -> avoid loading entire files into memory
Large API exports/reports          -> avoid building huge response bodies in memory before sending
Real-time data (logs, events)        -> deliver updates as they happen, not in a batch after the fact
Video/audio delivery                    -> allow playback to begin before the entire file is transferred
Processing large datasets                  -> transform/filter data chunk-by-chunk rather than
                                              loading everything into memory for a single pass
```

## Common Interview-Style Questions

- **What problem does streaming solve compared to loading an entire response/file into memory first?**
  It avoids holding the entire dataset in memory at once, keeping memory usage roughly constant regardless of the total data size, and lets the client begin receiving data almost immediately rather than waiting for the entire payload to be fully prepared before anything is sent.

- **What is backpressure, and why does it matter for streaming?**
  It's the situation where a writable stream's destination can't consume data as quickly as a readable stream produces it; without properly handling backpressure (signaling the readable side to pause), unconsumed data can accumulate unboundedly in memory — `.pipe()` and `pipeline()` handle this automatically, while naive manual `data`/`write` event handling typically does not.

- **Why is `pipeline()` generally preferred over manually chaining multiple `.pipe()` calls?**
  It correctly propagates errors across the entire chain of streams (a common gap with manual piping, where an error partway through can go unhandled) and ensures all streams in the chain are properly cleaned up if any part of the pipeline fails.

- **Why would you use a database cursor instead of fetching an entire result set into an array when streaming a large export?**
  A cursor lets you process and stream out records one at a time as they're retrieved, rather than loading the entire matching result set into memory upfront — critical for keeping memory usage bounded when exporting or processing very large datasets.

- **Give an example of when streaming file uploads directly to cloud storage (rather than buffering them fully first) is beneficial.**
  For very large file uploads, buffering the entire file in the application server's memory before forwarding it to storage risks significant memory pressure (or even crashing the server under concurrent large uploads); streaming the incoming request body directly toward the storage destination as it arrives avoids this memory overhead and can also let processing begin before the upload fully completes.
