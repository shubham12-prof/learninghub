# 02. Testing Pipeline

## What is a Testing Pipeline?

The testing pipeline stage automatically validates that a build actually works correctly before it's allowed to progress toward deployment — running unit tests, integration tests, end-to-end tests, linting, type checking, and security scans. It's the primary automated quality gate in a CI/CD pipeline.

```
Build Pipeline -> Testing Pipeline -> Deployment Pipeline
                   (if ANY check fails here, the pipeline stops — nothing broken reaches deployment)
```

## The Testing Pyramid — Structuring What to Test, and How Much

```
        /\
       /E2E\        <- few, slow, expensive, test full user flows through the real system
      /------\
     /Integr. \      <- more, moderate speed, test interactions between components/services
    /----------\
   /   Unit     \     <- MANY, fast, cheap, test individual functions/modules in isolation
  /--------------\
```

**Guidance:** most of your automated tests should be fast unit tests; progressively fewer, slower integration tests; and only a small number of comprehensive (but expensive) end-to-end tests covering critical user flows. Inverting this pyramid (relying heavily on slow E2E tests) leads to slow, flaky, expensive pipelines.

## A Basic Testing Pipeline (GitHub Actions Example)

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: "npm" }
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:unit
      - run: npm run test:integration
```

## Unit Tests — Fast Feedback on Individual Components

```yaml
- run: npm run test:unit -- --coverage
```

```js
// Example unit test
test("calculateDiscount applies 10% off for orders over $100", () => {
  expect(calculateDiscount(150)).toBe(15);
});
```

Unit tests should run in seconds, not minutes — they're the bulk of the testing pyramid and the primary fast-feedback mechanism catching most regressions immediately.

## Integration Tests — Verifying Components Work Together

```yaml
integration-tests:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:16
      env:
        POSTGRES_PASSWORD: testpass
      ports:
        - 5432:5432
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: 20 }
    - run: npm ci
    - run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:testpass@localhost:5432/test
```

GitHub Actions' `services:` feature spins up real dependencies (a real Postgres instance, in this example) alongside the test job — letting integration tests run against an actual database rather than mocks, closer to real production behavior.

## End-to-End (E2E) Tests — Validating Full User Flows

```yaml
e2e-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: npm ci
    - run: npx playwright install --with-deps
    - run: npm run build
    - run: npm run start &
    - run: npx wait-on http://localhost:3000
    - run: npx playwright test
    - uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/
```

E2E tests actually start the application and drive it through a real browser (Playwright, Cypress) — slower and more brittle than unit/integration tests, so they're reserved for the most critical user flows (login, checkout) rather than exhaustive coverage.

## Code Coverage — Measuring Test Thoroughness

```yaml
- run: npm run test:unit -- --coverage
- uses: codecov/codecov-action@v4
  with:
    files: coverage/lcov.info
```

```yaml
# Enforcing a minimum coverage threshold, failing the pipeline if not met
- run: npm run test:unit -- --coverage --coverageThreshold='{"global":{"lines":80}}'
```

> **Important nuance:** high coverage numbers don't guarantee good tests (a test can execute a line without meaningfully asserting anything about its behavior) — coverage is a useful signal for finding _completely untested_ code, not a definitive measure of test quality.

## Linting and Static Analysis — Catching Issues Before Runtime

```yaml
- run: npm run lint # style/code quality issues (ESLint, etc.)
- run: npm run type-check # TypeScript type errors
- run: npm audit # known vulnerabilities in dependencies
```

These checks catch entire categories of bugs (type mismatches, unused variables, unsafe patterns) essentially for free, before any test even needs to run — cheap, fast, high-value pipeline steps.

## Security Scanning

```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: myapp:${{ github.sha }}
    exit-code: 1 # fail the pipeline if critical vulnerabilities are found
    severity: CRITICAL,HIGH
```

Integrating vulnerability scanning (dependency scanning, container image scanning) directly into the testing pipeline catches known security issues before they ever reach production, rather than discovering them after the fact.

## Parallelizing Tests for Speed

```yaml
jobs:
  test:
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    runs-on: ubuntu-latest
    steps:
      - run: npm run test -- --shard=${{ matrix.shard }}/4
```

Splitting a large test suite into parallel "shards" (using matrix builds, covered in the GitHub Actions module) dramatically reduces overall pipeline wall-clock time — 4 shards running in parallel finish roughly 4x faster than running the whole suite sequentially.

## Flaky Tests — A Common, Serious Pipeline Problem

A "flaky" test is one that sometimes passes and sometimes fails **without any actual code change** — usually due to timing issues, shared/leaked test state, or reliance on external services. Flaky tests erode trust in the pipeline (developers start ignoring failures, assuming "it's probably just flaky") and should be treated as a priority to fix or quarantine, not tolerated indefinitely.

```yaml
# A common (imperfect) mitigation — automatic retries for known-flaky tests
- run: npm run test -- --retry=2
```

Retries can mask genuine intermittent bugs rather than fixing them — they're a pragmatic short-term mitigation, not a substitute for actually identifying and fixing the root cause of flakiness.

## Required Status Checks — Making the Pipeline Actually Enforce Quality

Test results alone don't prevent bad code from merging unless paired with branch protection requiring those checks to pass (covered in the Git/GitHub modules).

```
Repository -> Settings -> Branches -> Branch protection rule for "main":
  ✓ Require status checks to pass before merging: [test, lint, type-check]
```

Without this enforcement, a failing test pipeline is just information — someone could still merge broken code regardless. The enforcement is what actually turns the testing pipeline into a genuine quality gate.

## Common Interview-Style Questions

- **What is the testing pyramid, and why does its shape matter?**
  A model describing the ideal proportion of test types: many fast unit tests, fewer moderate-speed integration tests, and very few slow end-to-end tests; an inverted pyramid (relying heavily on E2E tests) leads to slow, flaky, expensive test pipelines, while a properly-shaped pyramid provides fast, reliable feedback for the vast majority of changes.

- **Why might a testing pipeline spin up a real database (via GitHub Actions `services:` or similar) rather than mocking it entirely for integration tests?**
  To validate behavior against real database semantics (actual query behavior, constraints, transactions) that mocks might not accurately replicate, providing higher confidence that integration tests reflect true production behavior at the cost of somewhat slower, more complex test setup.

- **Does high code coverage guarantee good test quality?**
  No — coverage measures which lines of code were _executed_ during tests, not whether those tests made meaningful assertions about correct behavior; a test can achieve high coverage while still failing to catch real bugs, so coverage is best used to identify completely untested code rather than as a definitive quality metric.

- **What is a flaky test, and why is it a serious problem for a CI/CD pipeline?**
  A test that inconsistently passes or fails without any actual underlying code change, typically due to timing issues or shared state; it's serious because it erodes developer trust in the pipeline (people start assuming failures are "probably just flaky" and ignoring genuine ones), undermining the entire point of having automated quality gates.

- **Why does a testing pipeline need to be paired with branch protection rules to actually be effective as a quality gate?**
  Without required status checks configured in branch protection, a failing test pipeline is merely informational — it doesn't actually prevent broken code from being merged; branch protection is what enforces that passing tests are a genuine, non-optional requirement before code can reach the protected branch.
