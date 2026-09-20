# Token Bucket

## The idea

Picture a bucket that holds up to `capacity` tokens. Tokens are added to
the bucket at a fixed rate (`refill_rate` tokens per second) up to the
capacity limit. Each incoming request must consume one token to proceed —
if there's a token available, the request is allowed and a token is
removed; if the bucket is empty, the request is rejected (or queued,
depending on the design).

## Algorithm (per-key state)

State per rate-limited key (e.g., per user or per API key):

```
tokens: current token count (starts at capacity)
last_refill_time: timestamp of last refill calculation
```

On each request:

1. Compute elapsed time since `last_refill_time`.
2. Add `elapsed_time * refill_rate` tokens to `tokens`, capped at
   `capacity`. Update `last_refill_time` to now.
3. If `tokens >= 1`: subtract 1, allow the request.
4. Else: reject the request (429 Too Many Requests), or queue/delay it
   depending on the product requirement.

This "lazy refill" approach (compute tokens accrued since last check,
rather than running a background timer per key) is the standard efficient
implementation — it avoids needing a scheduled job per key.

## Key properties

- **Allows bursts up to `capacity`.** If the bucket has been idle and full,
  a burst of up to `capacity` requests can go through instantly, before
  being throttled to the steady-state `refill_rate`. This is often a
  _desirable_ property — real traffic is bursty, and strictly smoothing it
  out can reject legitimate short bursts.
- **Two independent parameters**: `capacity` (max burst size) and
  `refill_rate` (steady-state allowed rate) — this two-parameter
  flexibility is a key advantage over fixed/sliding window approaches,
  which typically only have one "requests per window" knob.
- **Memory cost:** O(1) per key — just two numbers (token count, last
  refill time) regardless of request volume, which is very cheap compared
  to algorithms that store individual request timestamps.

## Common use cases

- API rate limiting where some burstiness is acceptable/desirable (e.g.,
  "100 requests/minute, but allow a user to burst up to 20 at once").
- This is the algorithm behind many well-known real-world rate limiters
  (e.g., AWS API Gateway's throttling model is token-bucket-based).

## Interview-relevant talking points

- Emphasize the **two-parameter control** (capacity vs. rate) as the main
  differentiator from single-parameter window algorithms — this is usually
  the strongest reason to pick token bucket when asked to justify a choice.
- Be ready to explain the lazy-refill computation precisely — interviewers
  often ask you to write this out as pseudocode or actual code.
- Know that "reject vs. queue" on empty bucket is a product decision you
  should surface explicitly rather than assume.
