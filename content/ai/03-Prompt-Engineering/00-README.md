# 33. Prompt Engineering

A complete learning guide on prompt engineering, with theory + diagrams + working code examples (Python, Jinja2, YAML).

## Contents

1. [Zero-shot](./01-Zero-shot.md) — no-example prompting, when it works, improving reliability
2. [One-shot](./02-One-shot.md) — single-example prompting for format/style anchoring
3. [Few-shot](./03-Few-shot.md) — multi-example prompting, example selection, dynamic retrieval-based few-shot
4. [Chain of Thought](./04-Chain-of-Thought.md) — step-by-step reasoning, self-consistency, reasoning models
5. [Prompt Templates](./05-Prompt-Templates.md) — reusable structures, versioning, injection mitigation
6. [Evaluation](./06-Evaluation.md) — metrics, LLM-as-judge, A/B testing, regression testing
7. [Interview Questions](./07-Interview-Questions.md) — 25 Q&A covering all topics above, plus scenario-based questions

## Suggested Study Order

```
Zero-shot -> One-shot -> Few-shot -> Chain of Thought -> Prompt Templates -> Evaluation -> Interview Questions
```

Start with the progression of example-based prompting (zero → one → few-shot), add reasoning techniques (CoT), then learn how to structure prompts as maintainable templates, and finish with how to systematically measure whether any of it is actually working.

## Quick Reference: Technique Selection Guide

| Situation                                       | Technique                               |
| ----------------------------------------------- | --------------------------------------- |
| Simple, well-understood task                    | Zero-shot                               |
| Need consistent output format/style             | One-shot or Few-shot                    |
| Task has multiple categories/edge cases         | Few-shot (3-8 examples)                 |
| Multi-step math/logic/reasoning problem         | Chain of Thought                        |
| Prompt used repeatedly across your app          | Prompt Template                         |
| Need to know if a prompt change actually helped | Evaluation (offline metrics + A/B test) |
