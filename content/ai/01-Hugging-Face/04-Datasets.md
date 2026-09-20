# Hugging Face — Datasets

## 1. What is the `datasets` Library?

`datasets` is Hugging Face's library for accessing and processing datasets efficiently — providing fast, memory-mapped access to thousands of ready-to-use datasets on the Hub, plus tools for loading your own data.

```bash
pip install datasets
```

## 2. Loading a Dataset from the Hub

```python
from datasets import load_dataset

dataset = load_dataset("imdb")
print(dataset)
# DatasetDict({
#     train: Dataset({ features: ['text', 'label'], num_rows: 25000 }),
#     test:  Dataset({ features: ['text', 'label'], num_rows: 25000 }),
#     unsupervised: Dataset({ features: ['text', 'label'], num_rows: 50000 })
# })

print(dataset["train"][0])
# {'text': 'I rented this movie...', 'label': 0}
```

### Loading a Specific Split or Config

```python
train_only = load_dataset("imdb", split="train")
subset = load_dataset("imdb", split="train[:1000]")  # first 1000 examples

# Some datasets have multiple configurations
glue_sst2 = load_dataset("glue", "sst2")
```

## 3. Loading Your Own Data

```python
# From CSV/JSON/text files
dataset = load_dataset("csv", data_files="my_data.csv")
dataset = load_dataset("json", data_files="my_data.jsonl")
dataset = load_dataset("text", data_files="my_data.txt")

# From a pandas DataFrame
from datasets import Dataset
import pandas as pd

df = pd.DataFrame({"text": ["hello", "world"], "label": [0, 1]})
dataset = Dataset.from_pandas(df)

# From a Python dict/list
dataset = Dataset.from_dict({"text": ["a", "b"], "label": [0, 1]})
```

## 4. Dataset Structure & Inspection

```python
dataset["train"].features
# {'text': Value(dtype='string'), 'label': ClassLabel(names=['neg', 'pos'])}

dataset["train"].num_rows      # 25000
dataset["train"].column_names  # ['text', 'label']
dataset["train"][:5]           # first 5 rows (dict of lists)
dataset["train"]["label"][:10] # first 10 labels only
```

## 5. Processing Datasets

### `map()` — Apply a Function to Every Example

```python
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

def tokenize_fn(examples):
    return tokenizer(examples["text"], truncation=True, padding="max_length")

tokenized_dataset = dataset.map(tokenize_fn, batched=True)  # batched=True is much faster
```

### `filter()` — Keep Only Matching Examples

```python
short_texts = dataset["train"].filter(lambda x: len(x["text"]) < 200)
```

### `remove_columns()` / `rename_column()`

```python
tokenized_dataset = tokenized_dataset.remove_columns(["text"])
tokenized_dataset = tokenized_dataset.rename_column("label", "labels")  # required name for Trainer
```

### `train_test_split()`

```python
split = dataset["train"].train_test_split(test_size=0.2, seed=42)
train_ds, val_ds = split["train"], split["test"]
```

### `shuffle()` and `select()`

```python
shuffled = dataset["train"].shuffle(seed=42)
small_subset = shuffled.select(range(1000))  # first 1000 of shuffled data
```

### `sort()`

```python
sorted_ds = dataset["train"].sort("label")
```

## 6. Memory Efficiency — Why `datasets` Scales Well

`datasets` uses **Apache Arrow** as its backend, which memory-maps data from disk instead of loading everything into RAM. This means you can work with datasets far larger than your available memory.

```python
# Streaming mode - don't even download the full dataset, iterate lazily
streamed_dataset = load_dataset("c4", "en", split="train", streaming=True)

for example in streamed_dataset.take(5):
    print(example)
```

## 7. Setting Output Format (for PyTorch/TensorFlow)

```python
tokenized_dataset.set_format(
    type="torch",
    columns=["input_ids", "attention_mask", "labels"],
)

# Now indexing returns PyTorch tensors directly
tokenized_dataset[0]  # {'input_ids': tensor([...]), 'attention_mask': tensor([...]), ...}
```

```python
from torch.utils.data import DataLoader
train_loader = DataLoader(tokenized_dataset, batch_size=16, shuffle=True)
```

## 8. Data Collation (Dynamic Padding)

Instead of padding all sequences to a fixed `max_length` (wasteful), pad dynamically per-batch to the longest sequence in that batch.

```python
from transformers import DataCollatorWithPadding

data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

train_loader = DataLoader(
    tokenized_dataset, batch_size=16, shuffle=True, collate_fn=data_collator
)
```

## 9. Metrics with the `evaluate` Library

```python
import evaluate

accuracy = evaluate.load("accuracy")
f1 = evaluate.load("f1")

predictions = [0, 1, 1, 0]
references = [0, 1, 0, 0]

print(accuracy.compute(predictions=predictions, references=references))  # {'accuracy': 0.75}
print(f1.compute(predictions=predictions, references=references))        # {'f1': 0.666...}
```

## 10. Uploading a Custom Dataset to the Hub

```python
dataset.push_to_hub("my-username/my-custom-dataset")
```

```bash
huggingface-cli login
```

## 11. Dataset Viewer & Exploration

The Hub provides a built-in dataset viewer (no code needed) at `huggingface.co/datasets/<name>` for browsing rows, filtering, and checking dataset statistics before committing to download it.

## 12. Common Dataset Categories

| Category            | Examples                  |
| ------------------- | ------------------------- |
| Text classification | IMDB, SST-2, AG News      |
| Question answering  | SQuAD, Natural Questions  |
| Translation         | WMT, OPUS                 |
| Summarization       | CNN/DailyMail, XSum       |
| Image               | ImageNet, COCO, CIFAR-10  |
| Audio               | Common Voice, LibriSpeech |
| Multimodal          | LAION, COCO Captions      |

## 13. Best Practices

1. Use `batched=True` with `.map()` for significantly faster preprocessing.
2. Use `streaming=True` for datasets too large to fit on disk/RAM.
3. Rename the label column to `labels` (exact name) when using the `Trainer` API.
4. Use dynamic padding (`DataCollatorWithPadding`) instead of fixed `max_length` padding to save compute.
5. Always inspect a few samples (`dataset[0]`, `.features`) before writing preprocessing code — data format assumptions are a common bug source.
6. Use `train_test_split` with a fixed `seed` for reproducibility.
