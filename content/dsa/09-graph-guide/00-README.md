# Graphs in JavaScript — Learning Guide

Core graph algorithm patterns for interviews and everyday problem solving.

## Files

1. `01-bfs.md`
2. `02-dfs.md`
3. `03-topological-sort.md`
4. `04-dijkstra.md`
5. `05-union-find.md`

## Quick Reference Table

| Pattern          | Time              | Space | Typical Use Case                                        |
| ---------------- | ----------------- | ----- | ------------------------------------------------------- |
| BFS              | O(V + E)          | O(V)  | Shortest path in unweighted graphs, levels              |
| DFS              | O(V + E)          | O(V)  | Path exploration, cycle detection, connected components |
| Topological Sort | O(V + E)          | O(V)  | Ordering with dependencies (DAGs only)                  |
| Dijkstra         | O((V+E) log V)    | O(V)  | Shortest path in weighted graphs (non-negative weights) |
| Union Find       | O(α(n)) amortized | O(n)  | Connectivity, cycle detection, Kruskal's MST            |

## Suggested Practice Order

1. BFS (queue-based traversal, shortest path unweighted)
2. DFS (recursive/stack-based traversal, cycle detection)
3. Union Find (connectivity without full traversal)
4. Topological Sort (build on DFS/BFS, add dependency ordering)
5. Dijkstra (build on BFS + priority queue, add weights)
