# Queue in JavaScript — Learning Guide

Core queue-based patterns for interviews and everyday problem solving.

## Files

1. `01-circular-queue.md`
2. `02-deque.md`
3. `03-bfs.md`

## Quick Reference Table

| Pattern        | Time   | Space       | Typical Use Case                                   |
| -------------- | ------ | ----------- | -------------------------------------------------- |
| Circular Queue | O(1)   | O(capacity) | Fixed-size buffers, bounded sliding windows        |
| Deque          | O(1)\* | O(n)        | Sliding window max/min, both-ends insert/remove    |
| BFS            | O(V+E) | O(V)        | Shortest path/levels in unweighted graphs or grids |

\* with a proper linked-list-backed deque; plain array `shift`/`unshift` are O(n)

## Suggested Practice Order

1. Circular Queue (fixed-size FIFO mechanics)
2. Deque (generalize to both-ends access)
3. BFS (apply queues to graph/grid traversal)
