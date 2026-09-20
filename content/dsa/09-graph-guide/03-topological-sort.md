# Topological Sort

An ordering of nodes in a **directed acyclic graph (DAG)** such that for every directed edge `u -> v`, `u` comes before `v` in the ordering. Only exists if the graph has no cycles.

## Representation — adjacency list (directed edges)

```javascript
const graph = {
  A: ["C"],
  B: ["C", "D"],
  C: ["E"],
  D: ["F"],
  E: ["F"],
  F: [],
};
```

## Approach 1 — Kahn's Algorithm (BFS-based, using in-degrees)

```javascript
function topologicalSortKahn(graph) {
  const inDegree = {};
  for (const node in graph) inDegree[node] = 0;
  for (const node in graph) {
    for (const neighbor of graph[node]) inDegree[neighbor]++;
  }

  // start with all nodes that have no incoming edges
  const queue = Object.keys(inDegree).filter((node) => inDegree[node] === 0);
  const result = [];

  while (queue.length > 0) {
    const node = queue.shift();
    result.push(node);

    for (const neighbor of graph[node]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }

  // if result doesn't include every node, there was a cycle
  if (result.length !== Object.keys(graph).length) return null;

  return result;
}

console.log(topologicalSortKahn(graph)); // e.g. ["A", "B", "C", "D", "E", "F"]
```

## Approach 2 — DFS-based (postorder, then reverse)

```javascript
function topologicalSortDFS(graph) {
  const visited = new Set();
  const stack = [];

  function dfs(node) {
    visited.add(node);
    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) dfs(neighbor);
    }
    stack.push(node); // add AFTER visiting all descendants
  }

  for (const node in graph) {
    if (!visited.has(node)) dfs(node);
  }

  return stack.reverse();
}
```

## Why this only works on DAGs

A cycle means some node would need to come "before itself" in the ordering — impossible. Kahn's algorithm naturally detects this: if any nodes still have `inDegree > 0` after processing, a cycle exists and no valid ordering is possible.

## Complexity

O(V + E) time for both approaches, O(V) space.

## Where it shows up

Course scheduling (prerequisites), build systems (compile order), task dependency resolution, package manager install order.
