# 📦 Package Management (npm, pnpm, yarn)

## 🎯 What They Do

Package managers install, update, and manage your project's **dependencies** (third-party code from the npm registry), track versions via `package.json`, and lock exact versions via a lockfile for reproducible builds.

---

## 🆚 npm vs Yarn vs pnpm

|                          | npm                                     | Yarn                               | pnpm                                           |
| ------------------------ | --------------------------------------- | ---------------------------------- | ---------------------------------------------- |
| Ships with Node          | ✅ Yes                                  | ❌ No (install separately)         | ❌ No                                          |
| Lockfile                 | `package-lock.json`                     | `yarn.lock`                        | `pnpm-lock.yaml`                               |
| Disk usage               | Duplicates deps per project             | Duplicates (Classic) / PnP (Berry) | ✅ **Shared global store** — huge disk savings |
| Install speed            | Good (improved a lot)                   | Fast                               | ✅ Fastest for repeat installs                 |
| `node_modules` structure | Flat (hoisted)                          | Flat (Classic)                     | Symlinked from global store (strict)           |
| Best for                 | Default choice, universal compatibility | Workspaces, established teams      | Monorepos, disk-space-conscious setups         |

---

## 💻 `package.json` Anatomy

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "description": "My awesome Node app",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js",
    "test": "node --test"
  },
  "dependencies": {
    "express": "^4.19.2"
  },
  "devDependencies": {
    "eslint": "^9.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## 🔢 Semantic Versioning (SemVer) — Understanding `^` and `~`

```
  4  .  19  .  2
  │      │      │
MAJOR  MINOR  PATCH
  │      │      │
breaking new    bug
changes  features fixes
```

| Range prefix     | Meaning                                  | Example allows                     |
| ---------------- | ---------------------------------------- | ---------------------------------- |
| `^4.19.2`        | Compatible: allows MINOR + PATCH updates | `4.19.2` → `4.99.0` (NOT `5.0.0`)  |
| `~4.19.2`        | Approximately: allows only PATCH updates | `4.19.2` → `4.19.9` (NOT `4.20.0`) |
| `4.19.2` (exact) | Locks to exact version                   | Only `4.19.2`                      |
| `*` or `latest`  | Any version                              | ⚠️ Risky — avoid in production     |

---

## 🔧 Core Commands (npm)

```bash
npm init -y                     # create a package.json with defaults
npm install express             # install + save to dependencies
npm install --save-dev eslint   # install as devDependency (-D shorthand)
npm install                      # install everything from package.json
npm uninstall express           # remove a package
npm update                       # update packages within semver ranges
npm outdated                     # see which packages have newer versions
npm audit                        # check for security vulnerabilities
npm audit fix                    # auto-fix vulnerabilities where possible
npm run dev                      # run a custom script from package.json
npx cowsay "hello"                # run a package WITHOUT installing globally
```

---

## 🔒 Why Lockfiles Matter

Without a lockfile, `^4.19.2` could resolve to different exact versions on different machines/days — causing **"works on my machine"** bugs. The lockfile pins the **exact dependency tree** (including nested/transitive dependencies) so every install is bit-for-bit reproducible.

```bash
npm ci   # "clean install" — uses ONLY the lockfile, ignores package.json ranges
         # faster + safer for CI/CD pipelines than `npm install`
```

⚠️ **Always commit your lockfile** (`package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`) to version control!

---

## 📁 pnpm — The Disk-Space-Efficient Option

```bash
npm install -g pnpm
pnpm install
pnpm add express
```

pnpm stores every package version **once globally** and uses hard links/symlinks in each project's `node_modules` — huge savings when you have many projects sharing dependencies.

```
~/.pnpm-store/           <- single global store
project-a/node_modules/  <- symlinks into the store
project-b/node_modules/  <- symlinks into the store
```

---

## 🗂️ Monorepo Workspaces (npm/Yarn/pnpm all support this)

**package.json (root)**

```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": ["packages/*"]
}
```

```bash
npm install                       # installs & links all workspace packages
npm install lodash -w packages/api  # install into a specific workspace
```

---

## ⚠️ Common Pitfalls

- Not committing the lockfile → inconsistent installs across environments.
- Using `npm install` in CI instead of `npm ci` → slower, can silently update the lockfile.
- Installing packages globally when a local `devDependency` + `npx` would be more reproducible.
- Ignoring `npm audit` warnings on production dependencies.
- Mixing package managers in one project (e.g., both `package-lock.json` AND `yarn.lock` present) → causes inconsistent dependency trees.

---

## 🧪 Try It Yourself

1. Initialize a new project, add `express` as a dependency and `eslint` as a devDependency, then inspect `package.json`.
2. Run `npm outdated` and `npm audit` on an existing project.
3. Try `pnpm install` on a project and compare `node_modules` disk usage to `npm install`.
