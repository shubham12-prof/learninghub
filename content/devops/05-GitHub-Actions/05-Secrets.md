# 05. Secrets

## What Are GitHub Actions Secrets?

Secrets are encrypted environment variables used to store sensitive values (API keys, deployment credentials, tokens) that workflows need but that should never appear in plain text in your workflow YAML or logs. GitHub encrypts secrets at rest and masks their values in workflow run logs automatically.

## Configuring Secrets

```
Repository -> Settings -> Secrets and variables -> Actions -> New repository secret
  Name: DEPLOY_API_KEY
  Value: (the actual sensitive value)
```

```bash
gh secret set DEPLOY_API_KEY --body "actual-secret-value"
gh secret list
```

## Using Secrets in a Workflow

```yaml
steps:
  - name: Deploy
    run: ./deploy.sh
    env:
      API_KEY: ${{ secrets.DEPLOY_API_KEY }}
```

```yaml
- uses: some-action/deploy@v1
  with:
    api-key: ${{ secrets.DEPLOY_API_KEY }}
```

## Automatic Log Masking

If a secret's actual value ever appears in a workflow's output/logs, GitHub automatically replaces it with `***` before displaying it — a built-in safety net against accidental leakage.

```
Log output showing a masked secret:
  Deploying with API key: ***
```

> **Important limitation:** masking is based on exact string matching — if a secret value is transformed (e.g., base64-encoded, or with whitespace/casing altered) before being printed, the masked/transformed version might **not** be caught, potentially leaking the underlying value in a disguised form. Never deliberately print secrets, even "for debugging," and be cautious about any logic that might inadvertently expose a transformed version.

## Levels of Secret Scope

```
Repository secrets:    available only to workflows in THIS specific repository
Environment secrets:     available only when a job targets a SPECIFIC environment (e.g., "production")
Organization secrets:      available across MULTIPLE repositories within an organization,
                            with optional repository access restrictions
```

```
Organization -> Settings -> Secrets and variables -> Actions -> New organization secret
  Repository access: All repositories / Selected repositories / Private repositories only
```

Organization-level secrets are useful for values shared across many repos (a shared registry credential, a common third-party API key), avoiding the need to duplicate the same secret into every individual repository.

## Environment-Specific Secrets

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: ./deploy.sh
        env:
          DB_PASSWORD:
            ${{ secrets.DB_PASSWORD }} # resolves to the "production" ENVIRONMENT's secret,
            # if one is configured, otherwise falls back to repo-level
```

```
Repository -> Settings -> Environments -> "production" -> Environment secrets:
  DB_PASSWORD: (production-specific value)

Repository -> Settings -> Environments -> "staging" -> Environment secrets:
  DB_PASSWORD: (staging-specific value)
```

This lets the exact same workflow code deploy correctly to different environments, each pulling its own environment-scoped secret value — no need for separate workflows or manual environment-switching logic.

## The Built-in `GITHUB_TOKEN`

GitHub Actions automatically provides a `GITHUB_TOKEN` secret for every workflow run, scoped to the specific repository and expiring when the job completes — used for interacting with the GitHub API (commenting on PRs, creating releases, pushing tags) without needing to manually configure a personal access token.

```yaml
steps:
  - uses: actions/checkout@v4
    with:
      token: ${{ secrets.GITHUB_TOKEN }} # often used implicitly by default, shown explicitly here
  - name: Comment on PR
    uses: actions/github-script@v7
    with:
      github-token: ${{ secrets.GITHUB_TOKEN }}
      script: |
        github.rest.issues.createComment({
          issue_number: context.issue.number,
          owner: context.repo.owner,
          repo: context.repo.repo,
          body: 'Automated comment from CI'
        })
```

Its permissions are governed by the workflow's `permissions:` configuration (covered in the Workflows notes), following the principle of least privilege.

## Secrets and Pull Requests From Forks — A Critical Security Consideration

By default, secrets are **not** exposed to workflows triggered by pull requests from forked repositories — a deliberate security measure preventing a malicious external contributor from opening a PR that exfiltrates your repository's secrets via a modified workflow file.

```
Internal PR (same repo):      full access to configured secrets
Fork PR (external contributor): secrets NOT available by default (for the standard `pull_request` trigger)
```

```yaml
# pull_request_target runs with the BASE repository's context/permissions (including secrets),
# even for fork PRs — but this requires EXTREME caution, since it can be exploited if not carefully
# scoped (e.g., checking out and running untrusted PR code with elevated permissions)
on:
  pull_request_target:
```

`pull_request_target` should only be used with a clear understanding of its risks — running untrusted fork code with access to secrets is a well-documented, serious attack vector if not handled very carefully (e.g., never directly checking out and executing arbitrary PR code under this trigger).

## Secret Scanning — Preventing Accidental Commits

GitHub also provides secret scanning (separate from Actions secrets themselves) that detects accidentally committed secrets (API keys, tokens) in repository code/history and can alert or automatically revoke them for supported providers.

```
Settings -> Code security and analysis -> Secret scanning: enable
```

This is a complementary defense — Actions Secrets protect values used _within_ workflows, while secret scanning protects against values accidentally _committed_ directly into the codebase.

## Best Practices for Secrets in GitHub Actions

1. **Never hardcode sensitive values directly in workflow YAML** — always reference `secrets.*`.
2. **Scope secrets as narrowly as possible** — environment-level over repository-level, repository-level over organization-level, when the broader scope isn't genuinely needed.
3. **Rotate secrets periodically**, especially after any suspected exposure.
4. **Avoid `pull_request_target` with untrusted code checkout** unless you fully understand and mitigate the risk.
5. **Use environment protection rules** (required reviewers) for environments whose secrets grant access to sensitive production systems.
6. **Never echo/print secret values**, even for debugging — rely on masking as a safety net, not a primary control.

## Common Interview-Style Questions

- **What happens if a secret's value accidentally appears in a workflow's log output?**
  GitHub Actions automatically masks it, replacing the value with `***` in the displayed logs — though this masking is based on exact string matching, so a transformed version of the secret (e.g., base64-encoded) might not be caught and could still leak.

- **What's the difference between repository secrets, environment secrets, and organization secrets?**
  Repository secrets are scoped to a single repository; environment secrets are scoped to a specific named deployment environment (like "production") within a repository, letting the same workflow pull different values per environment; organization secrets are shared across multiple repositories within an organization, with configurable access restrictions.

- **Why aren't secrets available by default to workflows triggered by pull requests from forked repositories?**
  As a security measure — without this restriction, a malicious external contributor could open a pull request containing a modified workflow designed to exfiltrate the repository's secrets, since PR-triggered workflows would otherwise run with full access to them.

- **What is the `GITHUB_TOKEN`, and how does it differ from a manually-configured secret?**
  An automatically-generated, repository-scoped token provided to every workflow run (expiring when the job completes), used for interacting with the GitHub API without manual configuration; unlike a manually-created secret, its permissions are governed directly by the workflow's `permissions:` configuration rather than being a fixed, indefinitely-valid credential.

- **Why is `pull_request_target` considered risky when combined with checking out and running code from the triggering pull request?**
  `pull_request_target` runs with the base repository's context and permissions (including access to secrets) even for fork-originated PRs; if the workflow checks out and executes the untrusted PR's code under this elevated-permission context, a malicious contributor could potentially exfiltrate secrets or perform other unauthorized actions — this combination is a well-documented attack vector requiring careful, deliberate mitigation if used at all.
