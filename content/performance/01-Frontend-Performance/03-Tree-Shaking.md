# 03. Tree Shaking

## What is Tree Shaking?

Tree shaking is a build-time process where a bundler analyzes your code's actual `import`/`export` usage and removes code that's never actually used ("dead code") from the final bundle — named after shaking a tree so dead leaves (unused code) fall away, leaving only what's actually needed.

```
Library exports 50 functions
Your app imports and uses only 3 of them
     │
     ▼ tree shaking
Final bundle includes ONLY those 3 functions' code (plus their own dependencies) —
the other 47 unused functions are never included at all
```

## Why Tree Shaking Requires ES Modules (Not CommonJS)

Tree shaking relies on the **static** nature of ES Module (`import`/`export`) syntax — a bundler can analyze imports/exports at build time without executing any code, since the structure is fixed and determinable just by reading the source.

```js
// ES Modules — STATIC, analyzable at build time WITHOUT executing anything
import { debounce } from "lodash-es"; // bundler can see EXACTLY what's imported

// CommonJS — DYNAMIC, requires actually running code to know what's exported
const _ = require("lodash"); // bundler can't statically determine what parts of `_` are actually used
```

```js
// CommonJS's dynamic nature defeats tree shaking, even in seemingly simple cases:
const utils = require(condition ? "./utilsA" : "./utilsB"); // impossible to statically analyze
```

**Practical implication:** using ES Module-native library builds (`lodash-es` instead of `lodash`, checking a library's `"module"` field in `package.json`) is often necessary to actually get tree-shaking benefits — importing a CommonJS-only library, even with modern `import` syntax, often can't be tree-shaken effectively.

## A Practical Example

```js
// math-utils.js
export function add(a, b) {
  return a + b;
}
export function subtract(a, b) {
  return a - b;
}
export function multiply(a, b) {
  return a * b;
}
export function divide(a, b) {
  return a / b;
}
```

```js
// app.js
import { add } from "./math-utils.js";

console.log(add(2, 3));
```

With tree shaking enabled, the final bundle includes only the `add` function — `subtract`, `multiply`, and `divide` are entirely excluded, since static analysis proves they're never imported/used anywhere.

## Enabling Tree Shaking

### Webpack

```js
// webpack.config.js
module.exports = {
  mode: "production", // tree shaking (and other optimizations) are enabled automatically in production mode
  optimization: {
    usedExports: true, // mark unused exports for removal
    minimize: true, // actually REMOVE the marked dead code (via Terser or similar)
  },
};
```

```json
// package.json — marking the package itself as side-effect-free helps the bundler be MORE aggressive
{
  "sideEffects": false
}
```

### Vite / Rollup

Tree shaking is enabled by default in production builds — generally requiring no additional configuration for straightforward cases, since Rollup (Vite's underlying bundler for production builds) was designed around ES Modules and tree shaking from the start.

## The `sideEffects` Field — A Critical, Often-Overlooked Detail

Bundlers must be conservative by default — if a module _might_ have side effects (like modifying a global, or a polyfill that runs on import purely for its effects rather than its exports), removing "unused" code could actually break the application. The `sideEffects` field in `package.json` explicitly tells the bundler which files are safe to more aggressively tree-shake.

```json
{
  "name": "my-library",
  "sideEffects": false
}
```

```json
{
  "sideEffects": [
    "*.css", // CSS imports have side effects (they apply styles) — never safe to tree-shake away
    "./src/polyfills.js" // this specific file has side effects, exclude it from aggressive tree-shaking
  ]
}
```

Without this field set correctly, a bundler may be overly conservative and fail to remove code that's actually safe to remove — a very common, easy-to-miss source of larger-than-necessary bundles, especially for library authors.

## Common Tree Shaking Pitfalls

### Importing an Entire Library Instead of Specific Functions

```js
// BAD — depending on the library's structure, this can pull in the ENTIRE library
import _ from "lodash";
_.debounce(fn, 300);

// BETTER — explicit, targeted import
import debounce from "lodash/debounce";
debounce(fn, 300);

// BEST (if the library supports it) — named import from an ES-module-native build
import { debounce } from "lodash-es";
debounce(fn, 300);
```

### Re-exporting Everything from a Barrel File

```js
// index.js (a "barrel" file re-exporting everything)
export * from "./components/Button";
export * from "./components/Modal";
export * from "./components/Table";
// ... 50 more components
```

```js
// Importing just ONE component from the barrel file
import { Button } from "./components";
```

Depending on the bundler and how the barrel file is structured, this pattern can sometimes prevent effective tree shaking — the bundler may struggle to prove that importing from the barrel doesn't need to evaluate/include the other 49 components' modules too, especially if any of them have side effects. Importing directly from the specific component's file often tree-shakes more reliably.

```js
// More reliably tree-shakeable — direct import, bypassing the barrel file
import { Button } from "./components/Button";
```

### Class Methods and Tree Shaking

```js
class Utils {
  static methodA() {
    /* ... */
  }
  static methodB() {
    /* ... */
  }
}
```

Unlike standalone functions, individual **methods within a class** generally can't be tree-shaken independently — if any part of the class is used, the entire class typically gets bundled. Preferring standalone exported functions over class-based utility collections can improve tree-shakeability.

## Verifying Tree Shaking Is Actually Working

Don't just assume tree shaking is happening — verify it with actual bundle analysis (full detail in the dedicated Bundle Analysis notes).

```bash
npx vite-bundle-visualizer
# or
npx webpack-bundle-analyzer stats.json
```

```
If you see the ENTIRE lodash library in your bundle despite only using `debounce`,
tree shaking isn't working as expected — check your import style and the library's
module format/sideEffects configuration.
```

## Tree Shaking vs Minification vs Dead Code Elimination — Related but Distinct

```
Tree Shaking:              removes ENTIRE unused EXPORTS/MODULES based on import/export analysis
Dead Code Elimination (DCE): removes unreachable code WITHIN a module (e.g., code after a `return`,
                              or a branch that's provably always false) — often performed by the
                              same minifier (like Terser) as part of the same overall build optimization step
Minification:                  shortens variable names, removes whitespace/comments — reduces file SIZE,
                                but doesn't remove any actual functionality/code paths
```

These three optimizations work together in a typical production build pipeline, but address distinct problems — tree shaking operates at the module/export level, DCE operates within a module's code, and minification just compresses the remaining code's textual representation.

## Common Interview-Style Questions

- **What is tree shaking, and what makes it possible?**
  A build-time optimization that removes unused exports/code from the final bundle, based on static analysis of `import`/`export` statements; it's made possible by ES Modules' static structure, which a bundler can analyze at build time without executing any code — unlike CommonJS's dynamic `require()`, which generally can't be statically analyzed the same way.

- **Why might importing a CommonJS library (even with `import` syntax) fail to tree-shake effectively?**
  Bundlers can transpile/wrap CommonJS modules for compatibility, but since CommonJS exports are determined dynamically at runtime rather than statically at build time, the bundler often can't prove which parts are actually unused, forcing it to conservatively include the entire module.

- **What does the `sideEffects` field in `package.json` control?**
  It explicitly tells the bundler which files are safe to aggressively tree-shake (no side effects beyond their exports) versus which files must always be included if imported at all (like CSS files or polyfills that run for their side effects) — without it set correctly, bundlers default to conservative behavior that can leave unnecessary code in the final bundle.

- **Why might importing from a large "barrel" index file hurt tree-shaking effectiveness compared to importing directly from a specific file?**
  A barrel file re-exporting many modules can make it harder for the bundler to statically prove that importing just one export doesn't require evaluating or including the others, especially if any have side effects; importing directly from the specific source file bypasses this ambiguity and tends to tree-shake more reliably.

- **How does tree shaking differ from minification?**
  Tree shaking removes entire unused exports/modules from the bundle based on static import/export analysis, operating at the module level; minification shortens variable names and removes whitespace/comments from whatever code remains, reducing file size without removing any actual functionality — they're complementary optimizations addressing different aspects of bundle size.
