# AI Agents

## What an "AI agent" means

An LLM-based system that can autonomously decide a sequence of actions
(reasoning steps, tool calls, retrievals) to accomplish a goal, rather than
producing a single one-shot response. The defining features vs. a plain
chatbot: **planning/looping**, **tool use**, and often **memory** across
steps or sessions.

## Core agent loop

A common pattern (sometimes called the "ReAct" pattern — Reasoning +
Acting):

1. **Observe** — take in the current state (user goal, tool outputs so far).
2. **Think/Plan** — the LLM reasons about what to do next.
3. **Act** — call a tool, retrieve information, or produce a partial
   response.
4. **Observe result** — incorporate the tool's output.
5. Repeat until the LLM decides the goal is met, then produce a final
   answer.

This loop is what lets an agent handle multi-step tasks ("find the flight,
check the weather, then draft an email") that a single LLM call can't.

## Agent architectures

- **Single-agent, tool-using loop** — one LLM instance with access to a set
  of tools, looping as above. Simplest and most common in production.
- **Planner + executor** — a separate planning step decomposes the goal into
  a sequence of sub-tasks up front, then an executor (same or different
  model) carries them out — more predictable than a fully improvised loop,
  but less adaptive to surprises.
- **Multi-agent systems** — multiple specialized agents (e.g., a researcher
  agent, a coder agent, a reviewer agent) coordinate, often with one
  orchestrator agent delegating sub-tasks. Useful for separating concerns
  and specializing prompts/tools per role, at the cost of more coordination
  complexity and latency.
- **Reflection/self-critique loops** — the agent evaluates its own output or
  intermediate results and revises before continuing, improving reliability
  at the cost of extra LLM calls.

## Design considerations

- **Stopping conditions** — agents can loop indefinitely on ambiguous goals
  or repeated tool failures; production systems need max-iteration limits,
  timeouts, and explicit "give up and ask for help" paths.
- **Determinism vs. flexibility** — fully improvised loops are adaptive but
  unpredictable; more scripted workflows (state machines with LLM calls at
  specific nodes) are more testable/reliable for well-understood tasks.
- **Cost/latency** — every reasoning + tool-call round trip is another LLM
  call; multi-agent and reflection patterns multiply cost quickly, so scope
  agent autonomy to where it's actually needed.
- **Observability** — logging the full chain of thought/tool calls/results
  is essential for debugging agent failures, which are often non-obvious
  (agent picked a reasonable-looking but wrong tool, or misread a tool's
  output).
- **Human-in-the-loop checkpoints** — for high-stakes or irreversible
  actions (sending an email, making a purchase, deleting data), require
  explicit user confirmation before the agent executes.

## Interview-relevant talking points

- Be able to sketch the ReAct-style loop from memory and explain each step.
- Discuss when a single-agent loop is enough vs. when multi-agent
  decomposition earns its added complexity (usually: distinct
  specializations, large task, need for parallelism).
- Discuss failure modes specific to agents: infinite loops, tool misuse,
  compounding errors across steps, and how you'd guard against each.
- Be ready to design an agent for a concrete scenario (e.g., "design a
  customer-support agent that can look up orders and issue refunds") and
  talk through tools needed, guardrails, and stopping conditions.
