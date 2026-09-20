# 06. Stash

## What is `git stash`?

`git stash` temporarily saves your uncommitted changes (both staged and unstaged) and reverts your working directory to match the last commit — letting you switch context (e.g., to fix an urgent bug on another branch) without committing unfinished work or losing it.

```
Working directory has uncommitted changes
        │
        ▼ git stash
Changes are saved to a "stash," working directory is now CLEAN (matches last commit)
        │
        ▼ (do other work, switch branches, etc.)
        │
        ▼ git stash pop
Previously stashed changes are restored to the working directory
```

## Basic Usage

```bash
git stash               # stash all tracked, modified changes (staged and unstaged)
git stash push -m "WIP: refactoring auth logic"   # stash with a descriptive message
git stash list             # view all stashes (you can have multiple)
git stash pop                # apply the MOST RECENT stash AND remove it from the stash list
git stash apply                # apply the most recent stash, but KEEP it in the stash list
git stash drop                   # delete the most recent stash without applying it
git stash clear                    # delete ALL stashes
```

## `pop` vs `apply` — Key Distinction

```
git stash pop:    applies the stash's changes AND removes it from the stash list
                  (most common — you're done with this stash once it's reapplied)

git stash apply:  applies the stash's changes but KEEPS it in the stash list
                  (useful if you want to apply the same stash to MULTIPLE branches)
```

```bash
git stash apply   # apply to branch A
git checkout branch-b
git stash apply   # apply the SAME stash to branch B as well
git stash drop     # manually clean up once you're done reusing it
```

## Working with Multiple Stashes

```bash
git stash list
# stash@{0}: WIP on feature-branch: a1b2c3 Add login form
# stash@{1}: WIP on main: d4e5f6 Fix typo

git stash pop stash@{1}     # pop a SPECIFIC stash, not just the most recent one
git stash apply stash@{1}    # apply a specific stash without removing it
git stash show stash@{0}       # preview what changes a specific stash contains
git stash show -p stash@{0}      # preview the FULL diff of a specific stash
```

## Stashing Only Specific Files

```bash
git stash push -- src/app.js src/utils.js   # stash only these specific files, leave other changes untouched
```

## Stashing Untracked/Ignored Files

By default, `git stash` only stashes changes to already-tracked files — brand-new (untracked) files are left alone.

```bash
git stash              # tracked changes ONLY (default) — untracked files remain in the working directory
git stash -u             # (or --include-untracked) also stash untracked files
git stash -a               # (or --all) stash EVERYTHING, including files matched by .gitignore too
```

## Creating a Branch Directly From a Stash

If a stash's changes turn out to be substantial enough to deserve their own branch (rather than being reapplied to your current branch):

```bash
git stash branch new-branch-name stash@{0}
# creates a new branch from the commit the stash was originally based on,
# checks it out, and applies the stash's changes there — useful when the stash
# no longer applies cleanly to your current branch due to too much drift
```

## Common Real-World Scenarios

### Scenario 1: Urgent Context Switch

```bash
# You're mid-feature, uncommitted changes everywhere, and an urgent bug report comes in
git stash push -m "WIP: half-finished search feature"
git checkout main
git checkout -b hotfix/urgent-bug
# ... fix the bug, commit, push, get it deployed ...
git checkout feature-branch
git stash pop   # continue exactly where you left off
```

### Scenario 2: Pulling Remote Changes with Local Uncommitted Work

```bash
git pull   # fails/warns: "cannot pull with uncommitted changes"

git stash
git pull
git stash pop   # reapply your local changes on top of the newly pulled code
```

### Scenario 3: Testing Something Without Your Current Changes

```bash
git stash          # temporarily clear your changes
# run tests, verify behavior against the CLEAN last-committed state
git stash pop        # bring your changes back
```

## Handling Conflicts When Popping a Stash

If the working directory has changed significantly since the stash was created (e.g., you pulled new commits), reapplying it can conflict, just like a merge.

```bash
git stash pop
# CONFLICT (content): Merge conflict in src/app.js

# resolve the conflict manually, as usual
git add src/app.js
# Note: unlike a normal merge, a CONFLICTED stash pop does NOT automatically drop the stash from the list —
# you need to manually `git stash drop` once you're satisfied the conflict is fully resolved
```

## Stash Is Local-Only

Stashes exist only in your local repository — they are **never** pushed to a remote, and are not shared with collaborators. They're purely a personal, temporary workspace tool.

```
git stash contents:  stored locally in .git/refs/stash and related objects
                      -> NOT part of your commit history, NOT visible to anyone else,
                         NOT included in `git push`
```

## Common Interview-Style Questions

- **What does `git stash` do, and what problem does it solve?**
  It temporarily saves uncommitted changes (staged and unstaged) and reverts the working directory to match the last commit, letting a developer switch context (e.g., to another branch for an urgent fix) without committing unfinished, half-done work or losing it.

- **What's the difference between `git stash pop` and `git stash apply`?**
  `pop` applies the most recent stash's changes and removes it from the stash list; `apply` applies the changes but keeps the stash in the list, useful when you want to apply the same stashed changes to multiple branches before finally discarding it.

- **Does `git stash` include untracked files by default?**
  No — by default it only stashes changes to already-tracked files; untracked files require the `-u` (`--include-untracked`) flag, and files matched by `.gitignore` additionally require `-a` (`--all`).

- **Are stashes shared with other collaborators when you push?**
  No — stashes are entirely local to your repository and are never pushed to a remote or visible to anyone else; they're a personal, temporary tool for your own workflow.

- **What happens if popping a stash results in a conflict, and how does that differ from a normal successful pop?**
  Git leaves the conflicting changes in the working directory for manual resolution, just like a merge conflict; but unlike a successful pop (which automatically removes the stash from the list), a conflicted pop does NOT automatically drop the stash — you need to manually run `git stash drop` once you've resolved the conflict and are satisfied with the result.
