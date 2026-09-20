# 07. Interview Questions — CI/CD (Comprehensive)

A consolidated set of commonly asked CI/CD interview questions, organized by topic, with concise answers and code where useful.

---

## Build Pipeline

**Q: What's the purpose of the build pipeline stage?**
Transforming source code into a deployable artifact — installing dependencies, compiling/bundling, and packaging — producing a consistent, reproducible output for later stages.

**Q: Why `npm ci` over `npm install` in CI?**
`npm ci` installs exactly what's in the lockfile without modifying it, guaranteeing reproducible dependency versions; `npm install` can update the lockfile and is less deterministic.

**Q: What does "build reproducibility" mean, and why does it matter?**
The same source and dependencies should always produce the same output regardless of the building machine; essential for trusting that a CI-tested artifact is truly what gets deployed.

---

## Testing Pipeline

**Q: What is the testing pyramid?**
A model favoring many fast unit tests, fewer integration tests, and very few slow E2E tests — an inverted pyramid leads to slow, flaky, expensive pipelines.

**Q: Does high code coverage guarantee good tests?**
No — coverage measures executed lines, not meaningful assertions; useful for finding untested code, not a definitive quality measure.

**Q: What is a flaky test, and why is it serious?**
A test that inconsistently passes/fails without a real code change; it erodes trust in the pipeline, as people start assuming failures are "probably just flaky."

**Q: Why must a testing pipeline be paired with branch protection to be effective?**
Without required status checks, a failing pipeline is merely informational — branch protection is what actually prevents broken code from merging.

---

## Deployment Pipeline

**Q: Continuous Delivery vs Continuous Deployment?**
Continuous Delivery automates up through release-readiness but requires manual approval to actually deploy to production; Continuous Deployment automatically deploys every passing change with no manual gate.

**Q: Why deploy the same artifact to staging and production rather than rebuilding?**
Rebuilding risks subtle differences between what was validated and what's actually shipped; using the identical artifact guarantees consistency.

**Q: Why should migrations be backward-compatible for zero-downtime deploys?**
Old and new application versions run simultaneously during a rolling update; a backward-incompatible migration would break the still-running old version.

**Q: How do feature flags change deployment risk?**
They decouple deployment (shipping code) from release (exposing behavior), letting new code deploy dormant and be safely, gradually enabled — deployment itself becomes less risky.

---

## Rollbacks

**Q: Why does rollback speed matter so much?**
The time between a bad deployment causing an incident and rollback completion is time spent with a broken system actively affecting users.

**Q: Why are database rollbacks harder than application code rollbacks?**
Data written under a new schema might not map cleanly back; some changes can't be cleanly reversed — a key reason backward-compatible migrations are preferred.

**Q: Rollback vs roll-forward?**
Rollback reverts to a previous known-good version quickly; roll-forward fixes and ships ahead. Rollback is generally preferred for severe issues; roll-forward for trivial fixes.

**Q: How can feature flags act as an even faster rollback?**
Disabling a flag instantly deactivates problematic feature-specific behavior without any redeployment.

---

## Blue-Green Deployment

**Q: What's the core mechanism of blue-green deployment?**
Two complete environments run simultaneously; the "switch" is redirecting traffic routing from the old (Blue) to the new (Green) environment all at once.

**Q: Why is rollback so fast with blue-green?**
Blue never stopped running — rolling back is just switching traffic routing back, no redeployment needed.

**Q: Biggest challenge with blue-green and a shared database?**
Schema changes must remain backward-compatible so both versions can function correctly against the same database during the transition window.

**Q: Downside of blue-green's all-at-once traffic switch?**
No gradual validation against real production traffic — any issue only manifesting under genuine load is discovered immediately at full scale.

---

## Canary Deployment

**Q: What problem does canary deployment solve that pre-production testing doesn't fully address?**
Issues that only manifest under genuine production conditions (real traffic, scale, edge cases); canary limits the blast radius to a small percentage rather than 100% exposure.

**Q: Why is precise traffic splitting hard with plain Kubernetes Service + replica ratios?**
Services load-balance roughly evenly across matching Pods, not with exact percentage control; genuine precision requires a service mesh or advanced Ingress.

**Q: What does a tool like Flagger automate?**
The entire progressive rollout — incremental traffic shifting, continuous metric analysis, and automatic promotion or rollback based on thresholds.

**Q: Canary deployment vs A/B testing?**
Canary is a deployment-safety technique validating technical soundness before full rollout (short-lived, one version wins); A/B testing is a product-experimentation technique comparing variants against business metrics (longer-lived, both variants valid).

---

## Practical / Coding Questions Often Asked Live

**Q: Write a deployment pipeline with staging auto-deploy and production requiring manual approval.**

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
      - run: curl -f https://staging.example.com/health

  deploy-production:
    needs: [test, deploy-staging]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/download-artifact@v4
        with: { name: build-output, path: dist/ }
      - run: ./deploy.sh production
```

**Q: Write a Kubernetes blue-green traffic switch command.**

```bash
kubectl patch service my-app-service -p '{"spec":{"selector":{"version":"green"}}}'
```

**Q: Write a rollback step triggered automatically by a failed post-deployment health check.**

```yaml
- run: ./deploy.sh production
- id: health-check
  run: curl -f https://api.example.com/health || echo "unhealthy=true" >> "$GITHUB_OUTPUT"
- name: Rollback
  if: steps.health-check.outputs.unhealthy == 'true'
  run: kubectl rollout undo deployment/my-app
```

**Q: Design a full CI/CD strategy for a critical payment service where an undetected bug could cause real financial harm.**
Build pipeline producing a versioned, immutable artifact; testing pipeline with a strong unit/integration test base plus mandatory security scanning, enforced via required branch protection status checks; deployment pipeline promoting the identical artifact through staging with automated smoke tests before production; production deployment via canary (small initial traffic percentage, automated metric-based analysis via a tool like Flagger, both technical and business metrics monitored) rather than an all-at-once switch, specifically to limit blast radius for a high-stakes service; automatic rollback triggers on canary metric threshold violations; all database migrations required to be backward-compatible; a documented, periodically-practiced manual rollback runbook as a final safety net.

**Q: A team wants to reduce their deployment risk without slowing down how often they ship code. What CI/CD practices would you recommend?**
Feature flags to decouple deployment from release (ship code continuously, control exposure separately); canary deployments for gradual, metric-monitored rollout rather than all-at-once; comprehensive automated testing enforced via required status checks so most issues are caught before deployment at all; fast, well-tested rollback procedures (ideally near-instant, via blue-green or feature-flag disabling) so that when an issue does reach production, impact and recovery time are minimized rather than trying to prevent 100% of possible issues through testing alone.
