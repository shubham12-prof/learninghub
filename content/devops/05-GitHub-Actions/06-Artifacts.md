# 06. Artifacts

## What Are Artifacts?

Artifacts are files or collections of files produced by a workflow run that you want to persist **after** the job finishes — build outputs, test reports, coverage data, compiled binaries. Since each job runs on an ephemeral, isolated runner (destroyed after the job completes), artifacts are the mechanism for preserving and sharing that output — either for download after the workflow run, or for passing files **between jobs** in the same workflow.

```
Job A's runner (ephemeral, destroyed after the job)
   │
   ▼ upload-artifact
Artifact storage (persists after the job/workflow completes)
   │
   ▼ download-artifact
Job B's runner (a DIFFERENT, separate ephemeral runner)
```

## Uploading an Artifact

```yaml
steps:
  - uses: actions/checkout@v4
  - run: npm install && npm run build
  - uses: actions/upload-artifact@v4
    with:
      name: build-output
      path: dist/
```

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: test-results
    path: |
      coverage/
      test-report.xml
    retention-days: 7 # how long to keep the artifact before automatic deletion (default varies, max 90 days)
```

## Downloading an Artifact

### Within the Same Workflow (a Different Job)

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install && npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/
      - run: ./deploy.sh dist/
```

This is the standard pattern for a build-then-deploy pipeline split across separate jobs — `build` produces the artifact, `deploy` downloads it and uses it, without needing to re-run the build.

### Manually, from the GitHub UI

Every workflow run's page shows an "Artifacts" section where uploaded artifacts can be manually downloaded — useful for grabbing a specific build's output, test report, or log bundle for local inspection.

## Why Artifacts Are Necessary Between Jobs (Not Just Within One)

As covered in the Jobs notes, separate jobs run on entirely separate, isolated runners — files created by one job are **not** automatically visible to another job. While simple scalar values can be passed via job `outputs`, actual **files** (a compiled binary, a full build directory, a large test report) require artifacts specifically.

```
Job outputs:  good for small, simple VALUES (a version string, a boolean flag)
Artifacts:      necessary for actual FILES or directories of files
```

## Common Real-World Use Cases

### 1. Build Once, Deploy to Multiple Environments

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with: { name: app-build, path: dist/ }

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with: { name: app-build, path: dist/ }
      - run: ./deploy.sh staging

  deploy-production:
    needs: [build, deploy-staging]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/download-artifact@v4
        with: { name: app-build, path: dist/ }
      - run: ./deploy.sh production
```

Building exactly **once** and reusing that same artifact for multiple deployment stages guarantees you're deploying the exact same tested build to staging and production, rather than risking subtle differences from rebuilding separately for each environment.

### 2. Preserving Test Reports and Coverage

```yaml
- run: npm test -- --coverage --reporters=default --reporters=jest-junit
- uses: actions/upload-artifact@v4
  if: always() # upload test results even if the tests THEMSELVES failed — especially valuable then
  with:
    name: test-results
    path: |
      coverage/
      junit.xml
```

Using `if: always()` ensures the test report/coverage data is preserved even when the test step fails — often when you most want to actually inspect the detailed failure report.

### 3. Sharing Docker Images Between Jobs (Without a Registry)

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: docker build -t myapp:ci .
      - run: docker save myapp:ci -o myapp.tar
      - uses: actions/upload-artifact@v4
        with: { name: docker-image, path: myapp.tar }

  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with: { name: docker-image }
      - run: docker load -i myapp.tar
      - run: docker run myapp:ci npm test
```

## Artifact Retention and Storage Limits

```
Default retention: typically 90 days (configurable, up to 90 days max, per organization/repository settings)
Storage limits:      GitHub Actions storage is billed/limited based on your plan
                      (public repos generally get more generous free storage than private repos)
```

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: build-output
    path: dist/
    retention-days: 3 # shorter retention for less-important, high-frequency artifacts, to control storage usage
```

## Artifacts vs Caching — A Common Point of Confusion

```
Artifacts:  meant for OUTPUT FILES you want to PRESERVE/DOWNLOAD/PASS BETWEEN JOBS —
             build results, test reports, deployment packages
             (semantically: "the actual product of this job")

Cache:        meant for SPEEDING UP future runs by reusing unchanged intermediate data —
               dependency directories (node_modules), compiler caches
               (semantically: "a performance optimization, not a deliverable")
```

```yaml
# Caching — for speeding up npm install on future runs
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: npm-${{ hashFiles('package-lock.json') }}

# Artifacts — for preserving the actual build output as a deliverable
- uses: actions/upload-artifact@v4
  with:
    name: build-output
    path: dist/
```

Using the wrong mechanism for the wrong purpose is a common mistake — caches are best-effort and can be evicted/invalidated at any time (never rely on a cache being present), while artifacts are a more deliberate, explicit "this is what this job produced."

## Downloading Artifacts via the GitHub CLI/API (Outside a Workflow)

```bash
gh run download <run-id>                    # download all artifacts from a specific workflow run
gh run download <run-id> -n build-output       # download a specific named artifact
```

Useful for scripting/automation outside of GitHub Actions itself — e.g., a local script that fetches the latest build artifact for manual inspection or a custom deployment process.

## Common Interview-Style Questions

- **What problem do artifacts solve, given that GitHub Actions runners are ephemeral?**
  Since each job's runner (and all its files) is destroyed once the job completes, artifacts provide a way to persist specific output files beyond a job's lifetime — either for manual download after the workflow run, or for passing files between separate jobs within the same workflow.

- **Why can't job outputs alone be used to pass a build's compiled files from one job to another?**
  Job `outputs` are designed for small scalar values (strings, simple flags), not actual files or directories; passing real file content between the isolated runners of separate jobs requires artifacts specifically, via `upload-artifact` in the producing job and `download-artifact` in the consuming job.

- **What's the difference between artifacts and GitHub Actions' caching mechanism?**
  Artifacts are meant to preserve actual deliverable output files (build results, test reports) that you explicitly want to keep or pass between jobs; caching is meant purely as a performance optimization for speeding up future workflow runs by reusing unchanged intermediate data (like installed dependencies) — caches are best-effort and can be evicted at any time, so they shouldn't be relied upon the way artifacts are.

- **Why might a workflow use `if: always()` when uploading test result artifacts?**
  To ensure the test report/coverage data is uploaded even if the test step itself fails — which is often precisely when you most want to inspect the detailed failure report, so skipping the upload on failure (the default behavior without `always()`) would be counterproductive.

- **Why is "build once, deploy to multiple environments" using a shared artifact considered a best practice over rebuilding separately for each environment?**
  It guarantees the exact same tested build artifact is what actually gets deployed to every environment, eliminating any risk of subtle differences (dependency version drift, environment-specific build quirks) that could occur if the build process were independently re-run for each deployment target.
