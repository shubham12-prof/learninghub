# 🏗️ Node.js Architecture

## 🎯 What Is Node.js?

Node.js is a **JavaScript runtime** built on Google's **V8 engine**, designed to run JS **outside the browser** — on servers, CLIs, desktop apps, etc. It's **single-threaded**, **event-driven**, and **non-blocking (asynchronous)** by design.

---

## 🧩 Core Building Blocks

| Component         | Role                                                                                |
| ----------------- | ----------------------------------------------------------------------------------- |
| **V8 Engine**     | Compiles & executes JavaScript (developed by Google, also powers Chrome)            |
| **libuv**         | C library providing the **event loop**, async I/O, thread pool, and OS abstractions |
| **Node Bindings** | C++ glue code connecting JS APIs (`fs`, `http`, etc.) to libuv/OS                   |
| **Core Modules**  | Built-in JS modules (`fs`, `http`, `path`, `crypto`...)                             |

```
┌───────────────────────────────────────────────────────────┐
│                      Node.js Runtime                        │
│                                                               │
│   ┌───────────────┐     ┌───────────────┐                  │
│   │  Your App.js   │────▶│  Node.js APIs  │                  │
│   └───────────────┘     └───────┬───────┘                  │
│                                  │                            │
│              ┌───────────────────┼───────────────────┐      │
│              ▼                   ▼                   ▼      │
│      ┌───────────────┐  ┌───────────────┐  ┌───────────────┐│
│      │   V8 Engine    │  │     libuv      │  │  C/C++ Addons ││
│      │ (JS execution) │  │ (event loop +  │  │               ││
│      │                │  │  thread pool)  │  │               ││
│      └───────────────┘  └───────┬───────┘  └───────────────┘│
└───────────────────────────────────┼──────────────────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │   Operating System (OS)   │
                        │  (files, network, etc.)   │
                        └───────────────────────────┘
```

---

## ⚡ Single-Threaded but Non-Blocking — How?

Node runs your JS on **one main thread**, but delegates heavy/slow work (file I/O, DNS, network, some crypto) to:

- **libuv's thread pool** (default size: 4 threads) for file system & some CPU-bound APIs
- **The OS kernel** directly for network I/O (epoll/kqueue/IOCP — truly async, no thread pool needed)

```js
console.log("1️⃣ Start");

setTimeout(() => console.log("3️⃣ Timeout callback"), 0);

require("fs").readFile(__filename, () => {
  console.log("4️⃣ File read callback");
});

console.log("2️⃣ End");

// Output order:
// 1️⃣ Start
// 2️⃣ End
// 3️⃣ Timeout callback  (or 4 first, depends on I/O timing)
// 4️⃣ File read callback
```

The main thread never "waits" — it fires off the request and moves on, resuming your callback once libuv reports the work is done.

---

## 🆚 Node.js vs Traditional (Thread-per-Request) Servers

| Traditional (e.g. Apache/PHP) | Node.js                                            |
| ----------------------------- | -------------------------------------------------- |
| New OS thread per request     | Single thread + event loop                         |
| High memory per connection    | Lightweight, scales to 1000s of connections        |
| Blocking I/O by default       | Non-blocking I/O by default                        |
| Great for CPU-heavy sync work | Great for I/O-heavy (APIs, web servers, streaming) |

⚠️ **Weakness**: CPU-bound work (heavy loops, image processing, crypto hashing) **blocks** the single thread — solved via **Worker Threads** or **Cluster** (see topics 12 & 13).

---

## 🔬 Node.js Version Internals (Modern Node)

Since Node 15+, Node ships with:

- **V8** (JS engine — also gives Node async/await, optional chaining, etc. as V8 evolves)
- **libuv** (event loop)
- **npm** (bundled package manager)
- **N-API** (stable ABI for native addons)

```bash
node -p "process.versions"
# {
#   node: '20.11.0',
#   v8: '11.3.244.8-node.17',
#   uv: '1.46.0',
#   ...
# }
```

---

## ⚠️ Common Misconceptions

- ❌ "Node.js is single-threaded, period." → **False.** Only the **event loop / JS execution** is single-threaded. libuv uses a **thread pool** under the hood.
- ❌ "Node can't handle CPU-intensive tasks." → It _can_, but it will block the loop unless you offload to `worker_threads` or `child_process`.
- ❌ "Node is only for web servers." → Also great for CLIs, build tools, real-time apps, IoT, scripting.

---

## 🧪 Try It Yourself

1. Run the code snippet above and predict the output order before executing.
2. Run `node -p "process.versions"` and inspect your local V8/libuv versions.
3. Write a script that blocks the event loop with a `while` loop for 5 seconds, then try hitting an HTTP server (topic 08) during that time — observe it hangs.
