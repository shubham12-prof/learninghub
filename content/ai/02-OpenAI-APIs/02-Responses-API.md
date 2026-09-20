# OpenAI APIs — Responses API

> Note: The Responses API is OpenAI's newer, unified API surface (introduced 2025) intended to eventually supersede Chat Completions for most use cases, combining conversational messaging, tool use, and stateful conversation management in one endpoint. Check `https://platform.openai.com/docs` for the latest capabilities, as this API is actively evolving.

## 1. What is the Responses API?

The Responses API (`/v1/responses`) is designed to unify what used to require multiple separate APIs (Chat Completions + Assistants API) into a single, more flexible interface — with built-in support for **server-side conversation state**, native **tool use** (web search, file search, code interpreter), and simpler multi-turn handling.

```
Chat Completions API:  stateless, you resend full history every call
Responses API:         can be stateless OR stateful (server manages history via `previous_response_id`)
```

## 2. Basic Request

```python
from openai import OpenAI
client = OpenAI()

response = client.responses.create(
    model="gpt-4o",
    input="What is the capital of France?",
)

print(response.output_text)
# "The capital of France is Paris."
```

```js
const response = await client.responses.create({
  model: "gpt-4o",
  input: "What is the capital of France?",
});
console.log(response.output_text);
```

## 3. Key Differences from Chat Completions

| Feature          | Chat Completions                             | Responses API                                                  |
| ---------------- | -------------------------------------------- | -------------------------------------------------------------- |
| Input format     | `messages` array (role/content)              | `input` (string or structured array)                           |
| State management | Fully stateless (resend all history)         | Optional server-side state via `previous_response_id`          |
| Output           | `choices[0].message.content`                 | `output_text` (convenience) or structured `output` array       |
| Built-in tools   | Requires manual function calling             | Native hosted tools: web search, file search, code interpreter |
| Reasoning models | Supported, but reasoning tokens less exposed | Better first-class support for showing/using reasoning traces  |

## 4. Multi-Turn Conversations with Server-Side State

```python
# First turn
response1 = client.responses.create(
    model="gpt-4o",
    input="My name is Alex.",
)

# Second turn - reference the previous response, no need to resend history
response2 = client.responses.create(
    model="gpt-4o",
    input="What's my name?",
    previous_response_id=response1.id,
)

print(response2.output_text)  # "Your name is Alex."
```

This shifts conversation history management from the client to OpenAI's servers, simplifying application code (though you can still manage history manually if you prefer full control, e.g., for auditing/compliance).

## 5. Structured Input (Multi-Message / Multimodal)

```python
response = client.responses.create(
    model="gpt-4o",
    input=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": [
            {"type": "input_text", "text": "What's in this image?"},
            {"type": "input_image", "image_url": "https://example.com/photo.jpg"},
        ]},
    ],
)
```

## 6. Built-In Hosted Tools

The Responses API exposes tools OpenAI hosts and runs on their infrastructure — you don't need to implement the tool logic yourself.

### Web Search

```python
response = client.responses.create(
    model="gpt-4o",
    input="What were the major AI announcements this week?",
    tools=[{"type": "web_search"}],
)
print(response.output_text)
```

### File Search (Retrieval over your uploaded documents)

```python
response = client.responses.create(
    model="gpt-4o",
    input="What does our refund policy say about late returns?",
    tools=[{"type": "file_search", "vector_store_ids": ["vs_abc123"]}],
)
```

### Code Interpreter

```python
response = client.responses.create(
    model="gpt-4o",
    input="Calculate the standard deviation of [4, 8, 15, 16, 23, 42].",
    tools=[{"type": "code_interpreter", "container": {"type": "auto"}}],
)
```

## 7. Custom Function Calling (Same Concept as Chat Completions)

```python
tools = [
    {
        "type": "function",
        "name": "get_weather",
        "description": "Get the current weather for a location",
        "parameters": {
            "type": "object",
            "properties": {"location": {"type": "string"}},
            "required": ["location"],
        },
    }
]

response = client.responses.create(
    model="gpt-4o",
    input="What's the weather in Tokyo?",
    tools=tools,
)

for item in response.output:
    if item.type == "function_call":
        print(item.name, item.arguments)
```

See `03-Function-Calling.md` for the full request-response loop pattern (which applies similarly here).

## 8. Streaming

```python
stream = client.responses.create(
    model="gpt-4o",
    input="Write a haiku about databases.",
    stream=True,
)

for event in stream:
    if event.type == "response.output_text.delta":
        print(event.delta, end="", flush=True)
```

## 9. Reasoning Models (o-series / reasoning-tuned models)

```python
response = client.responses.create(
    model="o3",
    input="Solve this step by step: a train travels 120 miles in 2 hours, then 180 miles in 3 hours. What's its average speed?",
    reasoning={"effort": "medium"},  # low / medium / high - controls reasoning depth vs cost
)
print(response.output_text)
```

Reasoning-tuned models spend extra "thinking" tokens internally before producing a final answer, improving performance on complex multi-step problems (math, logic, code debugging) at the cost of higher latency/token usage.

## 10. Deleting / Managing Stored Responses

```python
client.responses.delete(response1.id)
```

If using server-side state (`previous_response_id`), be mindful of data retention policies — check OpenAI's current data usage/retention terms for your use case (e.g., regulated industries).

## 11. When to Use Responses API vs Chat Completions

```
Building a simple, stateless chatbot with full history control?
 └── Chat Completions works fine, very well-established

Need built-in tools (web search, file search, code execution) without building them yourself?
 └── Responses API

Want simpler state management (not resending full history)?
 └── Responses API

Maintaining an existing Chat Completions integration that already works well?
 └── No urgent need to migrate; both are supported
```

## 12. Best Practices

1. Use built-in hosted tools (web search, file search, code interpreter) when you don't want to build/maintain that infrastructure yourself.
2. Decide deliberately between server-side state (`previous_response_id`) vs client-managed history based on your auditability/compliance needs.
3. For reasoning models, tune the `reasoning.effort` parameter to balance answer quality against latency/cost.
4. Check the current OpenAI docs before building — this API surface is newer and evolving faster than Chat Completions.
5. Stream responses in user-facing applications for better perceived performance.
