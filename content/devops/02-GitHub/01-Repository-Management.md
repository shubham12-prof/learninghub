# 01. Repository Management

## What is a GitHub Repository?

A repository ("repo") on GitHub hosts a Git project remotely, adding a full layer of collaboration tooling on top of raw Git — issue tracking, pull requests, discussions, project boards, CI/CD integration, access control, and more. Understanding repository-level configuration is essential for managing any real-world collaborative project.

## Creating and Cloning a Repository

```bash
# Create locally, then connect to a new GitHub repo
git init
git remote add origin https://github.com/username/repo-name.git
git push -u origin main

# Or clone an existing repo
git clone https://github.com/username/repo-name.git
gh repo clone username/repo-name   # using the GitHub CLI
```

## The GitHub CLI (`gh`)

A powerful tool for managing nearly everything about a repository directly from the terminal, without switching to the browser.

```bash
gh repo create my-project --public --clone
gh repo view username/repo-name
gh pr create --title "Add search feature" --body "Implements search functionality"
gh issue create --title "Bug: login fails on Safari"
```

## Repository Visibility

| Visibility                     | Who Can See It                                             |
| ------------------------------ | ---------------------------------------------------------- |
| **Public**                     | Anyone on the internet                                     |
| **Private**                    | Only explicitly granted collaborators/organization members |
| **Internal** (Enterprise only) | Anyone within the organization, but not the public         |

## The README — A Repository's Front Door

`README.md` is the file GitHub renders prominently on a repository's homepage — typically covering project description, installation instructions, usage examples, and contribution guidelines.

````markdown
# Project Name

Brief description of what this project does.

## Installation

​`bash
npm install
​`

## Usage

​`js
const myLib = require('my-lib');
​`

## Contributing

See CONTRIBUTING.md for guidelines.
````

## Essential Repository Files

| File                 | Purpose                                               |
| -------------------- | ----------------------------------------------------- |
| `README.md`          | Project overview, setup, usage                        |
| `LICENSE`            | Legal terms for using/modifying/distributing the code |
| `CONTRIBUTING.md`    | Guidelines for external contributors                  |
| `CODE_OF_CONDUCT.md` | Community behavior expectations                       |
| `.gitignore`         | Files/patterns Git should never track                 |
| `SECURITY.md`        | How to responsibly report security vulnerabilities    |
| `.github/`           | Houses issue/PR templates, workflows, funding config  |

## Branch Protection Rules — Enforcing Quality Gates

A critical repository management feature: preventing direct pushes to important branches (like `main`) and requiring certain conditions before changes can land.

```
Settings -> Branches -> Add branch protection rule for "main":
  ✓ Require a pull request before merging
  ✓ Require approvals (e.g., at least 1 reviewer)
  ✓ Require status checks to pass before merging (CI tests, linting)
  ✓ Require branches to be up to date before merging
  ✓ Require signed commits
  ✓ Do not allow bypassing the above settings (even for admins)
  ✓ Restrict who can push to matching branches
```

This is how teams enforce "nothing reaches `main` without review and passing tests" as a hard rule rather than a social convention that could be accidentally (or deliberately) skipped.

## Access Control — Collaborators, Teams, and Permission Levels

| Permission Level | Capabilities                                                              |
| ---------------- | ------------------------------------------------------------------------- |
| **Read**         | View and clone the repo                                                   |
| **Triage**       | Read + manage issues/PRs (labels, assignees) without write access to code |
| **Write**        | Push directly to non-protected branches, manage issues/PRs                |
| **Maintain**     | Write + manage some repo settings, without full admin access              |
| **Admin**        | Full control, including settings, deleting the repo, managing access      |

For organizations, permissions are typically managed via **Teams** rather than individually per-person, making it easier to manage access as people join/leave/change roles.

```
Organization: my-company
  Team: backend-engineers -> Write access to api-server, database-migrations repos
  Team: frontend-engineers -> Write access to web-app, design-system repos
  Team: admins -> Admin access to all repos
```

## Webhooks — Integrating with External Systems

Webhooks let external services react to repository events (a push, a new PR, an issue comment) in real time.

```
Settings -> Webhooks -> Add webhook:
  Payload URL: https://your-service.com/github-webhook
  Content type: application/json
  Events: push, pull_request, issues
```

```js
// Express endpoint receiving a GitHub webhook
app.post("/github-webhook", express.json(), (req, res) => {
  const event = req.headers["x-github-event"];

  if (event === "push") {
    console.log(`New push to ${req.body.ref} by ${req.body.pusher.name}`);
  } else if (event === "pull_request") {
    console.log(`PR ${req.body.action}: ${req.body.pull_request.title}`);
  }

  res.sendStatus(200);
});
```

## GitHub Apps and Integrations

Beyond simple webhooks, GitHub Apps provide a more powerful, scoped way for third-party tools (CI/CD services, code quality bots, project management integrations) to interact with a repository, with fine-grained permissions rather than a broad personal access token.

## Repository Settings Worth Knowing

```
- Default branch (main vs master, configurable)
- Merge button options (allow merge commits / squash merging / rebase merging — can restrict to specific strategies)
- Automatically delete head branches after a PR is merged (keeps the branch list tidy)
- Require linear history (disallows merge commits entirely, forcing squash or rebase)
- Discussions, Wiki, Issues, Projects — can be individually enabled/disabled per repo
```

## Forking vs Cloning — A Common Point of Confusion

```
Cloning:  creates a LOCAL copy of a repository on your machine
          (works the same whether you have write access or not)

Forking:  creates a SEPARATE COPY of the repository under YOUR OWN GitHub account
          (used specifically when you don't have write access to the original repo,
           allowing you to make changes and propose them back via a pull request)
```

```bash
# Typical open-source contribution flow using a fork
gh repo fork original-owner/project --clone
cd project
git checkout -b my-fix
# ... make changes, commit ...
git push origin my-fix
gh pr create --repo original-owner/project   # open a PR from YOUR fork back to the ORIGINAL repo
```

## Repository Topics and Discoverability

```
Settings -> add Topics (e.g., "javascript", "rest-api", "authentication")
```

Topics improve discoverability via GitHub's search and topic browsing pages — a small but meaningful detail for open-source projects wanting visibility.

## Archiving and Transferring Repositories

```bash
# Archive: makes a repo read-only, signals it's no longer actively maintained
Settings -> Danger Zone -> Archive this repository

# Transfer: moves ownership to a different user/organization
Settings -> Danger Zone -> Transfer ownership
```

## Common Interview-Style Questions

- **What's the difference between forking and cloning a repository?**
  Cloning creates a local copy of a repository on your machine, regardless of whether you have write access; forking creates a separate copy under your own GitHub account, typically used when you lack write access to the original repository and want to propose changes back via a pull request.

- **What are branch protection rules, and why are they important?**
  Repository settings that enforce requirements (like passing CI checks, required reviewer approvals, or up-to-date branches) before changes can be merged into a protected branch like `main`; they ensure quality gates are enforced as hard rules rather than relying on developers remembering to follow a process manually.

- **How does GitHub typically manage permissions at the organization level?**
  Via Teams — permissions are granted to a team (e.g., "backend-engineers") rather than to individuals one at a time, making it much easier to manage access as people join, leave, or change roles within the organization.

- **What is a webhook, and how is it commonly used with GitHub repositories?**
  A mechanism that sends an HTTP POST request to a configured external URL whenever specified repository events occur (a push, a new pull request, an issue comment); commonly used to trigger CI/CD pipelines, notify chat tools like Slack, or integrate with custom internal tooling in real time.

- **What files does GitHub specifically recognize and give special treatment to in a repository?**
  Files like `README.md` (rendered on the repo homepage), `LICENSE` (recognized and displayed as the project's license), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and files within the `.github/` directory (issue/PR templates, GitHub Actions workflows).
