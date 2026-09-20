# Dijkstra's Algorithm

Finds the shortest path from a source node to all other nodes in a **weighted graph with non-negative edge weights**. Uses a priority queue (min heap) to always expand the currently-closest unvisited node next.

## Representation — weighted adjacency list

```javascript
const graph = {
  A: [
    ["B", 4],
    ["C", 1],
  ],
  B: [["D", 1]],
  C: [
    ["B", 2],
    ["D", 5],
  ],
  D: [],
};
// each entry: [neighbor, edgeWeight]
```

## Simple Priority Queue helper

```javascript
class MinPriorityQueue {
  constructor() {
    this.heap = [];
  }
  isEmpty() {
    return this.heap.length === 0;
  }

  push(item) {
    this.heap.push(item);
    this.heap.sort((a, b) => a.dist - b.dist); // simple but O(n log n) per push — fine for learning
  }

  pop() {
    return this.heap.shift();
  }
}
```

## Dijkstra implementation

```javascript
function dijkstra(graph, start) {
  const distances = {};
  for (const node in graph) distances[node] = Infinity;
  distances[start] = 0;

  const pq = new MinPriorityQueue();
  pq.push({ node: start, dist: 0 });

  const visited = new Set();

  while (!pq.isEmpty()) {
    const { node, dist } = pq.pop();

    if (visited.has(node)) continue; // already finalized with a shorter distance
    visited.add(node);

    for (const [neighbor, weight] of graph[node]) {
      const newDist = dist + weight;
      if (newDist < distances[neighbor]) {
        distances[neighbor] = newDist;
        pq.push({ node: neighbor, dist: newDist });
      }
    }
  }

  return distances;
}

console.log(dijkstra(graph, "A"));
// { A: 0, B: 3, C: 1, D: 4 }
```

## Why it needs non-negative weights

Dijkstra assumes that once a node is popped from the queue with the smallest known distance, that distance is **final** — a negative edge could later create an even shorter path, breaking that assumption. For graphs with negative weights, use Bellman-Ford instead.

## Complexity

O((V + E) log V) using a binary heap priority queue. (The simplified array-sort version above is O(V² log V) — fine for learning, but swap in a real heap for production use.)

## Where it shows up

GPS/routing systems, network routing protocols, "cheapest flights within K stops" style problems, game pathfinding (often extended into A\*).
