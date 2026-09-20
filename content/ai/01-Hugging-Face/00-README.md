# 31. Hugging Face

A complete learning guide on the Hugging Face ecosystem, with theory + diagrams + working code examples (Python, REST API, Node.js).

## Contents

1. [Models](./01-Models.md) — Model Hub, `Auto*` classes, model cards, quantization, LoRA/PEFT, fine-tuning
2. [Transformers](./02-Transformers.md) — the `transformers` library, tokenizers, attention mechanism, `Trainer` API, text generation
3. [Pipelines](./03-Pipelines.md) — high-level `pipeline()` API for all major tasks (NLP, vision, audio), production usage
4. [Datasets](./04-Datasets.md) — the `datasets` library, loading/processing data, Apache Arrow backend, streaming, `evaluate`
5. [Inference API](./05-Inference-API.md) — Serverless Inference API, Inference Endpoints, chat completions, self-hosted TGI
6. [Interview Questions](./06-Interview-Questions.md) — 30 Q&A covering all topics above, plus scenario-based questions

## Suggested Study Order

```
Transformers (theory) -> Models -> Datasets -> Pipelines -> Inference API -> Interview Questions
```

Start with the underlying Transformer architecture and library fundamentals, then learn how models and datasets fit into that ecosystem, move up to the high-level pipeline abstraction, and finish with deployment (Inference API) and interview prep.

## Ecosystem Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Hugging Face Hub                          │
│      (Models · Datasets · Spaces · Model Cards)                │
└─────────────────────────────────────────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
 transformers          datasets              huggingface_hub
 (load/train/run          (load/process         (API client,
  models)                   data)                 Inference API)
        │
        ▼
   pipeline()
 (high-level, task-ready API)
```
