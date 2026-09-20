# 02. Jobs

## What is a Job?

A job is a set of steps that execute on the same runner (a fresh virtual machine or container). Every workflow contains one or more jobs; by default, jobs run **in parallel**, unless you explicitly configure dependencies between them.

```yaml
jobs:
  test: # job ID
    runs-on: ubuntu-latest
    steps: [...]

  lint: # runs in PARALLEL with "test" by default
    runs-on: ubuntu-latest
    steps: [...]
```

## `runs-on` — Choosing the Runner

```yaml
jobs:
  build:
    runs-on: ubuntu-latest # GitHub-hosted runner (Linux)
  build-mac:
    runs-on: macos-latest # GitHub-hosted runner (macOS)
  build-windows:
    runs-on: windows-latest # GitHub-hosted runner (Windows)
  build-self-hosted:
    runs-on: self-hosted # your OWN infrastructure, registered as a runner
```

GitHub-hosted runners are fresh, ephemeral virtual machines — every job starts with a completely clean environment (nothing persists between separate job runs unless explicitly cached or passed via artifacts).

## Job Dependencies — `needs`

By default, all jobs in a workflow run in parallel. `needs` establishes an explicit dependency, making one job wait for another (or several others) to complete first.

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps: [...]

  build:
    needs: test # "build" only starts AFTER "test" completes successfully
    runs-on: ubuntu-latest
    steps: [...]

  deploy:
    needs: [test, build] # waits for BOTH to complete
    runs-on: ubuntu-latest
    steps: [...]
```

```
Without needs:  test ─┐
                 lint ─┼─> all run in PARALLEL, workflow waits for all to finish
                build ─┘

With needs (build needs test):
                 test ──> build ──> deploy
                 (sequential chain, each waits for the previous to succeed)
```

If a job in the dependency chain fails, dependent jobs are **skipped** by default (not run at all) — unless overridden with a conditional.

```yaml
deploy:
  needs: test
  if: always() # run even if "test" failed (rarely what you want for a deploy job, but sometimes needed for cleanup jobs)
```

## Passing Data Between Jobs — Outputs

Since each job runs on a fresh, isolated runner, sharing data between jobs requires explicitly defined outputs (unlike steps within the _same_ job, which can share files directly on disk).

```yaml
jobs:
  determine-version:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.get-version.outputs.version }}
    steps:
      - id: get-version
        run: echo "version=1.2.3" >> "$GITHUB_OUTPUT"

  deploy:
    needs: determine-version
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying version ${{ needs.determine-version.outputs.version }}"
```

## Job-Level Environment and Defaults

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      NODE_ENV: production
    defaults:
      run:
        working-directory: ./backend # every "run" step in this job defaults to this directory
        shell: bash
    steps: [...]
```

## Job Timeout

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10 # kill the job if it hasn't finished within 10 minutes (default is 360 = 6 hours)
```

Setting a sensible timeout prevents a hung/stuck job from silently consuming runner minutes (and billing, for private repos) indefinitely.

## Job-Level Conditional Execution

```yaml
jobs:
  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps: [...]

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps: [...]
```

## Environments — Deployment Targets with Protection Rules

GitHub Environments (`environment:`) let a job target a named deployment environment (like `production`), which can have protection rules configured at the repository level — required reviewers, wait timers, restricted branches.

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://myapp.example.com
    steps:
      - run: ./deploy.sh
```

```
Repository Settings -> Environments -> "production":
  ✓ Required reviewers: @deploy-team    (job PAUSES, waiting for manual approval, before running)
  ✓ Wait timer: 5 minutes                  (mandatory delay before the job can proceed)
  ✓ Deployment branches: only "main"          (restricts which branches can trigger this environment)
```

This is the standard mechanism for adding a manual approval gate before a production deployment job actually executes — a critical safety feature for CD pipelines.

## Matrix Jobs — Preview (Full Detail in Matrix Builds Notes)

A single job definition can run as **multiple parallel job instances**, each with different variable combinations (e.g., testing against multiple Node.js versions simultaneously).

```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20, 22]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
```

(Full dedicated coverage in the Matrix Builds notes.)

## A Complete Multi-Job Workflow Example

```yaml
name: CI/CD

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm install
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      image-tag: ${{ steps.set-tag.outputs.tag }}
    steps:
      - uses: actions/checkout@v4
      - id: set-tag
        run: echo "tag=v$(date +%s)" >> "$GITHUB_OUTPUT"
      - run: docker build -t myapp:${{ steps.set-tag.outputs.tag }} .

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: production
    steps:
      - run: echo "Deploying myapp:${{ needs.build.outputs.image-tag }}"
```

`test` runs first; `build` waits for `test` to succeed and produces a version tag output; `deploy` waits for `build`, uses its output, and additionally requires the `production` environment's protection rules (like manual approval) to be satisfied before running.

## Common Interview-Style Questions

- **Do jobs within a workflow run in parallel or sequentially by default?**
  In parallel by default — sequential execution requires explicitly declaring a dependency with `needs`.

- **What happens to a dependent job if the job it `needs` fails?**
  It's skipped by default, not executed at all — unless explicitly overridden with a conditional like `if: always()` to force it to run regardless of the dependency's outcome.

- **How do you pass data from one job to another, given that each job runs on a separate, isolated runner?**
  Via explicitly defined job `outputs`, referencing a step's output within that job (`steps.<id>.outputs.<name>`) and then accessing it from a dependent job via `needs.<job-id>.outputs.<name>` — unlike steps within the same job, jobs can't simply share files on disk since they run on entirely separate runner instances.

- **What is a GitHub Environment, and why is it commonly used for production deployment jobs?**
  A named deployment target (like "production") that can have protection rules configured at the repository level, such as requiring manual approval from specific reviewers or restricting which branches can deploy to it; assigning a job to an Environment is the standard way to add a manual approval gate before a production deployment actually runs.

- **Why is setting a `timeout-minutes` on a job considered good practice?**
  Without it, a hung or stuck job could run for the default timeout (6 hours), silently consuming runner minutes and, for private repositories, incurring unnecessary billing costs — an explicit, reasonable timeout ensures failures are caught and the job terminated promptly.
