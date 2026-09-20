# Min Heap

A binary heap where every parent is **smaller than or equal to** its children — the smallest element is always at the root (index 0). Implemented as an array; child/parent relationships are computed with index math, no pointers needed.

## Index math

For a node at index `i`:

- Parent: `Math.floor((i - 1) / 2)`
- Left child: `2 * i + 1`
- Right child: `2 * i + 2`

## Implementation

```javascript
class MinHeap {
  constructor() {
    this.heap = [];
  }

  size() {
    return this.heap.length;
  }
  peek() {
    return this.heap[0];
  }

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
      if (this.heap[parent] <= this.heap[i]) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  bubbleDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;

      if (left < n && this.heap[left] < this.heap[smallest]) smallest = left;
      if (right < n && this.heap[right] < this.heap[smallest]) smallest = right;

      if (smallest === i) break;
      [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
  }
}

const heap = new MinHeap();
[5, 3, 8, 1, 9].forEach((v) => heap.push(v));
console.log(heap.pop()); // 1
console.log(heap.pop()); // 3
```

## Complexity

Push: O(log n). Pop: O(log n). Peek: O(1). Build heap from an array: O(n).

## Where it shows up

Kth smallest element, Dijkstra's algorithm, merging K sorted lists, scheduling by earliest deadline.
