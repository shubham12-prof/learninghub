# Singleton

Ensures a class/object has only **one instance**, providing a global access point to it — useful for shared resources like config, DB connections, or logging.

```js
class Database {
  static #instance;

  constructor() {
    if (Database.#instance) {
      return Database.#instance; // return existing instance instead of creating new
    }
    this.connection = "Connected to DB";
    Database.#instance = this;
  }
}

const db1 = new Database();
const db2 = new Database();
db1 === db2; // true — same instance
```

Simpler version using a module (module exports are cached/singleton by nature):

```js
// config.js
const config = { apiUrl: "https://api.example.com" };
export default config; // every import gets the SAME object reference
```
