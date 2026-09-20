# Modules

TypeScript uses the same `import`/`export` syntax as ES Modules, with the compiler translating it to whichever module system you target (CommonJS, ESM, etc., via `tsconfig`'s `module` option) — plus some TS-specific additions for exporting types.

```ts
// math.ts
export function add(a: number, b: number): number {
  return a + b;
}
export interface Point {
  x: number;
  y: number;
}
export default class Calculator {
  /* ... */
}

// main.ts
import Calculator, { add, Point } from "./math";
```

**Type-only imports/exports — explicitly marking that an import is ONLY used for types, erased entirely at compile time:**

```ts
import type { User } from "./types"; // guaranteed to produce NO runtime import
import { type Point, add } from "./math"; // mixed — Point is type-only, add is a real value

export type { User }; // re-exporting only the type
```

This matters for tools that transpile files individually without full type information (like esbuild/SWC/Babel) — they can't tell on their own whether an import is a type or a value, so `import type` makes the intent explicit and safely erasable.

**Namespace imports:**

```ts
import * as MathUtils from "./math";
MathUtils.add(1, 2);
```

**Ambient/global type declarations (no import/export — augmenting the global scope, typically in a `.d.ts` file):**

```ts
// global.d.ts
declare global {
  interface Window {
    myCustomGlobal: string;
  }
}
```

**Interview note:** `import type` isn't just stylistic — with `isolatedModules` enabled (required by most modern single-file transpilers like esbuild/SWC), regular type-only imports written without the `type` keyword can sometimes cause build errors or unnecessary runtime imports, since those tools compile each file without cross-file type analysis.
