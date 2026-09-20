# Prompt Engineering — Few-Shot Prompting

## 1. What is Few-Shot Prompting?

Few-shot prompting provides the model with **multiple examples** (typically 2-10) demonstrating the task before asking it to handle a new input. More examples than one-shot means the model can better infer the underlying pattern, handle edge cases, and generalize output format/style more reliably.

```
[Instruction] + [Example 1] + [Example 2] + [Example 3] + [New Input] = Output
```

## 2. Basic Example

```python
prompt = """
Classify the sentiment of each review as positive, negative, or neutral.

Review: "Absolutely loved it, best purchase this year!"
Sentiment: positive

Review: "It was okay, nothing special but did the job."
Sentiment: neutral

Review: "Terrible quality, broke after one use. Do not recommend."
Sentiment: negative

Review: "Shipping was fast but the product itself is mediocre."
Sentiment:
"""
```

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": prompt}],
    temperature=0,
)
print(response.choices[0].message.content)
# "neutral"
```

## 3. Why Few-Shot Often Outperforms Zero/One-Shot

- **Pattern reinforcement**: multiple examples let the model triangulate the actual rule, rather than potentially overfitting to one example's quirks.
- **Edge case coverage**: including a borderline/ambiguous example teaches the model how to handle similar tricky cases.
- **Format consistency**: repeated exposure to the exact desired output format (JSON keys, punctuation, structure) makes deviations far less likely.

## 4. Structuring Few-Shot Examples Consistently

```python
prompt = """
Extract structured data from customer messages. Respond only in JSON with keys: intent, product, urgency.

Message: "My order hasn't arrived and it's been 2 weeks!"
Output: {"intent": "shipping_complaint", "product": null, "urgency": "high"}

Message: "Do you have the blue version of this jacket in stock?"
Output: {"intent": "product_inquiry", "product": "jacket", "urgency": "low"}

Message: "I need a refund immediately, this is unacceptable."
Output: {"intent": "refund_request", "product": null, "urgency": "high"}

Message: "Just wanted to say I love your new website design!"
Output:
"""
```

```python
import json
response = client.chat.completions.create(
    model="gpt-4o", messages=[{"role": "user", "content": prompt}], temperature=0
)
result = json.loads(response.choices[0].message.content)
print(result)
# {"intent": "feedback", "product": null, "urgency": "low"}
```

## 5. Few-Shot Using the Chat Message Format (Alternative to Inline Text)

Instead of embedding examples as plain text in one big prompt, you can simulate a conversation history with alternating `user`/`assistant` turns — this is often more effective since it matches the model's natural conversational training format.

```python
messages = [
    {"role": "system", "content": "You are a customer support ticket classifier."},
    {"role": "user", "content": "My order hasn't arrived and it's been 2 weeks!"},
    {"role": "assistant", "content": '{"intent": "shipping_complaint", "urgency": "high"}'},
    {"role": "user", "content": "Do you have the blue version in stock?"},
    {"role": "assistant", "content": '{"intent": "product_inquiry", "urgency": "low"}'},
    {"role": "user", "content": "I need a refund immediately, this is unacceptable."},
]

response = client.chat.completions.create(model="gpt-4o", messages=messages, temperature=0)
```

## 6. How Many Examples Should You Use?

```
Too few (1-2):  risk of overfitting to a specific example's surface pattern
Sweet spot (3-8): usually enough to establish a clear, generalizable pattern
Too many (10+): diminishing returns, higher token cost/latency, and can eat into
                the context budget available for the actual input/output
```

The right number depends on task complexity — a simple binary classification might need only 3 examples, while a task with 6 possible categories may need at least one example per category.

## 7. Selecting Good Examples

1. **Cover the range of expected inputs** — not just easy/obvious cases, but also ambiguous or edge cases.
2. **Balance categories** — for classification, don't over-represent one class (biases the model toward it).
3. **Match the real distribution** — if 90% of your production inputs are one type, your examples should roughly reflect that, unless you specifically want to correct for a class imbalance.
4. **Keep formatting perfectly consistent** across all examples — any inconsistency (e.g., quotes vs no quotes) can propagate into inconsistent output.

## 8. Dynamic Few-Shot Selection (Retrieval-Based)

For large or diverse example sets, instead of using the same fixed examples every time, dynamically select the most relevant examples for each new input (often via embedding similarity — see the Embeddings notes).

```python
def get_relevant_examples(query, example_bank, top_k=3):
    query_embedding = get_embedding(query)
    scored = [
        (ex, cosine_similarity(query_embedding, ex["embedding"]))
        for ex in example_bank
    ]
    scored.sort(key=lambda x: x[1], reverse=True)
    return [ex for ex, score in scored[:top_k]]

def build_prompt(query, example_bank):
    examples = get_relevant_examples(query, example_bank)
    example_text = "\n\n".join(
        f'Message: "{ex["message"]}"\nOutput: {ex["output"]}' for ex in examples
    )
    return f"{example_text}\n\nMessage: \"{query}\"\nOutput:"
```

This "dynamic few-shot" approach scales better than a fixed example set as your task's input diversity grows.

## 9. Few-Shot for Code Generation

```python
prompt = """
Write a Python function based on the docstring, following the style of these examples.

def add(a: int, b: int) -> int:
    \"\"\"Return the sum of a and b.\"\"\"
    return a + b

def multiply(a: int, b: int) -> int:
    \"\"\"Return the product of a and b.\"\"\"
    return a * b

def is_even(n: int) -> bool:
    \"\"\"Return True if n is even, False otherwise.\"\"\"
"""
```

## 10. Trade-Offs of Few-Shot Prompting

| Benefit                                    | Cost                                                  |
| ------------------------------------------ | ----------------------------------------------------- |
| More consistent, predictable output format | Increases prompt length -> higher token cost per call |
| Better handling of edge cases/nuance       | Higher latency (more input tokens to process)         |
| Reduces need for fine-tuning in many cases | Requires curating and maintaining a good example set  |

## 11. Best Practices

1. Use 3-8 well-chosen examples for most classification/extraction tasks; adjust based on task complexity.
2. Keep example formatting perfectly consistent — inconsistency confuses rather than clarifies.
3. Include at least one edge case/ambiguous example if your task has tricky boundary cases.
4. Consider chat-format (alternating user/assistant turns) examples over inline text blocks — often more natural for the model.
5. For large/diverse tasks, use dynamic (retrieval-based) few-shot example selection instead of a fixed static set.
6. Monitor token cost — few-shot prompts are more expensive per call than zero-shot; weigh the reliability gain against that cost at scale.
