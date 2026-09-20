# OpenAI APIs — Interview Questions & Answers

## Chat Completions

**Q1. Is the Chat Completions API stateful or stateless? What does that mean for your application code?**
It's stateless — every request must include the full conversation history in the `messages` array, since the API doesn't remember previous calls. Your application is responsible for storing and resending the conversation history on each turn (or trimming/summarizing it as it grows to manage token cost).

**Q2. What's the difference between `temperature` and `top_p`?**
Both control randomness in generation, but through different mechanisms: `temperature` scales the probability distribution over tokens (lower = more peaked/deterministic, higher = flatter/more random), while `top_p` (nucleus sampling) restricts sampling to the smallest set of tokens whose cumulative probability reaches `p`. They're generally recommended to be adjusted one at a time rather than both simultaneously, since combining aggressive settings on both can produce unpredictable results.

**Q3. Why would you use streaming (`stream=True`) in a chat application?**
It returns generated tokens incrementally as they're produced instead of waiting for the entire response to complete, dramatically improving perceived latency for user-facing chat interfaces — users see the response appearing progressively rather than a long pause followed by a wall of text.

**Q4. How would you manage growing token costs in a long-running conversation?**
Strategies include: trimming older messages once the conversation exceeds a token budget, periodically summarizing earlier turns into a condensed system/context message, using a smaller/cheaper model for less critical turns, and monitoring `usage` on each response to track cost in real time.

## Responses API

**Q5. What's the main architectural difference between the Responses API and Chat Completions?**
The Responses API can manage conversation state server-side via `previous_response_id`, so you don't need to resend the full message history on every call, and it has native, first-class support for hosted tools (web search, file search, code interpreter) without you having to implement that infrastructure — Chat Completions requires you to manage state manually and implement custom function calling for any tool behavior.

**Q6. Why might a team choose to keep using Chat Completions rather than migrate to the Responses API?**
Chat Completions is a mature, extremely well-established API with broad ecosystem support (many third-party tools, SDKs, and tutorials are built around its message format); if an existing integration works well and doesn't need the Responses API's built-in hosted tools or server-side state management, there's no urgent technical need to migrate.

**Q7. What are "hosted tools" in the Responses API, and how do they differ from custom function calling?**
Hosted tools (web search, file search, code interpreter) are executed by OpenAI's own infrastructure — you just declare you want to use them, and OpenAI handles running the search/retrieval/code execution and returns the result already incorporated. Custom function calling, by contrast, requires you to implement and execute the actual function yourself; the model only decides when to call it and with what arguments.

## Function Calling

**Q8. Walk through the full function-calling request-response loop.**
You send a message along with tool definitions; if the model determines a tool should be called, it returns a `tool_calls` object (function name + JSON arguments) instead of plain text. Your application parses the arguments, executes the actual function, and sends the result back as a `tool` role message appended to the conversation history. You then call the API again with this updated history, and the model produces a final natural-language response incorporating the tool's result.

**Q9. Why is it dangerous to blindly execute whatever function call the model requests?**
The model can hallucinate arguments, misunderstand user intent, or (in adversarial scenarios) be manipulated via prompt injection into requesting harmful actions (e.g., deleting data, sending unauthorized payments). Applications must validate arguments, enforce permission/authorization checks independent of the model's decision, and only allow pre-defined, vetted functions — never let the model execute arbitrary code directly.

**Q10. What's the difference between `tool_choice: "auto"`, `"required"`, and `"none"`?**
`"auto"` lets the model decide whether to call a tool or respond with plain text (default behavior). `"required"` forces it to call some tool rather than reply directly. `"none"` forces a text-only response even if tools are defined, useful when you temporarily want to disable tool use in a given call.

**Q11. How would you design function descriptions to improve the model's tool-selection accuracy?**
Write clear, specific `name` and `description` fields that explain exactly when the function should be used (not just what it does), use `enum` for constrained parameter values instead of open-ended strings, and avoid vague/overlapping function purposes that could confuse the model about which tool applies to a given request.

## Structured Outputs

**Q12. How does Structured Outputs differ from simply prompting the model to "respond in JSON"?**
Prompting alone relies on the model correctly following instructions, which can occasionally produce invalid JSON or deviate from the expected shape. Structured Outputs enforces the schema at the token-generation level via constrained decoding, guaranteeing the response is both valid JSON and matches your exact schema (correct keys, types, required fields) every time.

**Q13. What's the difference between `json_object` mode and `json_schema` (Structured Outputs) mode?**
`json_object` mode only guarantees syntactically valid JSON — you still need to describe and validate the desired structure yourself. `json_schema` mode (Structured Outputs) enforces an exact schema you provide, guaranteeing both valid JSON syntax and conformance to your specified fields/types — a strictly stronger guarantee.

**Q14. Why should you still check for a `refusal` field even when using Structured Outputs?**
Structured Outputs guarantees the _format_ of a response is correct when the model does respond normally, but the model can still refuse to answer entirely for safety reasons (e.g., a disallowed request). The `refusal` field surfaces this case separately from `parsed`/`content`, so your code should check it before assuming valid structured data is present.

**Q15. Give a practical use case where Structured Outputs is combined with function calling.**
When you want to guarantee that a function's generated arguments always exactly match its expected parameter schema — e.g., ensuring a `book_flight(origin, destination, date)` call never has a malformed date string or missing required field — Structured Outputs constrains the argument generation itself to be schema-valid, reducing runtime errors in the function execution step.

## Embeddings

**Q16. What does an embedding vector represent, and how is similarity typically measured?**
It's a numerical vector representation of a piece of text's semantic meaning, positioned such that semantically similar texts have vectors close together in the embedding space. Similarity is typically measured via cosine similarity (or dot product, since OpenAI's embedding models produce normalized vectors where the two are proportional).

**Q17. Describe the basic architecture of a RAG (Retrieval-Augmented Generation) system built with embeddings.**
Documents are chunked into passages, each chunk is embedded and stored in a vector database. At query time, the user's query is embedded and compared against stored chunk embeddings to retrieve the most semantically similar passages, which are then injected into the LLM's prompt as context so the model's answer is grounded in that retrieved information rather than relying solely on its training data.

**Q18. Why is chunking strategy important when building a RAG pipeline?**
Chunks that are too large dilute the specific relevant information with irrelevant surrounding text (reducing retrieval precision and wasting context window), while chunks that are too small can lose necessary context needed to correctly answer a question. Chunking is typically done by logical boundaries (paragraphs, sections) with some overlap between chunks to avoid losing information split across chunk boundaries.

**Q19. What is "hybrid search" and why might you combine it with pure semantic (embedding) search?**
Hybrid search combines semantic/vector similarity search with traditional keyword-based search (e.g., BM25). Pure semantic search can sometimes miss exact matches for specific terms (product SKUs, names, codes) that don't carry strong "semantic meaning" but are still critical exact-match signals — combining both approaches typically improves overall retrieval quality.

## File Search

**Q20. How does OpenAI's File Search tool differ from building your own embeddings-based RAG pipeline?**
File Search is a fully managed retrieval solution — you upload documents and OpenAI handles chunking, embedding, indexing, and retrieval automatically when the tool is invoked. Building your own pipeline (embeddings API + a vector database) gives you full control over chunking strategy, retrieval logic, and infrastructure, at the cost of significantly more implementation and maintenance effort.

**Q21. How would you scope File Search retrieval to only a specific subset of documents (e.g., per-tenant in a multi-tenant app)?**
Use metadata/attributes attached to files when adding them to a vector store (e.g., `{"tenant_id": "acme_corp"}`), then apply a `filters` parameter on the file search tool call to restrict retrieval to only documents matching that tenant's identifier — or alternatively, maintain entirely separate vector stores per tenant for stricter isolation.

**Q22. Why are citations/annotations important when using File Search in a production application?**
They let you show users exactly which source document (and often which passage) supported a given claim in the model's answer, which builds user trust, enables fact-checking against the original source, and helps catch cases where the model may have misrepresented the retrieved content.

## Image Generation

**Q23. What's the difference between the image generation endpoint and the image edit endpoint?**
Generation (`images.generate`) creates a new image entirely from a text prompt. Editing (`images.edit`) takes an existing image plus a mask (indicating which regions should be regenerated) and a prompt describing the desired change, modifying only the masked areas while preserving the rest of the original image (inpainting).

**Q24. What elements typically make an image generation prompt more effective?**
Specifying the subject, setting/environment, artistic style or medium (photorealistic, illustration, 3D render), lighting conditions, composition/framing, and mood/atmosphere generally produces more predictable, higher-quality results than a short, vague prompt.

**Q25. Why should generated image URLs typically not be relied upon as permanent storage?**
Generated image URLs from the API are often temporary/expiring links meant for immediate retrieval; for any application that needs to persist images long-term, you should download and store the image in your own storage (e.g., S3, a CDN) rather than relying on the API's returned URL remaining valid indefinitely.

## Audio APIs

**Q26. What's the difference between the transcription and translation audio endpoints?**
Transcription (`audio.transcriptions`) converts spoken audio into text in the same language as the speech. Translation (`audio.translations`) converts spoken audio in any supported language directly into English text, combining transcription and translation into a single step.

**Q27. When would you use `verbose_json` as the response format for transcription?**
When you need more than just the raw transcript text — `verbose_json` provides segment-level timestamps, language detection, and other metadata, useful for generating subtitles, syncing text display with audio playback, or analyzing speech timing/pacing.

**Q28. Why might a naive STT → LLM → TTS pipeline not be ideal for a real-time voice assistant, and what's the alternative?**
Chaining three separate API calls (speech-to-text, then a chat completion, then text-to-speech) introduces multiple sequential network round trips, adding up to noticeable latency that breaks the natural flow of a live conversation. The Realtime API addresses this with a persistent, bidirectional streaming connection (WebSocket-based) that processes audio in both directions with much lower latency, purpose-built for live voice interaction.

**Q29. How would you handle transcribing a 3-hour audio recording given file size/duration limits?**
Split the audio into smaller chunks (e.g., 10-minute segments) using an audio processing library, transcribe each chunk separately via the transcription endpoint, and concatenate the resulting text — being mindful of chunk boundaries potentially splitting a sentence, which can be mitigated with slight overlap between chunks if precision matters.

## Cross-Cutting / Scenario-Based

**Q30. You're building a customer support chatbot that needs to: answer questions from company documentation, check order status via an internal API, and escalate complex issues to a human. How would you architect this using the OpenAI APIs covered here?**
Use File Search (or a custom embeddings/RAG pipeline) grounded in the company's documentation for general Q&A, define a custom function (via function calling) like `get_order_status(order_id)` that calls your internal order API, and define another function like `escalate_to_human(reason)` that triggers a handoff workflow when the model determines it can't resolve the issue. Use Structured Outputs for the escalation function's arguments to guarantee your escalation system always receives a well-formed reason/summary, and use `tool_choice="auto"` so the model dynamically decides between answering directly, calling a tool, or escalating based on the conversation.
