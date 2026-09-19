# 🟢 Node.js Complete Mastery Guide

> A structured, code-first deep dive into Node.js internals, core modules, and best practices — organized topic by topic, each with explanations, diagrams (ASCII), runnable code, and pitfalls to avoid.

---

## 📚 Table of Contents

| #   | Topic                                   | Link                                                             |
| --- | --------------------------------------- | ---------------------------------------------------------------- |
| 01  | 🏗️ Node Architecture                    | [01-node-architecture](/nodejs/01-node-architecture)             |
| 02  | 🔁 Event Loop                           | [02-event-loop](/nodejs/02-event-loop)                           |
| 03  | 📢 EventEmitter                         | [03-eventemitter](/nodejs/03-eventemitter)                       |
| 04  | 📦 Modules (CommonJS & ES Modules)      | [04-modules](/nodejs/04-modules)                                 |
| 05  | 📁 File System (`fs`)                   | [05-file-system](/nodejs/05-file-system)                         |
| 06  | 🧭 Path                                 | [06-path](/nodejs/06-path)                                       |
| 07  | 🖥️ OS Module                            | [07-os-module](/nodejs/07-os-module)                             |
| 08  | 🌐 HTTP Module                          | [08-http-module](/nodejs/08-http-module)                         |
| 09  | 🌊 Streams                              | [09-streams](/nodejs/09-streams)                                 |
| 10  | 🧮 Buffers                              | [10-buffers](/nodejs/10-buffers)                                 |
| 11  | ⚙️ Process                              | [11-process](/nodejs/11-process)                                 |
| 12  | 🧩 Cluster                              | [12-cluster](/nodejs/12-cluster)                                 |
| 13  | 🧵 Worker Threads                       | [13-worker-threads](/nodejs/13-worker-threads)                   |
| 14  | 👶 Child Processes                      | [14-child-processes](/nodejs/14-child-processes)                 |
| 15  | 🔐 Environment Variables                | [15-environment-variables](/nodejs/15-environment-variables)     |
| 16  | 📦 Package Management (npm, pnpm, yarn) | [16-package-management](/nodejs/16-package-management)           |
| 17  | 🚨 Error Handling                       | [17-error-handling](/nodejs/17-error-handling)                   |
| 18  | 📝 Logging                              | [18-logging](/nodejs/18-logging)                                 |
| 19  | 🛡️ Security Best Practices              | [19-security-best-practices](/nodejs/19-security-best-practices) |
| 20  | ❓ Interview Questions                  | [20-interview-questions](/nodejs/20-interview-questions)         |

---

## 🧠 How to Use This Guide

1. Go **in order** if you're learning — each topic builds intuition for the next (Architecture → Event Loop → EventEmitter are foundational).

2. Every topic has:
   - 🎯 Concept explanation
   - 🖼️ Diagrams (ASCII art where useful)
   - 💻 Full runnable code examples
   - ⚠️ Common pitfalls
   - 🧪 "Try it yourself" exercises

3. Copy-paste the code blocks into a `.js` file and run with `node file.js` (Node.js v18+ recommended).

---

## 🗺️ Node.js Mental Model

```text
                    ┌─────────────────────────────┐
                    │        Your JS Code         │
                    └───────────────┬─────────────┘
                                    │
                    ┌───────────────▼──────────────┐
                    │      Node.js APIs / Bindings │
                    │   (fs, http, net, crypto...) │
                    └───────────────┬──────────────┘
                                    │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
┌───────▼────────┐         ┌─────────▼─────────┐        ┌─────────▼────────┐
│   V8 Engine    │         │      libuv        │        │   C++ Bindings   │
│ (executes JS)  │         │ (event loop, I/O, │        │ (OS-level calls) │
│                │         │  thread pool)     │        │                  │
└────────────────┘         └────────────────────┘        └──────────────────┘
```
