# Hugging Face — Interview Questions & Answers

## Models

**Q1. What is the Hugging Face Model Hub?**
It's a repository (like "GitHub for ML models") hosting 500,000+ pre-trained models across NLP, vision, audio, and multimodal tasks, each with weights, config, tokenizer files, and a model card describing usage, training data, and license.

**Q2. What do the `Auto*` classes (e.g., `AutoModel`, `AutoTokenizer`) do?**
They inspect a model repository's `config.json` (specifically the `architectures` field) and automatically instantiate the correct underlying model/tokenizer class, so you can load any compatible checkpoint without knowing in advance whether it's BERT, RoBERTa, GPT-2, etc.

**Q3. Why is `.safetensors` preferred over the legacy `.bin` (pickle) format?**
`.safetensors` loads faster and, critically, is immune to the arbitrary code execution risk that Python's `pickle` deserialization carries — loading an untrusted `.bin` file can execute malicious code, while `.safetensors` only stores tensor data, not executable objects.

**Q4. What is model quantization and why is it used?**
Quantization converts model weights from higher precision (e.g., 32-bit or 16-bit floats) to lower precision (8-bit or 4-bit integers), significantly reducing memory footprint and often speeding up inference, at a small (usually acceptable) cost to accuracy — this makes it feasible to run large models on consumer-grade GPUs.

**Q5. What is LoRA and why would you use it instead of full fine-tuning?**
LoRA (Low-Rank Adaptation) freezes the pre-trained model's weights and injects small trainable low-rank matrices into specific layers (commonly attention projections). This reduces the number of trainable parameters by orders of magnitude (often <1% of the full model), dramatically cutting compute/memory requirements for fine-tuning while achieving comparable results to full fine-tuning for many tasks.

## Transformers (Library & Architecture)

**Q6. What's the difference between encoder-only, decoder-only, and encoder-decoder Transformer architectures?**
Encoder-only models (BERT, RoBERTa) process the full input bidirectionally and excel at understanding tasks like classification and NER. Decoder-only models (GPT, Llama) generate text autoregressively, attending only to previous tokens, suited for generative tasks. Encoder-decoder models (T5, BART) first encode the full input, then decode an output sequence conditioned on it, suited for sequence-to-sequence tasks like translation and summarization.

**Q7. Explain self-attention in simple terms.**
Self-attention lets every token in a sequence "look at" every other token and weigh how relevant each one is when building its own representation, using Query, Key, and Value vectors: `Attention(Q,K,V) = softmax(QK^T / sqrt(d_k)) * V`. This lets the model capture long-range dependencies between words regardless of their distance in the sequence, which was a major limitation of RNNs.

**Q8. Why do multi-head attention mechanisms use multiple heads instead of one large attention computation?**
Multiple heads let the model attend to different types of relationships in parallel (e.g., one head might capture syntactic dependencies, another semantic similarity), and their outputs are concatenated and projected back to the model's hidden dimension — giving the model a richer, more expressive representation than a single attention computation could.

**Q9. What is subword tokenization, and why do models like BERT use it instead of word-level tokenization?**
Subword tokenization (e.g., WordPiece, BPE) breaks rare/unknown words into smaller known subword units (e.g., "unbelievable" → "un", "##believ", "##able") instead of treating each unique word as a single token. This keeps vocabulary size manageable while still being able to represent virtually any word, avoiding the out-of-vocabulary problem that pure word-level tokenization has.

**Q10. What does the `attention_mask` do, and why is it important during batching?**
When batching sequences of different lengths, shorter sequences are padded to match the longest one. The `attention_mask` tells the model which tokens are real (1) vs padding (0), so padding tokens are excluded from the attention computation and don't distort the model's understanding of the actual content.

**Q11. What's the difference between greedy decoding, beam search, and sampling in text generation?**
Greedy decoding always picks the single highest-probability next token (fast but can produce repetitive/suboptimal text). Beam search keeps track of the top-k most likely sequences at each step (`num_beams`), exploring more possibilities before committing, generally producing higher-quality but more deterministic and computationally expensive output. Sampling (`do_sample=True`, with `temperature`/`top_p`/`top_k`) introduces randomness for more varied, creative output at the cost of some coherence/predictability.

## Pipelines

**Q12. What is the `pipeline()` function and why would you use it over loading a model manually?**
It's a high-level wrapper that bundles tokenizer, model, and pre/post-processing logic for a given task into a single callable, letting you go from raw input to human-readable output in one line — ideal for prototyping and simple production use cases where you don't need fine-grained control over the inference process.

**Q13. In a production API, why should you load a pipeline once at startup instead of per-request?**
Loading a model (downloading/reading weights into memory, initializing the tokenizer) is an expensive operation. Doing it on every request would add significant latency and resource overhead to each API call; loading once at startup and reusing the pipeline object across requests avoids this repeated cost.

**Q14. What does `zero-shot-classification` allow you to do that standard classification pipelines don't?**
It lets you classify text into arbitrary, user-defined candidate labels at inference time, without needing a model fine-tuned specifically for those labels — internally it reformulates the task as a natural language inference problem (does the text entail each candidate label as a hypothesis), using a general-purpose NLI model like BART-MNLI.

**Q15. When would you NOT use a high-level pipeline?**
When you need custom pre/post-processing logic, fine-grained control over batching/streaming behavior, access to intermediate model outputs (e.g., hidden states, attention weights), or when performance-critical production code benefits from manually managing tokenization and inference steps rather than the pipeline's more generic handling.

## Datasets

**Q16. Why does the `datasets` library scale to datasets larger than available RAM?**
It uses Apache Arrow as its backend, which memory-maps data from disk rather than loading the entire dataset into RAM — data is only read into memory as needed, letting you work with datasets far larger than your machine's memory. For extremely large datasets, `streaming=True` avoids even downloading the full dataset, iterating lazily instead.

**Q17. Why should you use `batched=True` with `.map()`?**
Processing examples one at a time in Python is slow due to interpreter overhead; `batched=True` passes chunks of examples to your function at once, allowing vectorized operations (e.g., batch tokenization) that run significantly faster than per-example processing.

**Q18. Why is dynamic padding (via `DataCollatorWithPadding`) preferred over padding every example to a fixed `max_length`?**
Padding every example in the entire dataset to a single global `max_length` wastes computation on padding tokens that get masked out anyway. Dynamic padding pads each batch only to the length of its longest sequence, minimizing wasted compute across batches with naturally varying lengths.

**Q19. Why does the `Trainer` API require the label column to be named `labels`?**
The `Trainer`'s internal training loop and most model `forward()` methods expect a specifically-named `labels` argument to compute the loss automatically; if your dataset's label column has a different name (e.g., `label`), you need to rename it so the `Trainer` can correctly pass it through to the model.

## Inference API

**Q20. What's the difference between the Serverless Inference API and Inference Endpoints?**
The Serverless Inference API runs on shared infrastructure, is free/low-cost, rate-limited, and best suited for prototyping — models may be "cold" and need to load before responding. Inference Endpoints provision dedicated, autoscaling infrastructure you configure (hardware type, replica count), giving predictable latency and no shared rate limits — suited for production workloads with SLA requirements.

**Q21. What does a `503` error typically mean when calling the Serverless Inference API, and how should a client handle it?**
It usually means the requested model isn't currently loaded on the shared serverless infrastructure ("cold start") and is being loaded; the response often includes an `estimated_time` field. Clients should implement retry logic with a wait period rather than treating it as a hard failure.

**Q22. Why might a company choose to self-host with Text Generation Inference (TGI) instead of using Hugging Face's hosted Inference API?**
Self-hosting gives full control over infrastructure, data residency/compliance (data never leaves your environment), custom hardware/scaling decisions, and can be more cost-effective at very high, sustained traffic volumes — TGI provides production-grade features like continuous batching, tensor parallelism, and quantization support for this purpose.

**Q23. What is streaming in the context of LLM inference APIs, and why is it useful for chat applications?**
Streaming returns generated tokens incrementally as they're produced, rather than waiting for the entire response to finish generating before sending anything back. This dramatically improves perceived latency in chat UIs, since users see text appearing progressively instead of staring at a blank screen until the full (potentially long) response completes.

## Cross-Cutting / Scenario-Based

**Q24. You need to deploy a sentiment classifier for a customer support tool handling thousands of requests per minute. Walk through your approach.**
Choose a small, fast model (e.g., DistilBERT rather than BERT-large) fine-tuned or already trained for sentiment analysis; benchmark latency and consider quantization if using a GPU-constrained environment. For hosting, use dedicated Inference Endpoints or self-hosted TGI/a custom FastAPI service (loading the pipeline once at startup) rather than the rate-limited serverless API, since throughput at that scale needs predictable dedicated resources; add caching for repeated/duplicate inputs if applicable, and monitor latency/error rates in production.

**Q25. How would you fine-tune a pre-trained model on a custom dataset with limited compute (e.g., a single consumer GPU)?**
Use a smaller base model or a quantized version (4-bit/8-bit via `bitsandbytes`), apply LoRA/PEFT to drastically reduce trainable parameters instead of full fine-tuning, use gradient accumulation to simulate larger batch sizes without exceeding memory, and load/process the dataset efficiently with the `datasets` library (batched tokenization, dynamic padding) to avoid unnecessary overhead.

**Q26. What's the difference between using a pipeline for inference vs manually loading model + tokenizer — when does the distinction matter in an interview/production context?**
Functionally, `pipeline()` is a convenience wrapper around the same manual steps (tokenize → model forward pass → post-process); it matters when you need custom logic in any of those steps (e.g., custom post-processing, returning raw logits/embeddings instead of pipeline-formatted output, fine-grained batching control, or accessing intermediate model outputs like attention weights) — in those cases you drop to manual `AutoTokenizer`/`AutoModel` usage.

**Q27. How would you evaluate whether a pre-trained model from the Hub is suitable for your production use case?**
Check the model card for intended use, training data domain (does it match your domain?), known limitations/biases, and license (commercial use allowed?); benchmark it on a held-out sample of your own data for the specific metric that matters to you (accuracy, F1, latency); and consider model size/quantization needs relative to your infrastructure constraints.

**Q28. What's the risk of not pinning a specific model revision in a production deployment that loads from the Hub at runtime?**
If a model repository's `main` branch is updated (new weights, changed config, or even the same name pointing to different behavior), your production service could unexpectedly change behavior on next deploy/restart without any code change on your end. Pinning a specific commit hash/revision (`revision="<commit_sha>"`) ensures reproducible, stable behavior.

**Q29. Explain how you'd build an end-to-end NLP pipeline (from raw data to a deployed API) using the Hugging Face ecosystem.**
Load and preprocess data with `datasets` (tokenization via `batched=True` `.map()`, train/test split), fine-tune a pre-trained model with `Trainer` (or LoRA/PEFT if compute-constrained) and evaluate with the `evaluate` library, push the fine-tuned model to the Hub or save it locally, then serve it via a `pipeline()` wrapped in a production API (FastAPI/Node), loaded once at startup, or deploy it directly as a Hugging Face Inference Endpoint for managed hosting.

**Q30. What are the trade-offs between using the Serverless Inference API, Inference Endpoints, and fully self-hosting a model?**
Serverless API: lowest effort, free/cheap, but rate-limited and subject to cold starts — good for prototyping only. Inference Endpoints: managed dedicated infrastructure with autoscaling, low operational overhead, but you pay for provisioned compute and have less control than full self-hosting. Self-hosting (e.g., with TGI/vLLM on your own infrastructure): maximum control over cost optimization, data residency, and custom scaling/batching strategies, but requires your own DevOps/infrastructure expertise to operate reliably.
