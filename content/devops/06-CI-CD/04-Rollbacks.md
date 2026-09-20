# 04. Rollbacks

## What is a Rollback?

A rollback reverts a deployment back to a previous, known-good version — the essential safety net for when a deployment introduces a bug, performance regression, or outage that wasn't caught by automated testing. No amount of testing eliminates the need for a fast, reliable rollback capability; production is the ultimate test environment, and things will occasionally go wrong despite everyone's best efforts.

```
Deploy v2.0 -> Something breaks in production -> Roll back to v1.9 -> Investigate v2.0's issue separately
```

## Why Rollback Speed Matters So Much

The time between "a bad deployment causes an incident" and "the rollback completes" is time spent with a broken (or degraded) production system actively affecting real users. A slow, manual, error-prone rollback process directly extends incident duration and impact.

```
Fast, automated rollback (minutes):    limited user impact, quick recovery
Slow, manual rollback (hours):           extended outage, significant user impact, more stressful incident response
```

## Rollback Strategies by Deployment Approach

### Rolling Back a Kubernetes Deployment

```bash
kubectl rollout undo deployment/my-app                  # revert to the PREVIOUS revision
kubectl rollout undo deployment/my-app --to-revision=3     # revert to a SPECIFIC revision
kubectl rollout status deployment/my-app                     # monitor the rollback's progress
```

Kubernetes retains a configurable history of previous ReplicaSets (Pod template revisions), making rollback a simple, fast, single-command operation — one of the most operationally valuable built-in Kubernetes features (full detail in the Kubernetes module's Deployments notes).

### Rolling Back via Redeployment of a Previous Artifact

```yaml
- name: Rollback to previous version
  run: |
    docker pull myapp:${{ github.event.inputs.rollback_version }}
    ./deploy.sh myapp:${{ github.event.inputs.rollback_version }}
```

Since artifacts (Docker images, build outputs) are typically versioned/tagged and retained (as covered in the Build Pipeline notes), rolling back can simply mean redeploying a previously-built, known-good artifact — this is why keeping several recent versions readily available (not just the latest) matters operationally.

### Rolling Back a Database Migration

```bash
npm run migrate:down   # or the equivalent "down" migration for your migration tool
```

Database rollbacks are meaningfully harder and riskier than application code rollbacks — data written under the new schema might not cleanly map back to the old schema, and some changes (data deletions, certain transformations) simply can't be cleanly reversed. This is a major reason backward-compatible migrations (covered in the Deployment Pipeline notes) are so strongly preferred — they let you roll back the _application code_ without necessarily needing to also roll back the _database schema_ at the same time.

## Automatic Rollback Triggers

Rather than relying purely on a human noticing something is wrong, sophisticated deployment pipelines can trigger rollbacks automatically based on health signals.

```yaml
- run: ./deploy.sh production
- name: Post-deployment health check
  id: health-check
  run: |
    if ! curl -f https://api.example.com/health; then
      echo "unhealthy=true" >> "$GITHUB_OUTPUT"
    fi
- name: Automatic rollback on failed health check
  if: steps.health-check.outputs.unhealthy == 'true'
  run: ./rollback.sh
```

More advanced setups monitor broader signals over a window of time after deployment — error rate spikes, latency degradation, elevated 5xx responses — rather than just a single health-check endpoint, automatically triggering a rollback if key metrics cross a defined threshold shortly after a new deployment.

## Rollback vs Roll-Forward — A Strategic Choice

```
Rollback:      revert to the PREVIOUS version — fast, but the bug/issue still needs a SEPARATE fix later
Roll-forward:   fix the bug and deploy a NEW version forward, rather than going backward
```

For a genuinely severe, actively-harmful issue, rolling back immediately (restoring known-good behavior first, investigating the root cause afterward) is almost always the right call — speed matters more than root-causing during an active incident. Roll-forward is more appropriate for minor issues where the fix is trivial and rolling back would actually be slower or more disruptive than just shipping the fix.

## Blue-Green Deployments and Instant Rollback

As covered in the dedicated Blue-Green Deployment notes, this strategy makes rollback essentially instantaneous — since the previous version's complete environment is still fully running (just not receiving traffic), "rolling back" is simply switching traffic routing back to it.

```
Blue (old, v1.9) — idle, but still fully running
Green (new, v2.0) — currently receiving all traffic

Rollback: switch routing back to Blue — near-INSTANT, since Blue never stopped running
```

## Feature Flags as a Rollback Alternative

For issues specifically caused by a new feature (rather than the deployment/infrastructure itself), disabling the relevant feature flag can be an even faster "rollback" than a full deployment revert — no redeployment needed at all.

```js
// Instantly disable the problematic feature for all users, without any new deployment
featureFlags.disable("new-checkout-flow");
```

This is one of the strongest practical arguments for feature-flagging significant new functionality — it provides an extremely fast, granular "undo" mechanism that doesn't require going through the full deployment pipeline at all.

## Runbooks — Documenting the Rollback Process

Especially for complex systems, having a clear, tested, documented rollback procedure (rather than figuring it out under pressure during an actual incident) is critical.

```markdown
## Rollback Procedure — API Service

1. Identify the last known-good version: `kubectl rollout history deployment/api`
2. Execute rollback: `kubectl rollout undo deployment/api --to-revision=<N>`
3. Monitor: `kubectl rollout status deployment/api`
4. Verify health: `curl https://api.example.com/health`
5. Notify #incidents channel with rollback confirmation
6. Create a follow-up ticket to investigate the root cause of the original issue
```

Practicing rollback procedures periodically (not just writing them down once and hoping they still work months later) is a hallmark of mature operational practice — an untested rollback procedure might itself fail exactly when you need it most.

## Common Interview-Style Questions

- **Why is rollback speed such a critical operational concern?**
  The time between a bad deployment causing an incident and the rollback completing is time spent with a broken or degraded production system actively affecting users; a fast, automated rollback minimizes incident duration and user impact, while a slow, manual process directly extends the outage.

- **Why are database rollbacks generally harder and riskier than application code rollbacks?**
  Data written under a new schema might not cleanly map back to an old schema, and some changes (data deletions, certain transformations) can't be cleanly reversed at all; this is a major reason backward-compatible migrations are strongly preferred, since they allow rolling back application code without necessarily needing to reverse the database schema simultaneously.

- **What's the difference between "rollback" and "roll-forward" as incident response strategies, and when would you choose each?**
  Rollback reverts to a previous known-good version quickly, deferring root-cause investigation; roll-forward fixes the issue and deploys a new version ahead rather than going backward. Rollback is generally preferred for severe, actively-harmful issues where speed matters most; roll-forward can make sense for minor issues where the fix is trivial and rolling back would actually be more disruptive or slower.

- **How does blue-green deployment make rollback especially fast?**
  Because the previous version's complete environment remains fully running (just not currently receiving traffic), "rolling back" is simply switching traffic routing back to it — an essentially instantaneous operation, unlike strategies that require actually redeploying or recreating the previous version's running instances.

- **How can feature flags provide an even faster rollback path than a full deployment revert?**
  For issues caused specifically by a new feature (rather than the underlying deployment/infrastructure), disabling the relevant feature flag can instantly deactivate the problematic behavior for all users without requiring any new deployment or rollback through the pipeline at all — making it one of the fastest possible mitigation mechanisms for feature-specific issues.
