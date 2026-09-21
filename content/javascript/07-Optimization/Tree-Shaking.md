# Tree Shaking

A build-time optimization (via bundlers like Webpack/Rollup/esbuild) that eliminates unused ("dead") code from the final bundle. Requires ES module syntax (`import`/`export`), since it's statically analyzable — unlike CommonJS `require`.

```js
// utils.js
export function used() {
  return "I'm used";
}
export function unused() {
  return "I'm never imported";
}

// main.js
import { used } from "./utils.js";
used();
// bundler analyzes imports and drops `unused` from the final bundle
```

**Requirements for effective tree shaking:**

- Use ESM (`import`/`export`), not CommonJS (`require`/`module.exports`)
- Avoid side effects in modules (or mark `"sideEffects": false` in `package.json`)
- Import only what you need: `import { debounce } from "lodash-es"` instead of `import _ from "lodash"`
