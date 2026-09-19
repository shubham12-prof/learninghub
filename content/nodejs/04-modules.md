# 📦 Modules — CommonJS & ES Modules

## 🎯 Why Modules?

Modules let you split code into reusable files with **encapsulated scope** (no accidental global leaks) and explicit **imports/exports**. Node supports two systems:

|                            | CommonJS (CJS)                 | ES Modules (ESM)                                         |
| -------------------------- | ------------------------------ | -------------------------------------------------------- |
| Syntax                     | `require()` / `module.exports` | `import` / `export`                                      |
| Loading                    | Synchronous                    | Asynchronous                                             |
| File extension             | `.js` (default) or `.cjs`      | `.mjs`, or `.js` with `"type": "module"` in package.json |
| `this` at top level        | `module.exports`               | `undefined`                                              |
| `__dirname` / `__filename` | ✅ available                   | ❌ not available (use workaround below)                  |
| Tree-shaking               | ❌ No                          | ✅ Yes (bundlers can eliminate dead code)                |
| Top-level `await`          | ❌ No                          | ✅ Yes                                                   |

---

## 💻 CommonJS (CJS)

**math.js**

```js
function add(a, b) {
  return a + b;
}
function subtract(a, b) {
  return a - b;
}

module.exports = { add, subtract };
// or: exports.add = add;  (can't reassign `exports` directly with `=`)
```

**app.js**

```js
const { add, subtract } = require("./math");
console.log(add(2, 3)); // 5
console.log(subtract(5, 2)); // 3
```

### How `require()` Works Internally

1. **Resolve** the file path.
2. **Load** the file contents.
3. **Wrap** it in a function: `(function(exports, require, module, __filename, __dirname) { ... })`
4. **Execute** it.
5. **Cache** the result (`require.cache`) — subsequent `require()` calls return the cached `module.exports`.

```js
console.log(require("./math") === require("./math")); // true — cached!
```

---

## 💻 ES Modules (ESM)

**package.json**

```json
{ "type": "module" }
```

**math.mjs**

```js
export function add(a, b) {
  return a + b;
}
export function subtract(a, b) {
  return a - b;
}
export default function multiply(a, b) {
  return a * b;
}
```

**app.mjs**

```js
import multiply, { add, subtract } from "./math.mjs";

console.log(add(2, 3)); // 5
console.log(multiply(4, 5)); // 20

// ✅ Top-level await works!
const data = await fetch("https://api.example.com").then((r) => r.json());
```

### `__dirname` Equivalent in ESM

```js
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

---

## 🔄 Interop: Using CJS in ESM & Vice Versa

```js
// ✅ ESM can import CJS modules (default export = module.exports)
import pkg from "./legacy-cjs-module.js";

// ❌ CJS CANNOT statically `require()` an ESM module.
// Use dynamic import instead:
async function load() {
  const mod = await import("./esm-module.mjs");
  mod.someFunction();
}
```

---

## 📁 Module Resolution Order (CJS)

```
require('./local-file')     → relative path, resolves .js/.json/.node
require('lib-name')         → looks in ./node_modules, then parent dirs up to root
require('node:fs')          → Node built-in core module (explicit prefix, recommended)
```

```
project/
├── app.js
├── node_modules/
│   └── express/
└── utils/
    └── helper.js
```

```js
// app.js
const express = require("express"); // from node_modules
const helper = require("./utils/helper"); // relative path
const fs = require("node:fs"); // core module
```

---

## 🆚 Quick Decision Guide

- **New project, using modern tooling / top-level await / bundlers** → use **ESM**.
- **Maintaining legacy code, or heavy npm-package compatibility concerns** → stick with **CommonJS**.
- Many projects mix both via `.cjs` / `.mjs` extensions for explicit clarity.

---

## ⚠️ Common Pitfalls

- Forgetting `"type": "module"` in `package.json` → `import`/`export` syntax errors.
- Mixing `require` and `import` in the same file → syntax error.
- Assuming `require()` is dynamic like `import()` — `require()` is **synchronous** and resolved at load time (though you _can_ call it conditionally at runtime, unlike static `import`).
- Forgetting **circular dependency** behavior — CJS returns a **partial** `exports` object if two modules require each other.

```js
// Circular dependency example
// a.js
exports.done = false;
const b = require("./b");
console.log("in a, b.done =", b.done);
exports.done = true;

// b.js
exports.done = false;
const a = require("./a"); // a is only partially loaded here!
console.log("in b, a.done =", a.done); // false, because a.js hasn't finished yet
exports.done = true;
```

---

## 🧪 Try It Yourself

1. Convert a small CJS module to ESM and vice versa.
2. Create a circular dependency between two files and trace the log output.
3. Use `import.meta.url` to build an ESM-safe `__dirname`.
