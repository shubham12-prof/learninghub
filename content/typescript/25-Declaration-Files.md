# Declaration Files

`.d.ts` files contain **only type information** — no implementation/runtime code — used to describe the shape of existing JavaScript code (either your own compiled output, or third-party libraries that don't ship TypeScript natively).

```ts
// math.d.ts — describes the shape of a corresponding math.js file
export function add(a: number, b: number): number;
export function subtract(a: number, b: number): number;
export const PI: number;
```

```js
// math.js — the actual runtime implementation, plain JS, no types
export function add(a, b) {
  return a + b;
}
export function subtract(a, b) {
  return a - b;
}
export const PI = 3.14159;
```

TypeScript matches `math.js` with `math.d.ts` automatically (same base filename) — importing `math.js` in a TS file gets full type checking/autocomplete from the `.d.ts` file, with zero runtime overhead (declaration files are entirely erased, they generate no JS).

**Auto-generating declaration files from your own TS source:**

```json
// tsconfig.json
{ "compilerOptions": { "declaration": true } }
```

```bash
npx tsc   # now also emits a .d.ts file alongside each compiled .js file — useful when publishing a library
```

**Third-party type packages — `@types/*` on npm, for JS libraries without built-in types:**

```bash
npm install lodash
npm install --save-dev @types/lodash   # provides type info for lodash's untyped JS
```

**Writing a quick ambient declaration for an untyped module (escape hatch):**

```ts
// custom.d.ts
declare module "some-untyped-library" {
  export function doSomething(input: string): number;
}
```

**Interview note:** `.d.ts` files are purely a compile-time artifact for TypeScript's benefit — they produce **zero runtime code or overhead**, which is exactly how you get full type safety and autocomplete for plain JavaScript libraries without needing to rewrite them in TypeScript.
