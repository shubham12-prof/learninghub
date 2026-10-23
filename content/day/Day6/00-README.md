# Day 6: Full-Stack - APIs, Backend and DSA

> **Goal of the day:** understand how a request travels from the browser to the database and back, and practise the two skills interviews test most: a classic array/string problem and a robust API client.
> **Time:** about 8 hours at a steady pace.
> **Versions used to verify everything:** Node 22.22 (built-in `fetch`, `node:test`, `node:sqlite`), Express 5.3, jsonwebtoken 9.0.3.

## Daily target: 1 DSA problem + 1 integration exercise

| Target                     | Where                                         | Done when                                                                                                   |
| -------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **1 DSA problem**          | `05-coding-dsa-problem.md`                    | you can solve _Longest Substring Without Repeating Characters_ in O(n), explain it, and the 18 tests pass   |
| **1 integration exercise** | `06-coding-api-integration.md`                | your API client passes the 15 tests against the misbehaving mock server (auth, errors, retries, pagination) |
| **Interview**              | `07-interview-request-response-jwt-errors.md` | you can explain request-response flow, JWT and error handling aloud, 30 to 60 seconds each                  |
| **Bonus: project**         | `08-project-trace-ui-to-db.md`                | you traced "Save a course" from the click to the database row and fixed 6 broken versions                   |

## Files (one topic per file)

| #   | File                                          | Type                                                           | Time    |
| --- | --------------------------------------------- | -------------------------------------------------------------- | ------- |
| 01  | `01-http-methods-status-codes.md`             | Theory: request/response, methods, status codes, headers, CORS | 55 min  |
| 02  | `02-rest-api-design.md`                       | Theory: resources, routes, pagination, error shape, validation | 50 min  |
| 03  | `03-authentication.md`                        | Theory: password hashing, sessions vs JWT, 401 vs 403          | 65 min  |
| 04  | `04-databases-basics.md`                      | Theory: tables, keys, joins, indexes, injection, transactions  | 60 min  |
| 05  | `05-coding-dsa-problem.md`                    | Coding: sliding-window string problem + 3 variants             | 75 min  |
| 06  | `06-coding-api-integration.md`                | Coding: robust API client against a flaky mock server          | 100 min |
| 07  | `07-interview-request-response-jwt-errors.md` | Interview: 3 core answers + follow-ups                         | 60 min  |
| 08  | `08-project-trace-ui-to-db.md`                | Project: full-stack trace, debug 6 bugs                        | 120 min |

## Suggested study order

1. **Theory (about 3.5 h):** 01 -> 02 -> 03 -> 04. Answer each **Predict the output** before reading the answers.
2. **Coding (about 3 h):** `05` first (20 minutes alone before reading the solution), then `06` (write the client yourself, using the tests as the spec).
3. **Interview (60 min):** `07`. Say the 3 answers aloud without notes.
4. **Project (2 h):** `08`. Part A (build), B (trace), C (debug), D (stretch).
5. **Last 15 min:** the cheat sheet below.

## Setup

```bash
node --version                       # 22 or newer
mkdir day6 && cd day6 && npm init -y && npm pkg set type=module
npm i express jsonwebtoken           # only the project in 08 needs these
```

- Files `05` and `06` need **no installs**: `node --no-warnings --test <file>.test.js`.
- The project in `08` uses the built-in `node:sqlite`; run it with `node --no-warnings`.

## Cheat sheet

**HTTP:** request = method + path + headers + body; response = status + headers + body; stateless. **Safe** = no change (GET); **idempotent** = same state after repeats (GET, PUT, DELETE). `fetch` doesn't throw on 4xx/5xx: check `res.ok`. CORS is enforced by the **browser**; JSON/`Authorization`/`PUT`/`DELETE` trigger a preflight `OPTIONS`.

**Status codes:** 200 ok, 201 created, 204 no content, 400 malformed, **401 not authenticated**, **403 not allowed**, 404 missing, 409 conflict, 413 too large, 422 validation, 429 rate limit (`Retry-After`), 500 bug, 502/503/504 upstream.

**REST:** nouns in URLs, method as verb, query string for filter/page, `{ data, page, limit, total }`, cap the limit, one error shape `{ error: { code, message, details } }`, user from the **token**.

**Auth:** hash passwords (salt + slow: scrypt/bcrypt/argon2); same error for unknown email and wrong password. JWT = header.payload.signature, **signed not encrypted**, verify signature + expiry, pin the algorithm, short expiry, hard to revoke. Sessions = easy revoke. `decode` is not `verify`.

**SQL:** primary/foreign keys, UNIQUE/NOT NULL/CHECK, join table for many-to-many, `JOIN`, `GROUP BY`, **parameterised queries** (`?`), index what you filter/join/sort, transactions are all-or-nothing, SQLite needs `PRAGMA foreign_keys = ON`.

**Errors:** expected = `HttpError` + stable shape; unexpected = log fully, return a generic 500 + request id; client errors are never 5xx; retry only network/timeout/408/429/5xx, with backoff + jitter; POST retries need an idempotency key.

**DSA:** contiguous + longest/shortest => **sliding window**; "seen before?" => Set/Map; group by property => Map with a computed key. Longest substring without repeats: O(n) time; traps `"dvdf"` and `"abba"`.

## Final checklist for the day

- [ ] I can narrate the request-response flow from a click to the database and back
- [ ] I can choose the right status code for create, delete, invalid input, no login, no permission, duplicate
- [ ] I can explain JWT vs sessions, and 401 vs 403
- [ ] I can write a parameterised query and explain SQL injection
- [ ] I solved the sliding-window problem and can explain why it is O(n)
- [ ] My API client passes all 15 integration tests
- [ ] I traced the Save feature through every layer and fixed the 6 broken versions
