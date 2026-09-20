# 02. Branching

## What is a Branch?

A branch is simply a movable, lightweight pointer to a specific commit. Branching lets multiple independent lines of development happen in parallel — new features, bug fixes, experiments — without affecting the main codebase until they're deliberately merged in.

```
main:     A -- B -- C
                     \
feature:              D -- E   (a branch is just a pointer to commit E, with C as its ancestor)
```

Git branches are extremely cheap to create (just a new pointer, not a full copy of the codebase) — this is why Git-based workflows encourage frequent branching, unlike some older VCS tools where branching was expensive/discouraged.

## Basic Branch Commands

```bash
git branch                       # list local branches
git branch -a                     # list ALL branches, including remote-tracking ones
git branch new-feature              # create a new branch (doesn't switch to it)
git checkout new-feature              # switch to an existing branch
git checkout -b new-feature             # create AND switch to a new branch in one step
git switch new-feature                    # modern alternative to checkout for switching branches
git switch -c new-feature                   # modern alternative to checkout -b

git branch -d new-feature      # delete a branch (safe — refuses if it has unmerged commits)
git branch -D new-feature       # force-delete a branch (even with unmerged commits — use carefully)

git branch -m old-name new-name   # rename a branch
```

## How HEAD Relates to Branches

```
HEAD -> main -> commit C
```

`HEAD` normally points to a branch, which in turn points to a commit. When you commit new work, the current branch pointer moves forward to the new commit, and `HEAD` (still pointing to that branch) follows along automatically.

```
Before commit:  HEAD -> main -> C
After commit:   HEAD -> main -> D   (main now points to the new commit D, HEAD still points to main)
```

## Common Branching Strategies

### Git Flow

A more structured model with dedicated long-lived branches for different purposes.

```
main        <- production-ready code only
develop      <- integration branch for ongoing development
feature/*      <- individual feature branches, branched from develop, merged back into develop
release/*        <- prepares a release, branched from develop, merged into both main and develop
hotfix/*           <- urgent production fixes, branched from main, merged into both main and develop
```

**Best for:** projects with scheduled releases, multiple versions in production simultaneously.

### GitHub Flow (Simpler, Widely Used)

```
main   <- always deployable
feature/* <- branched from main, merged back into main via a pull request, then deployed
```

```bash
git checkout -b feature/add-login main
# ... work, commit ...
git push -u origin feature/add-login
# open a pull request, review, merge into main
# main is deployed (often automatically, via CI/CD)
```

**Best for:** continuous deployment, web applications, teams that ship frequently.

### Trunk-Based Development

```
main (the "trunk")  <- everyone commits here directly, or via VERY short-lived branches (hours, not days)
```

Relies heavily on feature flags to hide incomplete work in production, rather than long-lived feature branches — favored by teams prioritizing continuous integration and minimizing merge complexity.

## Branch Naming Conventions

```
feature/user-authentication
bugfix/login-redirect-issue
hotfix/critical-payment-bug
release/v2.1.0
chore/update-dependencies
```

Consistent prefixes (`feature/`, `bugfix/`, `hotfix/`, etc.) make it easy to understand a branch's purpose at a glance and can also drive automated tooling (like triggering different CI pipelines based on branch prefix).

## Working with Remote Branches

```bash
git push -u origin feature/new-feature   # push a local branch to the remote, set up tracking
git branch -r                               # list remote-tracking branches
git checkout -b local-name origin/remote-name  # create a local branch tracking a specific remote branch
git push origin --delete feature/old-feature     # delete a branch on the remote
```

## Comparing Branches

```bash
git diff main feature-branch          # see all differences between two branches
git log main..feature-branch            # commits in feature-branch NOT yet in main
git log feature-branch..main              # commits in main NOT yet in feature-branch
```

## Protecting Branches (GitHub/GitLab Feature, Not Core Git)

Most Git hosting platforms let you configure branch protection rules — requiring pull request reviews, passing CI checks, or preventing force-pushes/direct commits to critical branches like `main`. This is a platform feature layered on top of Git itself, not something Git provides natively.

## Long-Running Branches vs Short-Lived Branches

```
Long-running feature branches:
  + can work on large features without disrupting main
  - risk significant merge conflicts the longer they diverge from main
  - "merge hell" if too many changes accumulate before integrating back

Short-lived branches (hours to a few days):
  + minimal drift from main, fewer/smaller merge conflicts
  + encourages smaller, more frequent, more reviewable changes
  - requires breaking large features into smaller incremental pieces (often via feature flags)
```

Most modern teams favor keeping branches as short-lived as practically possible, specifically to minimize the pain of merging.

## Practical Example: A Typical Feature Branch Workflow

```bash
git checkout main
git pull origin main                       # ensure you're starting from the latest main
git checkout -b feature/add-search           # create a new branch for the feature

# ... make changes, commit incrementally ...
git add .
git commit -m "Add search input component"
git add .
git commit -m "Wire up search API call"

git push -u origin feature/add-search          # push to remote for review

# ... open a pull request, get it reviewed, address feedback with more commits ...

# once approved and merged (often via the hosting platform's UI):
git checkout main
git pull origin main                              # get the newly merged changes
git branch -d feature/add-search                    # clean up the now-merged local branch
```

## Common Interview-Style Questions

- **What is a Git branch, technically?**
  A lightweight, movable pointer to a specific commit — not a full copy of the codebase, which is why creating branches in Git is extremely cheap and fast compared to some older version control systems.

- **How does `HEAD` relate to branches?**
  `HEAD` typically points to the currently checked-out branch, which itself points to a specific commit; when you make a new commit, the branch pointer (and thus effectively HEAD, since it follows the branch) advances to point at the new commit.

- **Compare Git Flow, GitHub Flow, and trunk-based development.**
  Git Flow uses multiple long-lived branches (main, develop, feature, release, hotfix) suited to scheduled releases with multiple production versions; GitHub Flow is simpler, with a single always-deployable main branch and short-lived feature branches merged via pull requests, suited to continuous deployment; trunk-based development has everyone committing directly (or via very short-lived branches) to a single trunk, relying on feature flags to hide incomplete work, favored for minimizing merge complexity.

- **Why do most modern teams favor short-lived branches over long-running ones?**
  Long-running branches accumulate more divergence from the main branch over time, leading to larger, more painful merge conflicts ("merge hell") when finally integrated; short-lived branches minimize drift, resulting in smaller, more manageable, more frequently reviewable changes.

- **What's the difference between `git branch -d` and `git branch -D`?**
  `-d` is a safe delete that refuses to remove a branch containing commits not yet merged elsewhere; `-D` force-deletes the branch regardless of merge status, which can permanently lose unmerged work if used carelessly.
