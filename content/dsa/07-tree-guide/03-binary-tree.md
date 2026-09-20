# Binary Tree

A tree where each node has at most two children, referred to as `left` and `right`. The foundation for BSTs, heaps, and many recursive algorithms.

## Node definition

```javascript
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}
```

## Basic properties — height and node count

```javascript
function height(node) {
  if (node === null) return 0;
  return 1 + Math.max(height(node.left), height(node.right));
}

function countNodes(node) {
  if (node === null) return 0;
  return 1 + countNodes(node.left) + countNodes(node.right);
}
```

## Check if two trees are identical

```javascript
function isSameTree(p, q) {
  if (p === null && q === null) return true;
  if (p === null || q === null) return false;
  return (
    p.val === q.val &&
    isSameTree(p.left, q.left) &&
    isSameTree(p.right, q.right)
  );
}
```

## Invert (mirror) a binary tree

```javascript
function invertTree(root) {
  if (root === null) return null;

  [root.left, root.right] = [invertTree(root.right), invertTree(root.left)];

  return root;
}
```

## Diameter of a binary tree

The longest path between any two nodes (doesn't have to pass through the root).

```javascript
function diameterOfBinaryTree(root) {
  let diameter = 0;

  function depth(node) {
    if (node === null) return 0;
    const leftDepth = depth(node.left);
    const rightDepth = depth(node.right);
    diameter = Math.max(diameter, leftDepth + rightDepth); // path through this node
    return 1 + Math.max(leftDepth, rightDepth);
  }

  depth(root);
  return diameter;
}
```

## Complexity

Most binary tree operations: O(n) time (must visit every node), O(h) space for recursion, where h is tree height.

## Terminology cheat sheet

- **Leaf**: a node with no children
- **Height**: longest path from a node down to a leaf
- **Depth**: distance from the root to a given node
- **Balanced**: height difference between left and right subtrees is at most 1, for every node
- **Complete**: every level is fully filled except possibly the last, which fills left to right
