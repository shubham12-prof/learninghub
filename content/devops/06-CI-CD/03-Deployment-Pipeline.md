# 03. Deployment Pipeline

## What is a Deployment Pipeline?

The deployment pipeline stage takes a tested, validated build artifact and actually ships it to a running environment (staging, production) — the final stage in the CI/CD flow, transforming "code that's verified to work" into "code that's actually running and serving real traffic."

```
Build Pipeline -> Testing Pipeline -> Deployment Pipeline
                                        (staging -> production, typically with gates in between)
```

## Continuous Integration vs Continuous Delivery vs Continuous Deployment

A commonly confused set of terms worth being precise about:

```
Continuous Integration (CI):     developers frequently merge code, automatically built and tested
                                   -> ENDS at "we know the code works"

Continuous Delivery (CD):          CI, PLUS the code is automatically prepared for release
                                     (built, tested, packaged) and could be deployed at any time —
                                     but the actual deployment to production still requires a
                                     MANUAL trigger/approval

Continuous Deployment (also CD):     goes one step further — EVERY change that passes all
                                       automated checks is automatically deployed to production,
                                       with NO manual approval step at all
```

```
CI:                     merge -> build -> test                              (stops here)
Continuous Delivery:      merge -> build -> test -> package -> [MANUAL approval] -> deploy
Continuous Deployment:      merge -> build -> test -> package -> deploy (AUTOMATIC, no human gate)
```

Most real-world teams practice Continuous Delivery (automated up through being release-ready, manual gate before production) rather than full Continuous Deployment, though the latter is increasingly common for teams with very mature testing/monitoring practices.

## A Basic Deployment Pipeline (GitHub Actions Example)

```yaml
jobs:
  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/download-artifact@v4
        with: { name: build-output, path: dist/ }
      - run: ./deploy.sh staging

  deploy-production:
    needs: [test, deploy-staging]
    runs-on: ubuntu-latest
    environment: production # configured with required reviewers — manual approval gate
    steps:
      - uses: actions/download-artifact@v4
        with: { name: build-output, path: dist/ }
      - run: ./deploy.sh production
```

## Environment Promotion — Staging Before Production

A standard pattern: deploy first to a staging environment (as close to production as practical) to catch any remaining issues before deploying the same build to production.

```
Build -> Test -> Deploy to Staging -> Smoke Test Staging -> Deploy to Production
                                        (verify the deployment ITSELF worked, not just the code)
```

```yaml
deploy-staging:
  steps:
    - run: ./deploy.sh staging
    - name: Smoke test staging
      run: curl -f https://staging.example.com/health || exit 1
```

Deploying the **exact same artifact** to staging and then production (rather than rebuilding separately for each) — as covered in the GitHub Actions Artifacts notes — is essential; otherwise you're not actually validating what will run in production.

## Deployment Strategies — Preview

The _how_ of actually replacing running instances with a new version has several distinct strategies, each with different trade-offs around downtime, risk, and complexity — covered in full depth in the dedicated Blue-Green and Canary Deployment notes.

```
Recreate:          stop everything old, THEN start everything new  (simple, but causes downtime)
Rolling update:      gradually replace old instances with new ones, one/few at a time (the Kubernetes/most-common default)
Blue-Green:            run two COMPLETE environments, instantly switch traffic between them
Canary:                  gradually shift a SMALL percentage of traffic to the new version first, then increase
```

## Infrastructure as Code (IaC) — Deploying Infrastructure, Not Just Application Code

Modern deployment pipelines often manage infrastructure changes (servers, networking, databases) declaratively alongside application deployments, rather than manual, undocumented infrastructure changes.

```yaml
- name: Terraform Apply
  run: |
    terraform init
    terraform plan -out=tfplan
    terraform apply tfplan
```

```
Application deployment:  ships CODE changes
Infrastructure deployment: ships INFRASTRUCTURE changes (via Terraform, Pulumi, CloudFormation, etc.)
                            -> ideally ALSO goes through a reviewed, automated pipeline, not manual console changes
```

## Database Migrations in a Deployment Pipeline

Schema changes need careful handling — running a migration is a distinct, often riskier step from deploying application code, and the two need to be sequenced correctly (especially for zero-downtime deployments where old and new application code might briefly run simultaneously).

```yaml
- name: Run database migrations
  run: npm run migrate
  env:
    DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
- name: Deploy application
  run: ./deploy.sh production
```

**Best practice for zero-downtime deploys:** migrations should generally be **backward-compatible** — the old application version should still work correctly against the new schema, since during a rolling update, old and new code versions run simultaneously for a period (full detail on this general pattern in the Distributed Systems and Scaling modules).

## Deployment Notifications and Auditability

```yaml
- name: Notify deployment
  if: always()
  run: |
    ./notify-slack.sh "Deployment to production: ${{ job.status }} (${{ github.sha }})"
```

Keeping a clear, automated record of what was deployed, when, by whom (or what triggered it), and whether it succeeded is essential for debugging incidents later ("what changed right before this started failing?").

## Feature Flags — Decoupling Deployment from Release

A powerful complementary technique: deploying new code doesn't have to mean immediately exposing it to users — feature flags let you deploy code in a "dormant" state and separately, safely control when it actually activates.

```js
if (featureFlags.isEnabled("new-checkout-flow", user)) {
  return renderNewCheckout();
}
return renderOldCheckout();
```

```
Deployment:  ships the CODE (can happen frequently, continuously)
Release:       controls WHO sees the new behavior and WHEN (via flag targeting/rollout percentage)
```

This separation is a major reason mature CI/CD practices favor small, frequent deployments — deploying isn't the risky moment anymore, since the new code path can stay dark until deliberately, gradually enabled.

## Deployment Pipeline Health Checks — Verifying the Deployment Actually Worked

```yaml
- run: ./deploy.sh production
- name: Post-deployment health check
  run: |
    for i in {1..10}; do
      if curl -f https://api.example.com/health; then
        echo "Health check passed"
        exit 0
      fi
      sleep 10
    done
    echo "Health check failed after deployment"
    exit 1
```

A deployment that completes "successfully" from the deployment tool's perspective doesn't necessarily mean the application is actually healthy afterward — an automated post-deployment health check (potentially triggering an automatic rollback, covered in the Rollbacks notes, if it fails) closes this gap.

## Common Interview-Style Questions

- **What's the difference between Continuous Delivery and Continuous Deployment?**
  Continuous Delivery means every change is automatically built, tested, and packaged into a release-ready state, but actually deploying to production still requires a manual trigger/approval; Continuous Deployment goes further, automatically deploying every change that passes all checks to production with no manual gate at all.

- **Why is it important to deploy the exact same build artifact to staging and then production, rather than rebuilding for each?**
  Rebuilding separately risks subtle differences (dependency version drift, environment-specific build variations) between what was actually validated in staging and what ends up running in production — deploying the identical artifact guarantees you're truly testing and then shipping the same thing.

- **Why should database migrations generally be backward-compatible in a zero-downtime deployment pipeline?**
  During a rolling deployment, old and new versions of the application code typically run simultaneously for a period; if a migration breaks compatibility with the still-running old code, that transitional period would cause errors — backward-compatible migrations ensure both versions can correctly operate against the schema throughout the rollout.

- **How do feature flags change the risk profile of deploying code?**
  They decouple deployment (shipping code) from release (exposing new behavior to users) — new code can be deployed in a dormant, flag-gated state and safely, gradually enabled later, meaning the moment of deployment itself is no longer inherently risky, which supports smaller and more frequent deployments.

- **Why is an automated post-deployment health check important, even if the deployment tool reports success?**
  A deployment "succeeding" from the tool's perspective (files copied, container started) doesn't guarantee the application is actually functioning correctly afterward; an automated health check verifies real application health post-deployment and can trigger an automatic rollback if something is actually broken, closing the gap between "deployment completed" and "deployment actually worked."
