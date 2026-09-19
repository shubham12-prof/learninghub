# 🖥️ OS Module

## 🎯 What Is It?

The `os` module provides operating-system-level information: CPU info, memory, network interfaces, user info, and platform details. Useful for diagnostics, scaling decisions (e.g., how many `cluster` workers to spawn), and cross-platform logic.

---

## 💻 Core Methods

```js
const os = require("node:os");

console.log("🖥️ Platform:", os.platform()); // 'linux', 'darwin', 'win32'
console.log("🏗️ Architecture:", os.arch()); // 'x64', 'arm64'
console.log("🔢 CPU cores:", os.cpus().length); // number of logical cores
console.log("💾 Total memory (GB):", (os.totalmem() / 1e9).toFixed(2));
console.log("💾 Free memory (GB):", (os.freemem() / 1e9).toFixed(2));
console.log("🏠 Home directory:", os.homedir());
console.log("📂 Temp directory:", os.tmpdir());
console.log("⏰ Uptime (hrs):", (os.uptime() / 3600).toFixed(2));
console.log("👤 Current user:", os.userInfo().username);
console.log("🌐 Hostname:", os.hostname());
console.log("🔀 Endianness:", os.endianness()); // 'LE' or 'BE'
```

---

## 🧮 CPU Details

```js
const os = require("node:os");

os.cpus().forEach((cpu, i) => {
  console.log(`CPU ${i}: ${cpu.model} @ ${cpu.speed}MHz`);
});

/* Example output:
CPU 0: Apple M2 @ 3200MHz
CPU 1: Apple M2 @ 3200MHz
...
*/
```

This is exactly how [`cluster`](../12-cluster/README.md) decides how many worker processes to spawn:

```js
const os = require("node:os");
const numCPUs = os.cpus().length;
console.log(`🧩 Spawning ${numCPUs} worker processes...`);
```

---

## 🌐 Network Interfaces

```js
const os = require("node:os");

const interfaces = os.networkInterfaces();
for (const [name, addrs] of Object.entries(interfaces)) {
  addrs.forEach((addr) => {
    if (addr.family === "IPv4" && !addr.internal) {
      console.log(`🔌 ${name}: ${addr.address}`);
    }
  });
}
// Useful for finding your machine's local network IP
```

---

## 📊 Building a Simple Health-Check Utility

```js
const os = require("node:os");

function systemHealth() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedPercent = (((totalMem - freeMem) / totalMem) * 100).toFixed(1);

  return {
    platform: os.platform(),
    cpuCores: os.cpus().length,
    memoryUsedPercent: `${usedPercent}%`,
    loadAverage: os.loadavg(), // [1min, 5min, 15min] — POSIX only, returns [0,0,0] on Windows
    uptimeHours: (os.uptime() / 3600).toFixed(1),
  };
}

console.log("🩺 System Health:", systemHealth());
```

---

## ⚠️ Common Pitfalls

- `os.loadavg()` returns `[0, 0, 0]` on **Windows** — it's a POSIX-only concept.
- `os.freemem()` isn't the same as "available memory" for your app — OS caching/buffers can make this misleading; use it for rough diagnostics, not precise capacity planning.
- Don't hardcode paths — use `os.homedir()` / `os.tmpdir()` instead of `/home/user` or `/tmp`.

---

## 🧪 Try It Yourself

1. Print a "system info" banner when your app starts (platform, cores, memory).
2. Use `os.cpus().length` to dynamically configure a `cluster` pool size (see topic 12).
3. Build a simple `/health` HTTP endpoint that returns `systemHealth()` as JSON.
