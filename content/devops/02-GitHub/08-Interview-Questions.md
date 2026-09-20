# 08. Interview Questions — GitHub (Comprehensive)

A consolidated set of commonly asked GitHub interview questions, organized by topic, with concise answers and code where useful.

---

## Repository Management

**Q: Forking vs cloning?**
Cloning creates a local copy regardless of write access; forking creates a separate copy under your own account, typically used when you lack write access and want to propose changes back via a PR.

**Q: What are branch protection rules?**
Settings enforcing requirements (passing CI, required approvals, up-to-date branches) before changes can merge into a protected branch, turning quality gates into hard rules rather than social convention.

**Q: How does GitHub manage permissions at the organization level?**
Via Teams, granting access to a group rather than individually, simplifying management as people join/leave/change roles.

**Q: What is a webhook?**
An HTTP POST sent to a configured external URL when specified repository events occur, commonly used to trigger CI/CD, notify chat tools, or integrate custom tooling.

---

## Pull Requests

**Q: What is a pull request?**
GitHub's collaboration layer for proposing changes from one branch into another, adding review, discussion, and CI checks on top of the underlying Git merge/rebase mechanics.

**Q: What is a draft PR?**
A PR marked as work-in-progress that can't be merged until marked "Ready for review" — useful for early CI feedback and visibility.

**Q: What does a CODEOWNERS file do?**
Automatically requests reviews from specific people/teams based on which files a PR touches, and can be combined with branch protection to require their approval specifically.

**Q: Three common PR merge strategies?**
Merge commit (preserves full history), squash and merge (combines all commits into one), rebase and merge (replays commits without a merge commit).

---

## Issues

**Q: What's the primary purpose of GitHub Issues?**
Tracking bugs, feature requests, and tasks with discussion, categorization (labels/milestones/assignees), and linkage to resolving PRs.

**Q: Markdown template vs YAML issue form?**
Markdown templates provide editable free-text structure; YAML forms provide actual structured input fields (dropdowns, required fields), producing more consistent reports.

**Q: How does "Closes #142" behave?**
Automatically closes the referenced issue when the PR merges, keeping tracking synchronized without a manual step.

**Q: What is a stale issue workflow?**
An automation (e.g., `actions/stale`) that flags and eventually closes issues with no recent activity, preventing tracker clutter over time.

---

## Discussions

**Q: Issues vs Discussions?**
Issues are for actionable, trackable work with a clear resolution; Discussions are for open-ended conversation, questions, and ideas that may remain open indefinitely.

**Q: What does "marking an answer" do in a Q&A discussion?**
Highlights a specific reply as the resolution, making it easy for future visitors to find the answer without reading the full thread.

**Q: Are Discussions enabled by default?**
No — unlike Issues, they must be explicitly enabled per repository.

---

## Projects

**Q: Key advantage of modern GitHub Projects over Classic?**
Spans multiple repositories in one board, supports custom fields, and offers multiple views (board/table/roadmap) of the same data.

**Q: How does Projects automation reduce manual maintenance?**
Built-in workflows automatically move items between statuses based on repository events (closing an issue moves it to Done, opening a linked PR moves it to In Review).

**Q: What is a draft issue in a Project?**
A lightweight item existing only on the board, not yet a formal repository issue — useful for early brainstorming before something is ready to be tracked.

---

## Code Review

**Q: Approve vs Request changes vs Comment?**
Approve signals readiness to merge; Request changes formally blocks merging until addressed; Comment provides feedback without a formal verdict.

**Q: What are "suggested changes"?**
Inline, precise code edits a reviewer proposes that the author can apply with one click as a commit — efficient for small, unambiguous fixes.

**Q: Why distinguish blocking issues from nits?**
Helps the author triage which comments require action versus optional polish, improving review efficiency.

**Q: Why keep PRs small and focused?**
Smaller PRs are far easier and faster to review thoroughly; large PRs increase reviewer fatigue and risk of rubber-stamping.

---

## GitHub Pages

**Q: Core limitation of GitHub Pages?**
Serves static content only — no server-side code, database, or backend logic (though client-side JS can call external APIs).

**Q: User/org site vs project site?**
User/org site requires a repo named exactly `username.github.io`, serves at the root domain (one per account); project site uses any repo name, serves at `username.github.io/repo-name/` (unlimited).

**Q: How do you deploy a framework-built site (React/Vue) to Pages?**
A GitHub Actions workflow builds the static output in CI, then deploys it using GitHub's official Pages deployment actions.

**Q: What's special about Jekyll on GitHub Pages?**
Built-in, zero-configuration support — Jekyll-structured Markdown content is automatically built and served without a custom workflow.

---

## Practical / Coding Questions Often Asked Live

**Q: Configure branch protection requiring review and passing CI before merging to main.**

```
Settings -> Branches -> Add rule for "main":
  ✓ Require a pull request before merging
  ✓ Require approvals (1+)
  ✓ Require status checks to pass before merging
```

**Q: Write a CODEOWNERS file requiring backend team review for API changes.**

```
# .github/CODEOWNERS
/src/api/   @backend-team
```

**Q: Write a GitHub Actions workflow that runs tests on every pull request.**

```yaml
name: CI
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm test
```

**Q: Write a GitHub Actions workflow deploying a built site to GitHub Pages.**

```yaml
name: Deploy
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install && npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```

**Q: How would you set up a repository's collaboration workflow from scratch for a new team?**
Enable branch protection on `main` (require PRs, approvals, passing CI status checks); add a `CODEOWNERS` file mapping directories to responsible teams; add issue templates (bug report, feature request) to standardize incoming reports; enable Discussions for open-ended Q&A to keep Issues focused on actionable work; set up a GitHub Project board with automation (auto-move issues to "In Review" when a linked PR opens, "Done" when merged); configure a CI workflow running lint/tests on every PR as a required status check.

**Q: A team's Issues tracker has become cluttered with usage questions unrelated to actual bugs. How would you address this using GitHub's built-in tools?**
Enable Discussions and set up a Q&A category; add a note to the issue template directing usage questions to Discussions instead of Issues; convert existing non-actionable issues into Discussions; consider adding an automation/bot that detects question-like issues and suggests redirecting them, keeping the Issues tracker focused specifically on actionable bugs and feature requests.
