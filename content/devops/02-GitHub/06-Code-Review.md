# 06. Code Review

## Why Code Review Matters

Code review is the practice of having another developer examine proposed changes before they're merged — catching bugs, improving code quality, sharing knowledge across the team, and maintaining consistency. On GitHub, code review happens primarily within the context of a Pull Request.

## The Code Review Workflow on GitHub

```
1. Author opens a PR
2. Reviewer(s) examine the diff, leave comments/suggestions
3. Author addresses feedback (new commits, or discussion/pushback)
4. Reviewer re-reviews, eventually approves (or requests further changes)
5. Once approved (and other requirements met), the PR is merged
```

## Leaving Review Comments

### Line-Specific Comments

Click on a specific line in the diff view to leave a targeted comment — the most common form of review feedback.

```
Line 42: `const result = data.map(x => x.value)`

Comment: "This will throw if `data` is undefined. Consider adding a
          null check or defaulting to an empty array."
```

### General PR Comments

Comments on the PR as a whole (not tied to a specific line) — useful for broader feedback, questions about approach, or discussion not scoped to a single line.

## Formal Review Submission

Rather than leaving comments one at a time, reviewers typically batch their feedback and submit it as a single formal review with an overall verdict.

```
Review options:
  ✅ Approve             — satisfied, ready to merge (pending other requirements)
  🔄 Request changes       — found issues that must be addressed before merging
  💬 Comment                 — feedback given, no formal approve/reject decision
```

```bash
gh pr review 142 --approve --body "LGTM, nice work on the error handling!"
gh pr review 142 --request-changes --body "See inline comments about the missing null check"
```

## Suggested Changes — One-Click Fixes

Reviewers can propose an exact code change inline, which the author can apply with a single click.

````
Reviewer's inline comment:
  ​```suggestion
  const result = data?.map(x => x.value) ?? [];
  ​```
````

The author sees a "Commit suggestion" button; clicking it creates a commit applying exactly that change — extremely efficient for small, unambiguous fixes (typos, simple null checks, formatting) where writing out a full explanation would be slower than just showing the fix.

## Resolving Conversations

Once a comment thread's concern has been addressed (via a code change or clarifying discussion), it can be marked "Resolved" — collapsing it and signaling it no longer needs attention, keeping the review interface focused on genuinely open items as a PR evolves through multiple rounds.

```
Some teams/branch protection configs require ALL conversations to be resolved
before a PR can be merged, as an additional quality gate.
```

## Re-Requesting Review

After addressing feedback with new commits, the author typically re-requests review from anyone who previously requested changes, prompting them to take another look rather than leaving the PR in limbo.

```bash
gh pr edit 142 --add-reviewer username   # re-request from a specific reviewer
```

## What Makes Good Code Review Feedback

### Be Specific and Actionable

```
BAD:  "This doesn't look right."
GOOD: "This will fail if `items` is an empty array — line 34 assumes
       at least one element exists. Consider adding a check or a
       default value."
```

### Distinguish Blocking Issues from Suggestions

```
"Blocking: this introduces a SQL injection vulnerability — must fix before merge."

"Nit: minor style preference, not blocking — could extract this into
 a named constant for readability, but not required."
```

Prefixing non-blocking feedback (often called "nits") helps the author quickly triage which comments require action versus which are optional polish — a small convention with outsized value for review efficiency.

### Ask Questions Rather Than Assume

```
"Why did you choose to handle this with a Promise.all instead of
 sequential awaits? Just want to understand the reasoning — could be
 there's a good reason I'm not seeing."
```

Framing feedback as genuine questions (when uncertain) rather than assumed criticisms keeps reviews collaborative rather than adversarial, especially for less-experienced or newer team members.

## What Makes a PR Easy to Review

- **Keep PRs small and focused** — a PR doing one clear thing is far easier (and faster) to review thoroughly than a massive PR touching dozens of unrelated files.
- **Write a clear description** — what changed, why, and how to test it, so the reviewer doesn't have to reverse-engineer intent from the diff alone.
- **Self-review first** — authors catching their own obvious mistakes before requesting review saves everyone time.
- **Respond to every comment** — even if just "Done" or "Good point, fixed" — leaving comments unaddressed (silently) is confusing for reviewers trying to track what's resolved.

## Automated Checks as a Complement to Human Review

Human review should focus on things automation can't catch — logic correctness, architecture, readability, business requirements — while automated tooling handles mechanical concerns.

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm run lint # catches style/formatting issues automatically
      - run: npm test # catches functional regressions automatically
```

This division of labor — automation for mechanical checks, humans for judgment calls — makes both the automated checks and the human review more valuable, since reviewers aren't wasting time flagging things a linter should have already caught.

## Review Assignment Strategies

```
Round-robin:    reviews rotate evenly among team members
Code owners:      automatically assigned based on which files changed (see CODEOWNERS in the Pull Requests notes)
Load-based:        assigned to whoever has the fewest currently-pending reviews
Domain expertise:    assigned based on who has the most context on the specific area being changed
```

Many teams use GitHub's built-in reviewer auto-assignment (round-robin or load-balancing) combined with CODEOWNERS for domain-specific requirements.

## Common Anti-Patterns in Code Review

```
- Rubber-stamping: approving without actually reading the diff carefully
- Nitpicking without prioritization: treating every minor style preference as equally
  important as genuine bugs, overwhelming the author with low-value feedback
- Review bottlenecks: PRs sitting for days waiting on a single overloaded reviewer
- Scope creep in review: asking for unrelated improvements ("while you're at it, also fix...")
  that expand the PR beyond its original focused purpose
```

## Common Interview-Style Questions

- **What's the difference between "Approve," "Request changes," and "Comment" when submitting a GitHub review?**
  Approve signals the reviewer is satisfied and the PR can be merged (pending other requirements); Request changes signals issues that must be addressed before merging, formally blocking the merge if branch protection requires it; Comment provides feedback without a formal approve/reject verdict.

- **What are "suggested changes" in a GitHub review, and why are they useful?**
  Inline, precisely-specified code edits a reviewer proposes directly within the diff, which the author can apply with a single click as a commit; they're efficient for small, unambiguous fixes where showing the exact fix is faster and clearer than describing it in prose.

- **Why is it valuable to distinguish "blocking" issues from "nit" (non-blocking) feedback in a review?**
  It helps the author quickly triage which comments genuinely require action before the PR can be merged versus which are optional polish, improving review efficiency and avoiding unnecessary back-and-forth over minor preferences.

- **Why should PRs generally be kept small and focused?**
  A PR doing one clear thing is significantly easier and faster to review thoroughly than a massive PR spanning many unrelated changes; large PRs also increase the risk of reviewer fatigue leading to less careful (or "rubber-stamped") review.

- **How should automated CI checks and human code review divide responsibilities?**
  Automated checks (linting, tests, type checking) should handle mechanical, objectively-verifiable concerns; human review should focus on things automation can't evaluate — logic correctness, architectural decisions, readability, and whether the change actually solves the intended problem — avoiding wasted reviewer time on issues a linter should have already caught.
