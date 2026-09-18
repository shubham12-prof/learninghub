/*
  Top 30 - #27: LRU Cache

  PROBLEM: build a fixed-capacity cache. When full, evict the LEAST
  RECENTLY USED item first. get() and put() should be O(1).

  WHY A MAP FITS: JS Map remembers insertion order, and deleting +
  re-inserting a key moves it to the "end" in O(1) - we treat "end" as
  most-recently-used, and "start" as least-recently-used (next to evict).
*/

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;

    // Mark as recently used: delete + re-insert moves it to the end.
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Evict least recently used = first key in the Map's order.
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}

// -----------------------------------------------------------------
// Example usage
// -----------------------------------------------------------------
const lru = new LRUCache(2);
lru.put(1, "a");
lru.put(2, "b");
console.log(lru.get(1)); // "a" (1 is now most recently used)

lru.put(3, "c"); // cache full -> evicts key 2 (least recently used)
console.log(lru.get(2)); // -1 (evicted)
console.log(lru.get(1)); // "a"
console.log(lru.get(3)); // "c"

/*
  TIME COMPLEXITY: O(1) for get() and put().
  SPACE COMPLEXITY: O(capacity)
*/
