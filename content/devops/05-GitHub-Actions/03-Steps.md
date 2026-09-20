# 03. Steps

## What is a Step?

A step is a single task within a job — either running a shell command (`run`) or invoking a pre-built, reusable Action (`uses`). Steps within the same job execute **sequentially**, in the order they're listed, and share the same filesystem/workspace (unlike separate jobs, which run on isolated runners).

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code # step 1
        uses: actions/checkout@v4
      - name: Install dependencies # step 2 — runs AFTER step 1 completes
        run: npm install
      - name: Run tests # step 3 — runs AFTER step 2 completes
        run: npm test
```

## `run` — Executing Shell Commands

```yaml
steps:
  - run: npm install
  - run: npm test
  - name: Multi-line command
    run: |
      echo "Starting build"
      npm run build
      echo "Build complete"
```

```yaml
steps:
  - run: echo "hello"
    shell: bash # explicitly specify the shell (bash, sh, pwsh, python, cmd, etc.)
```

## `uses` — Invoking a Pre-Built Action

Actions are reusable, packaged units of automation — either from GitHub's own library, the broader community (via the GitHub Marketplace), or your own repository.

```yaml
steps:
  - uses: actions/checkout@v4 # official GitHub action — clones the repo onto the runner
  - uses: actions/setup-node@v4 # official — installs a specific Node.js version
    with:
      node-version: 20
  - uses: docker/build-push-action@v5 # community action — builds and pushes a Docker image
    with:
      push: true
      tags: myapp:latest
```

```
actions/checkout@v4
   │        │    │
   │        │    └─ version (tag, branch, or commit SHA — pinning to a specific SHA is most secure/reproducible)
   │        └────── action name
   └─────────────── owner/organization (or local path for a repo-local action)
```

## Step Inputs — `with`

```yaml
steps:
  - uses: actions/setup-node@v4
    with:
      node-version: 20
      cache: "npm" # this specific action's "cache" input, enabling automatic dependency caching
```

Each action defines its own set of accepted inputs (documented in its `action.yml` / README) — `with` passes values into those inputs.

## Step Outputs

```yaml
steps:
  - id: build-info
    run: echo "version=1.2.3" >> "$GITHUB_OUTPUT"
  - run: echo "The version is ${{ steps.build-info.outputs.version }}"
```

An `id` is required on a step for later steps (or a job's own `outputs:` section) to reference its outputs.

## Step Naming

```yaml
steps:
  - name: Install dependencies # shown in the GitHub Actions UI log, instead of the raw command
    run: npm install
```

Naming steps meaningfully significantly improves readability of workflow run logs, especially in longer workflows — without a `name`, GitHub displays the raw `run` command or action reference instead.

## Conditional Steps

```yaml
steps:
  - name: Deploy
    if: github.ref == 'refs/heads/main'
    run: ./deploy.sh

  - name: Notify on failure
    if: failure()
    run: ./notify-slack.sh "Build failed"

  - name: Always cleanup
    if: always()
    run: ./cleanup.sh
```

```
success()   -> (implicit default) all previous steps in this job succeeded
failure()     -> at least one previous step in this job failed
always()        -> run regardless of previous step outcomes
cancelled()        -> the workflow run was cancelled
```

## `continue-on-error` — Allowing a Step to Fail Without Failing the Job

```yaml
steps:
  - name: Run optional linter
    run: npm run lint
    continue-on-error: true # job continues even if this step fails; the step itself shows as "failed" but doesn't block later steps
```

Useful for non-critical steps (an experimental check, a linter still being rolled out) that shouldn't block the whole pipeline while still surfacing their result.

## Environment Variables at the Step Level

```yaml
steps:
  - name: Build
    run: npm run build
    env:
      NODE_ENV: production
      API_URL: ${{ secrets.API_URL }}
```

## Working Directory Per Step

```yaml
steps:
  - name: Install backend dependencies
    working-directory: ./backend
    run: npm install
  - name: Install frontend dependencies
    working-directory: ./frontend
    run: npm install
```

## Referencing Secrets Within a Step

```yaml
steps:
  - name: Deploy
    run: ./deploy.sh
    env:
      API_KEY: ${{ secrets.DEPLOY_API_KEY }}
```

(Full detail on managing and using Secrets in the dedicated Secrets notes.)

## Common Multi-Step Patterns

### Checkout, Setup, Install, Test — The Canonical CI Sequence

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with:
      node-version: 20
      cache: "npm"
  - run: npm ci
  - run: npm run lint
  - run: npm test
  - run: npm run build
```

### Using Step Outputs to Drive Later Conditional Steps

```yaml
steps:
  - id: check-changes
    run: |
      if git diff --name-only HEAD^ HEAD | grep -q '^src/'; then
        echo "changed=true" >> "$GITHUB_OUTPUT"
      else
        echo "changed=false" >> "$GITHUB_OUTPUT"
      fi
  - name: Run full test suite
    if: steps.check-changes.outputs.changed == 'true'
    run: npm test
```

## Pinning Actions to a Specific Commit SHA — A Security Consideration

```yaml
# Less secure — a tag can be moved to point at different (potentially compromised) code later
- uses: actions/checkout@v4

# More secure — an exact commit SHA can never be silently changed
- uses: actions/checkout@8f4b7f84864484a7bf31766abe9204da3cbe65b3 # v4.1.1, pinned
```

For workflows handling sensitive operations (deployments, secrets), pinning third-party actions to an exact commit SHA (rather than a mutable tag like `@v4`) protects against a supply-chain attack where a compromised action's tag is silently repointed to malicious code.

## Common Interview-Style Questions

- **What's the difference between `run` and `uses` in a step?**
  `run` executes a raw shell command directly; `uses` invokes a pre-built, packaged Action (from GitHub, the community Marketplace, or a local/repo-relative path) that encapsulates reusable automation logic, typically configured via `with` inputs.

- **Do steps within the same job share state, unlike separate jobs?**
  Yes — steps within a single job run sequentially on the same runner and share the same filesystem/workspace, so files created by one step are directly visible to later steps; separate jobs run on isolated runners and require explicit `outputs`/artifacts to share data.

- **Why is an `id` required on a step to use its outputs later?**
  The `id` gives the step a reference name so that later steps (via `steps.<id>.outputs.<name>`) or the job's own `outputs:` section can access values that step explicitly wrote to `$GITHUB_OUTPUT`.

- **What does `continue-on-error: true` accomplish, and when would you use it?**
  It allows a step to fail without failing the overall job/workflow, letting subsequent steps still run; useful for non-critical checks (like an experimental linter) that should surface their result without blocking the entire pipeline.

- **Why might a security-conscious workflow pin a third-party action to a specific commit SHA rather than a version tag?**
  A tag (like `@v4`) is mutable and could theoretically be repointed to different, potentially malicious code by whoever controls that action's repository (a supply-chain attack vector); pinning to an exact commit SHA guarantees the action's code can never silently change without your workflow explicitly updating the reference.
