# 03. Merging

## What is Merging?

Merging integrates changes from one branch into another, combining their independent histories back together. It's how work done on a feature branch eventually becomes part of the main codebase.

```bash
git checkout main
git merge feature-branch   # merges feature-branch's changes INTO main (the currently checked-out branch)
```

## Two Types of Merges

### Fast-Forward Merge

When the target branch (`main`) hasn't diverged at all since the feature branch was created — `main`'s pointer can simply be moved forward to the feature branch's latest commit, with no actual merge commit needed.

```
Before:
main:      A -- B
                 \
feature:          C -- D

After fast-forward merge:
main:      A -- B -- C -- D    (main's pointer simply moved forward — no new commit created)
```

```bash
git merge feature-branch   # Git automatically does a fast-forward if possible
```

### Three-Way (Non-Fast-Forward) Merge

When both branches have diverged (each has commits the other doesn't), Git creates a new **merge commit** with two parents, combining both histories.

```
Before:
main:      A -- B -- E
                 \
feature:          C -- D

After a three-way merge:
main:      A -- B -- E -------- M   (M = new merge commit, with parents E and D)
                 \              /
feature:          C ---------- D
```

```bash
git merge feature-branch   # creates a merge commit if the branches have diverged
```

## Forcing a Merge Commit Even When Fast-Forward Is Possible

```bash
git merge --no-ff feature-branch   # ALWAYS create a merge commit, even if a fast-forward was possible
```

**Why you might want this:** a merge commit preserves the historical fact that a feature branch existed and was merged as a distinct unit of work — useful for readability of history (`git log --graph`) and for tools that group commits by feature. Many teams enforce `--no-ff` merges specifically for this reason.

## Merge Conflicts — When Git Can't Auto-Merge

A conflict occurs when both branches modified the **same lines** of the **same file** in different ways (or one branch modified a file the other deleted, etc.) — Git can't automatically determine which change should "win."

```
<<<<<<< HEAD
const greeting = "Hello, World!";
=======
const greeting = "Hi there, World!";
>>>>>>> feature-branch
```

```
<<<<<<< HEAD           <- start of YOUR current branch's version
...your version...
=======                 <- divider
...their version...
>>>>>>> feature-branch  <- end of the incoming branch's version
```

## Resolving a Merge Conflict — Step by Step

```bash
git merge feature-branch
# Auto-merging src/app.js
# CONFLICT (content): Merge conflict in src/app.js
# Automatic merge failed; fix conflicts and then commit the result.

git status
# both modified: src/app.js
```

```
1. Open the conflicting file(s), find the <<<<<<< ======= >>>>>>> markers
2. Manually edit the file to resolve the conflict — keep one version, the other,
   or a combination, then REMOVE the conflict markers entirely
3. Stage the resolved file: git add src/app.js
4. Complete the merge: git commit (Git pre-fills a merge commit message)
```

```bash
git merge --abort   # bail out entirely, returning to the state before the merge attempt
```

## Merge Strategies (Advanced)

```bash
git merge -X ours feature-branch      # in a CONFLICT, automatically prefer "our" (current branch's) changes
git merge -X theirs feature-branch     # in a CONFLICT, automatically prefer "their" (incoming branch's) changes
```

> **Important distinction:** `-X ours`/`-X theirs` only affects lines that actually conflict — non-conflicting changes from both branches are still merged normally. This is different from `git merge -s ours`, which discards the ENTIRE content of the other branch, keeping only the current branch's version (a much more drastic, rarely-needed option).

## Squash Merging

Combines all of a feature branch's commits into a **single** commit on the target branch, rather than preserving the branch's individual commit history.

```bash
git checkout main
git merge --squash feature-branch
git commit -m "Add search feature"   # ONE commit representing the entire feature, staged but not yet auto-committed by --squash
```

```
Before:
main:      A -- B
                 \
feature:          C -- D -- E   (three separate commits)

After squash merge:
main:      A -- B -- F   (F = ONE new commit combining C+D+E's changes, feature branch history not preserved on main)
```

**Trade-off:** produces a much cleaner, more readable main branch history (one commit per feature), but loses the granular commit-by-commit history of how the feature was actually built (which still exists on the original feature branch, if it's kept).

## Merge vs Rebase — Preview (Full Detail in the Rebase Notes)

```
Merging:   preserves full history exactly as it happened, including all branch divergence —
           results in a non-linear history with merge commits

Rebasing:  REWRITES commit history to create a clean, linear sequence —
           no merge commits, but rewrites commit hashes (dangerous on shared branches)
```

Both accomplish "get these changes into this branch," but with very different effects on the resulting history's shape — full comparison and trade-offs covered in the dedicated Rebase notes.

## Pull Requests / Merge Requests — The Collaborative Layer on Top of Merging

While `git merge` is the underlying mechanism, most teams don't merge directly on the command line for shared work — they open a **Pull Request** (GitHub) or **Merge Request** (GitLab), which adds:

- Code review (comments, requested changes, approvals)
- Automated CI checks (tests, linting, build verification) before allowing the merge
- A discussion thread tied to the specific set of changes
- Merge strategy selection (regular merge, squash, or rebase — often configurable per-repository or per-merge)

```
Feature branch pushed to remote
       │
       ▼
Pull Request opened (feature-branch -> main)
       │
       ▼
CI runs tests, code review happens, changes requested/addressed
       │
       ▼
Approved -> merged (via whichever strategy the team/platform uses)
```

## Common Interview-Style Questions

- **What's the difference between a fast-forward merge and a three-way merge?**
  A fast-forward merge occurs when the target branch hasn't diverged at all — Git simply moves the branch pointer forward with no new commit created; a three-way merge occurs when both branches have diverged, requiring Git to create a new merge commit with two parents that combines both histories.

- **Why might a team enforce `--no-ff` even when a fast-forward merge is possible?**
  It preserves the historical record that a feature branch existed as a distinct unit of work, improving the readability of branch/merge history (especially in `git log --graph`) and making it easier for tooling to group related commits together — without it, a fast-forwarded feature's individual commits become indistinguishable from commits made directly on the target branch.

- **When does a merge conflict occur, and how do you resolve one?**
  When both branches modify the same lines of the same file in incompatible ways (or one modifies a file the other deletes); resolution involves manually editing the file to remove Git's conflict markers and decide on the final content, then staging the resolved file and completing the merge with a commit.

- **What is squash merging, and what's its trade-off?**
  Combining all of a feature branch's individual commits into a single commit on the target branch; it produces a cleaner, more readable target-branch history (one commit per feature) at the cost of losing the granular, commit-by-commit history of how that feature was actually developed on the target branch (though it may still exist on the original feature branch).

- **What's the difference between `git merge -X ours` and `git merge -s ours`?**
  `-X ours` (a merge _strategy option_) only affects how actual conflicting lines are resolved, automatically preferring the current branch's version for conflicts while still normally merging non-conflicting changes from both branches; `-s ours` (a merge _strategy_) discards the entire content of the incoming branch, keeping only the current branch's version regardless of what changes existed on the other branch — a much more drastic operation.
