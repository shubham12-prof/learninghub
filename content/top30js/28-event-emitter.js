/*
  Top 30 - #28: Event Emitter

  PROBLEM: build a simple pub/sub system - subscribe to a named event
  (on), fire it later (emit), running every subscribed callback.
*/

class EventEmitter {
  constructor() {
    this.events = {}; // { eventName: [callback1, callback2, ...] }
  }

  on(eventName, callback) {
    if (!this.events[eventName]) this.events[eventName] = [];
    this.events[eventName].push(callback);
    return () => this.off(eventName, callback); // returns an unsubscribe fn
  }

  off(eventName, callback) {
    if (!this.events[eventName]) return;
    this.events[eventName] = this.events[eventName].filter((cb) => cb !== callback);
  }

  emit(eventName, ...args) {
    if (!this.events[eventName]) return;
    this.events[eventName].slice().forEach((callback) => callback(...args));
  }

  once(eventName, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(eventName, wrapper);
    };
    this.on(eventName, wrapper);
  }
}

// -----------------------------------------------------------------
// Example usage
// -----------------------------------------------------------------
const emitter = new EventEmitter();

emitter.on("login", (username) => console.log(`${username} logged in!`));
emitter.emit("login", "Priya"); // "Priya logged in!"

emitter.once("signup", (name) => console.log(`${name} signed up (once)`));
emitter.emit("signup", "Tara"); // "Tara signed up (once)"
emitter.emit("signup", "Tara"); // (nothing - already unsubscribed)

/*
  TIME COMPLEXITY: emit() is O(k) where k = number of listeners for
  that event.
*/
