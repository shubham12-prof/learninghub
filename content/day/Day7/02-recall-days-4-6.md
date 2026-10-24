# 02 - Recall Test: Days 4 to 6 (React Performance + CSS, Next.js + TypeScript, Full-stack)

> **Time:** ~60 min | **Type:** Memory test, **no notes** | **Questions:** 32
> Same rules as `01-recall-days-1-3.md`: answer aloud first, then score 0 / 1 / 2. Numbers (contrast ratios, status codes, JWT errors, retry behaviour) were checked by running code.
> **Score:** 58 to 64 = interview-ready · 45 to 57 = fix weak spots · below 45 = redo that day.

---

## Part 1: Questions

### Day 4: React performance and CSS

**1.** Does a parent re-render re-render its children? How do you stop wasted renders?

**2.** What does `React.memo` do? Why can a memoized component still re-render?

**3.** `useMemo` vs `useCallback`: what does each cache, and when should you NOT use them?

**4.** How can you avoid re-renders **without** `memo` (two free techniques)?

**5.** How do you find a slow or over-rendering component? What does the React Compiler change?

**6.** Flexbox vs Grid: when do you use each? What do `justify-content` and `align-items` control?

**7.** Write a responsive card grid with **no media queries**. What is the difference between `auto-fit` and `auto-fill`?

**8.** Name five accessibility basics. What contrast ratio does normal text need, and does `#aaa` on white pass?

### Day 5: Next.js and TypeScript

**9.** Server Components vs Client Components: what can each do? What does `"use client"` mean, and how do you keep a Server Component inside a Client one?

**10.** Define CSR, SSR, SSG and ISR in one line each. What do `○`, `●` and `ƒ` mean in `next build`?

**11.** A page has `export const revalidate = 5` and was built at 10:00:00. Visitors come at 10:00:02, 10:00:08 and 10:00:09. What does each see?

**12.** What turns a static route into a dynamic one? What does `generateStaticParams` do, and what happens for a slug it didn't list?

**13.** In Next.js 16, how do you read `params` in a page?

**14.** `interface` vs `type`. What is a discriminated union and why use one for loading/error/success?

**15.** Write a generic `first` function. What does `Partial`, `Pick`, `Omit` and `Record` do?

**16.** `unknown` vs `any`. Do TypeScript types exist at runtime? What follows from that for API data?

**17.** What are the types of `const x = 5`, `let y = 5`, `[1, "a"]` and `(n: number) => (n > 0 ? "pos" : 0)`?

**18.** Write the skeleton of a Next.js Route Handler that returns 201, 400 and 422 in the right situations.

### Day 6: Full-stack

**19.** Walk through the request-response flow of clicking "Save" in the UI, all the way to the database and back.

**20.** What is the difference between a **safe** and an **idempotent** method? Which methods are which?

**21.** When do you return 400, 401, 403, 404, 409 and 422? Also 201 and 204.

**22.** What is CORS? Who enforces it, and what is a preflight?

**23.** What makes an API "RESTful"? Describe good pagination and a good error format.

**24.** What is a JWT? What is in it, and is it encrypted? What attacks should you know?

**25.** How do you store passwords? Why a salt, why slow, why `timingSafeEqual`?

**26.** Sessions vs JWT: compare them, including logout/revocation and where to keep the token in the browser.

**27.** SQL: write a JOIN, explain an index, a transaction and a foreign key with `ON DELETE CASCADE`.

**28.** What is SQL injection and how do you prevent it?

**29.** How do you handle errors on the server so users get a helpful message and attackers get nothing useful?

**30.** A request to your API times out. When is it safe to retry? What do you do about `429`, and what is jitter?

**31.** Sliding window: why is "longest substring without repeating characters" O(n) even though there is a `while` inside a `for`?

**32.** In `fetch`, which of these throw: a 500 response, a refused connection, a timeout? What does the client do for each?

---

## Part 2: Answer key (cover until you've answered)

### Day 4

**1.** **Yes**, by default every child re-renders when the parent does, even with identical props. Fixes: **move state down** to the component that needs it, **pass `children`** (composition), then `React.memo` + stable props if still needed. _(`03-composition.md`, `07-interview-memoization.md`)_

**2.** `React.memo(Component)` **skips re-rendering when props are shallowly equal** to last time (each prop compared with `Object.is`). It still re-renders if a prop is a **new reference** every render (inline object, array or function), if its own state changes, or if it reads a **context** that changed. _(`01-memoization.md`)_

**3.** `useMemo` caches a **computed value**; `useCallback` caches a **function** (same as `useMemo(() => fn, deps)`). Use them to give a `memo`-wrapped child **stable props**, or to skip a genuinely **expensive** calculation. Don't use them on cheap work, when the child isn't memoized (no benefit), or "just in case": they add cost and noise. **Measure first.** _(`02-usememo-usecallback.md`)_

**4.** **Lift state down** (put state next to the part that uses it, so the rest doesn't re-render) and **composition** (`children` / slot props created higher up keep their element references, so React skips them when the wrapper's state changes). In Day 4's card page, typing 3 characters in the Notes box caused **36** card renders (12 per keystroke after the first render); after the fixes, **0**.

**5.** **React DevTools Profiler** (and "highlight updates"), or a render counter, to see what renders and why. Then apply the free fixes, then `memo`. The **React Compiler** auto-memoizes components and values at build time, so hand-written `memo`/`useMemo`/`useCallback` is needed far less often. _(`07-interview-memoization.md`)_

**6.** **Flexbox is one-dimensional** (a row or a column: navbars, centring, card content); **Grid is two-dimensional** (rows and columns together: page layouts, card galleries). In flexbox `justify-content` aligns along the **main axis** and `align-items` along the **cross axis** (they swap when `flex-direction: column`). _(`04-flexbox.md`, `05-grid.md`)_

**7.** `grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 1rem;`. **`auto-fill`** keeps empty column tracks, so a few cards stay at their natural width; **`auto-fit`** collapses empty tracks, so the cards **stretch** to fill the row.

**8.** Semantic HTML (`button`, `nav`, `main`, headings), **labels** for inputs, **keyboard** operability, a **visible focus** style, text alternatives (`alt`), sufficient **contrast**, not relying on colour alone, and `aria-*` only when native HTML can't do it. Normal text needs **4.5:1** (large text 3:1). `#aaa` on white is **2.32:1**, so it **fails**; `#767676` is 4.54:1, the lightest grey that passes. _(`08-project-responsive-accessible.md`)_

### Day 5

**9.** **Server Components** (the default in the App Router) run on the server: they can be `async`, read databases and secrets, and send **no JS** to the browser, but they can't use state, effects, event handlers or browser APIs. **Client Components** (`"use client"` at the top of a file) hydrate in the browser and can use state, effects and handlers. `"use client"` marks the **boundary**: that file and what it imports become client code. Pass Server Components into Client ones as **`children`/props**; props across the boundary must be serialisable. _(`02-server-client-components.md`)_

**10.** **CSR**: the browser builds the HTML (fetches after load). **SSR**: the server builds the HTML **per request**. **SSG**: built **once at build time**. **ISR**: SSG that is **re-built in the background** after a time window. `○` = static, `●` = SSG with `generateStaticParams`, `ƒ` = dynamic (rendered on demand). _(`03-rendering-strategies.md`)_

**11.** 10:00:02 sees the **build-time** page (inside the window). 10:00:08 is after the window but **still gets the old page**, and triggers a background rebuild. 10:00:09 gets the **new** page. That is **stale-while-revalidate**: nobody waits for the rebuild.

**12.** Using request-time data (`cookies()`, `headers()`, `searchParams`), `export const dynamic = "force-dynamic"`, or `fetch(..., { cache: "no-store" })`. **`generateStaticParams`** lists the params to **pre-build**. An unlisted slug is rendered on first request and then cached, or returns **404** if `dynamicParams = false`.

**13.** `params` is a **Promise**: `export default async function Page({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; ... }`. The same applies to `searchParams`.

**14.** Both describe object shapes. **Interfaces** can be extended and merged; **types** can also express unions, tuples and mapped types. A **discriminated union** is a union with a shared literal tag, e.g. `{ status: "loading" } | { status: "error"; message: string } | { status: "success"; data: Course[] }`. Checking `status` **narrows** the type, so you can't read `data` while loading, and the compiler flags unhandled cases. _(`04-typescript-types.md`)_

**15.** `function first<T>(items: T[]): T | undefined { return items[0]; }`. `Partial<T>` makes all properties optional; `Pick<T, K>` keeps only some; `Omit<T, K>` drops some; `Record<K, V>` is an object type with keys `K` and values `V`.

**16.** `any` switches type checking off; **`unknown`** accepts anything but forces you to **narrow** it before use. Types are **erased at runtime**, so TypeScript can't check data that arrives from outside (JSON from an API, form input): **validate it** (a schema library or manual checks) and only then treat it as typed.

**17.** `const x = 5` is the literal type **`5`**; `let y = 5` widens to **`number`**; `[1, "a"]` is **`(string | number)[]`**; the function returns **`"pos" | 0`** (a union of literals).

**18.** Roughly:

```ts
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  } // cannot parse
  if (!isValidCourse(body))
    return Response.json({ error: "Invalid course" }, { status: 422 }); // parsed but invalid
  const created = await createCourse(body);
  return Response.json(created, { status: 201 }); // created
}
```

_(`05-api-routes.md`)_

### Day 6

**19.** The click handler calls `api("/api/me/saved/1", { method: "PUT" })`, a `fetch` wrapper that adds `Authorization: Bearer <token>`. The browser sends the request (a **preflight** first if cross-origin). On the server: a **request-id and logging** middleware, then `express.json` (body parsing), then **`requireAuth`** (verifies the JWT, sets `req.user`), then the route handler, which checks the course exists and runs a **parameterised SQL** `INSERT OR IGNORE`. The server answers `200 { saved: true }`; the UI checks `res.ok`, updates state (the button shows "Saved"), and a failure shows an error message instead. If anything throws, the **error middleware** turns it into the standard JSON error. _(`08-project-trace-ui-to-db.md`)_

**20.** **Safe** = does not change server state (`GET`, `HEAD`, `OPTIONS`). **Idempotent** = repeating it leaves the **same state** (`GET`, `PUT`, `DELETE`, plus `HEAD` and `OPTIONS`). **`POST` is neither**, `PATCH` isn't guaranteed idempotent. Idempotency decides whether a request can be **retried** safely.

**21.** **400** malformed request (e.g. broken JSON); **401** not authenticated (missing/invalid/expired token); **403** authenticated but **not allowed**; **404** no such resource; **409** conflict with current state (duplicate email); **422** well-formed but fails validation; **201** created (with `Location`); **204** success with no body (`DELETE`).

**22.** A **browser** rule: JavaScript on one origin may not **read** responses from another origin unless the server sends `Access-Control-Allow-Origin`. The **server still runs** a simple request; the browser just hides the response. Non-simple requests (JSON content type, `Authorization`, `PUT`/`DELETE`) first send an **`OPTIONS` preflight**; if it isn't allowed, the real request is never sent. (Verified in Chromium.) `curl` and server-to-server calls aren't affected. The fix is on the server (or serve UI and API from the same origin).

**23.** **Nouns** for URLs (`/courses/7`), the **method is the verb**, query strings for filter/sort/page, correct status codes, stateless requests. **Pagination**: `?page=2&limit=5` returning `{ data, page, limit, total }`, with a **capped** limit; offset for small tables, **cursor** for feeds. **Errors**: one consistent shape, `{ error: { code, message, details } }`, with a stable `code`. _(`02-rest-api-design.md`)_

**24.** A signed token: `header.payload.signature`, each **base64url**. Payload holds claims (`sub`, `role`, `iat`, `exp`). It is **signed, not encrypted**: anyone can read the payload, so no secrets in it. Attacks: **tampering** with the payload (the signature check fails: `invalid signature`), **`alg: none`** forgery (pin `algorithms: ["HS256"]`; it gives `jwt signature is required`), **expired** tokens (`TokenExpiredError`), and using **`decode` instead of `verify`**. Use a long random secret and short expiry. _(`03-authentication.md`)_

**25.** Never store or encrypt them; store a **salted, slow hash** (scrypt, bcrypt or argon2). The **salt** (random per user) means identical passwords give different hashes and defeats lookup tables; **slow** makes brute force expensive; **`timingSafeEqual`** avoids leaking information through comparison time. Return the **same error** for unknown email and wrong password.

**26.** **Session**: the server stores the state and the client holds a random id in a cookie; **easy to revoke**, needs a shared store when scaling. **JWT**: the client holds signed claims, the server verifies the signature, **stateless** and easy to scale but **hard to revoke** before expiry (use short-lived tokens + refresh tokens or a deny-list). Browser storage: JS-readable storage (`localStorage`/`sessionStorage`) is exposed to **XSS**; an **`HttpOnly`** cookie isn't readable by scripts but needs **CSRF** protection (`SameSite`, tokens).

**27.** `SELECT c.title FROM saved_courses s JOIN courses c ON c.id = s.course_id WHERE s.user_id = ?`. An **index** is a sorted lookup structure: the query plan changes from `SCAN` (every row) to `SEARCH ... USING INDEX`; it speeds reads and slows writes. A **transaction** makes several statements all-or-nothing (`BEGIN` ... `COMMIT`/`ROLLBACK`). A **foreign key** forces a value to exist in another table; **`ON DELETE CASCADE`** deletes the dependent rows automatically (in SQLite you must set `PRAGMA foreign_keys = ON`). _(`04-databases-basics.md`)_

**28.** Attacker-controlled text becomes part of the SQL (`' OR '1'='1` matched the whole table: 1 row vs 0 with a parameter). Prevent it with **parameterised queries** (`WHERE email = ?`), never string concatenation; allow-list anything you can't parameterise (column names); validate input; use a least-privilege database user.

**29.** Separate **expected** errors (a custom `HttpError` with a status and stable `code`: 400/401/403/404/409/422) from **bugs**. Bugs are **logged in full** on the server and the client gets a **generic 500** with a **request id**, so users can report it and you can find the log, but stack traces and SQL never leak. One error-handling middleware at the end of the chain; unknown routes return a JSON 404; oversized bodies return 413. _(`07-interview-request-response-jwt-errors.md`)_

**30.** Retry **idempotent** methods (`GET`, `PUT`, `DELETE`) on **network errors, timeouts, 5xx, 408 and 429**; **never** retry other 4xx (it will fail again). Retry `POST` only with an **`Idempotency-Key`** the server replays. Use **exponential backoff** (delay doubles, up to a cap) and **honour `Retry-After`** on 429/503. **Jitter** adds randomness to the delay so many clients don't retry at the same moment (a thundering herd). _(`06-coding-api-integration.md`)_

**31.** `left` and `right` only ever **move forward**. Each character is added to the window once and removed at most once, so the total work is at most **2n**, i.e. **O(n)**. Space is O(k) for the set (k = distinct characters). The brute force is O(n^3). _(`05-coding-dsa-problem.md`)_

**32.** A **500 response does not throw**: check `res.ok`, then retry if the method is safe. A **refused connection** throws a `TypeError` ("fetch failed") and a **timeout** (via `AbortSignal.timeout`) throws a `TimeoutError`: both are retryable for safe methods. In the Day 6 client they map to `ApiError` (HTTP), `NetworkError` and `TimeoutError`, so the UI can show a different message for each.

---

## Weak spots (fill this in)

| Q#  | Score (0/1/2) | File to re-read | Re-tested tomorrow? |
| --- | ------------- | --------------- | ------------------- |
|     |               |                 | [ ]                 |
|     |               |                 | [ ]                 |
|     |               |                 | [ ]                 |
|     |               |                 | [ ]                 |

## Recap

- Day 4: **state placement and composition first, `memo` second, measure always**; Flexbox is 1D, Grid is 2D; contrast 4.5:1.
- Day 5: **where and when HTML is produced** (CSR/SSR/SSG/ISR); Server vs Client Components; **types vanish at runtime**.
- Day 6: **401 vs 403**, safe vs idempotent, CORS is a browser rule, JWT is signed not secret, parameters stop injection, retry only what is safe.

## Checklist

- [ ] I answered aloud before checking
- [ ] I scored honestly and filled in the weak-spot table
- [ ] Score 58 or more, or I have a retest plan
- [ ] I can do questions 19, 24 and 30 in under 90 seconds each
