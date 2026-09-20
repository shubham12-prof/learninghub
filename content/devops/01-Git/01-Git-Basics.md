# 01. Git Basics

## What is Git?

Git is a distributed version control system (VCS) that tracks changes to files over time, letting multiple people collaborate on the same codebase, revert to previous states, and work on independent lines of development (branches) without interfering with each other.

**Distributed** means every developer has a full copy of the entire repository history locally — not just the latest snapshot — unlike older centralized VCS tools (like SVN) where history lived only on a central server.

## The Three (Four) Areas of a Git Repository

```
Working Directory  --git add-->  Staging Area (Index)  --git commit-->  Repository (.git history)
                                                                              │
                                                                     (optionally)
                                                                              ▼
                                                                     Remote Repository
```

| Area                     | Description                                                            |
| ------------------------ | ---------------------------------------------------------------------- |
| **Working Directory**    | Your actual files on disk, as you edit them                            |
| **Staging Area (Index)** | A holding area for changes you've marked to include in the next commit |
| **Repository**           | The committed history, stored in `.git/`                               |
| **Remote**               | A copy of the repository hosted elsewhere (GitHub, GitLab, etc.)       |

## Initializing and Cloning

```bash
git init                              # create a new repository in the current directory
git clone https://github.com/user/repo.git  # copy an existing remote repository locally
```

## The Core Workflow

```bash
git status              # see what's changed
git add file.js          # stage a specific file
git add .                 # stage everything changed
git commit -m "message"    # commit staged changes with a message
git push                    # send local commits to the remote
git pull                     # fetch AND merge remote changes into your current branch
```

## Checking Status and History

```bash
git status                    # working directory / staging area state
git log                        # commit history
git log --oneline               # condensed, one line per commit
git log --graph --oneline --all  # visual branch/merge graph
git diff                          # unstaged changes vs the last commit
git diff --staged                  # staged changes vs the last commit
git show <commit-hash>               # details of a specific commit
```

## Configuring Git

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
git config --list  # view all current config
```

## The `.gitignore` File

Specifies files/patterns Git should never track (build artifacts, dependencies, secrets, OS-specific files).

```
node_modules/
.env
dist/
*.log
.DS_Store
```

```bash
git rm --cached file.env  # stop tracking a file that was already committed, without deleting it locally
```

## Undoing Changes — A Critical Skill

```bash
git checkout -- file.js        # discard unstaged changes to a file (older syntax)
git restore file.js               # discard unstaged changes to a file (modern syntax)
git restore --staged file.js        # unstage a file (keep the changes, just remove from staging)

git commit --amend -m "new message"   # modify the MOST RECENT commit (message and/or content)

git reset --soft HEAD~1     # undo the last commit, KEEP changes staged
git reset --mixed HEAD~1     # undo the last commit, KEEP changes but UNSTAGE them (default mode)
git reset --hard HEAD~1       # undo the last commit, DISCARD changes entirely (destructive!)

git revert <commit-hash>       # create a NEW commit that undoes a previous commit (safe for shared/pushed history)
```

### `reset` vs `revert` — Critical Distinction

```
git reset:   REWRITES history — moves the branch pointer backward, as if the commit(s) never happened
             -> DANGEROUS on shared/pushed branches (other collaborators' history diverges)

git revert:  ADDS a new commit that undoes a previous commit's changes
             -> SAFE on shared/pushed branches — history isn't rewritten, just extended
```

**Rule of thumb:** use `reset` freely on local, unpushed commits; use `revert` for anything already shared with others.

## Viewing What Changed

```bash
git diff HEAD~1 HEAD          # changes between two commits
git diff branch1 branch2        # changes between two branches
git blame file.js                 # see who last modified each line, and in which commit
```

## Remotes

```bash
git remote -v                          # list configured remotes
git remote add origin <url>              # add a new remote named "origin"
git fetch origin                          # download remote changes WITHOUT merging them
git push origin main                        # push local "main" branch to the remote
git push -u origin main                      # push AND set up tracking (so future `git push` alone works)
```

### `fetch` vs `pull`

```
git fetch:  downloads remote changes into your LOCAL copy of the remote branch (origin/main),
            WITHOUT touching your current working branch — safe, non-destructive, always fine to run

git pull:   equivalent to `git fetch` + `git merge` (or `git rebase`, if configured) —
            actually integrates the remote changes into your current branch immediately
```

## The HEAD Pointer

`HEAD` refers to your currently checked-out commit/branch — essentially "where you are right now" in the repository's history.

```bash
git log HEAD                # history starting from your current position
git checkout HEAD~2            # move to the commit 2 steps before the current one (detached HEAD state)
```

### Detached HEAD State

```bash
git checkout <commit-hash>   # checks out a specific commit directly, NOT a branch
# You're now in "detached HEAD" — commits made here aren't on any branch and can be
# lost/garbage-collected if you switch away without creating a branch to keep them
```

```bash
git checkout -b new-branch-name   # from a detached HEAD, create a new branch to preserve any work done there
```

## File States in Git

```
Untracked  -> git add ->  Staged  -> git commit ->  Committed (tracked, unmodified)
                                                            │
                                              (edit the file)
                                                            ▼
                                                       Modified (tracked, changed, unstaged)
```

```bash
git status
# Untracked files: new_file.js
# Changes not staged for commit: existing_file.js
# Changes to be committed: staged_file.js
```

## Common Interview-Style Questions

- **What does "distributed" mean in the context of Git being a distributed version control system?**
  Every developer has a complete local copy of the entire repository history, not just the latest snapshot — unlike centralized VCS tools where full history exists only on a central server; this enables offline work, faster operations, and no single point of failure for the repository's history.

- **What are the three main areas Git tracks a file's state across?**
  The working directory (your actual files on disk), the staging area/index (changes marked for the next commit), and the repository (committed history).

- **What's the difference between `git reset` and `git revert`?**
  `git reset` rewrites history by moving the branch pointer backward, making it dangerous on shared/pushed branches since it causes divergent history for collaborators; `git revert` creates a new commit that undoes a previous commit's changes, safely extending history without rewriting it — appropriate for anything already shared with others.

- **What's the difference between `git fetch` and `git pull`?**
  `git fetch` downloads remote changes into your local copy of the remote-tracking branch without touching your current working branch (safe, non-destructive); `git pull` is equivalent to a fetch followed by a merge (or rebase), immediately integrating those remote changes into your current branch.

- **What is a "detached HEAD" state, and why is it risky?**
  It occurs when you check out a specific commit directly rather than a branch; any new commits made in this state aren't attached to any branch, meaning they can become unreachable and be garbage-collected if you switch away without first creating a branch to preserve them.
