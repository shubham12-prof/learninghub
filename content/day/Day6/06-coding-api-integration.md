# 06 - Coding: API Integration Exercise (Today's 1 Integration Exercise)

> **Time to learn:** ~100 min | **Level:** Coding | **Interview frequency:** High (take-home tasks and "build a small client" rounds)
> The mock server, the client and **15 tests** all ran with Node 22 (`node --test`). You need no installs: `fetch`, `AbortSignal.timeout` and `node:http` are built in.

## 1. The task

Build a small **API client** (`client.js`) that talks to a deliberately badly behaved server, and make all the tests in `client.test.js` pass. This is what "practising API integration" really is: **the happy path is easy; the work is everything that goes wrong.**

Your client must:

1. **Log in** and send the token as `Authorization: Bearer ...`.
2. **Throw a useful error** for non-2xx responses (`ApiError` with `status` and `body`), for timeouts (`TimeoutError`) and for network failures (`NetworkError`). Remember `fetch` does not throw on 404.
3. **Handle a body that isn't valid JSON** without crashing.
4. **Retry** transient failures (network error, timeout, 408, 429, 5xx) with **exponential backoff + jitter**; **never retry** other 4xx.
5. Honour **`Retry-After`** on 429.
6. **Renew an expired session once** (on 401, log in again and repeat the request).
7. Only retry `POST` if it carries an **`Idempotency-Key`**.
8. **Follow pagination** until `nextPage` is `null`.
9. Provide `mapLimit(items, limit, fn)` to run requests **with limited concurrency**, keeping result order.

## 2. Analogy

Ordering by phone from a shop with a bad line. You **time-box** how long you hold, **redial** when the line drops (but wait a little longer each time, and not all at the same second), **don't reorder** a pizza you may already have ordered (the idempotency key is your order number), and if the shop says "call back in a minute" (`Retry-After`), you **do**.

## 3. The mock server

Save as `mock-server.js`. It misbehaves on purpose:

| Endpoint                       | Behaviour                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /login`                  | `ada` / `pw` gives a token; anything else gives 401                                                                                   |
| `GET /courses?page=&pageSize=` | needs the token; 23 courses; returns `{ data, page, pageSize, total, nextPage }`                                                      |
| `GET /__expire`                | invalidates the token (simulates expiry)                                                                                              |
| `GET /missing`                 | always 404                                                                                                                            |
| `GET /flaky`                   | **500, 500, then 200**                                                                                                                |
| `GET /limited`                 | **429 with `Retry-After: 1`**, then 200                                                                                               |
| `GET /slow?ms=`                | answers after `ms` milliseconds                                                                                                       |
| `GET /not-json`                | `200` + `Content-Type: application/json` but an HTML body                                                                             |
| `POST /always-500`             | always 500                                                                                                                            |
| `POST /orders`                 | saves the order, but the **first reply per `Idempotency-Key` is a lost `503`**; a repeat with the same key returns the **same** order |

```js
import http from "node:http";

// A tiny in-memory API that misbehaves on purpose, so you can practise integration problems.
export function startMockServer() {
  const state = {
    token: null,
    tokensIssued: 0,
    flakyCalls: 0,
    limitedCalls: 0,
    orders: new Map(),
    lossy: new Set(),
    inFlight: 0,
    maxInFlight: 0,
    log: [],
  };
  const COURSES = Array.from({ length: 23 }, (_, i) => ({
    id: i + 1,
    title: `Course ${i + 1}`,
  }));

  const send = (res, status, body, headers = {}) => {
    res.writeHead(status, { "Content-Type": "application/json", ...headers });
    res.end(body === undefined ? undefined : JSON.stringify(body));
  };
  const readJson = (req) =>
    new Promise((resolve) => {
      let raw = "";
      req.on("data", (chunk) => (raw += chunk));
      req.on("end", () => {
        try {
          resolve(raw ? JSON.parse(raw) : {});
        } catch {
          resolve(null);
        }
      });
    });
  const authorised = (req) =>
    state.token !== null &&
    req.headers.authorization === `Bearer ${state.token}`;

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    state.log.push(`${req.method} ${url.pathname}`);

    if (req.method === "POST" && url.pathname === "/login") {
      const body = await readJson(req);
      if (body?.username === "ada" && body?.password === "pw") {
        state.token = `token-${++state.tokensIssued}`;
        return send(res, 200, { token: state.token });
      }
      return send(res, 401, { error: "Bad credentials" });
    }

    if (url.pathname === "/__expire") {
      state.token = null;
      return send(res, 204);
    } // simulate an expired session

    if (req.method === "GET" && url.pathname === "/courses") {
      if (!authorised(req)) return send(res, 401, { error: "Unauthorized" });
      const page = Number(url.searchParams.get("page") ?? 1);
      const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
      const start = (page - 1) * pageSize;
      const data = COURSES.slice(start, start + pageSize);
      return send(res, 200, {
        data,
        page,
        pageSize,
        total: COURSES.length,
        nextPage: start + pageSize < COURSES.length ? page + 1 : null,
      });
    }

    if (req.method === "GET" && url.pathname === "/missing")
      return send(res, 404, { error: "Nope" });

    if (req.method === "GET" && url.pathname === "/flaky") {
      // fails twice, then works
      state.flakyCalls += 1;
      return state.flakyCalls <= 2
        ? send(res, 500, { error: "Boom" })
        : send(res, 200, { ok: true, attempts: state.flakyCalls });
    }

    if (req.method === "POST" && url.pathname === "/always-500")
      return send(res, 500, { error: "Boom" }); // for the "POST is not retried" test

    if (req.method === "GET" && url.pathname === "/limited") {
      // rate limit once
      state.limitedCalls += 1;
      return state.limitedCalls === 1
        ? send(res, 429, { error: "Slow down" }, { "Retry-After": "1" })
        : send(res, 200, { ok: true });
    }

    if (req.method === "GET" && url.pathname === "/slow") {
      const ms = Number(url.searchParams.get("ms") ?? 2000);
      state.inFlight += 1;
      state.maxInFlight = Math.max(state.maxInFlight, state.inFlight);
      return setTimeout(() => {
        state.inFlight -= 1;
        send(res, 200, { waited: ms });
      }, ms);
    }

    if (req.method === "GET" && url.pathname === "/not-json") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end("<html>oops</html>");
    }

    // Creates an order. The FIRST response for each idempotency key is lost (503) AFTER the order was saved.
    if (req.method === "POST" && url.pathname === "/orders") {
      const key = req.headers["idempotency-key"];
      const body = await readJson(req);
      if (key && state.orders.has(key))
        return send(res, 200, state.orders.get(key)); // replay: same order, no duplicate
      const order = { id: state.orders.size + 1, item: body?.item };
      state.orders.set(key ?? `no-key-${state.orders.size}`, order);
      if (key && !state.lossy.has(key)) {
        state.lossy.add(key);
        return send(res, 503, { error: "Gateway timeout" });
      }
      return send(res, 201, order);
    }

    send(res, 404, { error: "No such route" });
  });

  return new Promise((resolve) => {
    server.listen(0, () =>
      resolve({
        url: `http://localhost:${server.address().port}`,
        state,
        close: () => server.close(),
      }),
    );
  });
}
```

## 4. The tests (your specification)

Save as `client.test.js`. Run with `node --no-warnings --test client.test.js`.

```js
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  ApiClient,
  ApiError,
  NetworkError,
  TimeoutError,
  mapLimit,
} from "./client.js";
import { startMockServer } from "./mock-server.js";

let mock;
const make = (overrides = {}) =>
  new ApiClient({
    baseUrl: mock.url,
    credentials: { username: "ada", password: "pw" },
    baseDelayMs: 5,
    ...overrides,
  });

before(async () => {
  mock = await startMockServer();
});
after(() => mock.close());
beforeEach(() => {
  Object.assign(mock.state, {
    flakyCalls: 0,
    limitedCalls: 0,
    inFlight: 0,
    maxInFlight: 0,
    log: [],
  });
});

describe("auth", () => {
  test("login stores the token and later requests send it", async () => {
    const api = make();
    await api.login();
    const page = await api.request("/courses");
    assert.equal(page.data.length, 10);
  });

  test("bad credentials -> ApiError 401 (not retried)", async () => {
    const api = new ApiClient({
      baseUrl: mock.url,
      credentials: { username: "ada", password: "wrong" },
      baseDelayMs: 5,
    });
    await assert.rejects(
      api.login(),
      (e) => e instanceof ApiError && e.status === 401,
    );
    assert.equal(mock.state.log.filter((l) => l === "POST /login").length, 1);
  });

  test("an expired session is renewed once, transparently", async () => {
    const api = make();
    await api.login();
    await fetch(mock.url + "/__expire");
    mock.state.log = [];
    const page = await api.request("/courses");
    assert.equal(page.data.length, 10);
    assert.deepEqual(mock.state.log, [
      "GET /courses",
      "POST /login",
      "GET /courses",
    ]); // 401 -> login -> retry
  });
});

describe("errors and retries", () => {
  test("404 is an ApiError and is NOT retried", async () => {
    const api = make();
    await assert.rejects(
      api.request("/missing"),
      (e) =>
        e instanceof ApiError && e.status === 404 && e.body.error === "Nope",
    );
    assert.equal(mock.state.log.length, 1);
  });

  test("500 twice then success: retried with backoff", async () => {
    const data = await make().request("/flaky");
    assert.deepEqual(data, { ok: true, attempts: 3 });
    assert.equal(mock.state.log.length, 3);
  });

  test("gives up after maxRetries and throws the last error", async () => {
    const api = make({ maxRetries: 1 });
    await assert.rejects(
      api.request("/flaky"),
      (e) => e instanceof ApiError && e.status === 500,
    );
    assert.equal(mock.state.log.length, 2); // 1 try + 1 retry
  });

  test("429 honours Retry-After", async () => {
    const start = Date.now();
    const data = await make().request("/limited");
    assert.deepEqual(data, { ok: true });
    assert.ok(Date.now() - start >= 950, "waited about one second");
  });

  test("timeout -> TimeoutError", async () => {
    const api = make({ timeoutMs: 50, maxRetries: 0 });
    await assert.rejects(
      api.request("/slow?ms=500"),
      (e) => e instanceof TimeoutError,
    );
  });

  test("connection refused -> NetworkError", async () => {
    const api = new ApiClient({ baseUrl: "http://localhost:1", maxRetries: 0 });
    await assert.rejects(
      api.request("/x", { auth: false }),
      (e) => e instanceof NetworkError,
    );
  });

  test("a 200 whose body is not valid JSON -> ApiError, not a crash", async () => {
    await assert.rejects(
      make().request("/not-json"),
      (e) => e instanceof ApiError && /invalid JSON/.test(e.message),
    );
  });
});

describe("idempotency", () => {
  test("POST without a key is NOT retried (a retry could create a duplicate)", async () => {
    await assert.rejects(
      make().request("/always-500", { method: "POST", body: { item: "book" } }),
      (e) => e instanceof ApiError && e.status === 500,
    );
    assert.equal(mock.state.log.length, 1); // exactly one attempt
  });

  test("POST with an Idempotency-Key is retried and creates exactly one order", async () => {
    mock.state.orders.clear();
    mock.state.lossy.clear();
    const order = await make().request("/orders", {
      method: "POST",
      body: { item: "book" },
      idempotencyKey: "key-1",
    });
    assert.equal(order.item, "book");
    assert.equal(mock.state.orders.size, 1); // first attempt saved it, retry replayed it
  });
});

describe("pagination and concurrency", () => {
  test("getAll follows nextPage until it is null", async () => {
    const api = make();
    await api.login();
    const all = await api.getAll("/courses", { pageSize: 10 });
    assert.equal(all.length, 23);
    assert.deepEqual(
      all.map((c) => c.id),
      Array.from({ length: 23 }, (_, i) => i + 1),
    );
  });

  test("mapLimit keeps order and never exceeds the limit", async () => {
    const api = make();
    const results = await mapLimit([10, 20, 30, 40, 50, 60], 2, (ms) =>
      api.request(`/slow?ms=${ms}`),
    );
    assert.deepEqual(
      results.map((r) => r.waited),
      [10, 20, 30, 40, 50, 60],
    );
    assert.equal(mock.state.maxInFlight, 2);
  });

  test("mapLimit edge cases: empty list, limit larger than the list", async () => {
    assert.deepEqual(await mapLimit([], 3, async (x) => x), []);
    assert.deepEqual(await mapLimit([1, 2], 10, async (x) => x * 2), [2, 4]);
  });
});
```

## 5. Try it yourself first

Order of attack (each step turns more tests green):

1. `ApiClient.request`: `fetch` + JSON + the `ApiError` for `!res.ok`.
2. Add `login()` and the auth header.
3. Add the timeout (`AbortSignal.timeout(ms)`) and `NetworkError`.
4. Add the **retry loop** (retryable errors only).
5. Add backoff, `Retry-After`, and the one-time **re-login on 401**.
6. Add `idempotencyKey` handling, `getAll`, and `mapLimit`.

## 6. Reference solution

```js
export class ApiError extends Error {
  constructor(status, body, message = `HTTP ${status}`) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}
export class TimeoutError extends Error {
  name = "TimeoutError";
}
export class NetworkError extends Error {
  name = "NetworkError";
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const SAFE_TO_RETRY = new Set(["GET", "HEAD", "PUT", "DELETE", "OPTIONS"]); // idempotent methods

export class ApiClient {
  #token = null;

  constructor({
    baseUrl,
    credentials,
    timeoutMs = 3000,
    maxRetries = 3,
    baseDelayMs = 200,
    maxDelayMs = 5000,
  }) {
    Object.assign(this, {
      baseUrl,
      credentials,
      timeoutMs,
      maxRetries,
      baseDelayMs,
      maxDelayMs,
    });
  }

  async login() {
    const { token } = await this.request("/login", {
      method: "POST",
      body: this.credentials,
      auth: false,
      retry: false,
    });
    this.#token = token;
    return token;
  }

  /** One request with: auth header, JSON in/out, timeout, error mapping, retries with backoff, one re-login on 401. */
  async request(
    path,
    {
      method = "GET",
      body,
      headers = {},
      auth = true,
      retry,
      idempotencyKey,
    } = {},
  ) {
    const canRetry =
      retry ?? (SAFE_TO_RETRY.has(method) || idempotencyKey !== undefined); // POST only when it has a key
    const attempts = canRetry ? this.maxRetries + 1 : 1;
    let reloggedIn = false;

    for (let attempt = 1; ; attempt++) {
      try {
        return await this.#once(path, {
          method,
          body,
          headers,
          auth,
          idempotencyKey,
        });
      } catch (err) {
        // 401: the session expired. Log in again ONCE and repeat the request.
        if (
          err instanceof ApiError &&
          err.status === 401 &&
          auth &&
          this.credentials &&
          !reloggedIn
        ) {
          reloggedIn = true;
          await this.login();
          attempt--; // this repeat does not use up a retry
          continue;
        }
        if (attempt >= attempts || !this.#isRetryable(err)) throw err;
        await sleep(this.#delayFor(err, attempt));
      }
    }
  }

  async #once(path, { method, body, headers, auth, idempotencyKey }) {
    let res;
    try {
      res = await fetch(this.baseUrl + path, {
        method,
        headers: {
          Accept: "application/json",
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(auth && this.#token
            ? { Authorization: `Bearer ${this.#token}` }
            : {}),
          ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err) {
      if (err?.name === "TimeoutError")
        throw new TimeoutError(
          `Timed out after ${this.timeoutMs} ms: ${method} ${path}`,
        );
      throw new NetworkError(`Network error: ${method} ${path}`, {
        cause: err,
      }); // DNS, connection refused, offline...
    }

    let data = null;
    if (res.status !== 204) {
      const text = await res.text();
      const isJson = (res.headers.get("content-type") ?? "").includes("json");
      try {
        data = isJson && text ? JSON.parse(text) : text || null;
      } catch {
        throw new ApiError(
          res.status,
          text,
          `Server sent invalid JSON (HTTP ${res.status})`,
        );
      }
    }
    if (!res.ok) {
      const err = new ApiError(
        res.status,
        data,
        data?.error ?? `HTTP ${res.status}`,
      );
      err.retryAfterMs = parseRetryAfter(res.headers.get("retry-after"));
      throw err;
    }
    return data;
  }

  #isRetryable(err) {
    if (err instanceof NetworkError || err instanceof TimeoutError) return true;
    if (err instanceof ApiError)
      return err.status === 429 || err.status === 408 || err.status >= 500; // never retry other 4xx
    return false;
  }

  #delayFor(err, attempt) {
    if (err instanceof ApiError && err.retryAfterMs !== undefined)
      return Math.min(err.retryAfterMs, this.maxDelayMs); // the server told us
    const exponential = Math.min(
      this.maxDelayMs,
      this.baseDelayMs * 2 ** (attempt - 1),
    );
    return exponential * (0.5 + Math.random() * 0.5); // jitter: avoid thundering herd
  }

  /** Follow `nextPage` until it is null and return every item. */
  async getAll(path, { pageSize = 10, maxPages = 100 } = {}) {
    const items = [];
    let page = 1;
    while (page !== null && page <= maxPages) {
      const sep = path.includes("?") ? "&" : "?";
      const result = await this.request(
        `${path}${sep}page=${page}&pageSize=${pageSize}`,
      );
      items.push(...result.data);
      page = result.nextPage;
    }
    return items;
  }
}

function parseRetryAfter(value) {
  if (value === null) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return seconds * 1000;
  const date = Date.parse(value); // the header may also be an HTTP date
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

/** Run fn over items with at most `limit` in flight; results keep the input order. */
export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++; // safe: JS is single-threaded between awaits
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}
```

### Why it is written this way

| Decision                                                                       | Reason                                                                             |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `#once` does one attempt; `request` owns the retry loop                        | one place to reason about retries                                                  |
| Retry only `NetworkError`, `TimeoutError`, 408, 429, 5xx                       | a 400/401/403/404/422 will **fail the same way** every time                        |
| Methods `GET/HEAD/PUT/DELETE/OPTIONS` retry by default; `POST` only with a key | retrying a non-idempotent `POST` can create duplicates                             |
| Backoff `base * 2^(attempt-1)` with **jitter**                                 | spreads out retries so many clients don't hit the server in sync (thundering herd) |
| Cap the delay (`maxDelayMs`)                                                   | a long outage must not produce minute-long sleeps                                  |
| `Retry-After` wins over the computed delay (seconds **or** an HTTP date)       | the server knows best                                                              |
| 401 triggers **one** re-login, tracked with `reloggedIn`                       | no infinite login loops when the password is wrong                                 |
| `AbortSignal.timeout`                                                          | a request without a timeout can hang forever                                       |
| Read the body as **text**, then `JSON.parse` in a `try`                        | a broken JSON body becomes a clear `ApiError`, not an unhandled crash              |
| `mapLimit` workers share one counter                                           | at most `limit` requests are in flight, and `results[i]` keeps input order         |
| Private `#token`                                                               | the token isn't a public property you might accidentally log                       |

## 7. What I verified (and a bug the first test run found)

All 15 tests pass. Verified behaviours: a 404 is **not retried** (1 request in the log); a flaky endpoint takes **3** requests; with `maxRetries: 1` it gives up after **2**; `Retry-After: 1` makes the call wait about a second; an expired session produces the request log `GET /courses`, `POST /login`, `GET /courses`; the keyed `POST /orders` creates **exactly one** order even though the first reply was lost; `mapLimit` never exceeds 2 concurrent requests.

My first draft of the "POST without a key is not retried" test **passed for the wrong reason** (it asserted nothing useful because the server succeeded on the first call). The fixed version points at `/always-500` and asserts there was **exactly one** attempt. Lesson: **a test that can't fail proves nothing; make it fail once on purpose.**

## 8. Edge cases to discuss

| Case                                     | What the client does                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------- |
| Server returns 204                       | `data` is `null`, no JSON parse                                             |
| Non-JSON error page (a proxy's HTML 502) | `ApiError` with the raw text as the body                                    |
| `Retry-After` as a date                  | parsed with `Date.parse`                                                    |
| Wrong credentials                        | login fails with 401 and is **not** retried                                 |
| User navigates away mid-request          | pass your own `AbortController` signal (stretch goal)                       |
| A page of results is empty               | `getAll` ends when `nextPage` is `null`, and `maxPages` stops runaway loops |

## 9. Practice variations (stretch goals)

1. **Cancellation:** accept an `AbortSignal` from the caller and combine it with the timeout (`AbortSignal.any([...])`).
2. **Circuit breaker:** after N consecutive failures, fail fast for 10 seconds.
3. **In-flight de-duplication:** two simultaneous `GET /courses?page=1` share one request.
4. **Cache with `ETag`:** send `If-None-Match`; on `304` return the cached body.
5. **Refresh tokens:** on 401, call `/refresh` (with a lock so five parallel requests trigger **one** refresh).
6. **Same client in React:** wrap `getAll` in a `useEffect` with an abort on unmount (see Day 2 and Day 3).

## 10. Common mistakes

1. Assuming `fetch` throws on 404/500.
2. Retrying **everything**, including 400/404 and non-idempotent `POST`.
3. Retrying immediately with no backoff (you become the attack).
4. Backoff **without jitter**.
5. No timeout.
6. Infinite retry or re-login loops.
7. Calling `res.json()` on a response that isn't JSON (uncaught `SyntaxError`).
8. Forgetting that `204` has **no body**.
9. Firing 1,000 requests with `Promise.all` instead of limiting concurrency.
10. Logging the `Authorization` header.

## Recap

- A good client **maps failures to clear error types**, **retries only what is safe and transient**, **backs off with jitter**, honours `Retry-After`, and **times out**.
- **Idempotency keys** make `POST` safe to retry.
- **401** is a session problem: re-login once. Other **4xx** are your fault: don't retry.
- Limit concurrency; follow pagination; keep result order.
- Make each test **able to fail**.

## Checklist

- [ ] I built (or fully understood) the client and all 15 tests pass
- [ ] I can explain which errors are retried and which are not, and why
- [ ] I can explain exponential backoff, jitter and `Retry-After`
- [ ] I can explain idempotency keys with the lost-response scenario
- [ ] I can explain why `fetch` needs `res.ok` and a timeout
- [ ] I completed at least one stretch goal
