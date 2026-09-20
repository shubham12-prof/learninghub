# 02. Pull Requests

## What is a Pull Request (PR)?

A pull request is GitHub's mechanism for proposing changes from one branch (often a feature branch, or a fork) into another (often `main`), providing a dedicated space for code review, discussion, automated checks, and controlled merging — the collaborative layer built on top of Git's raw `merge`/`rebase` mechanics.

## Creating a Pull Request

```bash
git checkout -b feature/add-search
# ... make changes, commit ...
git push -u origin feature/add-search
```

```bash
# Via GitHub CLI
gh pr create --title "Add search feature" --body "Implements search with debounced input and API integration"

# Or via the web UI: navigate to the repo, GitHub automatically prompts
# "Compare & pull request" after detecting a recently pushed branch
```

## Anatomy of a Pull Request

```
Title:        Add search feature
Description:  What changed, why, how to test it, screenshots if relevant
Base branch:  main             <- where changes will be merged INTO
Compare branch: feature/add-search  <- where changes are coming FROM
Commits:      list of individual commits included in this PR
Files changed:  diff view of every modified file
Checks:        CI/CD status (tests, linting, build)
Reviewers:      requested reviewers and their approval status
Labels:          categorization tags (bug, enhancement, needs-review, etc.)
```

## Writing a Good PR Description

```markdown
## What changed

Added a search feature to the product listing page, including a debounced
search input and integration with the `/api/search` endpoint.

## Why

Closes #142 — users have been requesting the ability to search products
without scrolling through the full catalog.

## How to test

1. Navigate to /products
2. Type into the search box
3. Verify results filter after a brief debounce delay

## Screenshots

[before/after screenshots]
```

Linking to an issue with `Closes #142` (or `Fixes`, `Resolves`) automatically closes that issue when the PR is merged — a small but valuable piece of GitHub automation.

## Draft Pull Requests

Signal that a PR is a work in progress, not yet ready for review — useful for early visibility, getting early CI feedback, or soliciting preliminary input before the work is complete.

```bash
gh pr create --draft --title "WIP: refactor auth module"
```

```
Draft PRs:
  - CANNOT be merged until marked "Ready for review"
  - Still run CI checks (useful for catching issues early)
  - Signal to reviewers "don't review this deeply yet, but feel free to glance"
```

## Requesting and Managing Reviews

```bash
gh pr edit --add-reviewer username1,username2
```

```
Review states:
  Approved              -> reviewer is satisfied, changes can be merged (pending other requirements)
  Changes requested       -> reviewer found issues that must be addressed before merging
  Commented                 -> feedback given, but no formal approval/rejection decision
```

With branch protection requiring approvals, a PR **cannot** be merged until the required number of "Approved" reviews is reached, and any "Changes requested" review is typically expected to be resolved (though this specific enforcement varies by configuration).

## Code Owners — Automatic Reviewer Assignment

A `CODEOWNERS` file automatically requests reviews from specific people/teams based on which files a PR touches.

```
# .github/CODEOWNERS
/src/api/          @backend-team
/src/components/    @frontend-team
/docs/                @documentation-team
*.sql                   @database-admin
```

When a PR modifies files matching one of these patterns, the corresponding owner(s) are automatically requested as reviewers — and branch protection can require their approval specifically, not just any approval.

## Merge Strategies

```
Merge commit:    preserves full history, creates a merge commit — GitHub's default
Squash and merge: combines all PR commits into ONE commit on the base branch
Rebase and merge:  replays the PR's individual commits onto the base branch, no merge commit
```

```
Settings -> General -> Pull Requests -> can restrict which merge strategies are allowed repo-wide
```

(Full technical detail on the underlying Git mechanics in the Git module's Merging and Rebase notes — this is where those concepts surface in GitHub's UI.)

## Handling Merge Conflicts in a PR

GitHub shows a "This branch has conflicts that must be resolved" banner when the base branch has diverged incompatibly from the PR branch.

```bash
# Resolve locally, as with any Git merge conflict
git checkout feature/add-search
git fetch origin
git merge origin/main   # or rebase, per team convention
# resolve conflicts manually
git add .
git commit    # (if merging)
git push
```

GitHub's web UI also offers a basic in-browser conflict editor for simple conflicts, though local resolution is generally preferred for anything non-trivial.

## Status Checks — Gating Merges on CI Results

```yaml
# .github/workflows/ci.yml (GitHub Actions)
name: CI
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm test
```

With branch protection requiring this check to pass, a PR shows a clear ✅ or ❌ status, and merging can be blocked until it's green.

## Suggested Changes — Inline Reviewer Edits

Reviewers can propose specific line-level edits directly within a PR's diff view, which the PR author can accept with a single click, automatically creating a commit with that exact change.

````
Reviewer comment on line 42:
  ```suggestion
  const result = await fetchData(id);
````

(author can click "Commit suggestion" to apply it directly)

````

## Auto-Merge

```bash
gh pr merge --auto --squash
````

Configures a PR to merge automatically once all required conditions (approvals, passing checks) are satisfied — useful for PRs waiting only on a slow CI run, without requiring someone to manually click merge the moment it's ready.

## Common PR Workflow Patterns

### Stacked PRs

Breaking a large feature into a sequence of smaller, dependent PRs, each building on the previous one — improves reviewability at the cost of some added coordination complexity.

```
PR #1: Add database schema for search
PR #2 (based on PR #1's branch): Add search API endpoint
PR #3 (based on PR #2's branch): Add search UI
```

### Draft-to-Ready Workflow

```
1. Open a draft PR early for visibility/early CI feedback
2. Iterate with more commits as the feature develops
3. Mark "Ready for review" once complete
4. Address review feedback
5. Merge once approved and checks pass
```

## Common Interview-Style Questions

- **What is a pull request, and how does it relate to the underlying Git operations?**
  A GitHub-specific collaboration layer for proposing changes from one branch into another, adding review, discussion, and automated CI checks on top of the actual Git merge/rebase mechanics that ultimately integrate the changes — the PR itself is a GitHub construct, not a native Git concept.

- **What is a draft pull request, and why would you use one?**
  A PR explicitly marked as a work in progress that can't be merged until marked "Ready for review"; useful for getting early CI feedback, giving teammates visibility into in-progress work, or soliciting preliminary input before the work is complete.

- **What does a `CODEOWNERS` file do?**
  Automatically requests reviews from specific people or teams based on which files a pull request modifies, and can be combined with branch protection to require approval specifically from the relevant code owner rather than just any reviewer.

- **What's the difference between the three common PR merge strategies (merge commit, squash, rebase)?**
  Merge commit preserves the full branch history with a new merge commit; squash and merge combines all the PR's commits into a single commit on the base branch; rebase and merge replays the PR's individual commits onto the base branch without a merge commit — each trades off history granularity against a cleaner target-branch log differently.

- **How does linking a PR to an issue (e.g., "Closes #142") behave?**
  When the PR is merged, GitHub automatically closes the referenced issue, providing lightweight traceability between the work done and the problem it addressed without requiring a manual step to close the issue separately.
