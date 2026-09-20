# Prompt Engineering — Zero-Shot Prompting

## 1. What is Zero-Shot Prompting?

Zero-shot prompting means asking a model to perform a task **without providing any examples** of how to do it — you rely entirely on the model's pre-trained knowledge and its ability to understand and follow instructions from the prompt alone.

```
Prompt:
"Classify the sentiment of this review as positive, negative, or neutral: 'The food was cold and the service was slow.'"

Model output (no examples given, relying purely on instructions + pretrained knowledge):
"Negative"
```

## 2. Why It Works

Modern large language models are trained on massive, diverse corpora and further refined via instruction-tuning (RLHF/SFT), which teaches them to generalize from natural-language task descriptions alone — without needing task-specific examples, unlike older NLP approaches that required labeled training data per task.

## 3. Basic Structure of a Zero-Shot Prompt

```
[Instruction] + [Input Data] = Output
```

```python
prompt = """
Translate the following English sentence to French.

Sentence: "The weather is beautiful today."
"""
```

```python
from openai import OpenAI
client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": prompt}],
)
print(response.choices[0].message.content)
# "Le temps est magnifique aujourd'hui."
```

## 4. Common Zero-Shot Task Patterns

### Classification

```
Classify the following email as "spam" or "not spam":
"Congratulations! You've won a $1000 gift card. Click here to claim now!"
```

### Extraction

```
Extract the person's name, company, and job title from this text:
"Hi, I'm Sarah Chen, VP of Engineering at Acme Corp."
```

### Summarization

```
Summarize the following article in 2 sentences:
[article text]
```

### Generation

```
Write a professional email declining a meeting invitation due to a scheduling conflict.
```

### Question Answering

```
Answer the question based on general knowledge: What causes rainbows to form?
```

## 5. Improving Zero-Shot Performance

### Be Explicit About the Desired Format

```
BAD:  "Summarize this article."
GOOD: "Summarize this article in exactly 3 bullet points, each under 15 words."
```

### Specify Role/Persona

```python
messages = [
    {"role": "system", "content": "You are an expert financial analyst."},
    {"role": "user", "content": "Explain the risks of investing in emerging markets."},
]
```

### Provide Clear Constraints

```
"List 5 healthy breakfast ideas. Each should take under 10 minutes to prepare and use no more than 5 ingredients."
```

### Use Explicit Task Framing Keywords

```
"Classify:", "Translate:", "Summarize:", "Extract:", "Generate:" — naming the task explicitly
often improves reliability over vague, implicit phrasing.
```

## 6. When Zero-Shot Works Well vs When It Struggles

| Works Well                                                               | Struggles                                                                 |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Common, well-represented tasks (translation, summarization, general Q&A) | Highly niche/domain-specific formatting conventions                       |
| Tasks with a clear, universally understood definition                    | Tasks requiring a very specific, non-obvious output structure             |
| Simple classification with intuitive categories                          | Nuanced classification with subtle, ambiguous category boundaries         |
| General knowledge questions                                              | Tasks needing a demonstrated reasoning pattern (see Chain of Thought doc) |

## 7. Code Example: Zero-Shot Classification Pipeline

```python
def classify_ticket(ticket_text):
    prompt = f"""
Classify the following customer support ticket into exactly one category:
"billing", "technical", "account", or "other".

Respond with only the category name, nothing else.

Ticket: "{ticket_text}"
"""
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,  # deterministic for classification tasks
    )
    return response.choices[0].message.content.strip()

print(classify_ticket("I was charged twice for my subscription this month."))
# "billing"
```

## 8. Zero-Shot vs Fine-Tuning

```
Zero-shot: no training data needed, works immediately, flexible, but sometimes less reliable
           for very specific/unusual formats or domain jargon.

Fine-tuning: requires labeled training examples and a training process, but can achieve higher
             consistency/accuracy for a narrow, well-defined task at scale.
```

For most tasks, well-crafted zero-shot (or few-shot) prompting is tried first — fine-tuning is reserved for cases where prompting alone can't hit the required accuracy/consistency bar, or where you need to reduce per-request prompt length/cost at scale.

## 9. Limitations of Zero-Shot Prompting

1. No demonstrated examples means the model must infer your exact expectations from instructions alone — ambiguity in phrasing directly hurts output quality.
2. Less reliable for tasks with unusual/non-standard output formats specific to your application.
3. More prone to inconsistent formatting across multiple calls compared to few-shot, since there's no concrete example anchoring the expected structure.

## 10. Best Practices

1. Be as explicit as possible about the task, format, and constraints — don't assume the model will infer unstated preferences.
2. Specify the desired output format directly (e.g., "respond with only the label," "return valid JSON").
3. Use `temperature=0` for deterministic, classification-style zero-shot tasks; higher for creative generation.
4. Test with edge cases/ambiguous inputs — zero-shot prompts can behave unpredictably on inputs near category boundaries.
5. If zero-shot output is inconsistent across similar inputs, consider moving to few-shot prompting (see `03-Few-shot.md`) before reaching for fine-tuning.
