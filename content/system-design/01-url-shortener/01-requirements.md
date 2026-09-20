# Requirements & Capacity Estimation

## Functional requirements

1. Given a long URL, generate a unique, short alias (e.g.,
   `https://short.ly/aZ9kT`).
2. When a user visits the short URL, redirect them to the original long URL.
3. (Optional/common extensions)
   - Let users pick a custom alias.
   - Support link expiration (TTL).
   - Track click analytics (count, referrer, geography, timestamp).
   - Support user accounts that own/manage their links.
   - Allow deleting/deactivating a link.

## Non-functional requirements

- **High availability** — redirection is on the critical path for anyone
  clicking a shared link; downtime is highly visible and damaging.
- **Low latency redirection** — the redirect should feel instant (target:
  low tens of milliseconds), since it sits in front of the user's actual
  destination.
- **Uniqueness** — no two long URLs should silently collide on the same
  short code.
- **Scalability** — needs to handle a read-heavy, high-volume workload
  (see estimation below).
- **Durability** — a short URL, once created, should keep working for its
  intended lifetime (until explicit expiration/deletion) — links get
  shared and bookmarked long-term.
- Unpredictability of short codes is a soft requirement in most designs
  (you generally don't want sequential codes that let people enumerate
  other users' links), though it's not always a hard security requirement.

## Capacity estimation (example assumptions — walk through this out loud

in an interview, the exact numbers matter less than showing the method)

Assume:

- 100M new short URLs created per month.
- Read:write ratio of 100:1 (redirects vastly outnumber creations — typical
  for this kind of system).

**Write QPS:**

- 100,000,000 / (30 days × 24h × 3600s) ≈ 39 writes/sec average.
- Assume peak traffic is ~3-5x average → ~150-200 writes/sec peak.

**Read QPS:**

- 100:1 ratio → ~3,900 reads/sec average, ~15,000-20,000 reads/sec peak.

**Storage:**

- Assume each record (short code, long URL, metadata) is roughly 500
  bytes.
- 100M new URLs/month × 500 bytes ≈ 50 GB/month.
- Over 5 years: ~3 TB — large but very manageable for modern storage;
  drives the decision to plan for horizontal scaling / sharding rather than
  a single machine, but isn't itself the bottleneck (read QPS and latency
  usually are).

**Short code length (see hash-generation note for full derivation):**

- Base62 (a-z, A-Z, 0-9) encoding: 62^7 ≈ 3.5 trillion possible codes with
  7 characters — comfortably supports the scale above with huge headroom,
  so 7 characters is a reasonable target length.

## Why walk through capacity estimation at all?

Interviewers use this step to see whether you can translate a vague
product ask into concrete numbers that then _justify_ your later design
decisions (e.g., "read-heavy → we need aggressive caching," "large data
volume + high read QPS → we need sharding and read replicas, not just a
single Postgres instance"). Skipping this step is a common way candidates
lose points even if their final architecture is reasonable.
