# 📢 EventEmitter

## 🎯 What Is It?

`EventEmitter` is the class powering Node's **observer pattern** — it's the foundation for `http.Server`, `streams`, `process`, and most of Node's async APIs. Objects that emit named events, and other code that listens for them.

---

## 💻 Basic Usage

```js
const EventEmitter = require("events");

class OrderService extends EventEmitter {
  placeOrder(order) {
    console.log(`📦 Order placed: ${order.id}`);
    this.emit("order:placed", order); // synchronous emit
  }
}

const orders = new OrderService();

orders.on("order:placed", (order) => {
  console.log(`✅ Sending confirmation email for ${order.id}`);
});

orders.on("order:placed", (order) => {
  console.log(`📊 Logging analytics for ${order.id}`);
});

orders.placeOrder({ id: "ORD-123" });

/* Output:
📦 Order placed: ORD-123
✅ Sending confirmation email for ORD-123
📊 Logging analytics for ORD-123
*/
```

⚠️ **Key fact**: `.emit()` calls listeners **synchronously**, in the order they were registered. It does NOT queue them onto the event loop.

---

## 🔑 Core API

| Method                                        | Purpose                                         |
| --------------------------------------------- | ----------------------------------------------- |
| `.on(event, listener)`                        | Register a listener (fires every time)          |
| `.once(event, listener)`                      | Register a listener that fires **only once**    |
| `.emit(event, ...args)`                       | Trigger all listeners for an event              |
| `.off(event, listener)` / `.removeListener()` | Remove a specific listener                      |
| `.removeAllListeners([event])`                | Remove all listeners (optionally for one event) |
| `.listenerCount(event)`                       | Number of listeners for an event                |
| `.eventNames()`                               | List all events with listeners                  |

```js
const emitter = new EventEmitter();

function greet(name) {
  console.log(`Hi, ${name}!`);
}

emitter.on("greet", greet);
emitter.emit("greet", "Alice"); // Hi, Alice!
emitter.off("greet", greet);
emitter.emit("greet", "Bob"); // (nothing happens)

emitter.once("login", (user) => console.log(`${user} logged in`));
emitter.emit("login", "Sam"); // Sam logged in
emitter.emit("login", "Sam"); // (nothing — already fired once)
```

---

## 🚨 The Special `'error'` Event

If an `EventEmitter` emits `'error'` and **no listener is attached**, Node **throws** the error and crashes the process!

```js
const emitter = new EventEmitter();

// ❌ Without an error listener, this crashes the whole app:
// emitter.emit('error', new Error('Something broke'));

// ✅ Always handle it:
emitter.on("error", (err) => {
  console.error("🚨 Caught:", err.message);
});
emitter.emit("error", new Error("Something broke")); // handled gracefully
```

---

## 🔢 Max Listeners Warning

By default, Node warns if more than **10 listeners** are added to a single event (helps catch memory leaks from forgotten `.on()` calls).

```js
emitter.setMaxListeners(20); // raise the limit if legitimately needed
```

---

## 🌊 Real-World Example: A Mini Pub/Sub Logger

```js
const EventEmitter = require("events");
const bus = new EventEmitter();

// 🎨 "Colorful" console levels
const colors = {
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  reset: "\x1b[0m",
};

bus.on("log", ({ level, message }) => {
  console.log(
    `${colors[level]}[${level.toUpperCase()}]${colors.reset} ${message}`,
  );
});

function log(level, message) {
  bus.emit("log", { level, message });
}

log("info", "Server starting...");
log("warn", "Deprecated API used");
log("error", "Database connection failed");
```

---

## ⚙️ EventEmitter + async/await (Waiting for an Event)

```js
const { once } = require("events");

async function waitForReady(emitter) {
  console.log("⏳ Waiting for ready event...");
  const [payload] = await once(emitter, "ready");
  console.log("🎉 Ready received:", payload);
}

const emitter = new EventEmitter();
waitForReady(emitter);
setTimeout(() => emitter.emit("ready", { status: "ok" }), 1000);
```

---

## ⚠️ Common Pitfalls

- Forgetting to remove listeners on short-lived objects → **memory leaks**.
- Not handling `'error'` events → **unhandled crash**.
- Assuming `.emit()` is async — it's **synchronous**; heavy listener logic blocks the emitter.
- Using arrow functions when you need `this` bound to the emitter (arrow functions don't rebind `this`).

---

## 🧪 Try It Yourself

1. Build a `Chatroom extends EventEmitter` class with `join`, `leave`, and `message` events.
2. Trigger the max-listeners warning intentionally by adding 11 listeners, then fix it with `setMaxListeners`.
3. Use `events.once()` to build a simple "wait for multiple events" coordinator using `Promise.all`.
