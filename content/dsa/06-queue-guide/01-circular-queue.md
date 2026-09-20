# Circular Queue

A fixed-size queue implemented on an array that wraps around — when the end of the array is reached, new elements go back to the beginning if there's freed-up space. This avoids the wasted space of a regular array-based queue (where shifting elements after every dequeue is O(n)).

## Implementation

```javascript
class CircularQueue {
  constructor(capacity) {
    this.capacity = capacity;
    this.queue = new Array(capacity);
    this.front = 0;
    this.size = 0;
  }

  enqueue(value) {
    if (this.isFull()) return false;
    const rear = (this.front + this.size) % this.capacity;
    this.queue[rear] = value;
    this.size++;
    return true;
  }

  dequeue() {
    if (this.isEmpty()) return null;
    const value = this.queue[this.front];
    this.front = (this.front + 1) % this.capacity;
    this.size--;
    return value;
  }

  peek() {
    return this.isEmpty() ? null : this.queue[this.front];
  }

  isEmpty() {
    return this.size === 0;
  }

  isFull() {
    return this.size === this.capacity;
  }
}

const cq = new CircularQueue(3);
cq.enqueue(1);
cq.enqueue(2);
cq.enqueue(3);
console.log(cq.enqueue(4)); // false, queue is full
console.log(cq.dequeue()); // 1
cq.enqueue(4); // now fits, wraps around internally
console.log(cq.peek()); // 2
```

## Why "circular"?

`front` and `rear` positions are calculated with `% capacity`, so indices wrap around to 0 after reaching the end of the underlying array — reusing freed slots instead of leaving them empty.

## Complexity

Enqueue, dequeue, peek: O(1) time each. O(capacity) space.

## Where it shows up

Fixed-size buffers, sliding window problems with a bounded window, CPU/task scheduling, streaming data with a bounded history.
