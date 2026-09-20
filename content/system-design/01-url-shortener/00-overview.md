# URL Shortener — Interview Prep Overview

Notes for the classic "design a URL shortener" system design interview
(the TinyURL / bit.ly problem). This is one of the most commonly asked
system design questions because it's small enough to fully design in 45
minutes but touches nearly every core system design concept: API design,
data modeling, ID generation, caching, and horizontal scaling.

## Contents

1. `01-requirements.md` — functional and non-functional requirements,
   capacity estimation.
2. `02-database-design.md` — schema design, SQL vs. NoSQL tradeoffs,
   indexing.
3. `03-hash-generation.md` — how to generate short codes: counters, hashing,
   base62 encoding, collision handling.
4. `04-caching.md` — caching layers, cache invalidation, hot-key handling.
5. `05-scaling.md` — horizontal scaling, load balancing, database sharding,
   read replicas, high availability.
6. `06-interview-questions.md` — question bank with model answers, plus a
   suggested 45-minute interview walkthrough structure.

## How to use this

- Read in order — each section builds on the last (requirements → schema →
  ID generation → caching → scaling).
- Practice sketching the high-level architecture diagram from memory:
  Client → Load Balancer → App Servers → Cache → Database, with a
  background ID-generation service.
- The interview questions file includes a suggested time-boxed structure
  for how to run the whole design in ~45 minutes — use it to rehearse
  pacing, not just content.
