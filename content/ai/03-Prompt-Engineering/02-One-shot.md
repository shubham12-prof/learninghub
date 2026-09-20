# Prompt Engineering — One-Shot Prompting

## 1. What is One-Shot Prompting?

One-shot prompting provides the model with **exactly one example** of the task before asking it to perform the task on new input. It sits between zero-shot (no examples) and few-shot (multiple examples) — a single demonstration to anchor the model's understanding of the expected format/style.

```
[Instruction] + [1 Example: Input -> Output] + [New Input] = Output
```

## 2. Basic Example

```python
prompt = """
Convert the following product description into a catchy one-line tagline.

Example:
Description: "Wireless noise-cancelling headphones with 30-hour battery life."
Tagline: "Silence the world. Amplify your music."

Now do the same for:
Description: "A reusable water bottle that keeps drinks cold for 24 hours."
Tagline:
"""
```

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": prompt}],
)
print(response.choices[0].message.content)
# "Stay refreshed, stay cool — all day long."
```

## 3. Why Use One-Shot Instead of Zero-Shot?

A single example can dramatically reduce ambiguity about:

- **Output format** (JSON structure, length, tone)
- **Level of detail** expected
- **Style/voice** the model should match

```
Zero-shot: "Summarize this article." -> length/style unclear, may vary wildly across calls

One-shot:  "Summarize this article in the style of the example below: [1 example]" ->
           much more consistent format matching
```

## 4. One-Shot for Format Consistency (Structured Text)

```python
prompt = """
Extract the key information from a job posting into this exact format:

Example:
Posting: "We're hiring a Senior Backend Engineer in Austin, TX. Remote OK. $130k-$160k."
Output:
Title: Senior Backend Engineer
Location: Austin, TX (Remote OK)
Salary: $130k-$160k

Now extract from:
Posting: "Looking for a Product Designer based in NYC. Hybrid role. Salary range $95k-$120k."
Output:
"""
```

## 5. One-Shot for Tone/Style Matching

```python
prompt = """
Rewrite the following sentence in a formal, professional tone, matching the example style.

Example:
Casual: "Hey, can't make it to the meeting, something came up."
Formal: "I regret to inform you that I am unable to attend the meeting due to an unforeseen circumstance."

Now convert:
Casual: "Yeah that sounds good, let's do it."
Formal:
"""
```

## 6. Code Example: One-Shot Sentiment with Confidence Score

```python
def analyze_sentiment(text):
    prompt = f"""
Analyze the sentiment of the text and respond in this exact JSON format.

Example:
Text: "This restaurant exceeded all my expectations!"
Output: {{"sentiment": "positive", "confidence": 0.95}}

Now analyze:
Text: "{text}"
Output:
"""
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
    )
    return response.choices[0].message.content

print(analyze_sentiment("The product broke after just two uses."))
# {"sentiment": "negative", "confidence": 0.9}
```

## 7. When One-Shot Is the Right Choice

```
Use one-shot when:
 - The task is fairly simple/well-understood, but output FORMAT needs anchoring
 - Token budget is limited (can't afford multiple few-shot examples)
 - You want to demonstrate style/tone without over-constraining with many rigid examples

Use few-shot instead when:
 - The task has multiple distinct categories/edge cases that benefit from several examples
 - A single example risks over-fitting the model's output to that one example's specific pattern
```

## 8. Risk: Over-Anchoring on the Single Example

A common pitfall with one-shot prompting is the model may **overfit** to superficial details of the single example (e.g., copying its specific length, specific phrasing patterns, or even leaking unrelated details) rather than generalizing the underlying pattern.

```
Example given: a very short, punchy tagline for headphones
Risk: model may now ALWAYS produce very short taglines regardless of whether
      the new product actually needs more explanation
```

Mitigate by choosing a representative, moderately general example, or moving to few-shot with 2-3 varied examples if this becomes a problem.

## 9. Best Practices

1. Choose an example that's representative of the typical case, not an edge case.
2. Make the example's format exactly match what you want repeated (the model will mirror it closely).
3. Keep the example concise — a bloated example wastes tokens and can dilute the instruction's clarity.
4. If output remains inconsistent, escalate to few-shot (2-5 examples) rather than adding more instructions alone.
5. Use one-shot particularly for **format-anchoring** tasks (structured extraction, consistent styling) rather than tasks needing complex reasoning demonstration (see Chain of Thought doc for that).
