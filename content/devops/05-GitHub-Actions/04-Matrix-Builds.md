# 04. Matrix Builds

## What is a Matrix Build?

A matrix build automatically generates multiple parallel job instances from a single job definition, each running with a different combination of variables — the classic use case is testing your application against multiple language/runtime versions or operating systems simultaneously, without duplicating the job definition for each combination.

```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20, 22]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm install
      - run: npm test
```

This single job definition automatically runs as **three separate, parallel jobs** — one each for Node 18, 20, and 22 — without writing three separate job blocks.

## Multi-Dimensional Matrices

```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20, 22]
        os: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm test
```

With two dimensions of 3 values each, this generates **9 total job combinations** (every combination of `node-version` × `os`) — the matrix by default produces the full Cartesian product of all specified dimensions.

```
Job 1: node 18, ubuntu    Job 4: node 18, windows    Job 7: node 18, macos
Job 2: node 20, ubuntu    Job 5: node 20, windows    Job 8: node 20, macos
Job 3: node 22, ubuntu    Job 6: node 22, windows    Job 9: node 22, macos
```

## `include` — Adding Specific Extra Combinations

```yaml
strategy:
  matrix:
    node-version: [18, 20]
    os: [ubuntu-latest]
    include:
      - node-version: 22
        os: ubuntu-latest
        experimental: true # adds an EXTRA property just to this specific combination
```

`include` adds specific combinations beyond the base Cartesian product — useful for adding a one-off configuration (like an experimental/preview version) without expanding it across every other dimension.

## `exclude` — Removing Specific Combinations

```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
    os: [ubuntu-latest, windows-latest, macos-latest]
    exclude:
      - node-version: 18
        os: macos-latest # skip this ONE specific combination, keep all the others
```

Useful when a specific combination is known to be unsupported/unnecessary, avoiding wasted runner time testing a configuration you don't actually need to validate.

## `fail-fast` — Controlling Whether One Failure Cancels the Rest

```yaml
strategy:
  fail-fast: false # default is TRUE — by default, ONE failing matrix job cancels ALL other in-progress matrix jobs
  matrix:
    node-version: [18, 20, 22]
```

```
fail-fast: true (default):  Node 18 fails -> Node 20 and Node 22 jobs are IMMEDIATELY CANCELLED
                              (saves runner time/cost, but you don't get full results across all versions)

fail-fast: false:             Node 18 fails -> Node 20 and Node 22 CONTINUE running to completion regardless
                                (useful when you want COMPLETE results across every combination,
                                 e.g., to know exactly which versions are affected by a regression)
```

**Practical guidance:** `fail-fast: false` is generally preferred for genuine compatibility-testing matrices (where you want to know the full picture of what's broken), while the default `true` can make sense for faster feedback loops where you just need to know "did anything fail" as quickly as possible.

## `max-parallel` — Limiting Concurrent Matrix Jobs

```yaml
strategy:
  max-parallel: 2 # only run 2 matrix combinations AT A TIME, even if more are queued
  matrix:
    node-version: [18, 20, 22, 24]
```

Useful for limiting resource consumption (runner minutes, or contention against a shared external resource like a rate-limited API/database the tests hit) rather than running an unbounded number of combinations simultaneously.

## Real-World Example: Cross-Platform, Cross-Version Library Testing

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18, 20, 22]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: "npm"
      - run: npm ci
      - run: npm test
```

This is the standard pattern for an open-source library that needs to guarantee compatibility across multiple Node.js versions and operating systems simultaneously — a single, compact workflow definition produces comprehensive coverage.

## Matrix Job Names in the GitHub UI

GitHub automatically labels each generated matrix job with its specific combination of values, making results easy to interpret at a glance.

```
test (18, ubuntu-latest)     ✅
test (20, ubuntu-latest)      ✅
test (22, ubuntu-latest)       ❌  <- immediately obvious WHICH combination is failing
test (18, windows-latest)        ✅
...
```

## Accessing Matrix Values Within Steps

```yaml
steps:
  - run: echo "Testing on ${{ matrix.os }} with Node ${{ matrix.node-version }}"
```

## Using a Matrix for Deployment Targets (Not Just Testing)

Matrix builds aren't limited to testing — they're a general mechanism for running the same job logic across multiple configurations, including deploying to multiple environments/regions in parallel.

```yaml
jobs:
  deploy:
    strategy:
      matrix:
        region: [us-east-1, eu-west-1, ap-southeast-1]
    runs-on: ubuntu-latest
    steps:
      - run: ./deploy.sh --region ${{ matrix.region }}
```

## Common Interview-Style Questions

- **What is a matrix build, and what problem does it solve?**
  A mechanism that automatically generates multiple parallel job instances from a single job definition, each with a different combination of specified variables — solving the problem of needing to test (or run) the same logic across multiple configurations (Node versions, operating systems, etc.) without duplicating the job definition for each combination.

- **What does a two-dimensional matrix produce by default?**
  The full Cartesian product of both dimensions' values — e.g., 3 Node versions × 3 operating systems produces 9 total job combinations, unless `include`/`exclude` are used to adjust this.

- **What's the difference between `include` and `exclude` in a matrix strategy?**
  `include` adds specific additional combinations beyond the base Cartesian product (optionally with extra properties attached only to that combination); `exclude` removes specific combinations from the generated set, useful for skipping known-unsupported or unnecessary configurations.

- **What does `fail-fast: false` change about matrix build behavior, and when would you want it?**
  By default (`fail-fast: true`), one failing matrix job immediately cancels all other in-progress matrix jobs; setting `fail-fast: false` lets all matrix combinations run to completion regardless of individual failures — useful when you want complete results across every configuration (e.g., to know exactly which specific versions/platforms are affected by a regression) rather than just the fastest possible failure signal.

- **Is matrix strategy limited to testing use cases?**
  No — it's a general mechanism for running identical job logic across multiple configurations in parallel, which can also be used for tasks like deploying to multiple regions or environments simultaneously, not just cross-version/cross-platform testing.
