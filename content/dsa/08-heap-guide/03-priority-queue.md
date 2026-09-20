# Priority Queue

An abstract data type where each element has a priority, and the element with the highest priority (could mean smallest or largest value, depending on definition) is served first — not FIFO like a regular queue. Heaps are the standard way to implement one efficiently.

## Implementation — generic priority queue backed by a Min Heap

```javascript
class PriorityQueue {
  constructor(compare = (a, b) => a.priority - b.priority) {
    this.heap = [];
    this.compare = compare; // smaller return value = higher priority
  }

  size() {
    return this.heap.length;
  }
  isEmpty() {
    return this.heap.length === 0;
  }
  peek() {
    return this.heap[0];
  }

  enqueue(item) {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue() {
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
      if (this.compare(this.heap[parent], this.heap[i]) <= 0) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  bubbleDown(i) {
    const n = this.heap.length;
    while (true) {
      let best = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;

      if (left < n && this.compare(this.heap[left], this.heap[best]) < 0)
        best = left;
      if (right < n && this.compare(this.heap[right], this.heap[best]) < 0)
        best = right;

      if (best === i) break;
      [this.heap[i], this.heap[best]] = [this.heap[best], this.heap[i]];
      i = best;
    }
  }
}

// Example: hospital triage — lower number = more urgent
const pq = new PriorityQueue();
pq.enqueue({ task: "flu", priority: 3 });
pq.enqueue({ task: "heart attack", priority: 1 });
pq.enqueue({ task: "broken arm", priority: 2 });

console.log(pq.dequeue().task); // "heart attack"
console.log(pq.dequeue().task); // "broken arm"
```

## Example — Top K Frequent Elements using a priority queue

```javascript
function topKFrequent(nums, k) {
  const freq = new Map();
  for (const n of nums) freq.set(n, (freq.get(n) || 0) + 1);

  const pq = new PriorityQueue((a, b) => a.count - b.count); // min heap by count

  for (const [num, count] of freq) {
    pq.enqueue({ num, count });
    if (pq.size() > k) pq.dequeue(); // remove the least frequent
  }

  return pq.heap.map((item) => item.num);
}

console.log(topKFrequent([1, 1, 1, 2, 2, 3], 2)); // [1, 2] (order may vary)
```

## Complexity

Enqueue/dequeue: O(log n). Peek: O(1).

## Where it shows up

Task scheduling, Dijkstra's algorithm, A\* pathfinding, top-K problems, merging K sorted lists, event simulation.
