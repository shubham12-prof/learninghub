# 05. Cherry Pick

## What is Cherry Picking?

`git cherry-pick` applies the changes from a **specific individual commit** (from any branch) onto your current branch, creating a new commit with those same changes — without needing to merge or rebase the entire branch that commit came from.

```
Before:
main:      A -- B -- C
                       \
feature:                D -- E -- F

git checkout main
git cherry-pick E   # apply JUST commit E's changes onto main

After:
main:      A -- B -- C -- E'   (E' = a NEW commit with the same changes as E, but a different hash)
                       \
feature:                D -- E -- F   (feature branch is untouched)
```

## Basic Usage

```bash
git cherry-pick <commit-hash>            # apply a single commit
git cherry-pick <hash1> <hash2> <hash3>    # apply multiple specific commits, in the order given
git cherry-pick <hash1>..<hash2>             # apply a RANGE of commits (exclusive of hash1, inclusive of hash2)
git cherry-pick <hash1>^..<hash2>              # apply a range INCLUSIVE of hash1 too
```

## Common Real-World Use Cases

### 1. Applying a Hotfix to Multiple Branches

A critical bug fix committed on `main` also needs to be applied to an older `release/v1.2` branch that doesn't include all of `main`'s other recent changes.

```bash
git checkout release/v1.2
git cherry-pick <hotfix-commit-hash>   # bring JUST that fix into the release branch, without merging all of main's other changes
```

### 2. Recovering a Specific Commit from an Abandoned/Deleted Branch

```bash
git log --all --oneline   # find the commit hash, even if its branch was deleted (as long as it's not garbage-collected yet)
git cherry-pick <commit-hash>
```

### 3. Moving a Commit That Was Accidentally Made on the Wrong Branch

```bash
git checkout wrong-branch
git log   # find the accidental commit's hash

git checkout correct-branch
git cherry-pick <commit-hash>

git checkout wrong-branch
git reset --hard HEAD~1   # remove the accidental commit from the wrong branch (only safe if not yet pushed/shared)
```

## Handling Conflicts During a Cherry-Pick

Just like merging/rebasing, a cherry-picked commit's changes might conflict with the current branch's state.

```bash
git cherry-pick <commit-hash>
# CONFLICT (content): Merge conflict in src/app.js
# -- resolve the conflict manually --
git add src/app.js
git cherry-pick --continue

# to bail out entirely:
git cherry-pick --abort
```

## Cherry-Picking Without Committing Immediately

```bash
git cherry-pick -n <commit-hash>   # (or --no-commit) apply the changes to the working directory/staging area,
                                     # but DON'T create a commit yet — lets you review/modify before committing
```

Useful when you want to combine changes from multiple cherry-picked commits into a single commit, or make additional edits before finalizing.

## Cherry-Picking a Range and Its Nuances

```bash
git cherry-pick main~5..main~2   # applies commits main~4, main~3, main~2 (exclusive start, inclusive end)
```

> Be careful with ranges — if any commit in the range depends on an earlier commit NOT included in the range, the cherry-pick can fail or produce broken/incomplete changes. Cherry-picking works best on genuinely self-contained, independent commits.

## Preserving the Original Commit Reference

```bash
git cherry-pick -x <commit-hash>   # appends "(cherry picked from commit <hash>)" to the new commit's message
```

This is good practice for traceability, especially when cherry-picking fixes across release branches — anyone looking at the history later can trace the new commit back to its origin.

```
Fix null pointer exception in payment processing

(cherry picked from commit a1b2c3d4e5f6...)
```

## Cherry-Pick vs Merge vs Rebase — When to Use Which

| Operation       | Scope                         | Use When                                                                                    |
| --------------- | ----------------------------- | ------------------------------------------------------------------------------------------- |
| **Merge**       | Entire branch's history       | You want ALL of another branch's changes integrated, preserving full history                |
| **Rebase**      | Entire branch's commits       | You want to replay ALL of your branch's commits onto a new base, for a clean linear history |
| **Cherry-pick** | One or a few SPECIFIC commits | You want only SOME specific changes from another branch, not the whole thing                |

```
Merge:        "I want everything from feature-branch merged into main"
Rebase:        "I want to replay all of my commits on top of the latest main"
Cherry-pick:     "I want JUST that one bug fix commit from feature-branch, nothing else"
```

## Practical Example: Backporting a Security Fix

```bash
# Fix was committed on main
git log --oneline main
# a1b2c3d Fix SQL injection vulnerability in search endpoint

# Need to backport this fix to two older, still-supported release branches
git checkout release/v2.0
git cherry-pick -x a1b2c3d
git push origin release/v2.0

git checkout release/v1.5
git cherry-pick -x a1b2c3d
git push origin release/v1.5
```

This is one of cherry-pick's most common legitimate production uses — applying a critical fix across multiple maintained version branches without merging each branch's unrelated diverged history together.

## Common Interview-Style Questions

- **What does `git cherry-pick` do, and how does it differ from a merge?**
  It applies the changes from one specific commit onto the current branch, creating a new commit with those changes; unlike a merge, which integrates an entire branch's history, cherry-pick selectively brings in just the chosen commit(s), leaving everything else on the source branch untouched.

- **Give a real-world scenario where cherry-picking is the right tool, rather than merging or rebasing.**
  Backporting a critical bug fix (committed on the main branch) to one or more older, still-maintained release branches that shouldn't receive all of main's other unrelated recent changes — cherry-picking brings over just that specific fix.

- **Why might you use `git cherry-pick -x`?**
  It appends a reference to the original commit's hash in the new commit's message ("cherry picked from commit ..."), improving traceability so anyone reviewing history later can trace the cherry-picked commit back to where it originally came from.

- **What's a risk of cherry-picking a range of commits rather than an individual commit?**
  If a commit within the range depends on changes from an earlier commit not included in the range, the cherry-pick can fail or produce incomplete/broken results — cherry-picking works most reliably on commits that are genuinely self-contained and independent.

- **When would you use `git cherry-pick -n` (no-commit) instead of a normal cherry-pick?**
  When you want to apply a commit's changes to your working directory/staging area without immediately creating a commit — useful for combining changes from multiple cherry-picked commits into a single new commit, or making additional edits before finalizing.
