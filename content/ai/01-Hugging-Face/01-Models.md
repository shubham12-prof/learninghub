# Hugging Face — Models

## 1. What is the Hugging Face Model Hub?

The Hugging Face Hub (huggingface.co/models) is a repository of 500,000+ pre-trained machine learning models — covering NLP, computer vision, audio, and multimodal tasks — that can be downloaded and used directly, or fine-tuned for custom tasks. Think of it as "GitHub for ML models."

```
[Hugging Face Hub] --download--> [Your Application]
   ├── Model weights (.bin / .safetensors)
   ├── Config (config.json)
   ├── Tokenizer files
   └── Model card (README.md with usage, license, benchmarks)
```

## 2. Anatomy of a Model Repository

```
bert-base-uncased/
├── config.json          # architecture hyperparameters
├── pytorch_model.bin     # (or model.safetensors) weights
├── tokenizer.json
├── tokenizer_config.json
├── vocab.txt
└── README.md             # model card: usage, license, training data, limitations
```

### `config.json` Example

```json
{
  "architectures": ["BertForMaskedLM"],
  "hidden_size": 768,
  "num_hidden_layers": 12,
  "num_attention_heads": 12,
  "vocab_size": 30522
}
```

## 3. Loading a Model

### Basic Loading (PyTorch)

```python
from transformers import AutoModel, AutoTokenizer

model_name = "bert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)
```

### Task-Specific Model Classes

```python
from transformers import (
    AutoModelForSequenceClassification,
    AutoModelForCausalLM,
    AutoModelForQuestionAnswering,
    AutoModelForTokenClassification,
)

classifier_model = AutoModelForSequenceClassification.from_pretrained(
    "distilbert-base-uncased-finetuned-sst-2-english"
)
llm = AutoModelForCausalLM.from_pretrained("gpt2")
qa_model = AutoModelForQuestionAnswering.from_pretrained("deepset/roberta-base-squad2")
```

The `Auto*` classes inspect `config.json`'s `architectures` field and automatically instantiate the correct underlying model class — you don't need to know if it's BERT, RoBERTa, DistilBERT, etc.

## 4. Model Cards

Every model repo has a **model card** (README.md) with structured metadata:

```yaml
---
license: apache-2.0
language: en
datasets:
  - squad
metrics:
  - f1
  - exact_match
tags:
  - question-answering
---
```

Model cards should document: intended use, training data, known limitations/biases, evaluation results, and license — critical for responsible model selection.

## 5. Loading Models in Different Formats/Frameworks

### PyTorch vs TensorFlow vs JAX/Flax

```python
from transformers import TFAutoModel, FlaxAutoModel

pt_model = AutoModel.from_pretrained("bert-base-uncased")          # PyTorch
tf_model = TFAutoModel.from_pretrained("bert-base-uncased")        # TensorFlow
flax_model = FlaxAutoModel.from_pretrained("bert-base-uncased")    # JAX/Flax
```

### Safetensors (Preferred Modern Format)

```python
model = AutoModel.from_pretrained("bert-base-uncased", use_safetensors=True)
```

`.safetensors` is preferred over legacy `.bin` (pickle) files because it's faster to load and immune to arbitrary code execution vulnerabilities that pickle deserialization can carry.

## 6. Quantization (Reducing Model Size/Memory)

```python
from transformers import AutoModelForCausalLM, BitsAndBytesConfig
import torch

quant_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
)

model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-7b-hf",
    quantization_config=quant_config,
    device_map="auto",
)
```

Quantization (converting weights from 32-bit/16-bit floats to 8-bit/4-bit integers) drastically reduces memory footprint and speeds up inference, at a small accuracy cost — makes running large models on consumer GPUs feasible.

## 7. Fine-Tuning a Pre-Trained Model

```python
from transformers import AutoModelForSequenceClassification, TrainingArguments, Trainer

model = AutoModelForSequenceClassification.from_pretrained(
    "distilbert-base-uncased", num_labels=2
)

training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=16,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    learning_rate=2e-5,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
)

trainer.train()
```

## 8. Parameter-Efficient Fine-Tuning (PEFT / LoRA)

Instead of fine-tuning all model weights (expensive), LoRA freezes the base model and trains small low-rank adapter matrices.

```python
from peft import LoraConfig, get_peft_model

lora_config = LoraConfig(
    r=8,
    lora_alpha=16,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    task_type="CAUSAL_LM",
)

model = get_peft_model(base_model, lora_config)
model.print_trainable_parameters()
# trainable params: 4,194,304 || all params: 6,738,415,616 || trainable%: 0.06%
```

## 9. Pushing a Model to the Hub

```python
model.push_to_hub("my-username/my-finetuned-model")
tokenizer.push_to_hub("my-username/my-finetuned-model")
```

```bash
huggingface-cli login
```

## 10. Model Categories on the Hub

| Category              | Example Models                           |
| --------------------- | ---------------------------------------- |
| NLP (text)            | BERT, RoBERTa, GPT-2, T5, Llama, Mistral |
| Computer Vision       | ViT, ResNet, YOLOS, Detectron2           |
| Audio                 | Whisper, Wav2Vec2, MusicGen              |
| Multimodal            | CLIP, BLIP, LLaVA                        |
| Diffusion / Image Gen | Stable Diffusion, DALL-E variants        |

## 11. Choosing the Right Model — Key Filters on the Hub

- **Task** (text classification, translation, summarization, etc.)
- **Library** (Transformers, Diffusers, Timm, etc.)
- **License** (Apache-2.0, MIT, gated/custom license, non-commercial)
- **Model size** (parameter count — affects memory/latency)
- **Downloads/Likes** (community adoption signal, not a quality guarantee)

## 12. Best Practices

1. Always read the model card for license, intended use, and known limitations before deploying.
2. Prefer `.safetensors` over `.bin` for security and load speed.
3. Use quantization (4-bit/8-bit) when deploying large models on limited hardware.
4. Use LoRA/PEFT instead of full fine-tuning when compute is limited — far cheaper, comparable results for many tasks.
5. Pin a specific model revision/commit hash in production to avoid unexpected changes when the hub repo updates.
6. Check the license carefully — many "open" models restrict commercial use or require attribution.
