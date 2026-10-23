# 02 - REST API Design: Resources, Routes, Pagination, Errors

> **Time to learn:** ~50 min | **Level:** Core concept | **Interview frequency:** High
> Read `01-http-methods-status-codes.md` first. Every response below came from the API in `08-project-trace-ui-to-db.md`.

## 1. The one idea

REST (as used day to day) means: **model your API as nouns (resources) and use the HTTP method as the verb.** The URL says _what_, the method says _what to do with it_.

```
GET    /api/courses            list courses
GET    /api/courses/7          one course
POST   /api/courses            create a course
PUT    /api/me/saved/7         save course 7 for me
DELETE /api/me/saved/7         unsave it
```

## 2. Analogy

A library. **Nouns** are the shelves and books (`/courses`, `/courses/7`). The **verbs** are always the same four or five things you can do with a book (look, add, replace, remove). You never invent a shelf called `/getBookNumberSeven`.

## 3. The rules

| Rule                                                         | Good                                            | Bad                              |
| ------------------------------------------------------------ | ----------------------------------------------- | -------------------------------- |
| Nouns, plural, lowercase                                     | `/courses`                                      | `/getCourses`, `/Course`         |
| The method is the verb                                       | `DELETE /courses/7`                             | `POST /courses/7/delete`         |
| Nest only to show ownership                                  | `/users/3/saved` (or `/me/saved`)               | `/a/b/c/d/e/f`                   |
| Filter, sort, page with the **query string**                 | `/courses?level=Beginner&page=2`                | `/courses/beginner/page/2`       |
| Real status codes                                            | 201 after create, 404 missing                   | 200 + `{ "success": false }`     |
| **One consistent error shape**                               | `{ "error": { "code", "message", "details" } }` | each endpoint different          |
| Stateless: the request carries what the server needs (token) | `Authorization: Bearer ...`                     | "remember me from the last call" |
| Version when you must break clients                          | `/api/v2/...`                                   | silently change responses        |

`/me/...` is a handy convention for "the logged-in user": the server knows who from the **token**, so the client doesn't need to (and can't lie about) the user id.

## 4. The API we use (LearningHub)

| Method + path                             | Auth      | Success                            | Failures                                                |
| ----------------------------------------- | --------- | ---------------------------------- | ------------------------------------------------------- |
| `POST /api/auth/register`                 | none      | 201 `{ user }`                     | 422 invalid, 409 email taken                            |
| `POST /api/auth/login`                    | none      | 200 `{ token, user }`              | 401 (same message for wrong password and unknown email) |
| `GET /api/courses?level=&q=&page=&limit=` | none      | 200 `{ data, page, limit, total }` | 422 bad level                                           |
| `GET /api/courses/:id`                    | none      | 200 course                         | 404                                                     |
| `POST /api/courses`                       | **admin** | 201 + `Location` header            | 401, **403**, 422, 409                                  |
| `GET /api/me/saved`                       | login     | 200 `{ data }`                     | 401                                                     |
| `PUT /api/me/saved/:courseId`             | login     | 200 `{ saved, courseId }`          | 401, 404                                                |
| `DELETE /api/me/saved/:courseId`          | login     | 204                                | 401                                                     |

### Why `PUT /api/me/saved/7` and not `POST /api/me/saved`?

Because "course 7 is saved" is a **state** you set. The client already knows the identifier, repeating the request changes nothing, and the server can safely `INSERT OR IGNORE`. That makes it **idempotent**, so a client can retry it after a timeout without worrying (see `06`). `POST` would suit "create something and let the server choose the id".

## 5. Pagination

Never return an unbounded list. The list endpoint uses **page + limit** and returns metadata so the UI can build "Load more":

```json
GET /api/courses?page=2&limit=2
{ "data": [ {"id":3, ...}, {"id":4, ...} ], "page": 2, "limit": 2, "total": 12 }
```

Behaviour I checked by running the API (12 seeded courses):

| Request                                 | Result                                                             |
| --------------------------------------- | ------------------------------------------------------------------ |
| `?page=2&limit=2`                       | ids `3, 4`; `total: 12`                                            |
| `?level=Beginner&limit=1`               | 1 item, `total: 5` (total counts **after filtering**)              |
| `?q=react`                              | `total: 4` (search is case-insensitive: `?q=REACT` gives the same) |
| `?level=Intermediate&q=react`           | `total: 3` (filters combine with AND)                              |
| `?limit=1000`                           | the server **caps** it: `limit: 50`                                |
| `?page=0` or `?page=-3` or `?limit=abc` | falls back to `page: 1` / `limit: 5`                               |
| `?page=99`                              | `200` with `data: []` (an empty page is not an error)              |
| `?level=Expert` or `?level=beginner`    | **422** (values are validated, and they are case-sensitive here)   |

**Offset pagination** (`LIMIT 5 OFFSET 10`) is simple and lets users jump to page N, but it gets slow on huge tables and can skip or repeat rows if data changes between requests. **Cursor pagination** (`?after=<last id>`) is faster and stable and suits infinite scroll, but you can't jump to a page. For an interview: _"offset for small admin tables, cursor for feeds."_

## 6. A consistent error shape

Every failure from this API looks the same, so the client needs **one** error handler:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid level",
    "details": { "level": "Must be one of: Beginner, Intermediate, Advanced" }
  }
}
```

- `code` is a stable machine-readable string the UI can switch on (`UNAUTHORIZED`, `NOT_FOUND`, `CONFLICT`...).
- `message` is for humans (and can change).
- `details` carries per-field problems for forms.
- Unexpected errors return a **generic** body with a `requestId` (see `07`); internals never leak.

## 7. Input validation: trust nothing

The body, query string, params and headers all come from a stranger. Validate **type, range and format** on the server (the browser's validation is a convenience, not security). The register route checks the email format and a minimum password length and answers **422** with field-level details; the list route validates `level` against a fixed list. In larger apps you would use a schema library (Zod, Joi) instead of hand-written checks; the principle is the same.

## 8. Common mistakes

1. Verbs in URLs (`/createCourse`).
2. Returning everything with no pagination.
3. Different error shapes per endpoint.
4. `200 OK` with an error message in the body.
5. Putting the **user id in the URL** and trusting it (`/users/5/saved`) instead of reading it from the token. Anyone could change 5 to 6 (an **IDOR** bug).
6. Not validating query params (`?limit=-1`, `?limit=100000000`).
7. Leaking the database shape, or the password hash, in responses (`register` returns only `id`, `email`, `role`).
8. Returning `404` vs `403` inconsistently (be deliberate: sometimes `404` hides that a resource exists).
9. Forgetting that `LIKE` treats `%` and `_` as wildcards: `?q=%` returned **all 12** courses here. Harmless in this app, but escape them if the search must be literal.
10. Making a list endpoint that returns a bare array. An object (`{ data, page, ... }`) lets you add fields later without breaking clients.

## 9. Predict the output

(12 courses are seeded, ids 1 to 12.)

**Q1** `GET /api/courses?page=2&limit=2`. Which ids come back and what is `total`?

**Q2** `GET /api/courses?limit=1000`. How many items and what does `limit` say in the response?

**Q3** `GET /api/courses?page=99`. Status and `data`?

**Q4** Which is better REST design, and why: `POST /api/saveCourse` with `{ "courseId": 7 }`, or `PUT /api/me/saved/7`?

**Q5** `GET /api/courses?level=Beginner&q=react`. Is `total` 5, 4, or something else? (Beginner has 5 courses and 4 titles contain "react", but the filters are combined.)

## 10. Answers

- **Q1:** ids `[3, 4]`, `total: 12`.
- **Q2:** all 12 items (there are only 12); `limit: 50` (capped by the server).
- **Q3:** `200` and `data: []`, with `page: 99`, `total: 12`.
- **Q4:** `PUT /api/me/saved/7`: noun in the URL, method as the verb, **idempotent** (safe to retry), and the user comes from the token.
- **Q5:** `total: 1`. Both filters apply (AND): only **React Fundamentals** is Beginner _and_ has "react" in the title. (The other three "react" titles are Intermediate.)

## Recap

- **Nouns in the URL, verbs as methods**, query string for filter/sort/page, real status codes.
- Paginate every list; return `{ data, page, limit, total }`; **cap** the limit.
- One **consistent error shape** with a stable `code`.
- Validate everything on the server. Take the user from the **token**, never from the URL or body.
- Offset pagination = simple; cursor pagination = scalable.

## Checklist

- [ ] I can turn a feature ("save a course") into a resource + method + status code
- [ ] I can explain why `PUT` is idempotent and why that helps retries
- [ ] I can design a paginated list response and cap the limit
- [ ] I can describe a consistent error format
- [ ] I can explain offset vs cursor pagination
- [ ] I got Q1 to Q5 right without looking
