# OpenAI APIs — Audio APIs

> Note: check current docs for the latest model names (Whisper successors, TTS model variants) as these evolve.

## 1. Overview of Audio Capabilities

OpenAI's audio APIs cover three main directions:

```
Speech -> Text   : Transcription (Whisper-based models)
Text -> Speech   : Text-to-Speech (TTS)
Speech -> Speech : Realtime voice-to-voice conversation (Realtime API)
```

## 2. Speech-to-Text (Transcription)

```python
from openai import OpenAI
client = OpenAI()

audio_file = open("meeting_recording.mp3", "rb")

transcript = client.audio.transcriptions.create(
    model="whisper-1",  # or current transcription model per docs
    file=audio_file,
)

print(transcript.text)
```

### Response Formats

```python
transcript = client.audio.transcriptions.create(
    model="whisper-1",
    file=audio_file,
    response_format="verbose_json",  # includes timestamps, segments
)

for segment in transcript.segments:
    print(f"[{segment.start:.1f}s - {segment.end:.1f}s] {segment.text}")
```

| `response_format` | Output                                                            |
| ----------------- | ----------------------------------------------------------------- |
| `json`            | Simple `{ "text": "..." }`                                        |
| `text`            | Plain text string                                                 |
| `srt`             | Subtitle format with timestamps                                   |
| `vtt`             | WebVTT subtitle format                                            |
| `verbose_json`    | Full detail: segments, timestamps, language detection, confidence |

### Language & Prompt Hints

```python
transcript = client.audio.transcriptions.create(
    model="whisper-1",
    file=audio_file,
    language="en",              # hint the expected language (improves accuracy/speed)
    prompt="Technical terms: Kubernetes, PostgreSQL, gRPC",  # improve recognition of jargon/names
)
```

### Translation (Any Language -> English)

```python
translation = client.audio.translations.create(
    model="whisper-1",
    file=open("spanish_audio.mp3", "rb"),
)
print(translation.text)  # English translation of the spoken Spanish audio
```

## 3. Text-to-Speech (TTS)

```python
response = client.audio.speech.create(
    model="tts-1",  # or "tts-1-hd" for higher quality, per current docs
    voice="alloy",
    input="Hello! Welcome to our customer support line. How can I help you today?",
)

response.stream_to_file("output.mp3")
```

### Available Voices (General Examples — Check Current List)

```
alloy, echo, fable, onyx, nova, shimmer  (illustrative; check docs for the current voice roster)
```

### Streaming TTS Audio

```python
with client.audio.speech.with_streaming_response.create(
    model="tts-1",
    voice="nova",
    input="This is a streaming text to speech example.",
) as response:
    response.stream_to_file("streamed_output.mp3")
```

### Controlling Speed

```python
response = client.audio.speech.create(
    model="tts-1",
    voice="alloy",
    input="This will play back more slowly.",
    speed=0.75,  # 0.25 - 4.0 range typically
)
```

## 4. Practical Use Case: Voice Memo Transcription + Summarization Pipeline

```python
def transcribe_and_summarize(audio_path):
    audio_file = open(audio_path, "rb")
    transcript = client.audio.transcriptions.create(model="whisper-1", file=audio_file)

    summary_response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Summarize the following meeting transcript in 3 bullet points."},
            {"role": "user", "content": transcript.text},
        ],
    )
    return {
        "transcript": transcript.text,
        "summary": summary_response.choices[0].message.content,
    }

result = transcribe_and_summarize("meeting.mp3")
print(result["summary"])
```

## 5. Voice Assistant Pipeline (STT -> LLM -> TTS)

```python
def voice_assistant(audio_input_path):
    # 1. Speech to text
    transcript = client.audio.transcriptions.create(
        model="whisper-1", file=open(audio_input_path, "rb")
    )

    # 2. Generate a response
    chat_response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": transcript.text}],
    )
    reply_text = chat_response.choices[0].message.content

    # 3. Text to speech
    speech_response = client.audio.speech.create(
        model="tts-1", voice="nova", input=reply_text
    )
    speech_response.stream_to_file("assistant_reply.mp3")

    return reply_text
```

This three-step chained pipeline (STT → chat → TTS) works but adds latency at each hop; for real-time voice conversation, OpenAI's **Realtime API** (a WebSocket-based, low-latency speech-to-speech interface) is purpose-built to avoid this round-trip overhead.

## 6. Realtime API (Conceptual Overview)

```
Traditional pipeline: Audio -> [STT] -> Text -> [LLM] -> Text -> [TTS] -> Audio
                       (multiple round trips, higher latency)

Realtime API: Audio stream <-> [Single realtime model] <-> Audio stream
              (WebSocket connection, streaming both directions, much lower latency)
```

```python
# Conceptual - actual implementation uses WebSocket events; check current docs for exact API
import websockets
import asyncio

async def realtime_session():
    async with websockets.connect(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
        extra_headers={"Authorization": f"Bearer {API_KEY}"},
    ) as ws:
        # Send/receive streaming audio events per the Realtime API's event protocol
        pass
```

Used for voice assistants, live customer support bots, and interactive voice applications where natural, low-latency back-and-forth conversation matters.

## 7. Supported Audio File Formats (General Guidance)

Common input formats: mp3, mp4, mpeg, mpga, m4a, wav, webm. There are file size limits (check current docs) — very long recordings may need to be chunked before transcription.

```python
# Example: chunking a long audio file before transcription
from pydub import AudioSegment

audio = AudioSegment.from_file("long_recording.mp3")
chunk_length_ms = 10 * 60 * 1000  # 10 minutes
chunks = [audio[i:i + chunk_length_ms] for i in range(0, len(audio), chunk_length_ms)]

full_transcript = ""
for i, chunk in enumerate(chunks):
    chunk.export(f"chunk_{i}.mp3", format="mp3")
    result = client.audio.transcriptions.create(model="whisper-1", file=open(f"chunk_{i}.mp3", "rb"))
    full_transcript += result.text + " "
```

## 8. Best Practices

1. Provide a `language` hint and domain-specific `prompt` context to improve transcription accuracy for jargon, names, and accents.
2. Use `verbose_json` when you need timestamps (e.g., generating subtitles or syncing text with audio playback).
3. Chunk very long audio files before transcription if they approach size/duration limits.
4. Use the Realtime API instead of chaining STT→LLM→TTS when you need natural, low-latency voice conversation.
5. Cache/store generated TTS audio if the same text will be spoken repeatedly (e.g., common phrases/prompts), rather than regenerating every time.
6. Handle transcription/generation failures gracefully (e.g., corrupted audio, unsupported format) with clear error messaging.
