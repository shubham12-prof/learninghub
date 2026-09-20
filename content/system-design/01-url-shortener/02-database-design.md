# Database Design

## Core schema

A minimal URL-shortener table:

```
urls
------------------------------------------------
short_code     VARCHAR(10)   PRIMARY KEY
long_url       TEXT          NOT NULL
created_at     TIMESTAMP     NOT NULL DEFAULT now()
expires_at     TIMESTAMP     NULL
user_id        BIGINT        NULL (FK -> users, if accounts supported)
click_count    BIGINT        DEFAULT 0   (or moved to a separate analytics store)
is_active      BOOLEAN       DEFAULT true
```

If custom aliases and collision-free generated codes are both supported,
`short_code` doubles as the natural primary key/unique constraint — no
separate surrogate key is needed, since lookups are always by short_code.

Optional supporting tables:

```
users
------------------------------------------------
user_id        BIGINT PRIMARY KEY
email          VARCHAR
created_at     TIMESTAMP

click_events   (if detailed analytics are required)
------------------------------------------------
event_id       BIGINT PRIMARY KEY
short_code     VARCHAR(10)  (FK -> urls)
timestamp      TIMESTAMP
referrer       VARCHAR
ip_hash        VARCHAR   (hashed, not raw IP, for privacy)
country        VARCHAR
```

## SQL vs. NoSQL

The core access pattern is extremely simple: **point lookups by primary
key** (`short_code → long_url`), with occasional writes. This is a strong
signal in favor of a **key-value-style store**, though either family can
work:

| Option                                                  | Why it fits                                                                                                                                                                                                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Relational (Postgres/MySQL)                             | Simple schema, strong consistency for uniqueness constraints, mature tooling, fine at this scale with read replicas/sharding. Good default if the team already runs relational infra or if you need relational features (user accounts, joins for analytics). |
| Key-value store (DynamoDB, Cassandra, Redis-as-primary) | Matches the access pattern (single-key lookup) almost exactly, scales horizontally very naturally, high write/read throughput. A common choice when the workload is purely key→value with no complex queries.                                                 |

**Interview framing:** there's no single "correct" answer — what matters
is justifying the choice against the access pattern and stated
requirements. A common strong answer: "Given lookups are always by
short_code and there's no need for complex joins, a key-value store or a
simple relational table with a primary-key index both work; I'd lean
[X] because [reason tied to team context / need for transactions /
analytics joins / etc.]."

## Indexing

- `short_code` — primary key, always indexed (this is the hot lookup path).
- `long_url` — index only if you need to detect duplicate long URLs and
  return the existing short code instead of creating a new one (a common
  optional feature); otherwise skip, since indexing a large text column
  is expensive and rarely queried directly.
- `user_id` — index if users need to list "my links."
- `expires_at` — index if a background job periodically sweeps/deletes
  expired links.

## Handling duplicate long URLs

Decide explicitly: should shortening the same long URL twice return the
same short code, or always generate a new one?

- **Same code (dedup):** requires a lookup/index on `long_url` before
  creating a new record — adds write-path latency and an extra index, but
  saves storage and can be a nicer UX.
- **Always new code:** simpler, faster writes, but the same destination can
  end up with many different short codes (fine for most designs, and what
  most real-world shorteners actually do).

## Partitioning/sharding strategy (preview — full detail in scaling note)

Since lookups are always by `short_code`, sharding by a hash of
`short_code` distributes load evenly and keeps all lookups within a single
shard (no cross-shard queries needed for the hot path) — a very clean fit
for this workload.
