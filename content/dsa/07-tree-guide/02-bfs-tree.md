# BFS (Tree)

Level-order traversal — visiting all nodes at depth 0, then depth 1, then depth 2, and so on. Uses a queue, same core idea as graph BFS but specialized for trees.

## Basic level-order traversal (flat list)

```javascript
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function levelOrder(root) {
  if (root === null) return [];
  const queue = [root];
  const result = [];

  while (queue.length > 0) {
    const node = queue.shift();
    result.push(node.val);

    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }

  return result;
}
```

## Level-by-level (grouped into sub-arrays) — very common interview variant

```javascript
function levelOrderGrouped(root) {
  if (root === null) return [];
  const queue = [root];
  const result = [];

  while (queue.length > 0) {
    const levelSize = queue.length; // snapshot how many nodes are in this level
    const currentLevel = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      currentLevel.push(node.val);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(currentLevel);
  }

  return result;
}

//        3
//       / \
//      9  20
//         / \
//        15  7
// levelOrderGrouped -> [[3], [9, 20], [15, 7]]
```

## Finding the max depth using BFS

```javascript
function maxDepth(root) {
  if (root === null) return 0;
  const queue = [root];
  let depth = 0;

  while (queue.length > 0) {
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    depth++;
  }

  return depth;
}
```

## Complexity

O(n) time (visits every node once), O(w) space where w is the maximum width of the tree (worst case O(n) for a wide tree).

## Recognize this pattern when...

The problem mentions "level order," "level by level," "zigzag traversal," "right side view," or "minimum depth."
