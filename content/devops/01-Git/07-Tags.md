# 07. Tags

## What is a Git Tag?

A tag is a fixed, named pointer to a specific commit — most commonly used to mark release points (`v1.0.0`, `v2.3.1`). Unlike branches, tags **don't move** as new commits are made; once created, a tag always points to the exact same commit.

```
main:  A -- B -- C -- D -- E
                  ^         ^
               v1.0.0    v1.1.0   (tags mark specific, permanent points in history)
```

## Two Types of Tags

### Lightweight Tags

Just a simple pointer to a commit — essentially a named reference, with no additional metadata.

```bash
git tag v1.0.0   # creates a lightweight tag pointing to the current commit
git tag v1.0.0 <commit-hash>   # tag a specific (not necessarily the latest) commit
```

### Annotated Tags (Recommended for Releases)

A full Git object, storing the tagger's name, email, date, and an optional message — similar to a commit, but for the tag itself. Annotated tags can also be GPG-signed for verification.

```bash
git tag -a v1.0.0 -m "Release version 1.0.0 — initial public release"
```

**Recommendation:** use annotated tags for anything meaningful (releases), and reserve lightweight tags for quick, temporary, purely local markers — annotated tags carry proper metadata that's valuable for release history and are what most release tooling expects.

## Listing and Inspecting Tags

```bash
git tag                     # list all tags
git tag -l "v1.*"              # list tags matching a pattern
git show v1.0.0                  # show the tag's details (and the commit it points to)
```

## Pushing Tags to a Remote

Tags are **not** pushed automatically with a regular `git push` — they must be pushed explicitly.

```bash
git push origin v1.0.0          # push a specific tag
git push origin --tags            # push ALL local tags not yet on the remote
git push --follow-tags              # push commits AND any annotated tags reachable from what's being pushed
```

## Deleting Tags

```bash
git tag -d v1.0.0                    # delete a LOCAL tag
git push origin --delete v1.0.0        # delete a tag on the REMOTE (deleting locally doesn't affect the remote)
```

## Checking Out a Tag

```bash
git checkout v1.0.0   # check out the commit a tag points to (results in a detached HEAD state)
```

```bash
git checkout -b hotfix-from-v1.0.0 v1.0.0   # create a new branch FROM a tag, to safely make changes
```

Checking out a tag directly puts you in detached HEAD (as covered in the Git Basics notes) — if you need to make and keep commits based on a tagged release (e.g., a hotfix for an old version), create a branch from it first.

## Semantic Versioning — The Common Tagging Convention

```
v<MAJOR>.<MINOR>.<PATCH>

v2.4.1
  │ │ │
  │ │ └─ PATCH: backward-compatible bug fixes
  │ └─── MINOR: backward-compatible new features
  └───── MAJOR: breaking changes
```

```bash
git tag -a v2.4.1 -m "Fix pagination bug in search results"
git tag -a v2.5.0 -m "Add dark mode support"
git tag -a v3.0.0 -m "BREAKING: remove deprecated v1 API endpoints"
```

## Tags and CI/CD — A Very Common Practical Use Case

Many CI/CD pipelines specifically trigger release/deployment workflows when a new tag matching a release pattern is pushed, distinguishing "just a regular commit" from "an official release."

```yaml
# Conceptual CI config — trigger a deployment workflow only on tag pushes matching v*
on:
  push:
    tags:
      - "v*"

jobs:
  deploy:
    steps:
      - run: ./deploy.sh
```

```bash
# Typical release workflow
git checkout main
git pull origin main
git tag -a v2.5.0 -m "Release v2.5.0"
git push origin v2.5.0   # this push specifically triggers the CI/CD release pipeline
```

## Generating a Changelog Between Tags

```bash
git log v2.4.0..v2.5.0 --oneline   # all commits between two tagged releases — the basis for a changelog
```

Many release tools (semantic-release, standard-version, GitHub's auto-generated release notes) automate exactly this — walking commits between two tags to build a changelog automatically, often relying on a consistent commit message convention (like Conventional Commits) to categorize changes.

## Signed Tags — Verifying Release Authenticity

```bash
git tag -s v1.0.0 -m "Release v1.0.0"   # GPG-sign the tag

git tag -v v1.0.0                         # verify a signed tag's signature
```

Used in security-conscious projects to cryptographically prove that a specific release was actually created by an authorized maintainer, not tampered with or spoofed.

## GitHub Releases — A Platform Feature Built on Tags

GitHub (and similar platforms) let you create a "Release" tied to a specific tag, adding release notes, attached binary artifacts, and a dedicated release page — this is a hosting-platform feature layered on top of Git's native tagging, not something Git itself provides.

## Common Interview-Style Questions

- **What's the difference between a Git tag and a Git branch?**
  A tag is a fixed, immutable pointer to a specific commit that never moves; a branch is a movable pointer that automatically advances to point at each new commit made on it — tags mark permanent historical points (like releases), while branches represent ongoing lines of development.

- **What's the difference between a lightweight tag and an annotated tag?**
  A lightweight tag is just a simple named pointer to a commit with no extra metadata; an annotated tag is a full Git object storing the tagger's name, email, date, and message (and can be GPG-signed) — annotated tags are generally recommended for meaningful releases due to this richer metadata.

- **Why don't tags get pushed automatically with a regular `git push`?**
  Git treats tags as separate from branch commits by design, requiring explicit action (`git push origin <tag>` or `git push --tags`) to push them — this prevents accidentally publishing tags that might still be local/in-progress markers.

- **Why does checking out a tag put you in a detached HEAD state, and what should you do if you need to make changes based on a tagged release?**
  Because a tag points to a specific commit rather than a branch, so there's no branch pointer to advance as you make new commits; if you need to build on a tagged release (e.g., a hotfix for an old version), you should create a new branch from that tag first, so your new commits have somewhere to live.

- **How are tags commonly used in CI/CD pipelines?**
  Many pipelines are configured to trigger release/deployment workflows specifically when a tag matching a release pattern (like `v*`) is pushed, distinguishing an official, intentional release event from routine commits/pushes to a branch.
