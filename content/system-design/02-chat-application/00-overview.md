# Chat Application — Interview Prep Overview

Notes for the "design a chat application" system design interview (the
WhatsApp/Slack/Messenger problem). This question tests real-time systems
thinking — persistent connections, delivery guarantees, and state
synchronization — which is a different flavor of design than typical
CRUD/read-heavy systems.

## Contents

1. `01-websockets.md` — real-time transport options, WebSocket mechanics,
   connection management at scale.
2. `02-message-storage.md` — schema design, message ordering, delivery
   guarantees, storage engine choice.
3. `03-online-presence.md` — tracking and broadcasting online/offline/away
   status.
4. `04-typing-indicator.md` — ephemeral real-time signals and why they're
   architecturally different from messages.
5. `05-read-receipts.md` — tracking and syncing read state across devices
   and conversations.
6. `06-interview-questions.md` — question bank with model answers, plus a
   suggested 45-minute interview walkthrough structure.

## How to use this

- The throughline across all these features is **connection state**: unlike
  a stateless REST API, a chat app needs to know which server holds which
  user's live connection, and route events to it — that single idea
  (a connection registry / presence service) recurs in nearly every
  sub-topic here.
- Read WebSockets and Message Storage first — they're the foundation.
  Presence, typing indicators, and read receipts are all variations on
  "broadcast a small piece of state to the right set of connected clients,"
  built on top of that foundation.
- Practice sketching the architecture: Client ↔ WebSocket Gateway ↔
  Message/Presence services ↔ Database + Pub/Sub — and explain how a
  message gets from sender to recipient when they're connected to
  _different_ gateway servers.
