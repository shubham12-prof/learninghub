# Sliding Window

There are two distinct variants worth knowing: **sliding window log**
(exact but memory-heavy) and **sliding window counter** (approximate but
cheap) — interviewers often want you to know both and explain why the
counter variant is the practical production choice.

## Sliding Window Log

### The idea

Store a timestamp for **every** request made by a given key within the
lookback window. On a new request, remove timestamps older than
`now - window_size`, then check if the remaining count is below the limit.

### Algorithm

State per key: a list/set of request timestamps (often a sorted structure,
e.g., a Redis sorted set).

On each request:

1. Remove all stored timestamps older than `now - window_size`.
2. If the remaining count < limit: add the current timestamp, allow the
   request.
3. Else: reject.

### Properties

- **Perfectly accurate** — this is the only one of the four algorithms
  discussed in this topic that enforces the limit exactly, with no
  boundary artifacts.
- **Memory cost is high and scales with request volume**: you're storing
  one entry per request within the window, per key — for a high-limit,
  high-traffic key this can be significant (e.g., a limit of 10,000
  requests/hour means up to 10,000 stored timestamps per key at any given
  time).
- This memory cost is the main reason it's less common in production at
  scale, despite being the most accurate — it's the algorithm you present
  first to establish correctness, then optimize away from.

## Sliding Window Counter

### The idea

A practical approximation that gets most of the accuracy of the log
approach with far less memory: keep simple counters per fixed window
(like the fixed-window algorithm), but estimate the "current sliding
window" count as a **weighted combination of the current and previous
fixed window's counts**, based on how far into the current window we are.

### Algorithm

State per key: two counters — `previous_window_count`,
`current_window_count` — plus the window boundaries.

On each request:

1. Determine what fraction of the current fixed window has elapsed, e.g.
   `overlap = (window_size - time_into_current_window) / window_size`.
2. Estimate the sliding count as:
   `estimated_count = previous_window_count * overlap + current_window_count`
3. If `estimated_count < limit`: allow, increment `current_window_count`.
4. Else: reject.
5. When the window boundary rolls over, `current_window_count` becomes the
   new `previous_window_count`, and a new `current_window_count` starts at 0.

### Properties

- **Memory cost: O(1) per key** (just two counters) — essentially as cheap
  as fixed window, while being far more accurate at window boundaries.
- **Approximate, not exact** — it assumes requests are evenly distributed
  within the previous window, which isn't always true, so it can slightly
  over- or under-count in adversarial traffic patterns. In practice this
  approximation is good enough for the vast majority of rate-limiting use
  cases.
- This is the algorithm most commonly used in real production rate
  limiters (e.g., it's close to what's used in Cloudflare's and similar
  large-scale rate limiters) because it hits a strong accuracy/memory
  sweet spot.

## Interview-relevant talking points

- Present sliding window log first to establish the "ground truth" correct
  behavior, then motivate the counter variant explicitly as an
  accuracy/memory tradeoff, not a totally different idea — this
  progression is exactly how interviewers usually want the story told.
- Be ready to derive the weighted-overlap formula for the counter variant
  live — it's the most commonly requested piece of pseudocode/math in this
  sub-topic.
- Know that the counter variant's approximation error is bounded and
  generally acceptable, and be ready to describe a pathological case where
  it under- or over-allows (e.g., all previous-window requests clustered
  at the very end of that window, right before the boundary).
