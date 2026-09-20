# Hugging Face — Transformers (Library)

## 1. What is the `transformers` Library?

`transformers` is Hugging Face's open-source Python library providing a unified API to load, run, train, and fine-tune Transformer-based models (BERT, GPT, T5, Llama, etc.) across PyTorch, TensorFlow, and JAX.

```bash
pip install transformers
```

## 2. The Transformer Architecture (Brief Recap)

```
Input Text -> Tokenizer -> Token IDs -> Embedding Layer
                                              |
                                    Positional Encoding added
                                              |
                              ┌───────────────────────────────┐
                              │   Transformer Encoder/Decoder   │
                              │   (Self-Attention + FFN layers) │
                              │   x N layers                    │
                              └───────────────────────────────┘
                                              |
                                    Output (logits, embeddings, etc.)
```

- **Encoder-only** (BERT, RoBERTa): understanding tasks — classification, NER, embeddings.
- **Decoder-only** (GPT, Llama, Mistral): generative tasks — text generation, chat.
- **Encoder-Decoder** (T5, BART): sequence-to-sequence — translation, summarization.

## 3. Tokenizers

Tokenizers convert raw text into numerical IDs the model understands.

```python
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

encoded = tokenizer("Hello, how are you?", return_tensors="pt")
print(encoded)
# {'input_ids': tensor([[101, 7592, 1010, 2129, 2024, 2017, 1029, 102]]),
#  'attention_mask': tensor([[1, 1, 1, 1, 1, 1, 1, 1]])}

decoded = tokenizer.decode(encoded["input_ids"][0])
print(decoded)  # "[CLS] hello, how are you? [SEP]"
```

### Tokenizer Concepts

```python
tokenizer.tokenize("unbelievable")
# ['un', '##believ', '##able']  <- subword tokenization (WordPiece for BERT)

tokenizer.pad_token       # padding token, e.g. [PAD]
tokenizer.cls_token       # classification token, e.g. [CLS]
tokenizer.sep_token       # separator token, e.g. [SEP]
tokenizer.eos_token       # end-of-sequence token (GPT-style models)
```

### Batch Tokenization with Padding & Truncation

```python
batch = tokenizer(
    ["Short text.", "This is a much longer piece of text that needs truncation handling."],
    padding=True,        # pad shorter sequences to match the longest
    truncation=True,     # cut off sequences longer than max_length
    max_length=16,
    return_tensors="pt",
)
```

## 4. Running Inference with a Model

```python
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

model_name = "distilbert-base-uncased-finetuned-sst-2-english"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

inputs = tokenizer("I love this movie!", return_tensors="pt")

with torch.no_grad():
    outputs = model(**inputs)

logits = outputs.logits
probs = torch.softmax(logits, dim=-1)
predicted_class = torch.argmax(probs).item()
print(model.config.id2label[predicted_class])  # 'POSITIVE'
```

## 5. Text Generation (Decoder Models)

```python
from transformers import AutoTokenizer, AutoModelForCausalLM

tokenizer = AutoTokenizer.from_pretrained("gpt2")
model = AutoModelForCausalLM.from_pretrained("gpt2")

inputs = tokenizer("The future of AI is", return_tensors="pt")
outputs = model.generate(
    **inputs,
    max_new_tokens=50,
    do_sample=True,
    temperature=0.7,
    top_p=0.9,
    top_k=50,
    no_repeat_ngram_size=2,
)

print(tokenizer.decode(outputs[0], skip_special_tokens=True))
```

### Key Generation Parameters

| Parameter            | Meaning                                                                        |
| -------------------- | ------------------------------------------------------------------------------ |
| `max_new_tokens`     | Cap on how many new tokens to generate                                         |
| `temperature`        | Randomness: lower = more deterministic, higher = more creative                 |
| `top_p`              | Nucleus sampling: sample from smallest set of tokens whose cumulative prob ≥ p |
| `top_k`              | Only sample from the top-k most likely next tokens                             |
| `do_sample`          | `True` = sampling (varied output), `False` = greedy/deterministic              |
| `num_beams`          | Beam search width (higher = more thorough but slower search)                   |
| `repetition_penalty` | Penalizes repeated tokens to reduce loops                                      |

## 6. The `Trainer` API for Fine-Tuning

```python
from transformers import Trainer, TrainingArguments, AutoModelForSequenceClassification
from datasets import load_dataset
import evaluate
import numpy as np

dataset = load_dataset("imdb")
model = AutoModelForSequenceClassification.from_pretrained("distilbert-base-uncased", num_labels=2)

def tokenize_fn(examples):
    return tokenizer(examples["text"], truncation=True, padding="max_length")

tokenized = dataset.map(tokenize_fn, batched=True)

accuracy = evaluate.load("accuracy")
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    return accuracy.compute(predictions=preds, references=labels)

training_args = TrainingArguments(
    output_dir="./results",
    evaluation_strategy="epoch",
    per_device_train_batch_size=8,
    num_train_epochs=3,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized["train"],
    eval_dataset=tokenized["test"],
    compute_metrics=compute_metrics,
)
trainer.train()
```

## 7. Custom Training Loop (Without `Trainer`)

```python
from torch.utils.data import DataLoader
from torch.optim import AdamW

train_loader = DataLoader(tokenized["train"], batch_size=8, shuffle=True)
optimizer = AdamW(model.parameters(), lr=5e-5)

model.train()
for epoch in range(3):
    for batch in train_loader:
        optimizer.zero_grad()
        outputs = model(**batch)
        loss = outputs.loss
        loss.backward()
        optimizer.step()
```

## 8. Attention Mechanism (Conceptual)

```
Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) * V

Q (Query)  - "what am I looking for?"
K (Key)    - "what do I contain?"
V (Value)  - "what information do I carry?"

Self-attention lets every token attend to every other token in the sequence,
capturing long-range dependencies that RNNs struggled with.
```

## 9. Multi-Head Attention & Layers

```python
from transformers import AutoConfig

config = AutoConfig.from_pretrained("bert-base-uncased")
print(config.num_attention_heads)  # 12
print(config.num_hidden_layers)    # 12
print(config.hidden_size)          # 768
```

Multiple attention "heads" let the model attend to different types of relationships in parallel (e.g., syntactic vs semantic patterns), then their outputs are concatenated and projected back to the model's hidden dimension.

## 10. Device Placement / GPU Usage

```python
import torch

device = "cuda" if torch.cuda.is_available() else "cpu"
model = model.to(device)
inputs = {k: v.to(device) for k, v in inputs.items()}

# Or automatically split across available devices for large models
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-2-7b-hf", device_map="auto")
```

## 11. Common Pitfalls

1. Forgetting `torch.no_grad()` during inference — wastes memory tracking gradients unnecessarily.
2. Mismatched tokenizer/model pairs — always load the tokenizer that matches the model checkpoint.
3. Not setting `padding`/`truncation` consistently, causing shape mismatches in batches.
4. Ignoring `attention_mask` — padded tokens must be masked out or they'll affect attention computation.

## 12. Best Practices

1. Always use `AutoTokenizer`/`AutoModel` classes for portability across model checkpoints.
2. Wrap inference in `torch.no_grad()` (or `model.eval()`) to save memory and disable dropout.
3. Use the `Trainer` API for standard fine-tuning workflows; drop to a custom loop only when you need fine-grained control.
4. Tune generation parameters (`temperature`, `top_p`, `top_k`) based on whether you want deterministic or creative output.
5. Use `device_map="auto"` with `accelerate` for large models that don't fit on a single GPU.
