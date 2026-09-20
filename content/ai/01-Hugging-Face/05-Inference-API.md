# Hugging Face — Inference API

## 1. What is the Inference API?

Hugging Face's Inference API lets you run model inference via a hosted HTTP endpoint, without downloading the model or managing any infrastructure yourself. There are several tiers/products for this:

| Product                      | Description                                                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Serverless Inference API** | Free/low-cost, shared infrastructure, good for prototyping, rate-limited                                       |
| **Inference Endpoints**      | Dedicated, autoscaling, production-grade infrastructure you provision (paid)                                   |
| **Inference Providers**      | Hugging Face routes requests to partner inference providers (e.g., Together AI, Fireworks) for specific models |

```
[Your App] --HTTPS request (model name + input)--> [HF Inference Infrastructure] --> [Response]
No local GPU, no model download, no server management needed
```

## 2. Basic Usage — Serverless Inference API (REST)

```bash
curl https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english \
  -X POST \
  -H "Authorization: Bearer YOUR_HF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"inputs": "I love using Hugging Face!"}'
```

```json
[[{ "label": "POSITIVE", "score": 0.9998 }]]
```

## 3. Using the Python Client (`huggingface_hub`)

```python
from huggingface_hub import InferenceClient

client = InferenceClient(token="YOUR_HF_TOKEN")

result = client.text_classification(
    "I love using Hugging Face!",
    model="distilbert-base-uncased-finetuned-sst-2-english",
)
print(result)
```

### Other Task Methods

```python
# Text generation
client.text_generation("Once upon a time,", model="gpt2", max_new_tokens=50)

# Summarization
client.summarization(long_text, model="facebook/bart-large-cnn")

# Question answering
client.question_answering(question="Where is Paris?", context="Paris is in France.")

# Image classification
client.image_classification("cat.jpg", model="google/vit-base-patch16-224")

# Automatic speech recognition
client.automatic_speech_recognition("audio.mp3", model="openai/whisper-base")

# Text-to-image
image = client.text_to_image("A sunset over mountains", model="stabilityai/stable-diffusion-2")
image.save("output.png")
```

## 4. Chat Completions (LLM-style, OpenAI-compatible interface)

```python
from huggingface_hub import InferenceClient

client = InferenceClient(model="meta-llama/Llama-3.1-8B-Instruct", token="YOUR_HF_TOKEN")

response = client.chat_completion(
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain gradient descent in one sentence."},
    ],
    max_tokens=100,
    temperature=0.7,
)
print(response.choices[0].message.content)
```

### Streaming Responses

```python
stream = client.chat_completion(
    messages=[{"role": "user", "content": "Write a short poem about the ocean."}],
    max_tokens=200,
    stream=True,
)

for chunk in stream:
    print(chunk.choices[0].delta.content, end="")
```

## 5. Inference Endpoints (Dedicated Production Deployment)

```python
from huggingface_hub import create_inference_endpoint

endpoint = create_inference_endpoint(
    name="my-sentiment-endpoint",
    repository="distilbert-base-uncased-finetuned-sst-2-english",
    framework="pytorch",
    task="text-classification",
    accelerator="gpu",
    instance_size="x1",
    instance_type="nvidia-t4",
    min_replica=1,
    max_replica=3,  # autoscaling
)

endpoint.wait()  # wait until deployed
print(endpoint.url)
```

```python
response = endpoint.client.text_classification("This is great!")
```

Inference Endpoints give you dedicated compute (no sharing/rate limits with other users), autoscaling, custom hardware selection (CPU/GPU/specific accelerators), and a private, stable URL — suited for production traffic with SLA requirements.

## 6. Error Handling & Rate Limits

```python
import time
from huggingface_hub import InferenceClient
from huggingface_hub.utils import HfHubHTTPError

client = InferenceClient(token="YOUR_HF_TOKEN")

def call_with_retry(text, retries=3):
    for attempt in range(retries):
        try:
            return client.text_classification(text)
        except HfHubHTTPError as e:
            if "503" in str(e):  # model is loading (cold start)
                wait_time = 20
                print(f"Model loading, retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise
    raise Exception("Max retries exceeded")
```

A `503` response on the serverless API often means the model is "cold" (not currently loaded on shared infrastructure) — the API typically returns an `estimated_time` field indicating how long to wait before retrying.

## 7. Using Inference in a Web App (Node.js Example)

```js
const { HfInference } = require("@huggingface/inference");

const hf = new HfInference("YOUR_HF_TOKEN");

async function classifySentiment(text) {
  const result = await hf.textClassification({
    model: "distilbert-base-uncased-finetuned-sst-2-english",
    inputs: text,
  });
  return result;
}

async function generateText(prompt) {
  const result = await hf.textGeneration({
    model: "gpt2",
    inputs: prompt,
    parameters: { max_new_tokens: 50 },
  });
  return result.generated_text;
}
```

## 8. Self-Hosted Alternative: Text Generation Inference (TGI)

For teams that want to self-host LLM inference at scale (rather than using HF's hosted infra), Hugging Face open-sourced **TGI** — a high-performance inference server used internally to power their own hosted API.

```bash
docker run --gpus all --shm-size 1g -p 8080:80 \
  -v $PWD/data:/data \
  ghcr.io/huggingface/text-generation-inference:latest \
  --model-id meta-llama/Llama-3.1-8B-Instruct
```

```bash
curl 127.0.0.1:8080/generate \
  -X POST \
  -d '{"inputs":"What is Deep Learning?","parameters":{"max_new_tokens":50}}' \
  -H 'Content-Type: application/json'
```

TGI supports continuous batching, tensor parallelism, quantization, and streaming — optimized specifically for high-throughput LLM serving.

## 9. Choosing Between Options

```
Prototyping / low traffic / free tier acceptable?
 └── Yes -> Serverless Inference API

Production traffic, need SLA/dedicated resources?
 └── Yes -> Inference Endpoints (managed) OR self-hosted TGI (full control)

Need lowest latency / full infra control / data residency requirements?
 └── Self-host with TGI or vLLM on your own infrastructure
```

## 10. Authentication

```python
# Set token as environment variable (recommended over hardcoding)
import os
os.environ["HF_TOKEN"] = "your_token_here"

from huggingface_hub import InferenceClient
client = InferenceClient()  # automatically picks up HF_TOKEN env var
```

```bash
huggingface-cli login  # interactive login, stores token locally
```

## 11. Best Practices

1. Never hardcode API tokens in source code — use environment variables/secrets managers.
2. Handle `503` cold-start errors with retry logic on the serverless tier.
3. Use Inference Endpoints (or self-hosted TGI) for production workloads needing predictable latency and no rate limits.
4. Use streaming responses for chat/generation UIs to improve perceived latency.
5. Cache/deduplicate repeated inference calls where possible — inference costs add up at scale.
6. Monitor usage against your plan's rate limits before scaling traffic on the free/serverless tier.
