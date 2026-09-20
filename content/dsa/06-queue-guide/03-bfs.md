# BFS (Breadth-First Search)

BFS explores level by level, visiting all neighbors of a node before moving deeper. A **queue** is the natural data structure for this — it processes nodes in the order they were discovered (FIFO).

## Generic graph BFS

```javascript
function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  const order = [];

  while (queue.length > 0) {
    const node = queue.shift(); // dequeue
    order.push(node);

    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor); // enqueue
      }
    }
  }

  return order;
}

const graph = {
  A: ["B", "C"],
  B: ["A", "D"],
  C: ["A", "D"],
  D: ["B", "C"],
};

console.log(bfs(graph, "A")); // ["A", "B", "C", "D"]
```

## BFS on a grid (common in matrix/pathfinding problems)

```javascript
function bfsGrid(grid, startRow, startCol) {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = Array.from({ length: rows }, () =>
    new Array(cols).fill(false),
  );
  const queue = [[startRow, startCol]];
  visited[startRow][startCol] = true;
  const directions = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];
  let steps = 0;

  while (queue.length > 0) {
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const [r, c] = queue.shift();
      // process cell (r, c) here

      for (const [dr, dc] of directions) {
        const nr = r + dr,
          nc = c + dc;
        if (
          nr >= 0 &&
          nr < rows &&
          nc >= 0 &&
          nc < cols &&
          !visited[nr][nc] &&
          grid[nr][nc] !== 1 /* not a wall */
        ) {
          visited[nr][nc] = true;
          queue.push([nr, nc]);
        }
      }
    }
    steps++; // one full level/layer processed
  }

  return steps;
}
```

## Why BFS finds the _shortest_ path (unweighted graphs)

Because it explores in layers — everything at distance 1 before distance 2, and so on — the first time you reach a target node, you've reached it via the fewest possible edges.

## Complexity

O(V + E) time (vertices + edges), O(V) space for the visited set and queue.

## Recognize this pattern when...

The problem asks for "shortest path," "minimum steps," "levels," or "closest" in an unweighted graph or grid.
