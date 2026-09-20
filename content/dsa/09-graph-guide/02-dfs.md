# DFS (Graph)

Depth-first search explores as far as possible along one path before backtracking. Implemented recursively (using the call stack) or iteratively with an explicit stack. A `visited` set is essential on graphs to avoid infinite loops from cycles.

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

## Recursive DFS

```javascript
function dfsRecursive(graph, node, visited = new Set(), order = []) {
  visited.add(node);
  order.push(node);

  for (const neighbor of graph[node]) {
    if (!visited.has(neighbor)) {
      dfsRecursive(graph, neighbor, visited, order);
    }
  }

  return order;
}

console.log(dfsRecursive(graph, "A")); // ["A", "B", "D", "E", "F", "C"]
```

## Iterative DFS (explicit stack)

```javascript
function dfsIterative(graph, start) {
  const visited = new Set();
  const stack = [start];
  const order = [];

  while (stack.length > 0) {
    const node = stack.pop();
    if (visited.has(node)) continue;

    visited.add(node);
    order.push(node);

    // push in reverse so traversal order matches the recursive version
    for (let i = graph[node].length - 1; i >= 0; i--) {
      if (!visited.has(graph[node][i])) stack.push(graph[node][i]);
    }
  }

  return order;
}
```

## Detecting a cycle in a directed graph (using 3 colors)

```javascript
function hasCycle(graph) {
  const WHITE = 0,
    GRAY = 1,
    BLACK = 2; // unvisited, in progress, done
  const color = {};
  for (const node in graph) color[node] = WHITE;

  function dfs(node) {
    color[node] = GRAY;

    for (const neighbor of graph[node]) {
      if (color[neighbor] === GRAY) return true; // back edge -> cycle
      if (color[neighbor] === WHITE && dfs(neighbor)) return true;
    }

    color[node] = BLACK;
    return false;
  }

  for (const node in graph) {
    if (color[node] === WHITE && dfs(node)) return true;
  }

  return false;
}
```

## Complexity

O(V + E) time, O(V) space (visited set + recursion/stack depth).

## Recognize this pattern when...

The problem involves exploring all paths, detecting cycles, counting connected components, or needs backtracking (e.g. "number of islands," "path exists between nodes").
