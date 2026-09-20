# Guardrails

## What guardrails are

Mechanisms layered around an LLM (before, during, or after generation) to
keep a production AI system safe, reliable, on-topic, and compliant —
catching problems the model itself might not reliably avoid on its own.

## Where guardrails apply

### 1. Input guardrails (before the model sees the request)

- **Prompt injection detection** — catching attempts (in user input or in
  retrieved documents) to override the system's instructions.
- **PII detection/redaction** — stripping or flagging sensitive personal
  data before it's sent to the model or logged.
- **Topic/scope filtering** — rejecting or redirecting requests clearly
  outside the product's intended use case.
- **Rate limiting / abuse detection** — preventing spam or automated abuse
  of the system.

### 2. Output guardrails (after generation, before the user sees it)

- **Content moderation/safety classifiers** — catching harmful, toxic, or
  policy-violating output before it's returned.
- **Groundedness/faithfulness checks** (especially for RAG) — verifying the
  answer is actually supported by retrieved context, to reduce
  hallucination reaching the user.
- **Structured output validation** — for outputs that must conform to a
  schema (JSON, specific format), validate and reject/retry malformed
  output rather than passing it downstream.
- **PII leakage checks** — ensuring the model didn't surface sensitive data
  it shouldn't have (e.g., another user's info retrieved by mistake).

### 3. Action guardrails (for agents/tool calling)

- **Permission scoping** — tools should only expose actions the calling
  user/context is authorized for; don't rely on the model to "decide" not
  to do something it technically has access to.
- **Human-in-the-loop confirmation** — for irreversible or high-stakes
  actions (payments, deletions, sending communications), require explicit
  user approval before execution.
- **Dry-run / simulation modes** — letting an agent preview an action's
  effect before committing to it.
- **Rate/scope limits on autonomous actions** — capping how much an agent
  can do unsupervised in one session (e.g., max spend, max emails sent).

### 4. System-level guardrails

- **System prompt hardening** — clear, prioritized instructions that are
  harder to override via user input; separating trusted system instructions
  from untrusted user/tool content.
- **Monitoring and logging** — full traceability of inputs, retrieved
  context, tool calls, and outputs, so incidents can be audited and root-
  caused.
- **Fallback behavior** — a defined, safe default response when confidence
  is low, a guardrail trips, or an unexpected error occurs, rather than
  surfacing a raw error or a low-quality answer silently.

## Implementation approaches

- **Rule-based checks** — regex/keyword filters, schema validators — fast,
  cheap, deterministic, but brittle against novel phrasing.
- **Classifier models** — smaller, purpose-trained models (or the LLM
  itself in a separate call) that score input/output for policy violations,
  toxicity, PII, etc. — more robust than rules, but adds latency/cost.
- **LLM-as-judge** — using a second LLM call to evaluate the primary
  model's output against a rubric (faithfulness, safety, relevance) —
  flexible but nondeterministic and adds cost; usually reserved for
  higher-value or asynchronous checks (eval pipelines) rather than
  synchronous production gating, unless latency allows.
- **Defense in depth** — no single guardrail is sufficient; combine input
  filtering, careful prompting, output validation, and action-level
  permission scoping so that no single failure point compromises the whole
  system.

## Interview-relevant talking points

- Be ready to place guardrails correctly along the pipeline (input vs.
  output vs. action-level) — a common design-question ask is "where would
  you add a guardrail to prevent X."
- Discuss the latency/cost tradeoff of adding classifier or LLM-as-judge
  guardrails synchronously in the request path vs. running them
  asynchronously/sampled for monitoring.
- Emphasize that guardrails should not rely solely on prompting the model
  to "please don't do X" — reliable guardrails are enforced structurally
  (permissions, validation, separate classifiers), with prompting as one
  layer among several, not the only layer.
- Be able to design guardrails for a specific scenario (e.g., "an agent
  that can issue refunds — how do you prevent it from being tricked into
  issuing an unauthorized refund").
