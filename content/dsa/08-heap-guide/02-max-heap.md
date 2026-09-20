# Max Heap

A binary heap where every parent is **greater than or equal to** its children — the largest element is always at the root. Same structure as a Min Heap, just with the comparisons flipped.

## Implementation
```javascript
class MaxHeap {
  constructor() {
    this.heap = [];
  }

  size() { return this.heap.length; }
  peek() { return this.heap[0]; }

  push(val) {
    this.heap.push(val);
    this.bubbleUp(this.heap.length - 1);
  }

  pop() {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }

  bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent] >= this.heap[i]) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  bubbleDown(i) {
    const n = this.heap.length;
    while (true) {
      let largest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;

      if (left < n && this.heap[left] > this.heap[largest]) largest = left;
      if (right < n && this.heap[right] > this.heap[largest]) largest = right;

      if (largest === i) break;
      [this.heap[i], this.heap[largest]] = [this.heap[largest], this.heap[i]];
      i = largest;
    }
  }
}

const heap = new MaxHeap();
[5, 3, 8, 1, 9].forEach(v => heap.push(v));
console.log(heap.pop()); // 9
console.log(heap.pop()); // 8
```

## Trick: simulate a Max Heap using a Min Heap
If you only have a Min Heap available, negate values on the way in and out:
```javascript
minHeap.push(-val);      // insert
const max = -minHeap.pop(); // extract max
```

## Complexity
Push: O(log n). Pop: O(log n). Peek: O(1). Build heap from an array: O(n).

## Where it shows up
Kth largest element, task scheduling by highest priority, running median (paired with a Min Heap).
