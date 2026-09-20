# 08. Bisect

## What is `git bisect`?

`git bisect` uses **binary search** through your commit history to efficiently find the specific commit that introduced a bug — dramatically faster than manually checking commits one by one, especially across a long history.

```
Instead of checking commits sequentially: 1, 2, 3, 4, 5, 6, ..., 100  (up to 100 checks)

git bisect uses binary search:  check commit 50 -> good/bad?
                                 check commit 25 or 75 (based on result) -> good/bad?
                                 ... narrows down in ~log2(100) ≈ 7 checks
```

For 1,000 commits, sequential checking could take up to 1,000 steps; binary search takes at most ~10 steps (`log2(1000) ≈ 10`) — an enormous practical difference for a large history.

## The Basic Workflow

```bash
git bisect start                    # begin a bisect session
git bisect bad                        # mark the CURRENT commit as bad (has the bug)
git bisect good <known-good-commit>     # mark a commit you KNOW was working correctly

# Git checks out a commit roughly halfway between good and bad
# Test it manually (run the app, run tests, reproduce the bug scenario, etc.)

git bisect good   # if THIS commit doesn't have the bug
# or
git bisect bad     # if THIS commit DOES have the bug

# Repeat — Git keeps narrowing the range and checking out the new midpoint automatically
# until it identifies the EXACT first commit where the bug was introduced

git bisect reset   # end the session, return to your original branch/commit
```

## Practical Example

```bash
git bisect start
git bisect bad                  # current state (e.g., main) has the bug
git bisect good v2.3.0            # we know v2.3.0 was working fine

# Git checks out a commit halfway between v2.3.0 and the current bad commit
# -> run your tests / manually verify the bug

git bisect good   # this commit works fine — bug was introduced LATER
# Git checks out a new midpoint, further forward

git bisect bad     # this commit HAS the bug — bug was introduced EARLIER than this
# Git checks out another new midpoint

# ... continue until Git narrows it down to a single commit ...

# Git output: "a1b2c3d4 is the first bad commit"
git bisect reset   # done — return to where you started
```

## Automating Bisect with a Test Script

Instead of manually testing at each step, provide a script that returns a specific exit code — `0` for good, non-zero for bad — letting `git bisect run` automate the entire process end-to-end.

```bash
git bisect start
git bisect bad HEAD
git bisect good v2.3.0

git bisect run npm test   # or a custom script — Git automatically checks out each midpoint,
                            # runs the command, interprets the exit code, and continues
                            # UNTIL it finds the exact culprit commit — fully automated
```

```bash
#!/bin/bash
# a more targeted test script, e.g., bisect-test.sh
npm run build && npm test -- --grep "checkout flow"
exit $?
```

```bash
git bisect run ./bisect-test.sh
```

This automated approach is dramatically faster in practice — no manual checking/testing at each step, just letting the script determine good/bad and Git handle the entire search.

## Exit Code Conventions for `git bisect run`

```
Exit code 0:        commit is GOOD
Exit code 1-124, 126-127:  commit is BAD
Exit code 125:        this commit should be SKIPPED (can't be tested — e.g., doesn't build)
Exit code 128+:         aborts the bisect entirely (something went seriously wrong)
```

## Skipping Untestable Commits

Sometimes a commit in the range genuinely can't be tested (a broken intermediate build state unrelated to the bug you're hunting).

```bash
git bisect skip   # tell Git this commit can't be evaluated, move to a different midpoint instead
```

## Viewing Bisect Progress and Log

```bash
git bisect log     # see the full history of good/bad markings made so far in this session
git bisect visualize   # (or `git bisect view`) open a visual log of the remaining candidate commits
```

## Replaying a Bisect Session

```bash
git bisect log > bisect-log.txt    # save a bisect session's log
git bisect replay bisect-log.txt     # replay that exact session later (e.g., to share reproduction steps with a teammate)
```

## Practical Real-World Example: Finding a Performance Regression

```bash
git bisect start
git bisect bad HEAD                        # current build is slow
git bisect good v3.0.0                       # v3.0.0 was known to be fast

git bisect run ./benchmark-check.sh            # a script that runs a benchmark and exits non-zero if too slow

# Git automatically narrows down and reports:
# "a1b2c3d introduced the performance regression"
```

```bash
#!/bin/bash
# benchmark-check.sh
RESULT=$(npm run benchmark | grep "ops/sec" | awk '{print $1}')
if (( $(echo "$RESULT < 1000" | bc -l) )); then
  exit 1  # too slow -> BAD
else
  exit 0  # fast enough -> GOOD
fi
```

## When to Reach for `git bisect`

- A regression exists somewhere in a large range of commits, and you don't know exactly which one introduced it.
- You have (or can write) a reliable, automatable way to determine "good" vs "bad" for any given commit (a test, a script, a reproducible manual check).
- Manually checking each commit sequentially would be impractically slow given the size of the range.

## Common Interview-Style Questions

- **What algorithm does `git bisect` use, and why is it so much faster than checking commits sequentially?**
  Binary search — at each step it checks out the commit roughly halfway between the known-good and known-bad boundaries, narrowing the search range by half with each test; this means finding a bad commit among N commits takes roughly log2(N) checks instead of up to N checks with a sequential approach, a massive difference for large histories.

- **How does `git bisect run` differ from a manual `git bisect` session?**
  `git bisect run` accepts a script/command that Git executes automatically at each candidate commit, interpreting its exit code (0 for good, non-zero for bad) to determine the next step — fully automating the entire search process end-to-end instead of requiring manual testing and marking at each midpoint.

- **What does exit code 125 mean when using `git bisect run` with a test script?**
  It tells Git that this particular commit can't be meaningfully tested (e.g., it doesn't build, or is in some genuinely broken unrelated state) — Git will skip it and try a different nearby commit instead of treating it as good or bad.

- **What are the prerequisites for using `git bisect` effectively?**
  A known-good commit and a known-bad (typically current) commit to establish the search range, and a reliable way — ideally automatable via a script — to determine whether any given commit exhibits the bug or not.

- **When would `git bisect skip` be useful?**
  When a specific commit within the search range genuinely can't be evaluated (e.g., it represents a transiently broken build state unrelated to the actual bug being investigated) — it tells Git to try a nearby commit instead of forcing a good/bad judgment on an untestable one.
