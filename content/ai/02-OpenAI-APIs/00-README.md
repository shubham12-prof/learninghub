# 32. OpenAI APIs

A complete learning guide on OpenAI's APIs, with theory + diagrams + working code examples (Python, Node.js, REST/curl).

> **Note:** OpenAI's APIs evolve quickly — model names, parameters, and newer features (like the Responses API) are updated frequently. Always cross-check details against `https://platform.openai.com/docs` before shipping production code.

## Contents

1. [Chat Completions](./01-Chat-Completions.md) — the core conversational endpoint, message roles, streaming, vision input
2. [Responses API](./02-Responses-API.md) — the newer unified API, server-side state, hosted tools, reasoning models
3. [Function Calling](./03-Function-Calling.md) — tool definitions, the request-response loop, agent loops, security
4. [Structured Outputs](./04-Structured-Outputs.md) — schema-enforced JSON generation, Pydantic integration, enums
5. [Embeddings](./05-Embeddings.md) — semantic vectors, similarity search, RAG pipelines, vector databases
6. [File Search](./06-File-Search.md) — OpenAI's managed RAG tool, vector stores, metadata filtering, citations
7. [Image Generation](./07-Image-Generation.md) — text-to-image, editing/inpainting, variations, prompting tips
8. [Audio APIs](./08-Audio-APIs.md) — speech-to-text (Whisper), text-to-speech, translation, Realtime API
9. [Interview Questions](./09-Interview-Questions.md) — 30 Q&A covering all topics above, plus a scenario-based architecture question

## Suggested Study Order

```
Chat Completions -> Function Calling -> Structured Outputs -> Responses API
        -> Embeddings -> File Search -> Image Generation -> Audio APIs -> Interview Questions
```

Start with the foundational conversational API, layer on tool use and reliable structured data, then explore the newer unified Responses API, followed by retrieval (embeddings/file search) and multimodal capabilities (image/audio), finishing with interview prep.

## Quick Reference: Which API for Which Task?

| Goal                                                      | API                               |
| --------------------------------------------------------- | --------------------------------- |
| Basic chatbot / conversational AI                         | Chat Completions or Responses API |
| Let the model take actions in your app                    | Function Calling                  |
| Guarantee reliable JSON output                            | Structured Outputs                |
| Search the web / run code / search your files (managed)   | Responses API hosted tools        |
| Semantic search over your own documents (custom pipeline) | Embeddings                        |
| Q&A over uploaded documents (managed, less setup)         | File Search                       |
| Generate or edit images                                   | Image Generation                  |
| Transcribe or synthesize speech                           | Audio APIs                        |
