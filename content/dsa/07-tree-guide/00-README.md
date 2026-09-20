# Trees in JavaScript — Learning Guide

Core tree patterns for interviews and everyday problem solving.

## Files
1. `01-dfs.md`
2. `02-bfs-tree.md`
3. `03-binary-tree.md`
4. `04-bst.md`
5. `05-avl-basics.md`

## Quick Reference Table

| Pattern        | Time      | Space | Typical Use Case                                      |
|-----------------|-----------|-------|------------------------------------------------------------|
| DFS             | O(n)      | O(h)  | Pre/in/postorder traversal, path sum, backtracking          |
| BFS (Tree)      | O(n)      | O(w)  | Level order traversal, min depth, right side view           |
| Binary Tree     | O(n)      | O(h)  | Height, diameter, invert, structural comparisons             |
| BST             | O(h)      | O(h)  | Ordered search/insert/delete, kth smallest, validation        |
| AVL Basics      | O(log n)  | O(log n) | Guaranteed-balanced search tree via rotations             |

(h = tree height, w = max width, n = number of nodes)

## Suggested Practice Order
1. Binary Tree (fundamentals: height, count, invert)
2. DFS (preorder/inorder/postorder recursion)
3. BFS (Tree) (level order traversal)
4. BST (ordering property, search/insert/delete)
5. AVL Basics (self-balancing, rotations)
