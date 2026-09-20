# OpenAI APIs — Structured Outputs

## 1. What are Structured Outputs?

Structured Outputs is a feature that **guarantees** the model's response conforms exactly to a JSON Schema you provide — no missing fields, no extra fields, no malformed JSON. This is stronger than just prompting "please respond in JSON," which can still occasionally produce invalid or incomplete JSON.

```
Without Structured Outputs: "Please return JSON" -> model USUALLY follows format, sometimes doesn't
With Structured Outputs:    schema is enforced at the token-generation level -> ALWAYS valid & matches schema
```

## 2. Basic Usage (Chat Completions, `response_format`)

```python
from openai import OpenAI
client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "Extract the event details from the text."},
        {"role": "user", "content": "Team standup on Friday at 10am in Room 4B."},
    ],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "event_extraction",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "event_name": {"type": "string"},
                    "date": {"type": "string"},
                    "time": {"type": "string"},
                    "location": {"type": "string"},
                },
                "required": ["event_name", "date", "time", "location"],
                "additionalProperties": False,
            },
        },
    },
)

import json
event = json.loads(response.choices[0].message.content)
print(event)
# {'event_name': 'Team standup', 'date': 'Friday', 'time': '10am', 'location': 'Room 4B'}
```

## 3. Using Pydantic Models (Python SDK Convenience)

```python
from pydantic import BaseModel
from openai import OpenAI

client = OpenAI()

class Event(BaseModel):
    event_name: str
    date: str
    time: str
    location: str

response = client.beta.chat.completions.parse(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "Extract the event details from the text."},
        {"role": "user", "content": "Team standup on Friday at 10am in Room 4B."},
    ],
    response_format=Event,
)

event = response.choices[0].message.parsed
print(event.event_name, event.date, event.time, event.location)
```

The `.parse()` helper method auto-converts a Pydantic model into the JSON schema and parses the response back into a typed Python object — no manual `json.loads()` needed.

## 4. Nested Objects and Arrays

```python
from pydantic import BaseModel
from typing import List

class LineItem(BaseModel):
    product: str
    quantity: int
    price: float

class Invoice(BaseModel):
    invoice_number: str
    customer_name: str
    items: List[LineItem]
    total: float

response = client.beta.chat.completions.parse(
    model="gpt-4o",
    messages=[{"role": "user", "content": invoice_text}],
    response_format=Invoice,
)
invoice = response.choices[0].message.parsed
```

## 5. Enums for Constrained Categorical Fields

```python
from enum import Enum
from pydantic import BaseModel

class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"

class Review(BaseModel):
    summary: str
    sentiment: Sentiment
    rating: int

response = client.beta.chat.completions.parse(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Extract sentiment from: 'This product is amazing!'"}],
    response_format=Review,
)
```

The model is constrained to only output one of the exact enum values — eliminates the "close but not quite" string matching problems of unconstrained generation (e.g., "Positive" vs "positive" vs "POSITIVE").

## 6. Handling Refusals

```python
message = response.choices[0].message
if message.refusal:
    print("Model refused:", message.refusal)
else:
    result = message.parsed
```

Even with Structured Outputs enforcing schema validity, the model can still refuse to answer for safety reasons — check the `refusal` field before assuming `parsed`/`content` contains valid data.

## 7. JSON Mode (Legacy, Weaker Guarantee)

```python
# Older/simpler "JSON mode" - guarantees valid JSON syntax, but NOT a specific schema
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "Respond only with valid JSON: {\"answer\": ...}"},
        {"role": "user", "content": "What's 2+2?"},
    ],
    response_format={"type": "json_object"},
)
```

`json_object` mode guarantees syntactically valid JSON but doesn't enforce _which_ keys/structure it uses — you still need to describe the desired shape in your prompt and validate it yourself. Structured Outputs (`json_schema`) is the stronger, preferred approach when you know the exact shape you need.

## 8. Schema Constraints & Limitations

```
Supported: object, array, string, number, boolean, enum, nested objects/arrays, $defs/refs
Required:  "additionalProperties": false, all fields listed in "required" (strict mode)
Not supported (in strict mode): certain complex JSON Schema features like `oneOf` at the root,
                                  unconstrained `additionalProperties: true`
```

Always check current documentation for the exact schema feature support, since it's periodically expanded.

## 9. Practical Use Cases

### Data Extraction from Unstructured Text

```python
class ResumeInfo(BaseModel):
    name: str
    email: str
    years_experience: int
    skills: List[str]

# Extract structured candidate info from a raw resume PDF's text
```

### Classification with Confidence

```python
class ClassificationResult(BaseModel):
    category: str
    confidence: float
    reasoning: str
```

### Multi-Step Reasoning with Structured Output

```python
class Step(BaseModel):
    description: str
    result: str

class MathSolution(BaseModel):
    steps: List[Step]
    final_answer: str
```

### Generating Function Call Arguments Reliably

Combining Structured Outputs with function calling ensures the model's generated arguments always match your function's expected parameter schema exactly (see `03-Function-Calling.md`).

## 10. Structured Outputs vs Free-Text + Manual Parsing

| Approach                                 | Reliability                                 | Effort                         |
| ---------------------------------------- | ------------------------------------------- | ------------------------------ |
| Free-text + regex/manual parsing         | Low — brittle, breaks on format drift       | High (custom parsing code)     |
| `json_object` mode + prompt instructions | Medium — valid JSON, but shape not enforced | Medium (still need validation) |
| Structured Outputs (`json_schema`)       | High — schema strictly enforced by the API  | Low (define schema once)       |

## 11. Best Practices

1. Prefer Structured Outputs (`json_schema` / Pydantic `.parse()`) over prompting for JSON whenever you need a specific, reliable shape.
2. Keep schemas as simple/flat as reasonably possible — deeply nested or highly constrained schemas can slightly reduce generation quality/speed.
3. Always check for `refusal` before trusting `parsed` output.
4. Use `enum` types for categorical fields instead of open-ended strings.
5. Write clear field names and, where helpful, add a `description` in the schema to guide the model on what each field should contain.
6. Validate/sanity-check extracted data in your application layer too — schema conformance doesn't guarantee semantic correctness (e.g., a valid-looking but factually wrong date).
