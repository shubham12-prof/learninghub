# OpenAI APIs — Chat Completions

> Note: OpenAI's APIs evolve quickly. This covers the stable, well-established `Chat Completions` API. Always check `https://platform.openai.com/docs` for the latest parameters/models.

## 1. What is the Chat Completions API?

The Chat Completions API (`/v1/chat/completions`) is OpenAI's original conversational endpoint — you send a list of messages (with roles) and get back a generated assistant response. It's been the industry-standard interface pattern that most LLM providers (Anthropic, Mistral, open-source servers) have converged on.

```
POST https://api.openai.com/v1/chat/completions
```

## 2. Basic Request

```python
from openai import OpenAI

client = OpenAI(api_key="YOUR_API_KEY")

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is the capital of France?"},
    ],
)

print(response.choices[0].message.content)
# "The capital of France is Paris."
```

```js
// Node.js
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "What is the capital of France?" },
  ],
});

console.log(response.choices[0].message.content);
```

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## 3. Message Roles

| Role        | Purpose                                                              |
| ----------- | -------------------------------------------------------------------- |
| `system`    | Sets behavior/persona/instructions for the whole conversation        |
| `user`      | The end-user's message                                               |
| `assistant` | The model's previous responses (for multi-turn context)              |
| `tool`      | Result returned from a function/tool call (see Function Calling doc) |

```python
messages = [
    {"role": "system", "content": "You are a sarcastic assistant."},
    {"role": "user", "content": "What's 2+2?"},
    {"role": "assistant", "content": "Oh, just 4. Groundbreaking, I know."},
    {"role": "user", "content": "What about 3+3?"},
]
```

## 4. Multi-Turn Conversation (Managing History)

```python
conversation = [{"role": "system", "content": "You are a helpful assistant."}]

def chat(user_input):
    conversation.append({"role": "user", "content": user_input})
    response = client.chat.completions.create(model="gpt-4o", messages=conversation)
    reply = response.choices[0].message.content
    conversation.append({"role": "assistant", "content": reply})
    return reply

print(chat("My name is Alex."))
print(chat("What's my name?"))  # Model remembers via the message history
```

Note: the API itself is **stateless** — you must resend the full conversation history on every request. (The newer Responses API can manage state server-side — see that doc.)

## 5. Key Parameters

| Parameter           | Purpose                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| `model`             | Which model to use (`gpt-4o`, `gpt-4o-mini`, etc.)                     |
| `temperature`       | Randomness: 0 = deterministic, higher = more creative (0–2)            |
| `top_p`             | Nucleus sampling alternative to temperature                            |
| `max_tokens`        | Cap on tokens generated in the response                                |
| `n`                 | Number of completions to generate for the same prompt                  |
| `stop`              | Sequence(s) that stop generation when produced                         |
| `presence_penalty`  | Penalizes tokens that already appeared (encourages new topics)         |
| `frequency_penalty` | Penalizes tokens proportional to how often they've appeared            |
| `stream`            | Stream tokens incrementally instead of waiting for the full response   |
| `seed`              | Best-effort deterministic output for the same inputs                   |
| `response_format`   | Constrain output format (e.g., JSON mode — see Structured Outputs doc) |

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    temperature=0.7,
    max_tokens=300,
    presence_penalty=0.5,
)
```

## 6. Streaming Responses

```python
stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Write a short poem about the sea."}],
    stream=True,
)

for chunk in stream:
    delta = chunk.choices[0].delta.content
    if delta:
        print(delta, end="", flush=True)
```

```js
const stream = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Write a short poem about the sea." }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}
```

Streaming dramatically improves perceived latency for chat UIs, since tokens display as they're generated rather than waiting for the full response.

## 7. Vision (Multimodal Input)

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What's in this image?"},
                {"type": "image_url", "image_url": {"url": "https://example.com/photo.jpg"}},
            ],
        }
    ],
)
```

## 8. Token Usage & Cost Tracking

```python
response = client.chat.completions.create(model="gpt-4o", messages=messages)
print(response.usage)
# CompletionUsage(prompt_tokens=25, completion_tokens=42, total_tokens=67)
```

Cost = `(prompt_tokens * input_price + completion_tokens * output_price) / 1_000_000` (prices are typically quoted per million tokens — check current pricing on OpenAI's site since it changes).

## 9. Error Handling & Retries

```python
import time
from openai import OpenAI, RateLimitError, APIError

client = OpenAI()

def call_with_retry(messages, max_retries=3):
    for attempt in range(max_retries):
        try:
            return client.chat.completions.create(model="gpt-4o", messages=messages)
        except RateLimitError:
            wait = 2 ** attempt
            print(f"Rate limited, retrying in {wait}s...")
            time.sleep(wait)
        except APIError as e:
            print(f"API error: {e}")
            raise
    raise Exception("Max retries exceeded")
```

## 10. Choosing a Model (General Guidance)

```
Need highest capability / complex reasoning?  -> flagship model (e.g., gpt-4o / gpt-4.1 class)
Need low latency + low cost at scale?          -> smaller/mini model variant
Need long context (large documents)?            -> check model's context window size
Need multimodal (vision/audio) input?           -> confirm model supports that modality
```

Always check the current model list/pricing page, since OpenAI regularly ships new models and deprecates older ones.

## 11. Best Practices

1. Keep a clear, concise `system` message — it strongly steers style/behavior.
2. Manage conversation history yourself; trim/summarize old turns to control token cost as conversations grow.
3. Use `stream: true` for any user-facing chat interface.
4. Set `max_tokens` to a sensible cap to avoid runaway costs.
5. Handle rate limits (`429`) with exponential backoff.
6. Track `usage` on every response for cost monitoring/billing.
7. Use `temperature: 0` for deterministic/factual tasks (data extraction, classification); higher for creative writing.
