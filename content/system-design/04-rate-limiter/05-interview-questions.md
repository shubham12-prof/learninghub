# Interview Questions — Rate Limiter

Question bank with model answers, plus a suggested time-boxed structure
for a 45-minute interview. Includes distributed rate limiting as a common
extension, since almost every real interview pushes past the single-
machine version.

---

## Suggested 45-minute structure

| Time      | Activity                                                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0–5 min   | Clarify requirements: what's being limited (per-user? per-IP? per-API-key?), what happens on rejection (error vs. queue), is some burst tolerance acceptable? |
| 5–10 min  | Walk through the algorithm options at a high level, naming the accuracy/memory/burst tradeoffs                                                                |
| 10–20 min | Deep-dive one or two algorithms in detail (commonly token bucket + sliding window counter), with pseudocode                                                   |
| 20–28 min | Where does rate limiter state live? Single-machine (in-process) vs. shared store                                                                              |
| 28–38 min | Distributed rate limiting: race conditions, atomicity (Lua scripts/transactions), consistency tradeoffs                                                       |
| 38–43 min | Where does the rate limiter sit architecturally (API gateway vs. individual services), and multi-tier limiting                                                |
| 43–45 min | Recap the algorithm choice and why, tying back to the stated requirements                                                                                     |

A strong signal in this interview is precision: interviewers expect exact
answers about memory cost, boundary behavior, and race conditions — vague
"it depends" answers without specifics tend to underperform here relative
to other system design interviews.

---

## Conceptual

**Q1. Compare all four rate-limiting algorithms on memory cost, accuracy,
and burst behavior.**
A:

- **Fixed window:** O(1) memory, simplest, but allows up to 2× the limit
  in bursts straddling a window boundary.
- **Sliding window log:** stores one timestamp per request in the window —
  memory scales with request volume, but is perfectly accurate with no
  boundary artifacts.
- **Sliding window counter:** O(1) memory (two counters), approximates the
  log's accuracy via a weighted combination of the current and previous
  window counts — the practical production sweet spot.
- **Token bucket:** O(1) memory, explicitly allows controlled bursts up to
  a configurable capacity, with a separate steady-state refill rate —
  two independent tunable parameters.
- **Leaky bucket:** similar memory profile to token bucket if implemented
  as a counter, but strictly smooths output to a constant rate with no
  burst allowance (or introduces queuing delay if implemented as an actual
  queue).

**Q2. What's the core flaw in fixed window counters, and which algorithm
fixes it?**
A: Because the window resets abruptly at fixed boundaries, a client can
send up to the limit right before a window ends and up to the limit again
right after it starts, allowing roughly 2× the intended rate in a short
span straddling the boundary. The sliding window counter fixes this by
weighting the previous window's count based on how much it overlaps with
the current sliding window, avoiding the abrupt reset.

**Q3. When would you choose token bucket over leaky bucket, or vice
versa?**
A: Token bucket when short client bursts are acceptable or even desirable
(e.g., an API that's fine handling a quick burst of 20 requests as long as
the sustained rate stays at 10/sec). Leaky bucket when the _downstream_
system being protected needs a strictly constant processing rate
regardless of how bursty the input is — e.g., smoothing traffic before a
fixed-throughput backend.

---

## Technical

**Q4. Write pseudocode for the token bucket algorithm's request check.**
A:

```
function allow_request(key):
    now = current_time()
    bucket = get_bucket(key)  # {tokens, last_refill_time}
    elapsed = now - bucket.last_refill_time
    bucket.tokens = min(capacity, bucket.tokens + elapsed * refill_rate)
    bucket.last_refill_time = now
    if bucket.tokens >= 1:
        bucket.tokens -= 1
        save_bucket(key, bucket)
        return ALLOW
    else:
        save_bucket(key, bucket)
        return REJECT
```

**Q5. Derive the sliding window counter's estimated count formula.**
A: If `overlap` is the fraction of the previous fixed window that still
falls within the current sliding lookback period —
`overlap = (window_size - time_elapsed_in_current_window) / window_size`
— then:
`estimated_count = previous_window_count * overlap + current_window_count`
This assumes requests were evenly distributed across the previous window,
which is an approximation, not an exact accounting — the tradeoff that
buys O(1) memory instead of storing every timestamp.

**Q6. Why is sliding window log rarely used at large scale despite being
the most accurate?**
A: Its memory cost scales with request volume within the window — for a
high-limit, high-traffic key, you're storing thousands of individual
timestamps, which is expensive across many keys at production scale. The
sliding window counter gets close to the same accuracy with O(1) memory
per key, making it the better default once the log approach's cost becomes
a concern.

---

## Distributed Rate Limiting (common extension)

**Q7. Where should rate limiter state live in a multi-server deployment?**
A: If each server keeps its own local counters (in-process), the effective
limit becomes `limit × number_of_servers`, since a client's requests can be
spread across servers, each enforcing the limit independently — usually
not what's intended. The standard fix is a **shared, centralized state
store** (commonly Redis) that all servers read/write to, so the limit is
enforced globally regardless of which server handles a given request.

**Q8. What race condition can occur with a naive shared-counter
implementation, and how do you fix it?**
A: A naive "read count, check limit, increment" sequence executed by two
servers concurrently can both read the same pre-increment value, both
decide the request is allowed, and both increment — letting through one
more request than the limit permits (a classic check-then-act race). Fix
by making the check-and-increment **atomic** — e.g., using Redis's atomic
`INCR` command (increment first, then check the returned value against
the limit, rather than reading then incrementing separately), or a Lua
script executed atomically on the Redis server for algorithms needing more
than a single atomic operation (like token bucket's refill-then-decrement
logic).

**Q9. Why is a Lua script (or equivalent atomic transaction) often needed
for token bucket in a distributed setting, but a simple `INCR` is enough
for fixed window?**
A: Fixed window's logic reduces to a single atomic increment-and-compare,
which Redis's `INCR` handles natively and atomically in one round trip.
Token bucket's logic involves multiple dependent steps — read the current
token count and last refill time, compute the new token count, compare to
the request cost, conditionally decrement, write back — and doing these as
separate round trips introduces the same check-then-act race described
above. Running the whole sequence as a single Lua script on the Redis
server makes it atomic without needing distributed locks.

**Q10. What's the latency/consistency tradeoff of using a centralized
shared store for rate limiting versus per-server local counters?**
A: Centralized state guarantees an accurate global limit but adds a
network round trip (to the shared store) to every rate-limit check,
increasing latency, and makes the store itself a potential bottleneck or
single point of failure. Per-server local counters avoid that latency and
dependency but only approximate the intended global limit. A common
middle ground: local counters with periodic sync/reconciliation to a
central store, or accepting a slightly relaxed limit in exchange for lower
latency, depending on how strictly the limit needs to be enforced.

---

## Scenario / Design

**Q11. Design a rate limiter for a public API that should allow different
limits for free-tier vs. paid users.**
A: Store a per-user (or per-API-key) tier/limit configuration, looked up
at request time to determine which limit parameters apply (e.g., free tier:
token bucket with capacity 10, refill 1/sec; paid tier: capacity 100,
refill 20/sec). The algorithm and enforcement mechanism stay the same
across tiers — only the parameters differ — so this is primarily a
configuration/lookup concern layered on top of whichever core algorithm is
chosen, not a reason to build separate rate-limiting logic per tier.

**Q12. Where in the system architecture should the rate limiter live —
at the API gateway, or inside each individual service?**
A: A common pattern is enforcing coarse, global limits at the API gateway/
edge (protects all downstream services uniformly, avoids duplicating logic
per service, and rejects abusive traffic before it consumes any backend
resources), while allowing individual services to layer additional,
more specific limits internally if needed (e.g., a particularly expensive
endpoint might need a stricter limit than the general API-wide one).
Centralizing at the gateway is usually the right default; per-service
limits are an addition, not a replacement.

**Q13. A client complains their legitimate traffic is being rate-limited
even though they're well under their stated quota. How would you debug
this?**
A: First check which algorithm is in use and whether the complaint
correlates with time-window boundaries — a fixed-window implementation
could be double-counting bursts near a boundary in the _opposite_
direction of the classic flaw isn't likely, but clock skew between
servers computing "current window" independently in a distributed,
non-centralized setup could cause inconsistent window boundaries per
server. Also check whether the rate limiter key is scoped correctly (e.g.,
accidentally rate-limiting by shared IP instead of per-user/API-key,
causing multiple legitimate users behind the same NAT/proxy to share one
limit) — a very common real-world root cause worth naming explicitly.
