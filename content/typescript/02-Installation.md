# Installation

```bash
# Install TypeScript locally in a project (recommended over global install)
npm install --save-dev typescript

# Verify the version
npx tsc --version

# Initialize a tsconfig.json with sensible defaults
npx tsc --init
```

**Compiling a file:**

```bash
npx tsc app.ts          # compiles app.ts -> app.js
npx tsc                    # compiles the whole project, based on tsconfig.json
npx tsc --watch               # recompiles automatically on file changes
```

**Running TypeScript directly (without a separate compile step) during development:**

```bash
npm install --save-dev ts-node
npx ts-node app.ts    # compiles + runs in one step, handy for quick scripts

# Or, increasingly common in modern setups: tsx (faster, esbuild-based)
npm install --save-dev tsx
npx tsx app.ts
```

**Typical project setup:**

```bash
npm init -y
npm install --save-dev typescript @types/node
npx tsc --init
mkdir src
# put your .ts files in src/, compiled output typically goes to dist/ (configured in tsconfig.json)
```

**`@types/*` packages** provide type definitions for JS libraries that don't ship their own types (e.g. `@types/express`, `@types/react`) — installed as devDependencies, they're used only at compile time and add no runtime code.

```bash
npm install express
npm install --save-dev @types/express   # adds type info for the express package
```

**Interview note:** TypeScript itself doesn't execute anything — `tsc` only **transpiles** `.ts` to `.js`; you still need Node (or a bundler) to actually run the resulting JavaScript. Tools like `ts-node`/`tsx` combine both steps for convenience during development, but production builds typically compile ahead of time and run the plain `.js` output.
