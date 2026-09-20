# Hugging Face — Pipelines

## 1. What is a Pipeline?

The `pipeline()` function is the highest-level, easiest way to use a Hugging Face model — it bundles the tokenizer, model, and post-processing logic into a single callable, so you can go from raw input to usable output in one line.

```python
from transformers import pipeline

classifier = pipeline("sentiment-analysis")
result = classifier("I absolutely loved this movie!")
print(result)
# [{'label': 'POSITIVE', 'score': 0.9998}]
```

```
Raw Input -> [Tokenizer] -> [Model] -> [Post-processing] -> Human-readable Output
              └──────────────── all handled by pipeline() ────────────────┘
```

## 2. Common Pipeline Tasks

### Text Classification

```python
classifier = pipeline("text-classification", model="distilbert-base-uncased-finetuned-sst-2-english")
classifier("This product exceeded my expectations!")
# [{'label': 'POSITIVE', 'score': 0.9997}]
```

### Named Entity Recognition (NER)

```python
ner = pipeline("ner", grouped_entities=True)
ner("Elon Musk founded SpaceX in Hawthorne, California.")
# [{'entity_group': 'PER', 'word': 'Elon Musk', ...},
#  {'entity_group': 'ORG', 'word': 'SpaceX', ...},
#  {'entity_group': 'LOC', 'word': 'Hawthorne, California', ...}]
```

### Question Answering

```python
qa = pipeline("question-answering", model="deepset/roberta-base-squad2")
qa(question="Where is the Eiffel Tower located?",
   context="The Eiffel Tower is located in Paris, France.")
# {'answer': 'Paris, France', 'score': 0.93, 'start': 30, 'end': 44}
```

### Text Summarization

```python
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
summarizer(long_article_text, max_length=100, min_length=30, do_sample=False)
```

### Text Generation

```python
generator = pipeline("text-generation", model="gpt2")
generator("Once upon a time,", max_new_tokens=50, num_return_sequences=2)
```

### Translation

```python
translator = pipeline("translation_en_to_fr", model="Helsinki-NLP/opus-mt-en-fr")
translator("Hello, how are you?")
# [{'translation_text': 'Bonjour, comment allez-vous?'}]
```

### Zero-Shot Classification (No Fine-Tuning Needed)

```python
zero_shot = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
zero_shot(
    "This is a tutorial about machine learning models",
    candidate_labels=["education", "politics", "sports"],
)
# {'labels': ['education', 'politics', 'sports'], 'scores': [0.94, 0.04, 0.02], ...}
```

### Fill-Mask

```python
unmasker = pipeline("fill-mask", model="bert-base-uncased")
unmasker("The capital of France is [MASK].")
# [{'token_str': 'paris', 'score': 0.42, ...}, ...]
```

### Feature Extraction (Embeddings)

```python
extractor = pipeline("feature-extraction", model="bert-base-uncased")
embeddings = extractor("Hello world")  # returns hidden state vectors
```

### Image Classification

```python
image_classifier = pipeline("image-classification", model="google/vit-base-patch16-224")
image_classifier("cat.jpg")
# [{'label': 'tabby cat', 'score': 0.87}, ...]
```

### Automatic Speech Recognition (ASR)

```python
asr = pipeline("automatic-speech-recognition", model="openai/whisper-base")
asr("audio_sample.mp3")
# {'text': 'Hello, this is a test recording.'}
```

### Object Detection

```python
detector = pipeline("object-detection", model="facebook/detr-resnet-50")
detector("street_scene.jpg")
# [{'label': 'car', 'score': 0.98, 'box': {'xmin': 10, 'ymin': 20, ...}}, ...]
```

## 3. Specifying Model, Tokenizer, and Device

```python
# Explicit model + device (GPU: device=0, CPU: device=-1)
classifier = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english",
    tokenizer="distilbert-base-uncased-finetuned-sst-2-english",
    device=0,
)
```

## 4. Batch Processing

```python
texts = ["Great product!", "Terrible service.", "It was okay, nothing special."]
results = classifier(texts, batch_size=8)
for text, result in zip(texts, results):
    print(f"{text} -> {result['label']} ({result['score']:.2f})")
```

## 5. Under the Hood — What `pipeline()` Actually Does

```python
# This is roughly what pipeline("sentiment-analysis") does internally:
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased-finetuned-sst-2-english")
model = AutoModelForSequenceClassification.from_pretrained("distilbert-base-uncased-finetuned-sst-2-english")

inputs = tokenizer("I love this!", return_tensors="pt")
with torch.no_grad():
    outputs = model(**inputs)
probs = torch.softmax(outputs.logits, dim=-1)
label = model.config.id2label[torch.argmax(probs).item()]
```

Understanding this is useful for interviews — pipelines are a convenience wrapper, not new functionality.

## 6. Custom Pipelines

```python
from transformers import Pipeline

class MyCustomPipeline(Pipeline):
    def _sanitize_parameters(self, **kwargs):
        return {}, {}, {}

    def preprocess(self, inputs):
        return self.tokenizer(inputs, return_tensors="pt")

    def _forward(self, model_inputs):
        return self.model(**model_inputs)

    def postprocess(self, model_outputs):
        return model_outputs.logits.softmax(-1).tolist()
```

## 7. Using Pipelines in a Production API (FastAPI Example)

```python
from fastapi import FastAPI
from transformers import pipeline
from pydantic import BaseModel

app = FastAPI()
classifier = pipeline("sentiment-analysis", device=0)  # load once at startup

class TextInput(BaseModel):
    text: str

@app.post("/predict")
def predict(input: TextInput):
    result = classifier(input.text)[0]
    return {"label": result["label"], "score": result["score"]}
```

Key production tip: load the pipeline **once at startup**, not per-request — model loading is expensive.

## 8. Pipeline Performance Considerations

```python
# Use a smaller/distilled model for latency-sensitive production use
classifier = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
# vs. a much larger BERT-large model for offline/batch accuracy-critical tasks
```

```python
# Use half-precision on GPU for faster inference
import torch
generator = pipeline("text-generation", model="gpt2", torch_dtype=torch.float16, device=0)
```

## 9. Summary Table of Common Pipeline Tasks

| Task String                    | Use Case                                |
| ------------------------------ | --------------------------------------- |
| `sentiment-analysis`           | Classify text sentiment                 |
| `ner`                          | Extract named entities                  |
| `question-answering`           | Extractive QA from context              |
| `summarization`                | Condense long text                      |
| `text-generation`              | Generate text continuations             |
| `translation_xx_to_yy`         | Machine translation                     |
| `zero-shot-classification`     | Classify without task-specific training |
| `fill-mask`                    | Predict masked tokens                   |
| `feature-extraction`           | Get embeddings/hidden states            |
| `image-classification`         | Classify images                         |
| `automatic-speech-recognition` | Transcribe audio                        |
| `object-detection`             | Detect objects with bounding boxes      |

## 10. Best Practices

1. Use pipelines for quick prototyping and simple production use cases; drop to manual model/tokenizer code when you need fine control (custom pre/post-processing, streaming, batching logic).
2. Always specify the `model` explicitly in production — the default model for a task can change between library versions.
3. Load pipelines once (at app startup), never per-request.
4. Use `device=0` (GPU) when available; CPU inference is fine for low-traffic/dev use.
5. Batch inputs together when processing many items for better throughput.
6. Use quantized/distilled models for latency-sensitive production deployments.
