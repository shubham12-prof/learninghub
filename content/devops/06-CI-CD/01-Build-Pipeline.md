# 01. Build Pipeline

## What is a Build Pipeline?

The build pipeline is the stage of CI/CD responsible for transforming source code into a deployable artifact — installing dependencies, compiling/transpiling code, bundling assets, and packaging the result (a Docker image, a compiled binary, a static bundle) into something that can actually be deployed and run.

```
Source Code -> Install Dependencies -> Compile/Transpile -> Bundle/Package -> Deployable Artifact
```

## Why a Dedicated Build Stage Matters

- **Consistency** — the same build process runs identically every time, regardless of who triggers it or what their local machine looks like, eliminating "works on my machine" problems.
- **Speed** — a properly cached, optimized build pipeline can turn a 10-minute build into a 90-second one.
- **Reliability** — build failures are caught immediately and visibly, before ever reaching later pipeline stages (testing, deployment).

## A Basic Build Pipeline (GitHub Actions Example)

```yaml
name: Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/
```

## Dependency Installation — `npm install` vs `npm ci`

```bash
npm install   # can update package-lock.json, slower, less deterministic in CI
npm ci           # installs EXACTLY what's in package-lock.json, deletes node_modules first, faster and reproducible
```

**Best practice:** always use `npm ci` (or the equivalent for your package manager — `yarn install --frozen-lockfile`, `pnpm install --frozen-lockfile`) in CI pipelines specifically, since it guarantees the exact dependency versions from the lockfile are installed, with no possibility of silently drifting.

## Caching Dependencies — Dramatically Speeding Up Builds

Re-downloading and reinstalling every dependency on every single build wastes enormous amounts of time. Caching the dependency directory (keyed on the lockfile's hash) avoids this when dependencies haven't changed.

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: "npm" # built-in caching support, keyed automatically on package-lock.json
```

```yaml
# Or manually, for more control
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: npm-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      npm-
```

```
Cache HIT (lockfile unchanged):   dependency install takes seconds
Cache MISS (lockfile changed):      full fresh install, cache updated for NEXT time
```

## Build Steps for Different Project Types

### TypeScript Compilation

```yaml
- run: npm run build # typically runs `tsc` or a bundler like esbuild/webpack/vite under the hood
```

### Frontend Asset Bundling

```yaml
- run: npm run build # Vite/Webpack/etc. — bundles JS/CSS/assets into optimized production output
```

### Docker Image Build

```yaml
- uses: docker/setup-buildx-action@v3
- uses: docker/build-push-action@v5
  with:
    context: .
    push: false
    tags: myapp:${{ github.sha }}
    cache-from: type=gha # leverage GitHub Actions' cache for Docker layer caching too
    cache-to: type=gha,mode=max
```

## Build Reproducibility — A Core Principle

A build pipeline should produce the **exact same output** given the exact same source code and dependency versions — no hidden reliance on the specific machine, ambient environment variables, or "whatever happened to be installed" at build time.

```
BAD:  build behavior depends on globally-installed tools whose version isn't pinned/verified
GOOD:  build runs inside a container/environment with EXACTLY specified tool versions,
        dependencies locked via a lockfile, no reliance on ambient machine state
```

This reproducibility is what makes it safe to trust a CI-built artifact as the thing that actually gets deployed — if builds were non-deterministic, you couldn't be confident the artifact tested in CI is truly identical to what ships to production.

## Versioning and Tagging Build Artifacts

```yaml
- name: Set build version
  id: version
  run: echo "version=$(git describe --tags --always)" >> "$GITHUB_OUTPUT"

- run: docker build -t myapp:${{ steps.version.outputs.version }} .
```

```
Common versioning schemes:
  Git SHA:          myapp:a1b2c3d4          (always unique, but not human-friendly)
  Semantic version:   myapp:v2.4.1              (human-readable, requires a release/tagging process)
  Build number:         myapp:build-1247            (simple, incrementing, tied to CI run number)
  Combined:               myapp:v2.4.1-a1b2c3d4         (best of both — readable AND traceable to an exact commit)
```

## Build Failure Handling

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      - name: Notify on build failure
        if: failure()
        run: ./notify-slack.sh "Build failed on ${{ github.ref }}"
```

A build pipeline should fail loudly and immediately when something is wrong — silent build failures (or ones that don't block downstream stages) defeat the entire purpose of having automated checks.

## Multi-Stage Build Pipelines (Monorepo Example)

```yaml
jobs:
  build-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - working-directory: ./apps/api
        run: npm ci && npm run build

  build-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - working-directory: ./apps/web
        run: npm ci && npm run build
```

For larger monorepos, build pipelines often use path-based triggers and dependency-aware tooling (Nx, Turborepo) to avoid rebuilding unaffected packages on every single change.

```yaml
on:
  push:
    paths:
      - "apps/api/**" # only trigger the API build if API-related files actually changed
```

## The Build Pipeline's Place in the Overall CI/CD Flow

```
Build Pipeline  -->  Testing Pipeline  -->  Deployment Pipeline
(produces the        (validates the           (ships the validated
 artifact)             artifact works)          artifact to environments)
```

(Full detail on the next two stages in their own dedicated notes.)

## Common Interview-Style Questions

- **What's the purpose of the build pipeline stage, specifically?**
  Transforming source code into a deployable artifact — installing dependencies, compiling/transpiling, bundling, and packaging — producing a consistent, reproducible output that later pipeline stages (testing, deployment) can rely on.

- **Why is `npm ci` preferred over `npm install` in a CI build pipeline?**
  `npm ci` installs exactly what's specified in the lockfile (deleting `node_modules` first for a clean state) without potentially modifying the lockfile, guaranteeing reproducible dependency versions across every build — `npm install` can silently update the lockfile and is slower/less deterministic for CI purposes.

- **Why does dependency caching matter for build pipeline performance, and how is it typically keyed?**
  Re-downloading and reinstalling all dependencies on every build wastes significant time; caching (typically keyed on a hash of the lockfile) lets unchanged dependency sets be restored almost instantly, only triggering a full fresh install when the lockfile actually changes.

- **What does "build reproducibility" mean, and why is it important?**
  The same source code and dependency versions should always produce the exact same build output, regardless of the machine or ambient environment building it; this is essential for trusting that a CI-built and tested artifact is truly identical to what actually gets deployed to production.

- **How would you structure build triggers in a large monorepo to avoid unnecessary rebuilds?**
  Use path-based trigger filters (only rebuild a specific package/app when its own files change) combined with dependency-aware build tooling (like Nx or Turborepo) that understands the monorepo's internal dependency graph, avoiding rebuilding packages unaffected by a given change.
