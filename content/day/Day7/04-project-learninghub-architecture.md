# 04 - Project: Explain LearningHub's Architecture, Features, Decisions and Trade-offs

> **Time:** ~75 min | **Type:** Explain-it-aloud practice | **Target:** a clear 2-minute overview and a confident answer to "why did you choose X?"
> **Read this first:** this file describes the **LearningHub practice build** you made across Days 1 to 6 (course cards, saved courses, a typed Next.js catalogue, an Express + SQLite API). I don't have your real project's code, so **anything marked `[YOUR PROJECT]` must be replaced with the facts of your own repo.** An interviewer can tell within one follow-up question whether you built what you describe, so use your real details wherever they differ.

## 1. What you are practising

An interviewer says: _"Walk me through a project you're proud of."_ They are grading four things: can you **explain the whole system simply**, can you **pick one feature and trace it end to end**, can you **justify decisions with trade-offs**, and do you **know the weaknesses**. Not whether it is perfect.

## 2. The 30-second pitch (memorise this)

> "LearningHub is a learning platform where students browse and search courses, save the ones they want, and track progress, and admins add new courses. The front end is **React with Next.js and TypeScript**: the public catalogue is rendered on the server so it is fast and indexable, and interactive parts like search and the Save button are Client Components. The back end is a **REST API** with **JWT authentication** and a **SQL database**. I focused on correctness and robustness: validated input, a consistent error format, parameterised queries, tests, and a resilient API client with timeouts and retries."

## 3. The architecture in one picture

```
 BROWSER                                    SERVER                                  DATA
 ┌──────────────────────────────┐   HTTPS   ┌────────────────────────────────┐     ┌───────────────┐
 │ Next.js UI (React + TS)      │──────────▶│ API (Express / Route Handlers) │────▶│ SQL database  │
 │  - Server Components:        │  JSON     │  1 request id + access log     │ SQL │  users        │
 │    catalogue (static / ISR)  │◀──────────│  2 JSON body parser (10 kb)    │ (?) │  courses      │
 │  - Client Components:        │           │  3 requireAuth (JWT verify)    │◀────│  saved_courses│
 │    search, Save, Accordion   │           │  4 requireRole (admin)         │     │  + indexes,   │
 │  - fetch wrapper: token,     │           │  5 route handler + validation  │     │  constraints  │
 │    timeout, retry, errors    │           │  6 error middleware (last)     │     └───────────────┘
 └──────────────────────────────┘           └────────────────────────────────┘
```

| Layer                          | What it does                                                                                | Built in     |
| ------------------------------ | ------------------------------------------------------------------------------------------- | ------------ |
| **UI**                         | course cards, search/filter, progress, accordion, responsive + accessible layout            | Days 1, 3, 4 |
| **Rendering**                  | Server Components for the catalogue (static/ISR), Client Components for interaction         | Day 5        |
| **Types**                      | `strict` TypeScript, discriminated unions for loading/error/success                         | Day 5        |
| **Data access in the browser** | a `fetch` wrapper: `res.ok` check, timeout/abort, retry with backoff, latest-request-wins   | Days 2, 6    |
| **API**                        | REST routes, validation, pagination, consistent errors, request ids                         | Day 6        |
| **Auth**                       | scrypt password hashing, 15-minute JWT with `sub` and `role`, `requireAuth`, `requireRole`  | Day 6        |
| **Database**                   | `users`, `courses`, `saved_courses` with `UNIQUE`/`CHECK`/foreign keys, an index on `level` | Day 6        |
| **Tests**                      | API (19), integration client (15), DSA (18), component tests                                | Days 3 to 6  |

## 4. Key features and where to point in the code

| Feature                       | One-line explanation                      | Trace                                                                                                                                         |
| ----------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Browse and filter courses** | paginated, filterable list                | `GET /api/courses?level=&q=&page=&limit=` returns `{ data, page, limit, total }`, with `limit` capped at 50                                   |
| **Register / log in**         | hashed password, token on login           | `POST /api/auth/register` (201/409/422), `POST /api/auth/login` (200 or one 401 message)                                                      |
| **Save a course**             | needs login; idempotent                   | `PUT /api/me/saved/:id` runs `INSERT OR IGNORE` against a composite primary key; unsave is `DELETE` (204)                                     |
| **Admin adds a course**       | role-protected                            | `POST /api/courses` behind `requireAuth` and `requireRole("admin")`: 401 / **403** / 422 / 409 / 201 + `Location`                             |
| **Progress and accordion UI** | local interaction and reusable components | Day 1 progress tracker, Day 3 `Accordion` (controlled and uncontrolled)                                                                       |
| **Resilient client**          | survives flaky networks                   | retries `GET`/`PUT`/`DELETE` on 5xx/429/timeout with backoff and `Retry-After`; `POST` only with an `Idempotency-Key`; re-login once on a 401 |

## 5. Trace one feature (be ready to do this on a whiteboard): "Save a course"

1. **UI**: the Save button's click handler calls `api("/api/me/saved/1", { method: "PUT" })`. The state update changes the button to "Saved" only after a successful response (or optimistically, with a rollback on failure: see trade-offs).
2. **Network**: `PUT /api/me/saved/1` with `Authorization: Bearer <jwt>`. Same origin, so no CORS preflight.
3. **Server middleware**: request id and log, then JSON parsing, then **`requireAuth`** verifies the signature and expiry and sets `req.user = { id, role }`.
4. **Handler**: checks the course exists (else **404**), runs `INSERT OR IGNORE INTO saved_courses (user_id, course_id) VALUES (?, ?)`: parameterised, and idempotent.
5. **Database**: the composite primary key `(user_id, course_id)` guarantees one row per pair; foreign keys guarantee both ids exist; cascades clean up when a user or course is deleted.
6. **Response**: `200 { saved: true, courseId: 1 }`. The server log line is `[a98ba2ed] PUT /api/me/saved/1 -> 200 (1 ms)`; the same id is in the `X-Request-Id` header, so a bug report can be matched to a log line.
7. **UI again**: success updates the button; failure maps to an error message (401 means log in again, network error means retry).

(I ran exactly this trace in headless Chromium: the request carried the Authorization header, the database ended with the row `{ user_id: 1, course_id: 1 }`, and the button showed pressed.)

## 6. Decisions and trade-offs (the part interviewers care about most)

Use this formula: **"I chose X over Y because Z. The cost is W, and I'd revisit it when V."**

| Decision                                                       | Why                                                                       | Trade-off / cost                                                            | When I'd change it                                                                |
| -------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Server Components + static/ISR for the catalogue** (vs. CSR) | fast first paint, good SEO, little JS shipped                             | content can be stale up to the revalidate window; needs a server/build step | use on-demand `revalidatePath` after an admin edit, or SSR for personalised pages |
| **Client Components only where interactive**                   | keeps the JS bundle small                                                 | more thinking about the server/client boundary and serialisable props       | move the boundary lower if a big component is client-only for one button          |
| **TypeScript `strict`**                                        | catches shape errors at compile time, better refactoring                  | setup time; **types vanish at runtime**, so API data still needs validation | add a schema library (Zod) to derive types from validators                        |
| **REST + JSON** (vs. GraphQL)                                  | simple, cacheable, easy to test with curl                                 | over/under-fetching for complex screens                                     | GraphQL or a BFF if screens need many joined resources                            |
| **JWT access token, 15 min** (vs. server sessions)             | stateless, any instance can verify                                        | **hard to revoke** before expiry                                            | add refresh tokens (HttpOnly cookie) and a deny-list for logout-everywhere        |
| **Token in `sessionStorage`** (demo)                           | simple                                                                    | readable by injected scripts (XSS)                                          | HttpOnly `SameSite` cookie + CSRF protection                                      |
| **SQL (SQLite in the demo)** (vs. NoSQL)                       | relational data (users, courses, saves), constraints, joins, transactions | SQLite is single-writer and file-based                                      | PostgreSQL in production                                                          |
| **Constraints in the DB** as well as validation in code        | the database is the last line of defence against races                    | duplicated rules (code and schema)                                          | generate one from the other                                                       |
| **`PUT` for save, `INSERT OR IGNORE`**                         | idempotent: safe to retry, no duplicates                                  | slightly less obvious than a `POST`                                         | none, it is the right shape                                                       |
| **Offset pagination**                                          | simple, supports "page 3"                                                 | slow on huge tables, can skip/repeat rows while data changes                | cursor pagination for feeds                                                       |
| **One error shape + request id; generic 500**                  | the client has one error path; no internals leaked                        | a bit more code                                                             | add error tracking (Sentry)                                                       |
| **Memoization only after measuring**                           | avoids noise and wrong deps                                               | an unmeasured hot spot could slip through                                   | React Compiler                                                                    |
| **Serve UI and API from one origin** (demo)                    | no CORS needed                                                            | couples deployments                                                         | add a CORS allow-list if split                                                    |
| **Retry only idempotent requests (and `POST` with a key)**     | avoids duplicate orders                                                   | more client code                                                            | a library (e.g. TanStack Query)                                                   |

## 7. Limitations you should admit (honesty is a strength)

- No **refresh tokens**, no **rate limiting on login** (brute force), no **email verification**.
- Search uses `LIKE '%text%'`: no full-text index, and `%`/`_` act as wildcards (`?q=%` returned all 12 courses).
- Offset pagination only; no caching layer.
- Tests are API and unit level; a real project also needs a browser-level end-to-end suite and CI.
- No monitoring or metrics beyond logs with request ids.
- `[YOUR PROJECT]`: add two or three limitations that are true of your repo.

## 8. Follow-up questions to expect (with short answers)

| Question                             | Answer                                                                                                                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What was the hardest bug?            | Pick a real one. Example from this build: a request over the 10 kb body limit returned **500** instead of **413** because the body-parser error wasn't handled; I found it by probing edge cases and added a test.              |
| How do you know it works?            | Automated tests (19 API, 15 client, 18 DSA) plus tracing the feature in a real browser.                                                                                                                                         |
| How would it scale?                  | Stateless API instances behind a load balancer (JWT helps), PostgreSQL with indexes and read replicas, caching for the catalogue (it is static/ISR already), a CDN.                                                             |
| How do you secure it?                | Hashed passwords, short-lived JWT with pinned algorithm, role checks on the server, parameterised SQL, input validation, body size limit, HTTPS, no internals in errors. Next: rate limiting, refresh tokens, security headers. |
| What would you do with another week? | Refresh tokens and logout, rate limiting, cursor pagination, a schema validator, end-to-end tests in CI, error tracking.                                                                                                        |
| What did you learn?                  | Say one honest, specific thing: e.g. "401 versus 403 and idempotency changed how I design endpoints."                                                                                                                           |
| What would you do differently?       | e.g. start with a schema validator and types generated from it, and write the error format first.                                                                                                                               |

## 9. Fill-in template for YOUR real LearningHub

Write one line for each, then say them aloud as a 2-minute story.

```
Problem it solves:        [YOUR PROJECT]
Users:                    [YOUR PROJECT]
Stack (front / back / db):[YOUR PROJECT]
My part vs the team's:    [YOUR PROJECT]   <- be precise about what YOU built
3 key features:           [YOUR PROJECT]
One feature end to end:   [YOUR PROJECT]
3 decisions + trade-offs: [YOUR PROJECT]
A hard bug and the fix:   [YOUR PROJECT]
What I'd improve:         [YOUR PROJECT]
A number to quote:        [YOUR PROJECT]   (load time, test count, users, rows)
```

## 10. Common mistakes in project explanations

1. Starting with the tech stack list instead of **the problem and the user**.
2. Saying "we" for everything, so the interviewer can't tell what **you** did.
3. Describing features but **no decisions or trade-offs**.
4. Claiming it is perfect. Name real weaknesses and a plan.
5. Going deep into code line by line. Stay at the **architecture level**, and go deeper only when asked.
6. No numbers. One concrete figure (tests, latency, rows) adds credibility.
7. Not being able to trace **one feature end to end**.
8. Describing things you didn't build. Follow-ups will expose it.

## 11. Predict the questions (practice)

**Q1** "Why did you render the catalogue on the server instead of fetching it in the browser?"
**Q2** "A user's token was stolen. What happens, and what would you improve?"
**Q3** "Two requests to save the same course arrive at the same time. What happens?"
**Q4** "How would you add a 'popular courses' list that is expensive to compute?"
**Q5** "What breaks first if traffic grows 100 times?"

## 12. Answers

- **Q1:** The catalogue is the same for everyone and changes rarely, so rendering it at build time (with a revalidate window) gives the **fastest first paint, good SEO and less client JavaScript**; the cost is staleness, handled by ISR or on-demand revalidation.
- **Q2:** The thief can use it until it **expires (15 minutes)**; stateless JWTs can't be revoked individually. Improve with refresh tokens, a deny-list for logout, an `HttpOnly` cookie to reduce XSS theft, and anomaly detection.
- **Q3:** Both run `INSERT OR IGNORE` against the composite primary key. **One row is created, both requests return 200**, and the database constraint guarantees no duplicate even under a race.
- **Q4:** Compute it **off the request path** (a scheduled job or a cached query), store the result, and serve it from a cache with a revalidate time; add an index for the underlying query.
- **Q5:** Likely the **database** (SQLite file, offset pagination, `LIKE` search) before the stateless API tier. Move to PostgreSQL, add indexes and caching, and scale API instances horizontally.

## Recap

- Pitch (30 s) → picture (architecture) → one feature **end to end** → **decisions and trade-offs** → limitations → what's next.
- Every decision: **"X over Y because Z; the cost is W; I'd change it when V."**
- Be exact about what you built. Replace every `[YOUR PROJECT]` with your real facts.

## Checklist

- [ ] I can give the 30-second pitch without notes
- [ ] I can draw the architecture and name each layer's job
- [ ] I can trace "Save a course" (or my own feature) in 7 steps
- [ ] I can justify 5 decisions with their trade-offs
- [ ] I can name 3 real limitations and what I'd do next
- [ ] I filled in the template with my real project's facts
