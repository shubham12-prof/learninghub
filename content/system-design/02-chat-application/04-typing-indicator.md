# Typing Indicator

## What it is

The "Alice is typing…" signal shown to other members of a conversation
while a user is actively composing a message.

## Why it's architecturally different from a message

This is a good concept to name explicitly in an interview: a typing
indicator is **ephemeral, low-stakes, high-frequency, and not persisted** —
almost the opposite profile of a chat message (durable, ordered,
guaranteed-delivery). Recognizing this and _not_ over-engineering it the
same way as message storage is itself a signal of good judgment.

## How it works

1. As the user types, the client sends a lightweight `typing` event over
   the existing WebSocket connection — typically **debounced/throttled**
   (e.g., at most once every few seconds while actively typing, not on
   every keystroke) to avoid flooding the connection.
2. The server (via the same connection-registry + pub/sub mechanism used
   for messages/presence) forwards this event to the other currently-
   connected members of the conversation.
3. The receiving client shows the "typing…" UI and **starts a local
   timeout** (e.g., 3-5 seconds) — if no further typing event or an
   explicit "stopped typing" event arrives before the timeout, the client
   hides the indicator itself.
4. Optionally, an explicit `stopped_typing` event is sent when the user
   pauses/sends/clears the input, for a snappier "stopped typing" reaction
   than waiting for the client-side timeout.

## Why no persistence / no delivery guarantee is needed

- If a typing event is dropped due to a network blip, the worst outcome is
  a very minor, momentary UI inconsistency (indicator doesn't show, or
  shows a beat late) — not a lost message or a broken conversation history.
  This means it's fine to treat typing events as **fire-and-forget**, with
  no retry, no durable storage, and no delivery guarantee — a deliberate
  and correct simplification, not an oversight.
- Because of this, typing indicators are usually **not** written to the
  database or routed through the same durable message pipeline at all —
  they go through the live pub/sub layer only, and simply have no effect
  if the recipient isn't currently connected (which is fine — you don't
  need to tell someone "they were typing" after the fact).

## Scaling considerations

- The main risk is **event volume**, not durability: a busy group chat
  with many simultaneous typers could generate a lot of small events.
  Client-side debouncing (don't send more than ~1 event per few seconds
  per user) keeps this manageable.
- For very large groups, some products suppress typing indicators
  entirely, or only show "several people are typing" instead of naming
  everyone, to limit both fan-out cost and UI clutter.

## Interview-relevant talking points

- The strongest answer here is comparative: explicitly contrast this
  feature's requirements (ephemeral, best-effort, no persistence) against
  message storage's requirements (durable, ordered, guaranteed delivery)
  and explain how that difference drives a simpler design — this is often
  exactly what the interviewer is probing for by including this as a
  separate topic.
- Mention client-side timeout-based auto-hide as the mechanism that makes
  the feature robust to a dropped "stopped typing" event, without needing
  server-side reliability guarantees.
