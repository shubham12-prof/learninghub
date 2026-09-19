# 🧮 Buffers

## 🎯 What Is a Buffer?

A `Buffer` is a fixed-size chunk of **raw binary data**, stored outside the V8 JS heap. Used whenever Node deals with binary data — file I/O, network packets, images, encryption. Think of it as Node's equivalent to a byte array.

---

## 💻 Creating Buffers

```js
// From a string
const buf1 = Buffer.from("Hello, Node! 🚀", "utf8");
console.log(buf1); // <Buffer 48 65 6c 6c 6f 2c 20 4e 6f 64 65 21 20 f0 9f 9a 80>
console.log(buf1.toString()); // 'Hello, Node! 🚀'

// From an array of bytes
const buf2 = Buffer.from([72, 101, 108, 108, 111]);
console.log(buf2.toString()); // 'Hello'

// Allocate empty buffer of a given size (zero-filled — SAFE)
const buf3 = Buffer.alloc(10);
console.log(buf3); // <Buffer 00 00 00 00 00 00 00 00 00 00>

// Allocate WITHOUT zeroing (faster but contains old memory — use carefully!)
const buf4 = Buffer.allocUnsafe(10);
```

⚠️ **Security note**: `Buffer.allocUnsafe()` can expose **old memory contents** if not fully overwritten — never use it for anything holding user/sensitive data unless you immediately fill it.

---

## 🔍 Reading & Writing Buffer Data

```js
const buf = Buffer.from("Hello");

console.log(buf[0]); // 72  (byte value of 'H')
console.log(buf.length); // 5   (byte length, not char length!)

buf.write("Yo"); // overwrites bytes from the start
console.log(buf.toString()); // 'Yollo'

// Encoding-aware conversions
const b = Buffer.from("café", "utf8");
console.log(b.length); // 5 bytes (é is 2 bytes in UTF-8!)
console.log(b.toString("utf8")); // 'café'
console.log(b.toString("hex")); // '636166c3a9'
console.log(b.toString("base64")); // 'Y2Fmw6k='
```

⚠️ `buf.length` is **byte length**, not character count — multi-byte characters (emoji, accents, CJK) make these diverge.

---

## ✂️ Slicing & Copying

```js
const buf = Buffer.from("Hello, World!");

const slice = buf.subarray(0, 5); // 'Hello' — shares memory with original!
slice[0] = 74; // 'J'
console.log(buf.toString()); // 'Jello, World!'  <- original mutated!

// To avoid shared-memory surprises, copy instead:
const copy = Buffer.from(buf.subarray(0, 5)); // independent copy
```

⚠️ `.subarray()` (like `.slice()`) does **NOT** copy memory — it's a _view_ into the same underlying buffer. Mutating the slice mutates the original!

---

## 🔗 Concatenating Buffers

```js
const buf1 = Buffer.from("Hello, ");
const buf2 = Buffer.from("World!");
const combined = Buffer.concat([buf1, buf2]);
console.log(combined.toString()); // 'Hello, World!'
```

---

## 🌊 Buffers + Streams (Where You'll See Them Most)

```js
const fs = require("node:fs");

const readStream = fs.createReadStream("image.png"); // no encoding = raw Buffers

readStream.on("data", (chunk) => {
  console.log("📦 Received Buffer chunk of", chunk.length, "bytes");
  console.log("First few bytes (hex):", chunk.subarray(0, 4).toString("hex"));
});
```

---

## 🔐 Buffers + Base64 (Common Real-World Use)

```js
// Encoding an image file to Base64 (e.g., for embedding in JSON/HTML)
const fs = require("node:fs");

const imageBuffer = fs.readFileSync("logo.png");
const base64String = imageBuffer.toString("base64");
console.log(`data:image/png;base64,${base64String.slice(0, 50)}...`);

// Decoding back
const decodedBuffer = Buffer.from(base64String, "base64");
fs.writeFileSync("logo-copy.png", decodedBuffer);
```

---

## ⚖️ Comparing Buffers

```js
const a = Buffer.from("abc");
const b = Buffer.from("abc");

console.log(a === b); // false (different memory references)
console.log(a.equals(b)); // true  (content comparison)
console.log(Buffer.compare(a, b)); // 0 (equal), -1, or 1 (for sorting)
```

---

## ⚠️ Common Pitfalls

- Confusing `buf.length` (bytes) with string character count.
- Using `Buffer.allocUnsafe()` for sensitive data without immediately overwriting it.
- Assuming `.slice()`/`.subarray()` copies data — it shares memory!
- Using the deprecated `new Buffer()` constructor — always use `Buffer.from()` / `Buffer.alloc()`.

---

## 🧪 Try It Yourself

1. Read a small image file into a Buffer and print its first 10 bytes in hex.
2. Demonstrate the shared-memory gotcha: mutate a `.subarray()` and show the original buffer changes.
3. Write a function that converts a UTF-8 string to Base64 and back, verifying round-trip correctness.
