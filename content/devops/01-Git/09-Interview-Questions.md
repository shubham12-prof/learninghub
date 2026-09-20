# 09. Interview Questions — Git (Comprehensive)

A consolidated set of commonly asked Git interview questions, organized by topic, with concise answers and code where useful.

---

## Git Basics

**Q: What does "distributed" mean for Git as a VCS?**
Every developer has a complete local copy of the entire repository history, not just the latest snapshot — unlike centralized systems where full history exists only on a central server.

**Q: What are the three main areas Git tracks?**
Working directory (files on disk), staging area/index (changes marked for the next commit), and the repository (committed history).

**Q: `git reset` vs `git revert`?**
`reset` rewrites history by moving the branch pointer backward (dangerous on shared branches); `revert` creates a new commit undoing a previous one (safe on shared/pushed branches).

**Q: `git fetch` vs `git pull`?**
`fetch` downloads remote changes without touching your current branch (safe, non-destructive); `pull` is fetch + merge (or rebase), immediately integrating changes into your current branch.

**Q: What is a detached HEAD state?**
Checking out a specific commit directly rather than a branch; new commits made there aren't attached to any branch and can be lost if you switch away without creating a branch first.

---

## Branching

**Q: What is a Git branch, technically?**
A lightweight, movable pointer to a specific commit — cheap to create since it's not a copy of the codebase.

**Q: Compare Git Flow, GitHub Flow, and trunk-based development.**
Git Flow: multiple long-lived branches (main/develop/feature/release/hotfix) for scheduled releases. GitHub Flow: single always-deployable main with short-lived feature branches via PRs, for continuous deployment. Trunk-based: everyone commits to a single trunk (or very short-lived branches), relying on feature flags.

**Q: Why do teams favor short-lived branches?**
Less divergence from main over time means smaller, more manageable merge conflicts and more frequent, reviewable changes.

**Q: `git branch -d` vs `-D`?**
`-d` is a safe delete refusing to remove a branch with unmerged commits; `-D` force-deletes regardless of merge status.

---

## Merging

**Q: Fast-forward vs three-way merge?**
Fast-forward: target branch hasn't diverged, pointer simply moves forward, no new commit. Three-way: both branches diverged, Git creates a new merge commit with two parents.

**Q: Why enforce `--no-ff` even when fast-forward is possible?**
Preserves the historical record that a feature branch existed as a distinct unit of work, improving `git log --graph` readability.

**Q: When does a merge conflict occur?**
When both branches modify the same lines of the same file incompatibly (or one modifies what the other deletes) — resolved by manually editing out the conflict markers, staging, and committing.

**Q: What is squash merging, and its trade-off?**
Combines all feature branch commits into one commit on the target branch — cleaner history, but loses granular commit-by-commit history of how the feature was built.

---

## Rebase

**Q: Fundamental difference between merge and rebase?**
Merge preserves exact original history via a new merge commit (non-linear); rebase replays commits onto a new base as new commits with different hashes (linear history, rewritten).

**Q: Why is rebasing shared/public branches dangerous?**
It rewrites commit hashes; anyone who already pulled the original commits will have diverging history, causing confusing duplicates when they push/pull afterward.

**Q: What is interactive rebase commonly used for?**
Cleaning up messy local commit history — squashing/fixing up small commits, rewording messages, reordering, or dropping commits before merging/opening a PR.

**Q: `--force` vs `--force-with-lease`?**
`--force` unconditionally overwrites the remote; `--force-with-lease` refuses if the remote has commits you haven't seen locally, protecting against accidentally overwriting a collaborator's work.

---

## Cherry Pick

**Q: What does cherry-pick do, and how does it differ from merge?**
Applies changes from one specific commit onto the current branch as a new commit; unlike merge, it doesn't bring in an entire branch's history — just the selected commit(s).

**Q: Real-world use case for cherry-picking?**
Backporting a critical bug fix from main to one or more older, still-maintained release branches without merging all of main's unrelated changes.

**Q: Why use `git cherry-pick -x`?**
Appends a reference to the original commit's hash in the new commit message, improving traceability back to the source commit.

**Q: Risk of cherry-picking a range of commits?**
If a commit depends on an earlier commit not included in the range, the cherry-pick can fail or produce broken/incomplete results.

---

## Stash

**Q: What does `git stash` solve?**
Lets you temporarily save uncommitted changes and revert the working directory to the last commit, so you can switch context without committing unfinished work.

**Q: `git stash pop` vs `git stash apply`?**
`pop` applies and removes the stash from the list; `apply` applies but keeps it in the list, useful for applying the same stash to multiple branches.

**Q: Does stash include untracked files by default?**
No — requires `-u` (`--include-untracked`); `.gitignore`-matched files additionally require `-a` (`--all`).

**Q: Are stashes shared with collaborators?**
No — stashes are entirely local and never pushed to a remote.

---

## Tags

**Q: Tag vs branch?**
A tag is a fixed, immutable pointer to a commit; a branch is a movable pointer that advances with each new commit.

**Q: Lightweight vs annotated tags?**
Lightweight: simple pointer, no metadata. Annotated: full Git object with tagger name/email/date/message, can be GPG-signed — recommended for releases.

**Q: Why don't tags push automatically with `git push`?**
Git treats them separately by design, requiring explicit `git push origin <tag>` or `--tags`, preventing accidental publishing of in-progress local markers.

**Q: How are tags commonly used in CI/CD?**
Pipelines are often configured to trigger release/deployment workflows specifically when a tag matching a release pattern (like `v*`) is pushed.

---

## Bisect

**Q: What algorithm does `git bisect` use?**
Binary search — narrows the good/bad range by half at each test, finding a bad commit among N commits in roughly log2(N) checks.

**Q: How does `git bisect run` differ from manual bisecting?**
It accepts a script whose exit code (0 = good, non-zero = bad) automates the entire search, rather than requiring manual testing/marking at each step.

**Q: What does exit code 125 mean for `git bisect run`?**
Tells Git the commit can't be meaningfully tested (e.g., doesn't build) — it's skipped rather than marked good or bad.

**Q: Prerequisites for using bisect effectively?**
A known-good and known-bad commit to establish the range, and a reliable (ideally automatable) way to determine good/bad for any given commit.

---

## Practical / Coding Questions Often Asked Live

**Q: Undo the last commit but keep the changes staged.**

```bash
git reset --soft HEAD~1
```

**Q: Clean up a messy feature branch history before opening a PR.**

```bash
git rebase -i HEAD~5
# mark small "fix typo"-style commits as `fixup`, leave logical commits as `pick`
```

**Q: Backport a fix from main to a release branch.**

```bash
git checkout release/v1.5
git cherry-pick -x <fix-commit-hash>
git push origin release/v1.5
```

**Q: Find the commit that introduced a bug across 200 commits.**

```bash
git bisect start
git bisect bad HEAD
git bisect good v1.0.0
git bisect run npm test
git bisect reset
```

**Q: Safely update a feature branch with the latest main without losing your local uncommitted work.**

```bash
git stash
git checkout main
git pull origin main
git checkout feature-branch
git rebase main   # or merge, depending on team convention
git stash pop
```

**Q: Explain the trade-offs you'd communicate to a team deciding between merge and rebase workflows for feature branches.**
Merge preserves exact history (including how/when branches diverged and merged) and is always safe on shared branches, but produces a more tangled, harder-to-read log with extra merge commits; rebase produces a clean, linear, easy-to-follow history well-suited to tools like `git bisect`, but rewrites commit hashes, making it strictly unsafe on any branch others have already pulled from — the practical recommendation is typically: rebase freely on local/private feature branches to keep them tidy before sharing, but always merge (never rebase) once a branch is shared/public.
