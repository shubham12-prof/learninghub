# Observer

Defines a one-to-many dependency: when a "subject" changes state, all its registered "observers" are notified automatically. Foundation of pub/sub systems, event emitters, and reactive UI frameworks.

```js
class EventEmitter {
  #listeners = {};

  on(event, callback) {
    if (!this.#listeners[event]) this.#listeners[event] = [];
    this.#listeners[event].push(callback);
    return () => this.off(event, callback); // returns an unsubscribe function
  }

  off(event, callback) {
    this.#listeners[event] = (this.#listeners[event] || []).filter(
      (cb) => cb !== callback,
    );
  }

  emit(event, data) {
    (this.#listeners[event] || []).forEach((callback) => callback(data));
  }
}

const emitter = new EventEmitter();
const unsubscribe = emitter.on("userLoggedIn", (user) => {
  console.log(`Welcome, ${user.name}!`);
});
emitter.emit("userLoggedIn", { name: "Alice" }); // "Welcome, Alice!"
unsubscribe(); // stop listening
```

This is exactly how the DOM's `addEventListener`, Node's `EventEmitter`, and state libraries (Redux subscribers) work under the hood.
