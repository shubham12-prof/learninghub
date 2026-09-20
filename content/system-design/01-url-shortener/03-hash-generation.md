# Hash / Short-Code Generation

This is usually the centerpiece of the interview — expect to compare
multiple approaches and justify a choice.

## Requirement recap

Generate a short, unique string (the "short code") for each long URL, short
enough to be convenient (typically 6-8 characters), effectively collision-
free, and generated fast enough to sit on the write path without becoming a
bottleneck.

## Approach 1: Base62 encode an auto-incrementing counter

- Maintain a globally unique, monotonically increasing integer ID (e.g.,
  from a DB auto-increment column, or a distributed counter/ID service).
- Base62-encode that integer (using `[a-z, A-Z, 0-9]`, 62 symbols) to get a
  short alphanumeric string.
- Example: ID `125` → some short base62 string.
- **Pros:** No collisions by construction (IDs are unique) — no collision-
  checking needed at write time. Simple and fast.
- **Cons:** A single global counter is a scalability bottleneck/single
  point of contention at high write volume, and sequential codes are
  guessable/enumerable (someone could increment through codes and discover
  other users' links) — a real concern if links are meant to be
  unguessable.
- **Mitigation for the bottleneck:** use a distributed unique ID generator
  instead of one DB sequence — e.g., pre-allocate ID ranges to each app
  server (each server hands out IDs from its own reserved block, refilling
  from a central coordinator periodically), or use a scheme like Twitter's
  Snowflake (timestamp + machine ID + sequence number) to generate unique
  IDs without a single point of contention.
- **Mitigation for guessability:** shuffle/permute the ID space (e.g., XOR
  or a reversible bit-mix) before base62 encoding so codes aren't visibly
  sequential, while still guaranteeing uniqueness.

## Approach 2: Hash the long URL (e.g., MD5/SHA-256), then truncate

- Hash the long URL (+ maybe a salt/timestamp to allow the same URL to
  produce different codes if needed), take the first N characters of the
  base62/base64-encoded hash as the short code.
- **Pros:** No dependency on a central counter; naturally distributes well
  (hash output looks random); can be computed independently on any server.
- **Cons:** Truncating a hash to 6-8 characters creates a real chance of
  **collisions** (two different long URLs mapping to the same short code) —
  must explicitly handle this.
- **Collision handling:** on insert, check if the generated short code
  already exists (and maps to a different long URL); if so, append/mix in
  extra entropy (e.g., a counter or timestamp suffix) and re-hash, retrying
  until a free code is found. This adds a variable-cost check to the write
  path.

## Approach 3: Random string generation

- Generate a random N-character string directly from the base62 alphabet.
- **Pros:** Simple, no guessable sequence, no dependency on hashing a
  specific input.
- **Cons:** Same collision concern as hashing — must check for existing
  collisions on write (though at reasonable code lengths, collision
  probability is low — see below) and retry on collision.

## Choosing the code length

With a base62 alphabet:

- 6 characters → 62^6 ≈ 56.8 billion possible codes.
- 7 characters → 62^7 ≈ 3.5 trillion possible codes.
- 8 characters → 62^8 ≈ 218 trillion possible codes.

Given capacity estimates like "100M new URLs/month" (~1.2B/year), 7
characters gives enormous headroom (3.5 trillion capacity vs. billions of
actual URLs), keeping collision probability low even before dedup logic,
while staying short and user-friendly. This is the kind of number you
should be ready to compute live, not memorize.

## Custom aliases

If users can request a custom short code:

- Check availability the same way as collision detection (unique constraint
  on `short_code`, reject/retry if taken).
- Validate against a length range and character set, and block a reserved
  list (e.g., disallow codes that collide with system routes like
  `/admin`, `/api`).

## Interview-relevant talking points

- Be ready to compare counter-based vs. hash-based vs. random generation
  head-to-head, including the collision-handling cost difference (counter-
  based needs none; the other two need retry logic).
- Explain why a single global auto-increment counter becomes a bottleneck
  at scale, and describe at least one mitigation (pre-allocated ID ranges,
  Snowflake-style distributed IDs).
- Be able to justify a code length with a quick capacity calculation.
