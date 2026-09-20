# WebSockets & Real-Time Transport

## Why not plain HTTP request/response?

Chat requires the server to **push** data to clients (an incoming message,
a typing event) without the client asking first. Plain HTTP is
client-initiated only, so a chat app needs either persistent connections or
a workaround.

## Transport options

| Option                       | How it works                                                                                                        | Tradeoffs                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Short polling**            | Client repeatedly requests "anything new?" on a timer                                                               | Simple, but wastes requests/bandwidth and adds latency up to the poll interval                                     |
| **Long polling**             | Client requests, server holds the connection open until there's data (or a timeout), client immediately re-requests | Lower latency than short polling, works everywhere HTTP works, but still has per-message connection overhead       |
| **Server-Sent Events (SSE)** | Persistent one-way HTTP connection, server streams events to client                                                 | Simple, works over standard HTTP, but one-directional only (client still needs separate requests to send messages) |
| **WebSockets**               | Full-duplex persistent TCP connection after an HTTP upgrade handshake                                               | Low latency, bidirectional, efficient (no per-message HTTP overhead) — the standard choice for chat                |

**WebSockets are the standard answer** for a chat system because
messaging is inherently bidirectional and low-latency, and a single
persistent connection avoids the overhead of repeated HTTP requests.

## WebSocket connection lifecycle

1. Client opens a WebSocket via an HTTP Upgrade handshake to a **gateway
   server** (a stateful server whose job is to hold open connections).
2. Connection stays open; both sides can push frames at any time.
3. The gateway server registers the connection: typically `user_id →
(server_id, connection_id)` in a shared, fast-lookup store (e.g., Redis)
   so other servers know where to route messages for that user.
4. On disconnect (explicit close, network drop, timeout), the gateway
   deregisters the connection and can notify the presence service.

## The core scaling problem: routing across servers

A single WebSocket gateway server can only hold so many concurrent open
connections (bounded by memory/file descriptors — often tens of thousands
per instance, tunable). At scale you need **many gateway servers**, which
introduces the central architectural challenge:

> If Alice is connected to Gateway Server A and Bob is connected to Gateway
> Server B, how does a message Alice sends reach Bob?

**Standard solution: a pub/sub / message broker layer between gateways.**

1. Alice's message hits Gateway A.
2. Gateway A looks up Bob's current connection location (via the shared
   connection registry, e.g. Redis: `user_id → gateway_id`).
3. Gateway A publishes the message to a channel Gateway B is subscribed to
   (via Redis Pub/Sub, Kafka, or a similar broker) — or, in some designs,
   the message is written to persistent storage and Gateway B is notified
   to fetch/forward it.
4. Gateway B receives it and pushes it down Bob's open WebSocket
   connection.

This pattern — **connection registry + inter-server pub/sub** — is the
answer to almost every "how does X reach the right connected client"
follow-up question in this interview (presence updates, typing indicators,
read receipts all reuse it).

## Handling reconnection & delivery on reconnect

- Clients (mobile especially) disconnect/reconnect frequently (network
  changes, backgrounding, sleep). On reconnect, the client should be able
  to request "everything since my last known message/sequence ID" rather
  than relying solely on live push — this is what makes the system robust
  to the WebSocket connection itself being unreliable.
- This requires the client to track a cursor/last-seen message ID/
  timestamp per conversation, and the server to support a "catch-up" fetch
  endpoint (ordinary REST/DB query) in addition to live WebSocket push.

## Load balancing WebSockets

- Standard load balancers need **sticky-session-aware** or connection-aware
  routing for WebSockets, since (unlike stateless HTTP) the connection must
  stay pinned to the same gateway server for its lifetime.
- Health checks need to account for gracefully draining connections during
  deploys/scale-down (closing WebSockets abruptly on every deploy is a bad
  user experience) — typically via a graceful shutdown that stops accepting
  new connections and asks clients to reconnect elsewhere before killing
  existing ones.

## Interview-relevant talking points

- Be ready to explain, step by step, how a message crosses from one
  gateway server to another — this is the single most commonly probed
  detail in this type of interview.
- Justify WebSockets over polling/SSE explicitly by tying it to the
  bidirectional, low-latency requirement — don't just name-drop it.
- Bring up reconnection/catch-up handling proactively; it's a realistic
  concern interviewers often dig into if you don't mention it yourself.
