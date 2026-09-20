# 03. Issues

## What Are GitHub Issues?

Issues are GitHub's built-in tracker for bugs, feature requests, tasks, and general discussion tied to a specific, actionable item of work. They're the primary unit of project/task tracking for many teams and open-source projects, often replacing (or complementing) a separate external issue tracker.

## Creating an Issue

```bash
gh issue create --title "Bug: login fails on Safari" --body "Steps to reproduce: ..."
```

```
Title:        Bug: login fails on Safari
Description:  Detailed explanation, steps to reproduce, expected vs actual behavior
Labels:        bug, priority-high
Assignees:      who's responsible for addressing it
Milestone:       which release/sprint this belongs to
Projects:         linked project board(s)
```

## Issue Templates — Standardizing Issue Quality

Templates guide reporters toward providing the information actually needed to act on an issue, rather than receiving vague, unactionable reports.

```markdown
## <!-- .github/ISSUE_TEMPLATE/bug_report.md -->

name: Bug Report
about: Report a bug to help us improve
title: '[BUG] '
labels: bug

---

**Describe the bug**
A clear description of what the bug is.

**Steps to reproduce**

1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable.

**Environment**

- OS:
- Browser:
- Version:
```

Modern GitHub also supports YAML-based **issue forms**, providing structured input fields (dropdowns, checkboxes, required fields) rather than just a free-text Markdown template.

```yaml
# .github/ISSUE_TEMPLATE/bug_report.yml
name: Bug Report
description: File a bug report
body:
  - type: input
    id: version
    attributes:
      label: Version
      placeholder: "v2.3.1"
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Steps to reproduce
    validations:
      required: true
```

## Labels — Categorizing and Filtering Issues

```
bug              - something isn't working
enhancement       - new feature or request
documentation      - improvements to docs
good first issue    - suitable for newcomers/first-time contributors
help wanted           - extra attention needed
wontfix                 - won't be worked on
duplicate                 - already reported elsewhere
priority: high/medium/low
```

```bash
gh issue list --label bug --label "priority: high"   # filter issues by multiple labels
```

Custom labels can be created/colored per repository, and are one of the most powerful lightweight organizational tools available — enabling quick filtering, automation triggers, and at-a-glance status.

## Assignees and Milestones

```bash
gh issue edit 142 --add-assignee username
gh issue edit 142 --milestone "v2.5.0"
```

Milestones group issues (and PRs) toward a shared target — typically a release version or sprint — with GitHub automatically showing progress (e.g., "12 of 20 closed").

## Linking Issues and Pull Requests

```
This PR closes #142
Fixes #89
Resolves #201
Related to #55  (mentions without auto-closing)
```

Using `Closes`/`Fixes`/`Resolves` followed by an issue number automatically closes that issue when the PR merges — a small automation that keeps issue tracking synchronized with actual code changes without manual bookkeeping.

## Issue Comments and Discussion

Issues support full Markdown, code blocks, image/video attachments, emoji reactions, and threaded conversation — functioning as a lightweight discussion forum tied to a specific piece of work.

````markdown
I can reproduce this on Chrome 120 as well. Here's the stack trace:

​`
TypeError: Cannot read property 'map' of undefined
    at ProductList.render (ProductList.jsx:34)
​`
````

## Task Lists Within Issues

```markdown
## Subtasks

- [x] Design the API schema
- [x] Implement the backend endpoint
- [ ] Add frontend integration
- [ ] Write tests
- [ ] Update documentation
```

GitHub renders these as interactive checkboxes and shows completion progress directly in the issue list view — useful for tracking a multi-step piece of work within a single issue.

## Converting Between Issues and Discussions

Sometimes a reported "issue" turns out to be more of an open-ended question or discussion topic rather than an actionable bug/task — GitHub allows converting an issue into a Discussion (and vice versa in some contexts), keeping the tracker focused on genuinely actionable items.

## Filtering and Searching Issues

```bash
gh issue list --state open --label bug --assignee username
```

```
GitHub search syntax examples:
  is:issue is:open label:bug
  is:issue assignee:username
  is:issue milestone:"v2.5.0"
  is:issue no:assignee    (unassigned issues)
  is:issue sort:comments-desc   (most-discussed first)
```

## Issue Automation

### Auto-Labeling Based on Content

Third-party GitHub Actions or apps can automatically apply labels based on issue title/content patterns (e.g., auto-tagging anything mentioning "crash" as `bug` + `priority: high`).

### Stale Issue Management

```yaml
# .github/workflows/stale.yml — using the official actions/stale action
name: Mark stale issues
on:
  schedule:
    - cron: "0 0 * * *"
jobs:
  stale:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/stale@v9
        with:
          days-before-stale: 60
          days-before-close: 14
          stale-issue-message: "This issue has been inactive for 60 days and will close in 14 days unless updated."
```

Automatically flags and eventually closes issues that have seen no activity for a configured period — helps keep a large, long-running project's issue tracker from accumulating indefinitely stale/abandoned reports.

## Issues as a Project Management Tool (Beyond Just Bugs)

Many teams use Issues not just for bugs, but as their primary task-tracking unit for feature work, chores, and planning — especially when combined with Projects (covered in its own notes) for a lightweight, fully-integrated alternative to a separate tool like Jira.

## Common Interview-Style Questions

- **What are GitHub Issues, and what's their primary purpose?**
  A built-in tracker for bugs, feature requests, and tasks tied to a repository, providing a space for discussion, categorization (via labels/milestones/assignees), and linkage to the pull requests that resolve them — often serving as a project's primary task-tracking mechanism.

- **What's the difference between a Markdown-based issue template and a YAML-based issue form?**
  A Markdown template provides a pre-filled free-text structure that reporters can edit within (but doesn't enforce structure); a YAML-based issue form provides actual structured input fields (dropdowns, required fields, checkboxes) that must be filled in a specific way, producing more consistent, parseable issue reports.

- **How does linking an issue to a pull request with "Closes #142" behave?**
  When that PR is merged, GitHub automatically closes the referenced issue, keeping issue tracking synchronized with actual completed work without requiring a manual step to close the issue separately.

- **What is a milestone, and how does it differ from a label?**
  A milestone groups issues/PRs toward a shared target (typically a release or sprint), with GitHub automatically tracking completion progress; a label is a more general-purpose, often multiply-applicable categorization tag (like `bug` or `priority: high`) not tied to a specific completion target.

- **What is a common automation pattern for keeping a large repository's issue tracker manageable over time?**
  A "stale issue" workflow (e.g., using the `actions/stale` GitHub Action) that automatically flags issues with no recent activity after a configured period, and eventually closes them if they remain inactive — preventing the tracker from accumulating indefinitely abandoned reports.
