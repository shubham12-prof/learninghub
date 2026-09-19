# 👶 Child Processes

## 🎯 What Are They?

The `child_process` module lets Node **spawn separate OS processes** — run shell commands, other executables, or even other Node scripts, entirely outside your app's process boundary. Useful for running `ffmpeg`, `git`, Python scripts, ImageMagick, etc.

---

## 🧩 The 4 Main Methods

| Method       | Behavior                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `exec()`     | Runs a command in a shell, buffers **entire** output, returns via callback. Good for short commands with small output. |
| `execFile()` | Like `exec()` but runs an executable directly (no shell) — safer, avoids shell injection.                              |
| `spawn()`    | Streams output incrementally (stdout/stderr as streams) — best for long-running processes or large output.             |
| `fork()`     | Special case of `spawn()` specifically for launching **new Node.js processes**, with built-in IPC (message passing).   |

---

## 💻 `exec()` — Simple Shell Commands

```js
const { exec } = require("node:child_process");

exec("ls -la", (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Error: ${error.message}`);
    return;
  }
  if (stderr) console.error(`⚠️ stderr: ${stderr}`);
  console.log(`📄 stdout:\n${stdout}`);
});
```

⚠️ **Security risk**: `exec()` runs through a shell, so **never** pass unsanitized user input directly — it's vulnerable to **shell injection**:

```js
// ❌ DANGEROUS if `userInput` is attacker-controlled:
exec(`ls ${userInput}`, cb); // userInput = "; rm -rf /" would be catastrophic
```

---

## 🔒 `execFile()` — Safer Alternative

```js
const { execFile } = require("node:child_process");

// No shell involved — arguments passed as an array, immune to shell injection
execFile("node", ["--version"], (error, stdout) => {
  if (error) throw error;
  console.log("🔢 Node version:", stdout.trim());
});
```

---

## 🌊 `spawn()` — Streaming Output (Best for Long-Running Tasks)

```js
const { spawn } = require("node:child_process");

const child = spawn("ping", ["-c", "4", "google.com"]); // Linux/Mac; use '-n' on Windows

child.stdout.on("data", (data) => {
  console.log(`📦 ${data}`);
});

child.stderr.on("data", (data) => {
  console.error(`⚠️ ${data}`);
});

child.on("close", (code) => {
  console.log(`✅ Process exited with code ${code}`);
});
```

`spawn()` gives you `stdin`/`stdout`/`stderr` as **streams** — ideal for processes that output large or continuous data (video encoding, log tailing).

---

## 🍴 `fork()` — Spawning Node Scripts with IPC

**parent.js**

```js
const { fork } = require("node:child_process");

const child = fork("./child.js");

child.send({ task: "calculate", numbers: [1, 2, 3, 4, 5] });

child.on("message", (result) => {
  console.log("📩 Result from child:", result);
  child.kill(); // clean up
});
```

**child.js**

```js
process.on("message", (msg) => {
  if (msg.task === "calculate") {
    const sum = msg.numbers.reduce((a, b) => a + b, 0);
    process.send({ sum }); // 📤 send back to parent
  }
});
```

`fork()` is essentially `spawn()` specialized for Node-to-Node communication, with a built-in message-passing channel — no manual stdout parsing needed.

---

## 🆚 Quick Decision Guide

```
Need to run a shell command with small output & trust the input?  → exec()
Need to run an executable safely with user-influenced args?        → execFile()
Need streaming output / long-running process (video, logs)?        → spawn()
Need to launch ANOTHER NODE SCRIPT with easy message passing?      → fork()
```

---

## ⚠️ Common Pitfalls

- Using `exec()` with unsanitized user input → **shell injection vulnerability**.
- Not handling the `'error'` event → silent failures if the executable isn't found.
- Forgetting `maxBuffer` limits on `exec()` (default ~1MB) — large output throws `ERR_CHILD_PROCESS_STDIO_MAXBUFFER`. Use `spawn()` for big output instead.
- Leaving zombie child processes running — always handle cleanup (`child.kill()`) on parent exit.

---

## 🧪 Try It Yourself

1. Use `spawn()` to stream output of a long-running command (e.g., `ping` or `tail -f`) in real time.
2. Build a parent/child pair using `fork()` that offloads a CPU task and returns the result via IPC.
3. Demonstrate (safely, in a sandbox) why `exec()` with string concatenation is dangerous, and show the `execFile()` fix.
