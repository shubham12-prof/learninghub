# 11 - Project: API Fetching, Loading States and Error Handling

> **Time:** ~90 min | **Goal:** Build a small "LearningHub Instructors" page that fetches data from a real API and handles **every state**: loading, success, empty, error (network / HTTP / timeout), retry, search and stale responses.
> This is your **1 API exercise** for Day 2.

The project has two parts:

- **Part A: Build** the page.
- **Part B: Debug** a broken `loadUsers` function that has 4 classic async bugs.

> **Using your real LearningHub?** Everything here is self-contained so you can practise right away. At the end (section 8) there is a checklist for moving the same ideas into your real project.

## 1. What you will practise

| Skill                                               | Where it shows up        |
| --------------------------------------------------- | ------------------------ |
| `async/await` + `fetch`                             | `fetchJSON`, `loadUsers` |
| Checking `res.ok` (fetch doesn't reject on 404/500) | `fetchJSON`              |
| `try / catch / finally`                             | `loadUsers`              |
| Timeout + cancellation with `AbortController`       | `fetchJSON`              |
| Loading / success / empty / error UI states         | `render`                 |
| "Latest request wins" (closures + request id)       | `loadUsers`              |
| Retry button                                        | error state              |
| `debounce` (from `06-coding-debounce.md`)           | search box               |
| Safe DOM updates (no `innerHTML` with API data)     | `render`                 |

## 2. Setup

Create a folder `learninghub-day2` with `index.html` and `app.js`. The API is the free **JSONPlaceholder** service: `GET https://jsonplaceholder.typicode.com/users` returns 10 users like:

```json
{
  "id": 1,
  "name": "Leanne Graham",
  "email": "Sincere@april.biz",
  "address": { "city": "Gwenborough" },
  "company": { "name": "Romaguera-Crona" }
}
```

(We pretend they are course instructors.)

### `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>LearningHub - Instructors</title>
    <style>
      body {
        font-family: system-ui, sans-serif;
        max-width: 560px;
        margin: 2rem auto;
        padding: 0 1rem;
      }
      .toolbar {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      .toolbar input {
        flex: 1;
        padding: 0.5rem;
      }
      button {
        cursor: pointer;
        padding: 0.45rem 0.9rem;
      }
      #status {
        min-height: 1.5rem;
        color: #444;
      }
      #status[data-state="loading"] {
        color: #1d4ed8;
      }
      #status[data-state="error"] {
        color: #b91c1c;
      }
      ul {
        list-style: none;
        padding: 0;
      }
      li {
        display: grid;
        gap: 0.15rem;
        padding: 0.75rem 1rem;
        margin-bottom: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 8px;
      }
      li span {
        color: #555;
        font-size: 0.9rem;
      }
      .retry {
        margin-left: 0.5rem;
      }
    </style>
  </head>
  <body>
    <h1>LearningHub Instructors</h1>

    <div class="toolbar">
      <input
        id="search"
        type="search"
        placeholder="Search by name, email or company"
        aria-label="Search instructors"
      />
      <button id="reload" type="button">Reload</button>
    </div>

    <p id="status" role="status" aria-live="polite"></p>
    <ul id="list"></ul>

    <script src="app.js"></script>
  </body>
</html>
```

To run it: open `index.html` in a browser (the API allows requests from any origin), or use a tiny server (`npx serve`). Use DevTools (F12) -> **Console** and **Network** tabs.

## 3. Part A: Build it

### Requirements

1. On page load, fetch the users and show a **loading** message (`Loading instructors…`) while waiting.
2. **Success:** show each instructor (name, email, company, city) and a count (`10 instructors`).
3. **Empty:** if the API returns `[]`, show `No instructors yet.`
4. **Error:** show a friendly message **and a "Try again" button** for each case:

   | Situation       | How it happens          | Message to show                                     |
   | --------------- | ----------------------- | --------------------------------------------------- |
   | Network failure | offline / DNS / blocked | `Network problem. Check your internet connection.`  |
   | HTTP 404        | wrong URL               | `We couldn't find that data (404).`                 |
   | HTTP 5xx        | server problem          | `The server had a problem. Please try again (500).` |
   | Timeout         | no answer in 8 s        | `Request timed out after 8s`                        |
   | Unexpected data | response isn't an array | `Unexpected response from the server`               |

5. The **Reload** button fetches again. If you click it while a request is in flight, the **old request is cancelled** and only the **newest** one may update the page (no stale data).
6. A **search box** filters by name, email or company, **debounced by 300 ms**. If nothing matches: `No instructors match “<query>”.`
7. Never insert API data with `innerHTML` (use `textContent`) so a malicious name can't inject HTML.

### Concept map

| Requirement                        | Concept (file)                                       |
| ---------------------------------- | ---------------------------------------------------- |
| Check `res.ok`, custom `HttpError` | `09-interview-error-handling.md`                     |
| Timeout + cancel                   | `09-interview-error-handling.md` (`AbortController`) |
| Latest request wins                | `05-closures-review.md`                              |
| Debounced search                   | `06-coding-debounce.md`                              |
| `try/catch/finally`                | `02-async-await.md`                                  |
| `Promise.all` (stretch goals)      | `08-interview-promise-all.md`                        |

### Starter `app.js`

```js
"use strict";

const API_URL = "https://jsonplaceholder.typicode.com/users";
const TIMEOUT_MS = 8000;

const els = {
  search: document.getElementById("search"),
  reload: document.getElementById("reload"),
  status: document.getElementById("status"),
  list: document.getElementById("list"),
};

// One object describes the whole screen: status is "idle" | "loading" | "success" | "error"
const state = { status: "idle", users: [], error: "", query: "" };

function setState(patch) {
  Object.assign(state, patch);
  render();
}

// TODO 1: class HttpError extends Error  (stores `status`)
// TODO 2: async function fetchJSON(url, { timeoutMs, signal })
//         -> fetch, throw HttpError when !res.ok, abort after timeoutMs, return res.json()
// TODO 3: function friendlyMessage(err)  -> user-friendly text (see the table above)
// TODO 4: function filterUsers(users, query)
// TODO 5: function debounce(fn, delay)   (from 06-coding-debounce.md)
// TODO 6: async function loadUsers()
//         -> setState loading, await fetchJSON, validate Array, setState success/error,
//            ignore stale responses (requestId) and cancel the previous request
// TODO 7: function render()  -> show loading / error + retry / empty / list
// TODO 8: wire up events (reload click, debounced search input) and call loadUsers() once
```

### Hints (read only if stuck)

1. Keep `let requestId = 0;` outside `loadUsers`. At the start do `const myId = ++requestId;`. After every `await`, if `myId !== requestId`, `return` (a newer request exists).
2. `controller.abort()` makes `fetch` reject with an error whose `name` is `"AbortError"`. Set a `timedOut` flag in your timer so you can tell a timeout from a manual cancel.
3. A failed `fetch` (offline) throws a `TypeError`. An `HttpError` is _your_ error for bad status codes.
4. Use `finally { clearTimeout(timer); }` so the timer never leaks.
5. In `render()`, start by clearing both `els.status` and `els.list`, then rebuild only what the current `state.status` needs.

## 4. Part A: Solution (try first!)

```js
"use strict";

// ---------- 1. DOM + state ----------
const API_URL = "https://jsonplaceholder.typicode.com/users";
const TIMEOUT_MS = 8000;

const els = {
  search: document.getElementById("search"),
  reload: document.getElementById("reload"),
  status: document.getElementById("status"),
  list: document.getElementById("list"),
};

const state = { status: "idle", users: [], error: "", query: "" };

function setState(patch) {
  Object.assign(state, patch);
  render();
}

// ---------- 2. Helpers ----------
class HttpError extends Error {
  constructor(status, statusText) {
    super(`HTTP ${status} ${statusText}`.trim());
    this.name = "HttpError";
    this.status = status;
  }
}

async function fetchJSON(url, { timeoutMs = TIMEOUT_MS, signal } = {}) {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort(); // stop the request after the timeout
  }, timeoutMs);

  const onOuterAbort = () => controller.abort(); // let the caller cancel too
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onOuterAbort, { once: true });
  }

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new HttpError(res.status, res.statusText); // fetch does NOT reject on 404/500
    return await res.json();
  } catch (err) {
    if (err.name === "AbortError" && timedOut) {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timer); // always clean up
    if (signal) signal.removeEventListener("abort", onOuterAbort);
  }
}

function friendlyMessage(err) {
  if (err instanceof HttpError) {
    if (err.status === 404) return "We couldn't find that data (404).";
    if (err.status >= 500)
      return `The server had a problem. Please try again (${err.status}).`;
    return `Request failed (${err.status}).`;
  }
  if (err.name === "TypeError")
    return "Network problem. Check your internet connection.";
  return err.message || "Something went wrong.";
}

function filterUsers(users, query) {
  const q = query.trim().toLowerCase();
  if (!q) return users;
  return users.filter((u) =>
    [u.name, u.email, u.company?.name]
      .filter(Boolean)
      .some((text) => text.toLowerCase().includes(q)),
  );
}

function debounce(fn, delay) {
  let timerId;
  return function (...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ---------- 3. Loading data ----------
let requestId = 0; // closure state: which request is the newest?
let activeController = null; // lets us cancel the previous request

async function loadUsers() {
  if (activeController) activeController.abort(); // cancel the old request, if any
  activeController = new AbortController();
  const myId = ++requestId; // this call's own id

  setState({ status: "loading", error: "" });

  try {
    const users = await fetchJSON(API_URL, { signal: activeController.signal });
    if (myId !== requestId) return; // stale: a newer request exists
    if (!Array.isArray(users))
      throw new Error("Unexpected response from the server");
    setState({ status: "success", users });
  } catch (err) {
    if (myId !== requestId) return; // stale failure / our own cancel: ignore
    setState({ status: "error", error: friendlyMessage(err) });
  }
}

// ---------- 4. Rendering ----------
function render() {
  const { status, users, error, query } = state;

  els.list.replaceChildren();
  els.status.replaceChildren();
  els.status.dataset.state = status;
  els.list.setAttribute("aria-busy", String(status === "loading"));
  els.reload.textContent = status === "loading" ? "Loading…" : "Reload";

  if (status === "loading") {
    els.status.textContent = "Loading instructors…";
    return;
  }

  if (status === "error") {
    const message = document.createElement("span");
    message.textContent = error; // textContent: safe
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "retry";
    retry.textContent = "Try again";
    retry.addEventListener("click", loadUsers);
    els.status.append(message, " ", retry);
    return;
  }

  if (status !== "success") return; // "idle": nothing to show

  const visible = filterUsers(users, query);

  if (visible.length === 0) {
    els.status.textContent = query.trim()
      ? `No instructors match “${query.trim()}”.`
      : "No instructors yet.";
    return;
  }

  els.status.textContent = `${visible.length} instructor${visible.length === 1 ? "" : "s"}`;

  for (const user of visible) {
    const li = document.createElement("li");

    const name = document.createElement("strong");
    name.textContent = user.name;

    const email = document.createElement("span");
    email.textContent = user.email;

    const meta = document.createElement("span");
    meta.textContent = [user.company?.name, user.address?.city]
      .filter(Boolean)
      .join(" · ");

    li.append(name, email, meta);
    els.list.append(li);
  }
}

// ---------- 5. Events ----------
els.reload.addEventListener("click", loadUsers);
els.search.addEventListener(
  "input",
  debounce((event) => setState({ query: event.target.value }), 300),
);

loadUsers();
```

### Why it works

- **One `state` object + one `render()`** means the screen always matches the data, with no scattered `if`s changing the DOM.
- `fetchJSON` turns **three kinds of failure** (HTTP error, timeout, network) into thrown errors, so `loadUsers` needs just one `try/catch`.
- `requestId` is a **closure variable**: every call captures its own `myId`, so a slow older call can't overwrite newer data. `AbortController` additionally stops the old request on the network.
- `clearTimeout` in `finally` prevents leaks; `textContent` prevents HTML injection.
- The debounced handler is created **once** (not inside the event handler).

## 5. Test every state (the most important part)

A working happy path proves nothing. Real apps fail all the time, so **force every failure**.

### Option 1: DevTools tricks

| Test              | How                                                                |
| ----------------- | ------------------------------------------------------------------ |
| **Loading**       | Network tab -> throttling -> **Slow 3G**, then click Reload        |
| **Network error** | Network tab -> throttling -> **Offline**, then click Reload        |
| **404**           | Temporarily change `API_URL` to `.../users/9999/nothing`           |
| **Retry works**   | Go offline, trigger the error, go back online, click **Try again** |

### Option 2: paste a fake `fetch` into the Console

Paste this in the Console, then call `simulate("500")` (or another mode) and click **Reload**. Call `simulate("real")` to restore the real network.

```js
const realFetch = window.fetch.bind(window);

function simulate(mode) {
  window.fetch = (url, { signal } = {}) => {
    const wait = (ms) =>
      new Promise((resolve, reject) => {
        const id = setTimeout(resolve, ms);
        signal?.addEventListener("abort", () => {
          clearTimeout(id);
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    const reply = (status, body, statusText = "") =>
      new Response(JSON.stringify(body), { status, statusText });

    if (mode === "real") return realFetch(url, { signal });
    if (mode === "offline")
      return wait(300).then(() => {
        throw new TypeError("Failed to fetch");
      });
    if (mode === "500")
      return wait(300).then(() => reply(500, {}, "Internal Server Error"));
    if (mode === "404")
      return wait(300).then(() => reply(404, {}, "Not Found"));
    if (mode === "empty") return wait(300).then(() => reply(200, []));
    if (mode === "weird")
      return wait(300).then(() => reply(200, { oops: true }));
    if (mode === "slow")
      return wait(15000).then(() => realFetch(url, { signal })); // > 8s timeout
  };
}

simulate("500"); // then click Reload
```

### Test checklist

- [ ] Loading message appears, and the Reload button says `Loading…`
- [ ] Success shows `10 instructors` with name, email, company · city
- [ ] `empty` shows `No instructors yet.`
- [ ] `offline`, `404`, `500`, `slow` (timeout) and `weird` each show the right message **and a working Try again button**
- [ ] Typing in search filters only **300 ms after** you stop typing
- [ ] Searching `zzz` shows `No instructors match “zzz”.`
- [ ] Clicking Reload twice quickly never shows stale data (watch the Network tab: the first request is cancelled)

## 6. Part B: Debug it

Copy `app.js` to `app-buggy.js` (and point `index.html` at it). Then **replace the whole "3. Loading data" section** with this broken version:

```js
// ---------- 3. Loading data (BUGGY) ----------
async function loadUsers() {
  setState({ status: "loading", error: "" });

  const res = await fetch(API_URL);
  const users = await res.json();

  setState({ status: "success", users });
}
```

It looks fine on a good connection, but contains **4 bugs**. Find each one by running the tests from section 5.

| #   | Test to run                                                                                                                                                      | What you'll see                                                                                             | Concept                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | `simulate("offline")` + Reload                                                                                                                                   | Stuck on `Loading instructors…` forever; console shows `Uncaught (in promise) TypeError: Failed to fetch`   | No `try/catch` around `await` (`02`, `09`)                                         |
| 2   | `simulate("500")` + Reload                                                                                                                                       | Status reads `undefined instructors`, the list is empty, console shows `TypeError: visible is not iterable` | `fetch` doesn't reject on HTTP errors: check `res.ok` and validate the data (`09`) |
| 3   | Click Reload twice quickly, with the **first** request slower than the second (e.g. `simulate("slow")` first, then switch to `simulate("real")` and click again) | The **older** response arrives last and overwrites the newer one                                            | Latest wins: closure request id + `AbortController` (`05`)                         |
| 4   | `simulate("slow")` + Reload and wait                                                                                                                             | Stays on `Loading instructors…` with no end                                                                 | No timeout: `AbortController` + `setTimeout` (`09`)                                |

> **A trap to watch for:** if you fix Bug 1 first (add only the `try/catch`) and test `simulate("500")`, you'll see a **misleading** `Network problem. Check your internet connection.` message even though the server answered. That is because the 500 body `{}` is treated as success, `render` crashes with a `TypeError` _inside_ the `try`, and `friendlyMessage` maps every `TypeError` to "Network problem". The real fix is Bug 2 (`res.ok` check + `Array.isArray`), not a different message.

Don't scroll down until you have tried to fix each one.

## 7. Part B: Solutions

**Bug 1: no `try/catch`**. Any exception in the `async` function becomes an unhandled rejection and the code that sets the final state never runs.

```js
try {
  const res = await fetch(API_URL);
  const users = await res.json();
  setState({ status: "success", users });
} catch (err) {
  setState({ status: "error", error: friendlyMessage(err) });
}
```

**Bug 2: no `res.ok` check**. A 500 response is "successful" to `fetch`.

```js
const res = await fetch(API_URL);
if (!res.ok) throw new HttpError(res.status, res.statusText);
```

Also validate the **shape** of the data: `if (!Array.isArray(users)) throw new Error("Unexpected response from the server");`

**Bug 3: stale response overwrites a newer one**. Give each call an id and ignore results from old calls (and cancel the old request).

```js
let requestId = 0;
let activeController = null;

async function loadUsers() {
  if (activeController) activeController.abort();
  activeController = new AbortController();
  const myId = ++requestId;
  // ...
  const users = await fetchJSON(API_URL, { signal: activeController.signal });
  if (myId !== requestId) return; // stale
  // ...
}
```

**Bug 4: no timeout**. Abort the request after N seconds with an `AbortController` and a timer that is cleared in `finally` (see `fetchJSON` in the solution).

The **complete fixed version** is the Part A solution above (`fetchJSON` + `loadUsers`).

## 8. Stretch goals (use these on your real LearningHub)

1. **Retry with exponential backoff** for network errors and 5xx (reuse `retry` from `09-interview-error-handling.md`). Don't retry 4xx.
2. **Instructor details:** clicking a name loads `/users/:id` **and** `/posts?userId=:id` **in parallel with `Promise.all`**; show an error for each independently (use `Promise.allSettled`).
3. **Cache** the last successful response in `localStorage` and show it immediately while refreshing (stale-while-revalidate). Wrap storage access in `try/catch`.
4. **Pagination / "Load more"** with `https://jsonplaceholder.typicode.com/posts?_page=1&_limit=5`.
5. **Skeleton loader:** show 3 grey placeholder cards instead of text while loading.
6. **Write 5 sentences** in your own words: _"What happens in my app if the server returns a 500? If the user is offline? If they click Reload twice?"_ This is exactly how interviewers phrase async-error questions.

### Applying it to your real project

1. Find every `fetch` in LearningHub. Does each one check `res.ok`?
2. Does every `await` sit inside a `try/catch` (or is the error handled by the caller)?
3. Is there a **loading** state, an **error** state with a retry, and an **empty** state?
4. Can a slow old response overwrite a new one (search boxes, tabs, filters)? Add the request-id pattern.
5. Are timers, listeners and requests cleaned up when the user leaves the screen?
6. Is API data inserted with `textContent` (or a framework that escapes it)?

## 9. Self-check

- [ ] Part A works: loading, success, empty, error + retry, search, reload
- [ ] I forced every failure from the test checklist and each one looks right
- [ ] I fixed all Part B bugs and can name the concept behind each one
- [ ] I can explain my solution in 60 seconds, out loud
- [ ] I tried at least one stretch goal

## Recap

- `fetch` only rejects on **network** failures. Check `res.ok` and throw for HTTP errors.
- Every request has 4 outcomes to design for: **loading, success, empty, error**.
- Use `try/catch/finally`, a **timeout** (`AbortController`) and a **Retry** button.
- Prevent stale updates with a **closure request id** and cancel old requests.
- Keep one `state` object and one `render()` so the UI never disagrees with the data.
- Test failures on purpose (offline, slow, 404, 500). Happy-path-only code isn't finished.
