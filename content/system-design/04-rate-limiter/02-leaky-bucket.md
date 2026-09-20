# Leaky Bucket

## The idea

Picture a bucket with a small hole in the bottom, leaking at a constant
rate. Incoming requests are added to the bucket (like water poured in); the
bucket processes (leaks out) requests at a fixed constant rate regardless
of how fast they arrived. If the bucket is full when a new request arrives,
that request overflows and is rejected.

This is most naturally implemented as a **request queue processed at a
fixed rate**, rather than a simple counter — a meaningful conceptual
difference from token bucket.

## Algorithm (queue-based implementation)

State per rate-limited key:

```
queue: pending requests (bounded to some max size)
```

- Incoming requests are enqueued if there's room; if the queue is full,
  the request is rejected (overflow).
- A separate process (or scheduled dequeue check) removes and processes
  one request from the queue at a fixed interval (`1 / leak_rate` seconds
  between each), enforcing a strictly constant outbound rate.

A simpler counter-based variant (without an actual request queue) tracks
a "water level" that increases by 1 per request and decreases at a fixed
rate over time, rejecting new requests when the level is at capacity —
functionally similar to token bucket's accounting but inverted, and
without token bucket's burst allowance once the level reaches capacity.

## Key properties

- **Strictly smooths traffic to a constant outbound rate** — unlike token
  bucket, leaky bucket does not allow bursts to pass through faster than
  the leak rate, even if the bucket has been empty/idle. This is the core
  behavioral difference from token bucket.
- Good fit when the _downstream system_ being protected genuinely needs a
  constant, predictable processing rate (e.g., smoothing bursty traffic
  before it hits a fixed-capacity backend), rather than when bursts from
  the client are themselves acceptable.
- **Memory/complexity cost:** if implemented as an actual queue, this is
  more complex and stateful than token bucket's simple counter — you're
  managing a queue of pending work, not just a number. The simplified
  counter-based variant brings the cost back down to roughly the same as
  token bucket.
- Requests that "wait" in the queue add latency (they're delayed, not
  instantly rejected or instantly allowed) — if the design queues rather
  than immediately overflows, this is a real UX tradeoff to name (client
  perceives delay rather than an immediate rejection).

## Token bucket vs. leaky bucket — the key contrast

|                        | Token bucket                             | Leaky bucket                                              |
| ---------------------- | ---------------------------------------- | --------------------------------------------------------- |
| Bursts                 | Allowed, up to bucket capacity           | Not allowed — output strictly smoothed to a constant rate |
| Primary control        | Two params: burst capacity + refill rate | Primarily one param: constant leak/processing rate        |
| Typical implementation | Counter + timestamp                      | Queue processed at fixed rate (or an inverted counter)    |
| Best fit               | Client bursts are acceptable/desirable   | Downstream system needs a strictly constant input rate    |

## Interview-relevant talking points

- The single most common question here is a direct compare-and-contrast
  with token bucket — be ready to state the burst-smoothing difference
  crisply, not just describe each algorithm in isolation.
- Mention the queue-based vs. counter-based implementation choice, and that
  the queue-based version introduces request _delay_ as a possible
  behavior, not just accept/reject — a nuance many candidates miss.
- Be ready to name a scenario where leaky bucket is specifically preferable
  to token bucket: protecting a downstream system that can only handle a
  strictly constant processing rate (e.g., a legacy backend with fixed
  throughput), where absorbing a burst and processing it steadily is more
  valuable than letting bursts straight through.
