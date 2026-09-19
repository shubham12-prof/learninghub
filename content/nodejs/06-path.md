# 🧭 Path Module

## 🎯 Why It Matters

File paths differ across OSes: `C:\Users\me\file.txt` (Windows) vs `/home/me/file.txt` (Linux/Mac). The `path` module gives you **cross-platform-safe** utilities to build, parse, and manipulate paths — never hardcode `/` or `\`!

---

## 💻 Core Methods

```js
const path = require("node:path");

// 🔗 join() — combines segments, normalizes slashes
path.join("/users", "alice", "docs", "file.txt");
// -> '/users/alice/docs/file.txt'

path.join("/users", "../etc", "./passwd");
// -> '/etc/passwd'   (resolves .. and .)

// 🎯 resolve() — builds an ABSOLUTE path (like `cd` in a terminal)
path.resolve("folder", "file.txt");
// -> '/current/working/directory/folder/file.txt'

// 📛 basename() — the last portion (filename)
path.basename("/users/alice/report.pdf"); // 'report.pdf'
path.basename("/users/alice/report.pdf", ".pdf"); // 'report' (strip extension)

// 📁 dirname() — the directory portion
path.dirname("/users/alice/report.pdf"); // '/users/alice'

// 🏷️ extname() — the file extension
path.extname("archive.tar.gz"); // '.gz'

// 🧩 parse() — breaks a path into an object
path.parse("/users/alice/report.pdf");
/* {
  root: '/',
  dir: '/users/alice',
  base: 'report.pdf',
  ext: '.pdf',
  name: 'report'
} */

// 🔧 format() — the inverse of parse()
path.format({ dir: "/users/alice", name: "report", ext: ".pdf" });
// -> '/users/alice/report.pdf'
```

---

## 🆚 `join()` vs `resolve()` — The #1 Confusion

|          | `path.join()`                           | `path.resolve()`                                                                |
| -------- | --------------------------------------- | ------------------------------------------------------------------------------- |
| Result   | Relative or absolute (depends on input) | **Always absolute**                                                             |
| Behavior | Just concatenates + normalizes          | Resolves like navigating from `cwd`, right-to-left until absolute path is built |

```js
path.join("a", "b", "c"); // 'a/b/c'          (relative)
path.resolve("a", "b", "c"); // '/cwd/a/b/c'     (absolute!)

path.resolve("/foo", "/bar", "baz");
// -> '/bar/baz'   (an absolute segment "resets" the resolution)
```

---

## 🌍 Cross-Platform Separators

```js
path.sep; // '/' on POSIX, '\\' on Windows
path.delimiter; // ':' on POSIX (used in PATH env var), ';' on Windows

// Always build paths with path.join/resolve — NEVER string concatenation:
// ❌ const filePath = dir + '/' + filename;
// ✅ const filePath = path.join(dir, filename);
```

---

## 📌 `__dirname` + `path.join` — The Golden Combo

```js
const path = require("node:path");

// Build a path relative to THIS file's location, regardless of where
// the script is run from:
const configPath = path.join(__dirname, "config", "settings.json");
console.log(configPath);
```

---

## 🧮 `path.isAbsolute()` & Normalization

```js
path.isAbsolute("/etc/passwd"); // true
path.isAbsolute("./relative"); // false

path.normalize("/users//alice/../bob/./file.txt");
// -> '/users/bob/file.txt'
```

---

## ⚠️ Common Pitfalls

- Concatenating paths manually with `+` and `/` → breaks on Windows.
- Confusing `join` (no resolution guarantee) with `resolve` (always absolute).
- Forgetting that `path.win32` / `path.posix` exist for **forcing** a specific platform's rules (e.g., generating Windows paths on a Linux CI server):

```js
path.win32.join("C:\\Users", "alice"); // 'C:\\Users\\alice'
path.posix.join("/home", "alice"); // '/home/alice'
```

---

## 🧪 Try It Yourself

1. Write a function that takes any file path and returns just the filename without extension, using `path.parse`.
2. Build a config loader that always resolves paths relative to `__dirname`, regardless of the caller's CWD.
3. Compare `path.join('..', 'a')` vs `path.resolve('..', 'a')` outputs and explain the difference.
