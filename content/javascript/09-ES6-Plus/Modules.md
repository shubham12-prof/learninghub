# Modules

Split code into reusable files with explicit `import`/`export`. Each module has its own scope (nothing leaks to global by default).

```js
// math.js
export function add(a, b) {
  return a + b;
}
export const PI = 3.14159;
export default function multiply(a, b) {
  return a * b;
} // one default export per file

// main.js
import multiply, { add, PI } from "./math.js";
import * as math from "./math.js"; // namespace import

// Dynamic import (returns a Promise, enables code-splitting)
const module = await import("./math.js");
```

`<script type="module">` in HTML enables ESM in browsers; modules are deferred and strict-mode by default.
