# Tool Calling (Function Calling)

## What it is

Tool calling lets an LLM invoke external functions/APIs to take actions or
fetch information it can't produce from its own knowledge — search the web,
query a database, run code, send an email, call an internal service. The
model doesn't execute the function itself; it outputs a structured request
(function name + arguments), the host application executes it, and feeds the
result back to the model.

## How it works mechanically

1. **Tool/function definitions are provided in the request** — typically a
   name, description, and a JSON-schema-style parameter spec.
2. **The model decides** (based on the user's message and the tool
   descriptions) whether to answer directly or call a tool, and if so,
   which one and with what arguments — it emits a structured tool-call
   output rather than free text.
3. **The host application executes the tool call** (the actual API/DB/code
   call) — the model itself never runs code or hits the network.
4. **The tool's result is returned to the model** as a new message/turn, and
   the model continues — either calling another tool or producing a final
   natural-language answer.
5. This can loop multiple times for multi-step tasks (see the AI Agents
   note) — the model chains tool calls together.

## Design considerations

- **Tool descriptions matter a lot.** The model chooses tools based on
  their name/description/parameter schema — vague or overlapping
  descriptions cause the model to pick the wrong tool or misuse arguments.
  Write descriptions the way you'd explain the tool to a new engineer.
- **Scoping tools tightly.** Fewer, well-defined tools generally outperform
  many overlapping or overly general ones — too large a toolset increases
  selection errors.
- **Parameter validation.** The model can hallucinate invalid or
  out-of-range arguments; the host application should validate/sanitize
  arguments before executing, not trust them blindly.
- **Error handling and retries.** Tool calls can fail (bad input, API
  downtime, timeout). The failure should be surfaced back to the model as a
  structured error so it can retry, ask for clarification, or gracefully
  degrade — silent failures lead to confidently wrong answers.
- **Idempotency and side effects.** For tools with real-world side effects
  (sending money, deleting data, sending messages), consider confirmation
  steps, dry-run modes, or explicit user approval before execution —
  especially since the model's decision to call a tool isn't guaranteed
  correct.
- **Parallel vs. sequential tool calls.** Some tasks allow calling multiple
  independent tools in parallel (faster); others require sequential calls
  because a later call depends on an earlier result.
- **Latency budget.** Every tool call round-trip adds latency (network call
  - another LLM inference pass); design workflows to minimize unnecessary
    round trips (e.g., batch requests where possible).

## Common failure modes

| Symptom                                        | Likely cause                                                        | Mitigation                                         |
| ---------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------- |
| Model calls the wrong tool                     | Ambiguous/overlapping tool descriptions                             | Tighten descriptions, reduce tool overlap          |
| Model hallucinates arguments                   | Under-specified parameter schema, missing required fields in prompt | Strict schema + validation layer                   |
| Model loops calling the same tool              | No stopping condition / bad error feedback                          | Return clear structured errors; cap retries        |
| Unsafe/irreversible action taken automatically | No human-in-the-loop gate for high-risk tools                       | Add confirmation step before executing risky tools |
| Slow multi-step tasks                          | Unnecessary sequential calls                                        | Parallelize independent calls where possible       |

## Interview-relevant talking points

- Be able to explain the full round trip clearly: model emits structured
  call → host executes → result returned to model → model continues. A
  common misconception to correct: the model does not execute the function.
- Discuss how you'd design tool schemas/descriptions to minimize selection
  errors.
- Discuss guardrails for tools with real-world side effects — this overlaps
  heavily with the Guardrails note and is a favorite follow-up question.
