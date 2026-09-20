# Fixed Window Counter

## The idea

The simplest rate-limiting algorithm: divide time into fixed-size windows
(e.g., 1-minute buckets aligned to the clock: 12:00:00-12:01:00,
12:01:00-12:02:00, ...). Keep a counter per key per window. Allow a request
if the counter for the current window is below the limit; increment it on
each allowed request. When the window rolls over, reset the counter to
zero.

## Algorithm

State per key: `count` (for the current window), `window_start_time`.

On each request:

1. Compute the current window's start time (e.g.,
   `floor(now / window_size) * window_size`).
2. If this differs from the stored `window_start_time`: reset `count` to 0
   and update `window_start_time` to the new window.
3. If `count < limit`: increment `count`, allow the request.
4. Else: reject.

## Key properties

- **Extremely simple to implement and reason about** — a single counter
  and a timestamp per key, trivial to store (e.g., a single Redis `INCR`
  with a TTL matching the window size, which auto-resets the counter for
  free).
- **Very cheap: O(1) memory per key.**
- **The boundary-burst problem (the main flaw to know cold):** because
  windows are fixed and reset abruptly, a client can send up to `limit`
  requests right at the _end_ of one window, and another `limit` requests
  right at the _start_ of the next window — resulting in up to `2 × limit`
  requests within a short span straddling the boundary, even though the
  long-run rate limit is respected on average. This is the textbook flaw
  interviewers expect you to identify and explain with a concrete example.

## Concrete example of the boundary problem

With a limit of 100 requests/minute:

- 100 requests arrive at 12:00:59 (allowed — within that window's limit).
- 100 more requests arrive at 12:01:01 (allowed — new window, counter
  reset).
- Result: 200 requests within a 2-second span, despite a "100/minute"
  limit — a real burst vulnerability, not just a theoretical edge case.

## When fixed window is still a reasonable choice

- When simplicity and raw performance matter more than precise
  boundary behavior (e.g., a coarse, high-level global rate limit where
  occasional boundary bursts are an acceptable risk).
- As a **first cut / MVP** before optimizing to sliding window counter —
  a completely reasonable thing to say explicitly in an interview: "I'd
  start here for simplicity, then upgrade to a sliding window counter if
  the boundary-burst behavior turns out to matter for this use case."

## Interview-relevant talking points

- Be ready to state the boundary-burst flaw precisely, with a concrete
  numeric example (as above) — this is probably the single most
  frequently tested specific fact across this whole topic.
- Correctly note that this flaw is exactly what motivates the sliding
  window counter algorithm — connecting these two topics explicitly shows
  you understand the _progression_ of ideas, not just isolated facts.
- Mention the trivial Redis `INCR` + `TTL` implementation as a real,
  practical way this gets built — a good concrete detail to have ready.
