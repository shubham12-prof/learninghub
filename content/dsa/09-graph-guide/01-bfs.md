# BFS (Graph)

Breadth-first search explores a graph level by level using a queue — visiting every neighbor at the current distance before moving further out. On unweighted graphs, it always finds the shortest path.

## Representation — adjacency list

```javascript
const graph = {
  A: ["B", "C"],
  B: ["A", "D", "E"],
  C: ["A", "F"],
  D: ["B"],
  E: ["B", "F"],
  F: ["C", "E"],
};
```

## Basic BFS traversal

```javascript
function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  const order = [];

  while (queue.length > 0) {
    const node = queue.shift();
    order.push(node);

    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return order;
}

console.log(bfs(graph, "A")); // ["A", "B", "C", "D", "E", "F"]
```

## Shortest path (unweighted) — track distance and parent

```javascript
function shortestPath(graph, start, target) {
  const visited = new Set([start]);
  const queue = [[start, 0]]; // [node, distance]
  const parent = new Map();

  while (queue.length > 0) {
    const [node, dist] = queue.shift();

    if (node === target) {
      // reconstruct path by walking parents backward
      const path = [target];
      let curr = target;
      while (parent.has(curr)) {
        curr = parent.get(curr);
        path.unshift(curr);
      }
      return { path, distance: dist };
    }

    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, node);
        queue.push([neighbor, dist + 1]);
      }
    }
  }

  return null; // target unreachable
}

console.log(shortestPath(graph, "A", "F"));
// { path: ["A", "C", "F"], distance: 2 }
```

## Complexity

O(V + E) time (vertices + edges), O(V) space.

## Recognize this pattern when...

The problem asks for "shortest path," "minimum number of steps/moves," or "levels" in an **unweighted** graph — for weighted graphs, use Dijkstra instead.
