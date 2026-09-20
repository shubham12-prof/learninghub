# 01. Workflows

## What is a GitHub Actions Workflow?

A workflow is an automated process defined in a YAML file, living in a repository's `.github/workflows/` directory, that runs one or more jobs in response to specified events (a push, a pull request, a schedule, a manual trigger). Workflows are the top-level container for everything GitHub Actions does — CI, CD, automation, bots.

```
.github/
└── workflows/
    ├── ci.yml
    ├── deploy.yml
    └── release.yml
```

## Anatomy of a Basic Workflow

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm test
```

| Field  | Purpose                                                        |
| ------ | -------------------------------------------------------------- |
| `name` | Human-readable workflow name, shown in the GitHub UI           |
| `on`   | The event(s) that trigger this workflow                        |
| `jobs` | One or more jobs the workflow runs (full detail in Jobs notes) |

## Triggering Events (`on`)

### Push and Pull Request

```yaml
on:
  push:
    branches: [main, develop]
    paths:
      - "src/**" # only trigger if files under src/ changed
      - "!src/**/*.md" # exclude markdown file changes
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened] # specific PR event types
```

### Scheduled (Cron)

```yaml
on:
  schedule:
    - cron: "0 2 * * *" # every day at 2:00 AM UTC
```

```
Cron syntax: minute hour day-of-month month day-of-week
'0 2 * * *'    -> daily at 2 AM
'*/15 * * * *'   -> every 15 minutes
'0 0 * * 0'        -> every Sunday at midnight
```

### Manual Trigger

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Environment to deploy to"
        required: true
        default: "staging"
        type: choice
        options:
          - staging
          - production
```

`workflow_dispatch` adds a "Run workflow" button in the GitHub UI, letting someone manually trigger the workflow (optionally with custom inputs) — useful for deployments that shouldn't happen fully automatically.

### Other Common Triggers

```yaml
on:
  release:
    types: [published]
  issues:
    types: [opened, labeled]
  workflow_call: # allows this workflow to be CALLED by other workflows (reusable workflows)
  repository_dispatch: # triggered by an external system via the GitHub API
```

### Multiple Events

```yaml
on: [push, pull_request, workflow_dispatch]
```

## Workflow-Level Configuration

### Environment Variables

```yaml
env:
  NODE_ENV: test
  API_URL: https://api.example.com

jobs:
  test:
    runs-on: ubuntu-latest
    env:
      DEBUG: "true" # job-level, can override/add to workflow-level env vars
```

### Concurrency Control

Prevents multiple runs of the same workflow (e.g., from rapid successive pushes) from running simultaneously, optionally cancelling in-progress runs.

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

Extremely useful for deployment workflows — you generally don't want two deployments to the same environment racing each other.

### Permissions

Controls what the workflow's automatically-generated `GITHUB_TOKEN` is allowed to do — following the principle of least privilege.

```yaml
permissions:
  contents: read
  pull-requests: write # e.g., needed if the workflow comments on PRs
```

```yaml
permissions: read-all # or write-all — broader shortcuts, generally discouraged in favor of explicit scoping
```

## Reusable Workflows — Avoiding Duplication

A workflow can be defined once and called from multiple other workflows, similar to a function — useful when several workflows share common logic (e.g., a standardized build-and-test process used by both a CI workflow and a release workflow).

```yaml
# .github/workflows/reusable-build.yml
name: Reusable Build
on:
  workflow_call:
    inputs:
      node-version:
        required: true
        type: string
    secrets:
      NPM_TOKEN:
        required: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
      - run: npm install
      - run: npm run build
```

```yaml
# .github/workflows/ci.yml — CALLS the reusable workflow
jobs:
  call-build:
    uses: ./.github/workflows/reusable-build.yml
    with:
      node-version: "20"
    secrets:
      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Composite Actions vs Reusable Workflows

```
Reusable Workflow:  reuses an entire WORKFLOW (multiple jobs) — called with "uses:" at the JOB level
Composite Action:      reuses a sequence of STEPS — called with "uses:" at the STEP level, within a job
```

```yaml
# action.yml — a composite action definition
name: "Setup and Test"
runs:
  using: "composite"
  steps:
    - uses: actions/setup-node@v4
      with:
        node-version: 20
    - run: npm install
      shell: bash
    - run: npm test
      shell: bash
```

```yaml
# used within a job's steps
steps:
  - uses: ./.github/actions/setup-and-test
```

## Contexts and Expressions — Accessing Workflow Data

```yaml
steps:
  - run: echo "Triggered by ${{ github.actor }} on branch ${{ github.ref_name }}"
  - run: echo "Commit: ${{ github.sha }}"
  - if: github.event_name == 'pull_request'
    run: echo "This is a pull request"
```

| Context   | Provides                                                                   |
| --------- | -------------------------------------------------------------------------- |
| `github`  | Event/repository/workflow metadata (actor, sha, ref, event_name, etc.)     |
| `env`     | Environment variables                                                      |
| `secrets` | Configured secrets (full detail in the Secrets notes)                      |
| `matrix`  | Current matrix combination values (full detail in the Matrix Builds notes) |
| `steps`   | Outputs from previous steps in the same job                                |
| `needs`   | Outputs from jobs this job depends on                                      |

## Conditional Execution

```yaml
jobs:
  deploy:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying..."
        if: success() # only run if all PREVIOUS steps in this job succeeded (the implicit default)
      - run: echo "Cleanup"
        if: always() # run REGARDLESS of previous step success/failure
      - run: echo "Notify failure"
        if: failure() # only run if a PREVIOUS step in this job failed
```

## Common Interview-Style Questions

- **What is a GitHub Actions workflow, and where does it live in a repository?**
  An automated process defined in a YAML file that runs jobs in response to specified events; workflow files live in the `.github/workflows/` directory, with each file defining one independent workflow.

- **What's the difference between `push`, `pull_request`, and `workflow_dispatch` triggers?**
  `push` triggers on commits pushed to matching branches; `pull_request` triggers on PR events (opened, updated, etc.) against matching target branches; `workflow_dispatch` allows manually triggering the workflow via the GitHub UI or API, optionally with custom inputs — commonly used for deployments that shouldn't happen fully automatically.

- **Why would you configure `concurrency` on a workflow?**
  To prevent multiple runs of the same workflow (e.g., from rapid successive pushes) from executing simultaneously, and optionally to automatically cancel an in-progress run when a newer one starts — particularly important for deployment workflows where concurrent runs could race each other.

- **What's the difference between a reusable workflow and a composite action?**
  A reusable workflow lets you call an entire separate workflow (with its own jobs) from within another workflow's job definition (`uses:` at the job level); a composite action lets you package a reusable sequence of steps that can be invoked as a single step within any job (`uses:` at the step level) — reusable workflows operate at a coarser granularity than composite actions.

- **Why is scoping `permissions` explicitly (rather than relying on default broad permissions) considered a best practice?**
  It follows the principle of least privilege — the automatically-generated `GITHUB_TOKEN` should only have the specific permissions a workflow actually needs (e.g., `contents: read`, `pull-requests: write`), minimizing the potential impact if a workflow is ever compromised or misused (e.g., via a malicious dependency or a poorly-vetted third-party action).
