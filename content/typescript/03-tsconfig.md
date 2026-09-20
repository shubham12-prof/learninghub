# tsconfig

`tsconfig.json` configures how the TypeScript compiler behaves — target JS version, module system, strictness level, output location, and more.

```json
{
  "compilerOptions": {
    "target": "ES2020", // JS version to compile down to
    "module": "commonjs", // module system for output (or "esnext" for ESM)
    "outDir": "./dist", // where compiled .js files go
    "rootDir": "./src", // where source .ts files live
    "strict": true, // enables ALL strict type-checking options (recommended)
    "esModuleInterop": true, // allows default imports from CommonJS modules
    "skipLibCheck": true, // skip type-checking .d.ts files (faster builds)
    "moduleResolution": "node", // how imports are resolved
    "resolveJsonModule": true, // allows importing .json files
    "declaration": true, // also emit .d.ts type declaration files
    "sourceMap": true // emit source maps for debugging
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Key options interviewers commonly ask about:**

```json
"strict": true
```

Enables a bundle of stricter checks, most notably:

- `strictNullChecks` — `null`/`undefined` aren't assignable to other types unless explicitly included (`string | null`)
- `noImplicitAny` — variables/parameters without an inferred or explicit type cause an error, instead of silently becoming `any`
- `strictFunctionTypes`, `strictPropertyInitialization`, and others

```ts
// Without strictNullChecks:
function getLength(str: string) {
  return str.length;
}
getLength(null); // ❌ compiles fine without strict mode — but crashes at runtime!

// With strictNullChecks: true
getLength(null); // ✅ caught at compile time: Argument of type 'null' is not assignable
```

```json
"target": "ES5" vs "target": "ES2020"
```

Controls how modern the OUTPUT JS syntax is — lower targets add more polyfilled/transpiled code for older environment compatibility (e.g. converting arrow functions to regular functions for ES5).

**Interview note:** always enable `"strict": true` on new projects — it's the single setting with the biggest impact on catching real bugs (especially null/undefined handling), and turning it on later in a large existing codebase is much more painful than starting with it.
