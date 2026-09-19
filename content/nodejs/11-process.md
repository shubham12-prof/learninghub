# ⚙️ Process

## 🎯 What Is `process`?

`process` is a **global object** (no `require` needed) giving you information about, and control over, the currently running Node.js process — args, env vars, exit codes, signals, memory, and more.

---

## 💻 Core Properties

```js
console.log("📌 PID:", process.pid);
console.log("📁 CWD:", process.cwd());
console.log("🖥️ Platform:", process.platform);
console.log("🔢 Node version:", process.version);
console.log("⏱️ Uptime (s):", process.uptime());
console.log("💾 Memory usage:", process.memoryUsage());
/* {
  rss: 45boys...,     // Resident Set Size — total memory allocated
  heapTotal: ...,     // V8 heap allocated
  heapUsed: ...,      // V8 heap actually used
  external: ...,      // memory used by C++ objects bound to JS
  arrayBuffers: ...
} */
```

---

## 📋 Command-Line Arguments

```js
// node app.js --name=Alice --verbose
console.log(process.argv);
/* [
  '/usr/local/bin/node',   // [0] path to node binary
  '/path/to/app.js',       // [1] path to script
  '--name=Alice',          // [2] your args start here
  '--verbose'
] */

const args = process.argv.slice(2);
console.log("User args:", args);
```

---

## 🔐 Environment Variables

```js
console.log(process.env.NODE_ENV); // e.g. 'production'
console.log(process.env.PATH);

// Setting a default:
const port = process.env.PORT || 3000;
```

_(Full deep-dive in [`15-environment-variables`](../15-environment-variables/README.md))_

---

## 🚪 Exiting the Process

```js
process.exit(0); // 0 = success
process.exit(1); // non-zero = error/failure (convention)

// ⚠️ Prefer letting Node exit naturally by finishing all work —
// process.exit() can cut off pending I/O (e.g., unflushed console.log or unfinished writes)!
```

---

## 📡 Listening for Events & Signals

```js
// Graceful shutdown pattern (essential for production servers!)
process.on("SIGINT", () => {
  console.log("\n👋 Received SIGINT (Ctrl+C). Shutting down gracefully...");
  // close DB connections, finish in-flight requests, etc.
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log(
    "🛑 Received SIGTERM (e.g., from Docker/Kubernetes). Cleaning up...",
  );
  server.close(() => process.exit(0));
});

// 🚨 Catch unhandled errors (last resort — log and exit, don't try to "recover")
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
  process.exit(1);
});
```

---

## 📥 stdin / stdout / stderr

```js
process.stdout.write("No newline appended\n"); // like console.log but lower-level

process.stdin.setEncoding("utf8");
process.stdin.on("data", (input) => {
  console.log(`You typed: ${input.trim()}`);
});

console.log("Enter some text:");
// Try: node app.js  then type something and press Enter
```

---

## 🌊 `process.nextTick()`

```js
process.nextTick(() => {
  console.log(
    "🥇 Runs before any I/O or timers, right after current operation",
  );
});
```

_(Deep-dive in [`02-event-loop`](../02-event-loop/README.md))_

---

## 📊 Real-World Example: Startup Banner

```js
function printStartupBanner(port) {
  console.log(`
  🚀 Server started!
  ────────────────────────
  📍 URL:      http://localhost:${port}
  🌍 Env:      ${process.env.NODE_ENV || "development"}
  🆔 PID:      ${process.pid}
  🖥️ Platform: ${process.platform} (${process.arch})
  🔢 Node:     ${process.version}
  ────────────────────────
  `);
}
printStartupBanner(3000);
```

---

## ⚠️ Common Pitfalls

- Calling `process.exit()` too early — can truncate pending async writes/logs.
- Not handling `SIGTERM` in containerized apps (Docker/K8s sends this before force-killing) → **ungraceful shutdowns**, dropped requests.
- Using `uncaughtException` to "keep the app alive" after an unknown error — the process is in an **undefined state**; best practice is to log and exit, then let your process manager (PM2, Kubernetes) restart it.
- Confusing `process.argv` indices (remember: real args start at index **2**).

---

## 🧪 Try It Yourself

1. Build a CLI tool that reads flags from `process.argv` (e.g. `--name=X`) and greets the user.
2. Implement graceful shutdown handling for `SIGINT`/`SIGTERM` in a simple HTTP server.
3. Log `process.memoryUsage()` every 5 seconds while running a memory-intensive loop, and observe growth.
