# 📁 File System (`fs`)

## 🎯 Overview

The `fs` module lets you interact with the file system — reading, writing, deleting, watching files/directories. It ships in **3 flavors**:

| Style           | Example                                     | Notes                                  |
| --------------- | ------------------------------------------- | -------------------------------------- |
| **Callback**    | `fs.readFile(path, cb)`                     | Original API, error-first callback     |
| **Promise**     | `fs.promises.readFile(path)` / `fsPromises` | Modern, use with `async/await`         |
| **Synchronous** | `fs.readFileSync(path)`                     | Blocks the event loop — use sparingly! |

---

## 💻 Reading Files

```js
const fs = require("node:fs");
const fsPromises = require("node:fs/promises");

// 1️⃣ Callback style
fs.readFile("data.txt", "utf8", (err, data) => {
  if (err) return console.error("❌", err);
  console.log("📄 Callback:", data);
});

// 2️⃣ Promise style (recommended for modern code)
async function readModern() {
  try {
    const data = await fsPromises.readFile("data.txt", "utf8");
    console.log("📄 Async/Await:", data);
  } catch (err) {
    console.error("❌", err);
  }
}
readModern();

// 3️⃣ Synchronous (blocks everything — use only in scripts/CLI startup)
const dataSync = fs.readFileSync("data.txt", "utf8");
console.log("📄 Sync:", dataSync);
```

---

## ✍️ Writing Files

```js
const fsPromises = require("node:fs/promises");

async function writeExample() {
  await fsPromises.writeFile("output.txt", "Hello, Node.js! 🚀", "utf8");
  console.log("✅ File written");

  // Append instead of overwrite
  await fsPromises.appendFile("output.txt", "\nAnother line", "utf8");
}
writeExample();
```

---

## 📂 Directory Operations

```js
const fsPromises = require("node:fs/promises");

async function dirOps() {
  await fsPromises.mkdir("logs", { recursive: true }); // create nested dirs safely
  const files = await fsPromises.readdir("."); // list directory contents
  console.log("📁 Files:", files);

  const stats = await fsPromises.stat("output.txt");
  console.log("📊 Is file?", stats.isFile(), "| Size:", stats.size, "bytes");

  await fsPromises.rm("logs", { recursive: true, force: true }); // delete dir (Node 14.14+)
}
dirOps();
```

---

## 👀 Watching Files for Changes

```js
const fs = require("node:fs");

fs.watch("output.txt", (eventType, filename) => {
  console.log(`🔔 ${filename} changed: ${eventType}`);
});
```

⚠️ `fs.watch` behavior is **platform-dependent** — for production-grade file watching, use the popular `chokidar` npm package.

---

## 🌊 Streaming Large Files (Memory-Efficient)

```js
const fs = require("node:fs");

// ❌ BAD for huge files — loads entire file into memory
// const bigData = fs.readFileSync('huge-file.log');

// ✅ GOOD — streams data in small chunks
const readStream = fs.createReadStream("huge-file.log", {
  encoding: "utf8",
  highWaterMark: 64 * 1024,
});
const writeStream = fs.createWriteStream("huge-file-copy.log");

readStream.pipe(writeStream);

readStream.on("end", () => console.log("✅ Copy complete"));
readStream.on("error", (err) => console.error("❌", err));
```

_(See [`09-streams`](../09-streams/README.md) for the deep dive.)_

---

## 🔑 Common `fs` Methods Cheat Sheet

| Method                                   | Purpose                                |
| ---------------------------------------- | -------------------------------------- |
| `readFile` / `writeFile`                 | Read/write entire file contents        |
| `appendFile`                             | Add data to end of file                |
| `unlink`                                 | Delete a file                          |
| `rename`                                 | Rename/move a file                     |
| `mkdir` / `rmdir` / `rm`                 | Create/remove directories              |
| `readdir`                                | List directory contents                |
| `stat` / `lstat`                         | Get file/directory metadata            |
| `access`                                 | Check if a file exists / is accessible |
| `copyFile`                               | Copy a file                            |
| `createReadStream` / `createWriteStream` | Stream large files                     |
| `watch` / `watchFile`                    | Monitor file changes                   |

---

## ⚠️ Common Pitfalls

- Using `*Sync` methods inside a running server → blocks **all** requests.
- Not handling `ENOENT` (file not found) errors gracefully.
- Race conditions: checking `fs.access()` then `fs.readFile()` separately (file could be deleted in between) — prefer try/catch around the actual operation (TOCTOU bug).
- Forgetting `{ recursive: true }` when creating nested directories.

```js
// ✅ Correct pattern: check existence via catching the error, not pre-checking
async function safeRead(path) {
  try {
    return await fsPromises.readFile(path, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return null; // file doesn't exist
    throw err; // re-throw unexpected errors
  }
}
```

---

## 🧪 Try It Yourself

1. Write a script that reads a `.csv` file and logs the number of lines.
2. Build a tiny file-based logger that appends timestamped entries.
3. Use `createReadStream`/`createWriteStream` to copy a large file and measure the time vs `readFileSync`/`writeFileSync`.
