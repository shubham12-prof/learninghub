# 07. Interview Questions — GitHub Actions (Comprehensive)

A consolidated set of commonly asked GitHub Actions interview questions, organized by topic, with concise answers and code where useful.

---

## Workflows

**Q: What is a GitHub Actions workflow, and where does it live?**
An automated process defined in YAML that runs jobs in response to events; lives in the `.github/workflows/` directory of a repository.

**Q: `push` vs `pull_request` vs `workflow_dispatch`?**
`push` triggers on commits to matching branches; `pull_request` triggers on PR lifecycle events; `workflow_dispatch` allows manual triggering via the UI/API, often with custom inputs.

**Q: Why configure `concurrency` on a workflow?**
Prevents multiple runs of the same workflow from racing each other, optionally cancelling in-progress runs — important for deployment workflows.

**Q: Reusable workflow vs composite action?**
A reusable workflow is called at the job level to reuse an entire workflow (multiple jobs); a composite action is called at the step level to reuse a sequence of steps within a job.

---

## Jobs

**Q: Do jobs run in parallel or sequentially by default?**
In parallel by default — sequential execution requires explicit `needs` dependencies.

**Q: What happens to a dependent job if its `needs` job fails?**
It's skipped by default, unless overridden with `if: always()`.

**Q: How do you pass data between jobs?**
Via job `outputs`, referencing a step's `$GITHUB_OUTPUT` value within the producing job, accessed via `needs.<job-id>.outputs.<name>` in the consuming job.

**Q: What is a GitHub Environment used for?**
A named deployment target with configurable protection rules (required reviewers, wait timers, branch restrictions) — the standard mechanism for adding manual approval gates before production deployments.

---

## Steps

**Q: `run` vs `uses`?**
`run` executes a raw shell command; `uses` invokes a pre-built, packaged Action.

**Q: Do steps in the same job share state?**
Yes — they run sequentially on the same runner and share the filesystem, unlike separate jobs which run on isolated runners.

**Q: Why is an `id` needed on a step to use its output?**
It provides a reference name so later steps or the job's outputs can access values written to `$GITHUB_OUTPUT`.

**Q: Why pin a third-party action to a commit SHA instead of a tag?**
Tags are mutable and could be repointed to malicious code (a supply-chain risk); a commit SHA guarantees the code can never silently change.

---

## Matrix Builds

**Q: What does a matrix build solve?**
Automatically generates multiple parallel job instances from one job definition, each with a different variable combination — avoiding duplicated job definitions for testing across versions/platforms.

**Q: What does a two-dimensional matrix produce by default?**
The full Cartesian product of both dimensions' values.

**Q: `include` vs `exclude`?**
`include` adds specific extra combinations beyond the base product; `exclude` removes specific combinations from the generated set.

**Q: What does `fail-fast: false` change?**
By default, one failing matrix job cancels all others; setting it to false lets all combinations run to completion, useful for seeing the full picture of what's affected.

---

## Secrets

**Q: What happens if a secret leaks into log output?**
GitHub automatically masks it as `***` — though masking is exact-string-based, so transformed versions might not be caught.

**Q: Repository vs environment vs organization secrets?**
Repository: scoped to one repo. Environment: scoped to a specific deployment environment within a repo. Organization: shared across multiple repos with configurable access.

**Q: Why aren't secrets available to fork PR workflows by default?**
Security — prevents a malicious external contributor from exfiltrating secrets via a modified workflow in their PR.

**Q: Why is `pull_request_target` risky when combined with checking out PR code?**
It runs with the base repo's elevated permissions (including secrets) even for fork PRs; executing untrusted PR code under this context is a well-documented attack vector.

---

## Artifacts

**Q: What problem do artifacts solve?**
Since job runners are ephemeral, artifacts persist specific output files beyond a job's lifetime, for download or passing between jobs.

**Q: Why can't job outputs alone pass build files between jobs?**
Outputs are for small scalar values, not actual files; artifacts are needed to transfer real file content between isolated runners.

**Q: Artifacts vs caching?**
Artifacts preserve deliverable output files explicitly wanted/passed between jobs; caching is a best-effort performance optimization for reusing unchanged intermediate data, never guaranteed to persist.

**Q: Why use `if: always()` when uploading test result artifacts?**
So the report is preserved even when the test step fails — often exactly when you most need to inspect it.

---

## Practical / Coding Questions Often Asked Live

**Q: Write a CI workflow that tests across multiple Node versions with full failure visibility.**

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        node-version: [18, 20, 22]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: "npm"
      - run: npm ci
      - run: npm test
```

**Q: Write a build-then-deploy pipeline using artifacts and a protected production environment.**

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: actions/upload-artifact@v4
        with: { name: build-output, path: dist/ }

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/download-artifact@v4
        with: { name: build-output, path: dist/ }
      - run: ./deploy.sh dist/
        env:
          API_KEY: ${{ secrets.DEPLOY_API_KEY }}
```

**Q: Write a job that always uploads test coverage even on failure.**

```yaml
steps:
  - run: npm test -- --coverage
  - uses: actions/upload-artifact@v4
    if: always()
    with:
      name: coverage-report
      path: coverage/
```

**Q: How would you design a CI/CD pipeline for a Node.js app with staging and production deployments, requiring manual approval for production?**
A `test` job (matrix across Node versions) runs on every push/PR; a `build` job (needs test) compiles and uploads a build artifact; a `deploy-staging` job (needs build) downloads the artifact and deploys automatically on pushes to `main`; a `deploy-production` job (needs build, targeting the `production` GitHub Environment configured with required reviewers) downloads the same artifact and deploys only after manual approval — ensuring staging and production both receive the exact same tested build.

**Q: A workflow needs to comment on a pull request from a forked repository, but secrets aren't available on fork PRs. How would you handle this securely?**
Use a two-workflow pattern: the fork-triggered `pull_request` workflow (no secrets needed) uploads relevant data as an artifact; a separate `workflow_run` (or `pull_request_target`, used carefully without checking out untrusted code) triggered workflow, running with full repository context and secrets, downloads that artifact and performs the actual commenting via the GitHub API — avoiding ever running untrusted fork code with access to secrets directly.
