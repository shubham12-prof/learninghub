# Interview Questions — URL Shortener

Includes a question bank plus a suggested time-boxed structure for running
the whole design in a typical 45-minute interview.

---

## Suggested 45-minute structure

| Time      | Activity                                                                                                        |
| --------- | --------------------------------------------------------------------------------------------------------------- |
| 0–5 min   | Clarify functional/non-functional requirements out loud; confirm scope (custom aliases? analytics? expiration?) |
| 5–10 min  | Capacity estimation (QPS, storage) — state assumptions explicitly                                               |
| 10–15 min | API design (endpoints, request/response shape)                                                                  |
| 15–25 min | Core design: database schema + short-code generation strategy, justified against requirements                   |
| 25–35 min | Caching + high-level architecture diagram                                                                       |
| 35–43 min | Scaling: sharding, replication, availability, bottleneck discussion                                             |
| 43–45 min | Recap tradeoffs made and open questions/what you'd revisit with more time                                       |

Interviewers consistently reward candidates who **narrate their reasoning
and tradeoffs out loud**, ask clarifying questions early, and explicitly
connect design decisions back to the stated requirements — more than
candidates who silently produce a "correct" diagram.

---

## Conceptual

**Q1. Walk me through what happens end-to-end when a user creates a short
URL and then someone clicks it.**
A: Creation: client sends the long URL to an API endpoint → server
generates a unique short code (via counter/hash/random generation) →
checks for collision if needed → writes the mapping to the database
(and optionally pre-populates the cache) → returns the short URL to the
client. Click: client requests the short URL → load balancer routes to an
app server → app server checks the cache for the short code → on a hit,
redirects immediately using the cached long URL; on a miss, queries the
database, populates the cache, then redirects.

**Q2. What HTTP status code would you use for the redirect, and does it
matter?**
A: A 301 (permanent redirect) or 302 (temporary redirect). It matters
because 301s are cached by browsers/intermediaries, reducing load on your
system for repeat visits — but that also means analytics on repeat clicks
from the same client become harder to track, since the browser may not
even re-request your server. 302 preserves per-click visibility for
analytics at the cost of more repeated requests to your servers. Which to
choose depends on whether analytics accuracy or infrastructure load
reduction matters more for the product.

**Q3. How would you design the API for this system?**
A: Roughly:

- `POST /shorten` — body: `{ long_url, custom_alias?, expires_at? }` →
  returns `{ short_url }`.
- `GET /{short_code}` — redirects to the long URL (this is the hot path).
- Optionally `GET /{short_code}/stats` — returns analytics if supported.
- Optionally `DELETE /{short_code}` — deactivate a link (auth required if
  tied to a user account).

---

## Technical

**Q4. Compare counter-based, hash-based, and random short-code
generation.**
A: Counter-based (base62-encode an auto-incrementing ID) guarantees no
collisions by construction but risks a central bottleneck and produces
guessable sequential codes unless mitigated. Hash-based (truncate a hash of
the long URL) distributes well and needs no central counter, but truncation
creates real collision risk requiring retry logic. Random generation is
similar to hash-based in needing collision checks, but doesn't depend on
the input URL, so it's simple to reason about and naturally unguessable.
In practice, a counter-based approach with ID obfuscation (to avoid
sequential guessability) is a common, simple, collision-free choice; a
distributed ID generator resolves the central bottleneck concern.

**Q5. How do you prevent a single global counter from becoming a
bottleneck at scale?**
A: Avoid a single shared sequence. Options: pre-allocate blocks/ranges of
IDs to each app server so they can generate IDs locally without a
round-trip per request, refilling from a coordinator periodically; or use
a Snowflake-style scheme where each ID embeds a timestamp, a machine/
shard ID, and a local sequence number, so IDs are generated independently
per node while remaining globally unique.

**Q6. Why is caching such a central part of this design?**
A: The workload is heavily read-skewed — redirects vastly outnumber
creations — and redirect latency is directly user-visible, sitting in the
critical path before the user reaches their destination. A cache absorbs
the large majority of read traffic in-memory, both reducing latency and
protecting the database from a read load it wasn't sized for.

**Q7. How would you shard the database, and why that key?**
A: Shard by a hash of `short_code`, since every read and write in this
system is keyed by `short_code` — this distributes load evenly across
shards and ensures every request only needs to touch a single shard (no
cross-shard queries needed on the hot path), which is the ideal case for
sharding.

**Q8. How would you handle a link that suddenly goes viral (a "hot key")?**
A: The cache-aside pattern already handles most of this, since the hot key
gets served from the cache after the first request. At extreme scale where
one key overwhelms a single cache node, mitigate with local in-process
caching on app servers for the hottest keys, and/or replicate that hot key
across multiple cache nodes so load is spread rather than concentrated.

**Q9. How would you support link expiration?**
A: Store an `expires_at` timestamp on the record. Check it at read time
(treat an expired link as not-found even if still present in DB/cache —
cheap and always correct). Separately, run a background job that
periodically deletes/archives expired rows so the dataset doesn't grow
unbounded and cache entries for expired links get proactively evicted.

---

## Scenario / Design follow-ups

**Q10. How would you extend this design to support click analytics
without hurting redirect latency?**
A: Keep analytics off the critical path. On each redirect, publish a
lightweight event (short_code, timestamp, referrer, etc.) to a message
queue asynchronously, and return the redirect to the user immediately
without waiting on that write. A separate consumer processes the queue
into an analytics store/data warehouse, batching writes rather than
updating a counter on every single request.

**Q11. How would you make this system work across multiple regions with
low latency globally?**
A: Deploy app servers, caches, and read replicas in each region; use a
global load balancer/DNS routing (e.g., latency-based routing) to send
users to their nearest region. Since the `short_code → long_url` mapping is
effectively immutable, eventual consistency across regions is an easy,
well-justified tradeoff — a new link might take a short time to propagate
globally, which is acceptable for this use case, unlike systems needing
strong global consistency.

**Q12. What would you do differently if the interviewer said "assume 1000x
more read traffic than your original estimate"?**
A: Push more aggressively on caching: add CDN-level caching for redirects
(since responses are effectively static per short_code), consider
edge/serverless redirect handling to avoid round-tripping to origin
servers at all for cached links, and re-evaluate whether app-server-local
caching is needed in addition to the shared cache layer to reduce network
hops for the hottest keys. Database read replicas would also need to scale
further, though caching should absorb the overwhelming majority of this
increase before it ever reaches the database.

**Q13. What tradeoff did you make in your design that you'd revisit with
more time or different constraints?**
A: A good answer names a specific tradeoff and its rationale rather than
listing everything — e.g., "I chose 301 redirects for lower infrastructure
load, trading off some per-click analytics accuracy; if analytics were the
primary product feature rather than a nice-to-have, I'd reconsider 302 or
add explicit client-side tracking." Interviewers want to see you can
recognize and articulate the tradeoff, not that you picked the "right"
option.
