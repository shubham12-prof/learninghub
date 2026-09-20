# 04. Rebase

## What is Rebasing?

Rebasing takes the commits from one branch and **replays** them on top of a different base commit, effectively rewriting history to make it appear as if those commits were made starting from that new base — producing a clean, linear history instead of the branching/merging structure that `git merge` would create.

```
Before rebase:
main:      A -- B -- E
                 \
feature:          C -- D

git checkout feature
git rebase main

After rebase:
main:      A -- B -- E
                       \
feature:                C' -- D'   (C and D are REPLAYED on top of E, becoming NEW commits C' and D' with different hashes)
```

## Rebase vs Merge — The Core Trade-off

```
git merge main (while on feature):   creates a NEW merge commit, preserves exact original history,
                                       results in a non-linear graph

git rebase main (while on feature):    REWRITES feature's commits on top of main's latest commit,
                                         no merge commit, results in a clean LINEAR history,
                                         but ORIGINAL commits are replaced with new ones (different hashes)
```

```
Merge result:                          Rebase result:
main:  A---B---E-------M               main:  A---B---E
            \         /                                 \
feature:     C---D---/                 feature:           C'---D'
(non-linear, preserves exact history)   (linear, rewritten history)
```

## Why Rebase? — The Case for Linear History

- **Cleaner, easier-to-read history** — `git log` shows a single straight line of commits instead of a tangled web of merge commits.
- **Easier `git bisect`** — a linear history makes bisecting to find a bug's introducing commit simpler and more reliable (full detail in the Bisect notes).
- **No unnecessary merge commits cluttering history** — especially valuable for keeping a feature branch up to date with `main` during development, without a merge commit for every sync.

## The Golden Rule of Rebasing: Never Rebase Public/Shared History

Rebasing **rewrites commit hashes**. If you rebase commits that others have already pulled/based work on, their local history now conflicts with the rewritten history — leading to confusing duplicate commits or broken collaboration when they try to push/pull.

```
DANGEROUS: rebasing a branch that others have already pulled and built work on top of
           -> their history and your (rewritten) history diverge, causing major confusion

SAFE:      rebasing your OWN local, not-yet-pushed (or not-yet-shared-with-others) commits,
           or rebasing a feature branch that only YOU are working on
```

**Practical rule of thumb:** rebase freely on local/private branches; only merge (never rebase) branches that others are actively collaborating on, like `main` or a shared `develop` branch.

## Basic Rebase Workflow

```bash
git checkout feature-branch
git rebase main   # replay feature-branch's commits on top of main's current tip
```

### Handling Conflicts During a Rebase

Since each commit is individually replayed, conflicts can occur **per-commit**, not just once for the whole set of changes.

```bash
git rebase main
# CONFLICT (content): Merge conflict in src/app.js
# -- resolve the conflict in the file --
git add src/app.js
git rebase --continue   # move on to replaying the NEXT commit (may conflict again)

# If you want to bail out entirely:
git rebase --abort   # returns everything to the state before the rebase started
```

## Interactive Rebase — Rewriting/Cleaning Up Commit History

```bash
git rebase -i HEAD~4   # interactively rebase the last 4 commits
```

Opens an editor listing the commits, with commands you can apply to each:

```
pick a1b2c3 Add login form
pick d4e5f6 Fix typo in login form
pick g7h8i9 Add validation
pick j1k2l3 Fix validation bug

# Commands:
# p, pick   = use commit as-is
# r, reword = use commit, but edit the commit message
# e, edit   = use commit, but stop for amending
# s, squash = combine this commit INTO the previous one, prompting to merge messages
# f, fixup  = like squash, but DISCARD this commit's message entirely
# d, drop   = remove this commit entirely
```

### Example: Cleaning Up Messy Commits Before Opening a PR

```
pick a1b2c3 Add login form
fixup d4e5f6 Fix typo in login form        <- silently merged into the commit above, no separate "fix typo" noise
pick g7h8i9 Add validation
fixup j1k2l3 Fix validation bug              <- same here

Result: 2 clean commits instead of 4 messy ones — "Add login form" and "Add validation"
```

This is one of interactive rebase's most common real-world uses: cleaning up a messy, iterative commit history into a small number of clean, logical commits before a merge/PR, since the messy intermediate history is entirely a local/private concern up to that point.

## Reordering Commits

```
pick g7h8i9 Add validation
pick a1b2c3 Add login form   <- simply reorder the lines in the interactive editor to reorder commits
```

> Reordering can introduce conflicts if later commits depend on changes from commits you've moved after them — Git will pause and let you resolve conflicts commit-by-commit as usual.

## `git rebase --onto` — Advanced Selective Rebasing

Replays a specific range of commits onto a different base, useful for more surgical history rewrites (e.g., moving a feature branch that was accidentally based on the wrong branch).

```bash
git rebase --onto main feature-old-base feature-branch
# takes commits in feature-branch that are NOT in feature-old-base,
# and replays them onto main instead
```

## Rebase and Force-Pushing

Since rebasing rewrites commit hashes, pushing a rebased branch requires a force push (the remote's history and your local rewritten history no longer share the same commit hashes for the rebased commits).

```bash
git push --force              # DANGEROUS — can overwrite others' work if they've also pushed to this branch
git push --force-with-lease     # SAFER — refuses to force-push if the remote has commits you haven't seen locally
                                  # (protects against accidentally clobbering someone else's recent push)
```

**Best practice:** always use `--force-with-lease` instead of a plain `--force` when force-pushing a rebased branch, as a safety net against accidentally overwriting a collaborator's work you weren't aware of.

## Rebase Autosquash — Streamlining the Fixup Workflow

```bash
git commit --fixup=<commit-hash>   # creates a commit explicitly marked as a fixup for a specific earlier commit
git rebase -i --autosquash HEAD~5    # automatically reorders and marks fixup commits correctly in the interactive editor
```

## Common Interview-Style Questions

- **What's the fundamental difference between `git merge` and `git rebase`?**
  Merge combines two branches' histories by creating a new merge commit that preserves the exact original history, resulting in a non-linear graph; rebase replays one branch's commits on top of another branch's tip, rewriting them into new commits with different hashes, producing a clean linear history but altering the original commit history.

- **Why is rebasing shared/public branches considered dangerous?**
  Rebasing rewrites commit hashes; if others have already pulled or built work on top of the original commits, their history will diverge from the rewritten history, leading to confusing duplicate commits and broken collaboration when they try to push or pull afterward.

- **What is interactive rebase commonly used for in practice?**
  Cleaning up messy, iterative local commit history (combining small "fix typo"-style commits into their parent commit via squash/fixup, rewording commit messages, reordering commits, or dropping unwanted commits) before merging or opening a pull request, since the messy intermediate history is a private concern until it's shared.

- **What's the difference between `git push --force` and `git push --force-with-lease`?**
  `--force` unconditionally overwrites the remote branch with your local history, regardless of whether someone else has pushed additional commits you're not aware of; `--force-with-lease` refuses to force-push if the remote branch has changes you haven't seen locally, providing a safety check against accidentally clobbering a collaborator's recent work.

- **When would you use `git rebase --onto`?**
  For more surgical history rewrites — replaying a specific range of commits onto a different base than where they were originally rooted, such as correcting a feature branch that was accidentally created from the wrong starting branch.
