# 🌊 Streams

## 🎯 What Are Streams?

Streams let you process data **piece by piece** (chunks) instead of loading it all into memory at once. Essential for large files, network data, and real-time processing. Node's `fs`, `http`, `zlib`, and `crypto` all use streams internally.

---

## 🧩 The 4 Stream Types

| Type          | Purpose                                               | Examples                                          |
| ------------- | ----------------------------------------------------- | ------------------------------------------------- |
| **Readable**  | Source of data you can read from                      | `fs.createReadStream`, HTTP request (server-side) |
| **Writable**  | Destination you can write data to                     | `fs.createWriteStream`, HTTP response             |
| **Duplex**    | Both readable AND writable                            | TCP sockets                                       |
| **Transform** | Duplex stream that modifies data as it passes through | `zlib.createGzip()`, `crypto` ciphers             |

```
Readable ──▶ (optional Transform) ──▶ Writable
  📖              🔄                     💾
```

---

## 💻 Reading a Stream

```js
const fs = require("node:fs");

const readStream = fs.createReadStream("bigfile.txt", { encoding: "utf8" });

readStream.on("data", (chunk) => {
  console.log(`📦 Received ${chunk.length} characters`);
});

readStream.on("end", () => console.log("✅ Done reading"));
readStream.on("error", (err) => console.error("❌", err));
```

---

## 🔗 Piping — The Core Pattern

```js
const fs = require("node:fs");

// Copy a file efficiently — data flows chunk by chunk, low memory usage
fs.createReadStream("source.txt")
  .pipe(fs.createWriteStream("destination.txt"))
  .on("finish", () => console.log("✅ Copy complete"));
```

### 🗜️ Piping Through a Transform (Gzip Compression)

```js
const fs = require("node:fs");
const zlib = require("node:zlib");

fs.createReadStream("input.txt")
  .pipe(zlib.createGzip()) // 🔄 compress on the fly
  .pipe(fs.createWriteStream("input.txt.gz"))
  .on("finish", () => console.log("✅ Compressed!"));
```

---

## 🛠️ Building a Custom Transform Stream

```js
const { Transform } = require("node:stream");

const upperCaseTransform = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase()); // modify data
    callback(); // signal "done with this chunk"
  },
});

process.stdin.pipe(upperCaseTransform).pipe(process.stdout);

// Try: echo "hello world" | node transform-example.js
// Output: HELLO WORLD
```

---

## 🚦 Backpressure — Why Piping Matters

If a writable stream can't keep up with a readable stream, data piles up in memory. `.pipe()` **automatically handles backpressure** by pausing the readable stream until the writable catches up.

```js
// ❌ Manual approach WITHOUT backpressure handling (dangerous for huge files):
readable.on("data", (chunk) => writable.write(chunk)); // can overwhelm memory

// ✅ .pipe() handles this correctly for you:
readable.pipe(writable);

// ✅ Manual backpressure-aware writing (advanced):
readable.on("data", (chunk) => {
  const canContinue = writable.write(chunk);
  if (!canContinue) {
    readable.pause();
    writable.once("drain", () => readable.resume());
  }
});
```

---

## 🌊 Async Iteration Over Streams (Modern Style)

```js
const fs = require("node:fs");

async function processFile() {
  const stream = fs.createReadStream("data.txt", { encoding: "utf8" });
  for await (const chunk of stream) {
    console.log("📦 Chunk:", chunk.length, "chars");
  }
  console.log("✅ Finished");
}
processFile();
```

---

## 🔧 `stream.pipeline()` — Production-Safe Piping

```js
const { pipeline } = require("node:stream/promises");
const fs = require("node:fs");
const zlib = require("node:zlib");

async function compressFile() {
  try {
    await pipeline(
      fs.createReadStream("input.txt"),
      zlib.createGzip(),
      fs.createWriteStream("input.txt.gz"),
    );
    console.log("✅ Pipeline succeeded");
  } catch (err) {
    console.error("❌ Pipeline failed:", err);
  }
}
compressFile();
```

`pipeline()` automatically handles **errors and cleanup** (destroys all streams if one fails) — always prefer it over manual `.pipe()` chains in production code.

---

## ⚠️ Common Pitfalls

- Using `.pipe()` chains without error handling — one failed stream can leave others open (file descriptor leaks). Use `pipeline()` instead.
- Loading huge files with `readFileSync` when a stream would be far more memory-efficient.
- Not handling backpressure in manual `.write()` loops.
- Forgetting streams are **event emitters** — always attach an `'error'` listener.

---

## 🧪 Try It Yourself

1. Build a CLI tool that reads a text file, uppercases it via a Transform stream, and writes the result.
2. Compress a large file with `zlib.createGzip()` using `pipeline()`.
3. Compare memory usage (`process.memoryUsage()`) of `readFileSync` vs streaming for a large file.
