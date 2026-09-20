# Prompt Engineering — Evaluation

## 1. Why Evaluate Prompts?

Prompt engineering is empirical, not purely theoretical — a prompt that seems well-written can still perform poorly on real inputs, and small wording changes can meaningfully shift accuracy. Systematic evaluation turns "this feels better" into measurable, comparable evidence.

```
Prompt v1 -> run against test set -> score: 78% accuracy
Prompt v2 -> run against SAME test set -> score: 85% accuracy
-> v2 is measurably better, not just a hunch
```

## 2. Building an Evaluation Dataset

A good eval set contains representative inputs **with known correct/expected outputs** (ground truth), covering both common cases and edge cases.

```python
eval_dataset = [
    {"input": "This product is amazing, best purchase ever!", "expected": "positive"},
    {"input": "It was okay, nothing special.", "expected": "neutral"},
    {"input": "Terrible experience, would not recommend.", "expected": "negative"},
    {"input": "Fast shipping but the item arrived damaged.", "expected": "negative"},  # edge case: mixed signals
    {"input": "meh", "expected": "neutral"},  # edge case: very short/ambiguous
]
```

### Sources for Eval Data

- Hand-labeled examples curated by domain experts.
- Real production inputs (anonymized) with human-reviewed correct outputs.
- Synthetically generated edge cases specifically designed to stress-test the prompt.

## 3. Types of Evaluation Metrics

### Exact Match / Accuracy (Classification-Style Tasks)

```python
def evaluate_accuracy(prompt_fn, eval_dataset):
    correct = 0
    for item in eval_dataset:
        prediction = prompt_fn(item["input"])
        if prediction.strip().lower() == item["expected"].strip().lower():
            correct += 1
    return correct / len(eval_dataset)

accuracy = evaluate_accuracy(classify_sentiment, eval_dataset)
print(f"Accuracy: {accuracy:.2%}")
```

### Precision, Recall, F1 (For Imbalanced Classification)

```python
from sklearn.metrics import precision_recall_fscore_support

predictions = [classify_sentiment(item["input"]) for item in eval_dataset]
expected = [item["expected"] for item in eval_dataset]

precision, recall, f1, _ = precision_recall_fscore_support(
    expected, predictions, average="weighted"
)
```

### Semantic Similarity (For Open-Ended Generation)

```python
def semantic_similarity_score(generated, reference):
    gen_embedding = get_embedding(generated)
    ref_embedding = get_embedding(reference)
    return cosine_similarity(gen_embedding, ref_embedding)
```

Useful when exact match is too strict (e.g., summaries can be worded differently but still be "correct").

### ROUGE / BLEU (Traditional NLP Metrics, Summarization/Translation)

```python
from rouge_score import rouge_scorer

scorer = rouge_scorer.RougeScorer(["rouge1", "rougeL"], use_stemmer=True)
scores = scorer.score(reference_summary, generated_summary)
print(scores)  # {'rouge1': ..., 'rougeL': ...}
```

These metrics have known limitations (they reward lexical overlap, not necessarily true semantic correctness) but remain useful baselines, especially combined with other methods.

## 4. LLM-as-Judge Evaluation

For subjective or open-ended tasks where exact match doesn't apply (tone, helpfulness, coherence), use another LLM call to score the output against a rubric.

```python
def llm_judge(question, answer, rubric):
    prompt = f"""
You are an expert evaluator. Rate the following answer on a scale of 1-5 based on this rubric:
{rubric}

Question: {question}
Answer: {answer}

Respond with only a JSON object: {{"score": <int 1-5>, "reasoning": "<brief explanation>"}}
"""
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
    )
    return json.loads(response.choices[0].message.content)

result = llm_judge(
    question="Explain photosynthesis to a 10-year-old.",
    answer=generated_answer,
    rubric="1=incorrect/confusing, 3=correct but too technical, 5=correct, clear, age-appropriate",
)
print(result)  # {"score": 4, "reasoning": "..."}
```

LLM-as-judge is powerful but imperfect — judges can have their own biases (e.g., favoring longer answers, or being inconsistent across runs). Use a strong, well-calibrated judge model, provide a clear rubric, and consider spot-checking judge scores against human ratings periodically.

## 5. Structured Output Validation

For tasks using Structured Outputs, evaluation can directly check schema conformance plus field-level correctness.

```python
def evaluate_extraction(prompt_fn, eval_dataset):
    correct_fields = 0
    total_fields = 0
    for item in eval_dataset:
        result = prompt_fn(item["input"])  # returns parsed structured object
        for field, expected_value in item["expected"].items():
            total_fields += 1
            if getattr(result, field, None) == expected_value:
                correct_fields += 1
    return correct_fields / total_fields
```

## 6. A/B Testing Prompts in Production

```python
import random

def get_prompt_variant(user_id):
    # Deterministic bucketing based on user_id for consistent experience per user
    return "v2" if hash(user_id) % 2 == 0 else "v1"

def handle_request(user_id, user_input):
    variant = get_prompt_variant(user_id)
    prompt = PROMPT_VERSIONS[variant].format(text=user_input)
    response = call_model(prompt)
    log_metrics(user_id, variant, response)  # track downstream engagement/satisfaction
    return response
```

Track downstream business metrics (user satisfaction ratings, task completion rate, escalation rate to human support) alongside or instead of pure model-output accuracy, since the ultimate goal is real-world outcome quality.

## 7. Regression Testing for Prompts

Treat your eval set like a test suite — run it automatically whenever a prompt changes, to catch regressions before deploying.

```python
def run_eval_suite(prompt_version):
    prompt_fn = lambda text: get_prediction(prompt_version, text)
    accuracy = evaluate_accuracy(prompt_fn, eval_dataset)
    assert accuracy >= 0.85, f"Prompt {prompt_version} regressed below threshold: {accuracy:.2%}"
    return accuracy
```

```yaml
# CI pipeline step (conceptual)
- name: Run prompt eval suite
  run: python run_eval_suite.py --prompt-version=v3 --min-accuracy=0.85
```

## 8. Common Failure Modes to Test For

| Failure Mode                            | How to Test                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------ |
| Inconsistent output format              | Run the same input multiple times, check format stability                            |
| Hallucination (fabricated facts)        | Include eval items with a clear ground-truth answer and check for fabricated details |
| Prompt injection vulnerability          | Include adversarial inputs attempting to override instructions                       |
| Bias toward one class/answer            | Check per-class accuracy, not just overall accuracy (catches skewed predictions)     |
| Sensitivity to irrelevant input changes | Test paraphrased versions of the same input, expect the same output                  |
| Refusals on legitimate requests         | Include valid edge-case requests that might be over-flagged                          |

## 9. Frameworks & Tools for Prompt Evaluation

| Tool                   | Purpose                                                                      |
| ---------------------- | ---------------------------------------------------------------------------- |
| OpenAI Evals           | Open-source framework for defining and running evals against OpenAI models   |
| LangSmith              | Tracing, evaluation, and dataset management for LLM applications             |
| Promptfoo              | CLI/config-based tool for testing prompts across multiple models and metrics |
| Weights & Biases (W&B) | Experiment tracking, useful for logging prompt variants and their scores     |
| Custom scripts         | Often sufficient for smaller, well-defined evaluation needs                  |

## 10. Example: Simple `promptfoo`-Style Config (Conceptual)

```yaml
prompts:
  - "Classify sentiment: {{text}}"
providers:
  - openai:gpt-4o
tests:
  - vars: { text: "I love this product!" }
    assert:
      - type: equals
        value: "positive"
  - vars: { text: "This is the worst thing I've bought." }
    assert:
      - type: equals
        value: "negative"
```

## 11. Best Practices

1. Build a representative eval set early, including edge cases — don't rely on "it looks good to me" for anything going to production.
2. Choose metrics matching the task type: exact match/accuracy for classification, semantic similarity or LLM-as-judge for open-ended generation.
3. Use LLM-as-judge carefully — provide a clear rubric, and periodically validate judge scores against human review.
4. Track downstream business/user outcomes in production A/B tests, not just offline accuracy metrics.
5. Automate eval runs as part of your deployment pipeline (regression testing) whenever prompts change.
6. Test explicitly for known LLM failure modes: hallucination, format drift, injection vulnerability, and class bias — don't just test the "happy path."
