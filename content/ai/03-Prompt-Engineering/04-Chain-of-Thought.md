# Prompt Engineering — Chain of Thought (CoT)

## 1. What is Chain of Thought Prompting?

Chain of Thought (CoT) prompting encourages the model to generate intermediate reasoning steps before arriving at a final answer, rather than jumping directly to a conclusion. This significantly improves performance on tasks requiring multi-step reasoning — math, logic puzzles, multi-hop question answering — by giving the model "room to think" using its own generated tokens as working memory.

```
Without CoT: Question -> Answer (often wrong on complex problems)
With CoT:    Question -> Step 1 -> Step 2 -> Step 3 -> ... -> Answer (much more accurate)
```

## 2. Zero-Shot Chain of Thought (Simplest Form)

Just appending a trigger phrase like "Let's think step by step" can dramatically improve reasoning accuracy without providing any worked examples.

```python
prompt = """
A store had 23 apples. They sold 15 and then received a new shipment of 40 apples.
How many apples does the store have now?

Let's think step by step.
"""
```

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": prompt}],
)
print(response.choices[0].message.content)
# "Starting apples: 23
#  After selling 15: 23 - 15 = 8
#  After new shipment of 40: 8 + 40 = 48
#  The store now has 48 apples."
```

## 3. Few-Shot Chain of Thought (Worked Examples)

Provide examples that include the full reasoning chain, not just the final answer — this teaches the model the _style_ of reasoning to apply.

```python
prompt = """
Q: A cafe has 3 tables with 4 chairs each, and 2 tables with 6 chairs each. How many chairs in total?
A: There are 3 tables with 4 chairs: 3 x 4 = 12 chairs.
   There are 2 tables with 6 chairs: 2 x 6 = 12 chairs.
   Total: 12 + 12 = 24 chairs.
   The answer is 24.

Q: A train travels 60 miles in the first hour and 90 miles in the second hour. What's its average speed over the 2 hours?
A: Total distance: 60 + 90 = 150 miles.
   Total time: 2 hours.
   Average speed: 150 / 2 = 75 miles per hour.
   The answer is 75.

Q: A bakery makes 120 cupcakes. They sell 3/4 of them in the morning and 1/2 of the remainder in the afternoon. How many cupcakes are left?
A:
"""
```

## 4. Why Chain of Thought Improves Accuracy

- **Decomposition**: breaking a complex problem into smaller sub-steps reduces the chance of a single large reasoning error.
- **Self-correction opportunity**: generating intermediate steps lets the model's own later tokens be conditioned on (and potentially catch inconsistencies in) earlier steps.
- **Better use of computation**: LLMs process tokens sequentially; producing explicit reasoning tokens effectively gives the model more "compute" to work with before committing to a final answer, compared to answering immediately.

## 5. Structured Chain of Thought for Extraction Tasks

```python
prompt = """
Determine if this contract clause is a "termination clause" or "payment clause."
First explain your reasoning, then give your final answer on a new line starting with "Answer:".

Clause: "Either party may terminate this agreement with 30 days written notice if the other
party breaches a material term and fails to cure such breach within 15 days of notice."
"""
```

```
Reasoning: The clause describes conditions under which either party can end the agreement
(termination) due to breach of contract, along with notice periods. It does not discuss
payment amounts, schedules, or terms.
Answer: termination clause
```

## 6. Separating Reasoning from Final Answer (Structured Parsing)

```python
from pydantic import BaseModel

class ReasonedAnswer(BaseModel):
    reasoning: str
    final_answer: str

response = client.beta.chat.completions.parse(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Solve step by step: If a shirt costs $40 after a 20% discount, what was the original price?"}],
    response_format=ReasonedAnswer,
)
result = response.choices[0].message.parsed
print(result.reasoning)
print(result.final_answer)
```

Combining CoT with Structured Outputs lets you programmatically separate the "thinking" from the final answer your application actually uses — useful when you want to log/audit reasoning without showing it to end users.

## 7. Self-Consistency (Sampling Multiple Reasoning Paths)

Generate multiple independent CoT reasoning chains (via sampling with `temperature > 0`) and take the majority-vote answer — often more accurate than a single greedy pass.

```python
import collections

def self_consistency_answer(question, n=5):
    answers = []
    for _ in range(n):
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": f"{question}\nLet's think step by step, then give the final numeric answer."}],
            temperature=0.7,
        )
        text = response.choices[0].message.content
        # (In practice, parse out just the final answer from each response)
        answers.append(text.split()[-1])

    most_common = collections.Counter(answers).most_common(1)[0][0]
    return most_common
```

## 8. Reasoning Models (Built-In "Extended Thinking")

Some models (e.g., OpenAI's o-series reasoning models) perform extended internal reasoning automatically, without needing an explicit "think step by step" prompt — the model has been specifically trained to allocate more internal computation to hard problems.

```python
response = client.responses.create(
    model="o3",
    input="A farmer has chickens and cows. Together they have 30 heads and 74 legs. How many chickens and how many cows?",
    reasoning={"effort": "high"},
)
print(response.output_text)
```

With these models, explicit CoT prompting ("let's think step by step") often provides much smaller additional benefit, since extended reasoning is already happening internally — though clear problem framing still helps.

## 9. When Chain of Thought Helps Most

| Helps a Lot                          | Helps Little/Not at All                                 |
| ------------------------------------ | ------------------------------------------------------- |
| Multi-step math word problems        | Simple factual lookups ("What's the capital of Japan?") |
| Logical deduction / puzzles          | Straightforward text classification                     |
| Multi-hop question answering         | Simple formatting/rewriting tasks                       |
| Code debugging (trace through logic) | Direct translation of short phrases                     |

## 10. Downsides / Trade-offs

1. **Higher token cost & latency** — generating reasoning steps means more output tokens per response.
2. **Verbose output** — if user-facing, you may want to hide/strip the reasoning (or use `reasoning` structured field) rather than show raw chain-of-thought text.
3. **Not always faithful** — research has shown a model's stated reasoning doesn't always accurately reflect the actual computation that led to its answer; treat CoT as a performance-improving technique, not a guaranteed transparent explanation.

## 11. Best Practices

1. Use "Let's think step by step" (or similar) as a low-cost, zero-shot way to boost accuracy on reasoning-heavy tasks.
2. For more control/reliability, use few-shot CoT with 2-3 fully worked examples showing the desired reasoning style.
3. Separate reasoning from the final answer programmatically (via a structured schema or a clear "Answer:" delimiter) when you only want to surface the conclusion to users.
4. Use self-consistency (multiple sampled reasoning paths + majority vote) for higher-stakes tasks where accuracy matters more than cost/latency.
5. Don't over-apply CoT to simple tasks — it adds unnecessary cost/latency without meaningful accuracy benefit for straightforward lookups or classifications.
6. When using reasoning-tuned models, tune the reasoning effort parameter rather than manually engineering elaborate CoT prompts — the model handles it internally.
