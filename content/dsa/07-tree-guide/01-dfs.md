# DFS (Depth-First Search)

DFS explores as far as possible down one branch before backtracking. On trees, it's usually implemented recursively (using the call stack) or iteratively with an explicit stack.

## Recursive DFS — the three traversal orders

```javascript
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Preorder: root -> left -> right
function preorder(node, result = []) {
  if (node === null) return result;
  result.push(node.val);
  preorder(node.left, result);
  preorder(node.right, result);
  return result;
}

// Inorder: left -> root -> right (gives sorted order for a BST)
function inorder(node, result = []) {
  if (node === null) return result;
  inorder(node.left, result);
  result.push(node.val);
  inorder(node.right, result);
  return result;
}

// Postorder: left -> right -> root
function postorder(node, result = []) {
  if (node === null) return result;
  postorder(node.left, result);
  postorder(node.right, result);
  result.push(node.val);
  return result;
}
```

## Iterative DFS (preorder) using an explicit stack

```javascript
function preorderIterative(root) {
  if (root === null) return [];
  const stack = [root];
  const result = [];

  while (stack.length > 0) {
    const node = stack.pop();
    result.push(node.val);

    // push right first so left is processed first (stack is LIFO)
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }

  return result;
}
```

## DFS on a graph (with a visited set, to avoid infinite loops)

```javascript
function dfsGraph(graph, start, visited = new Set()) {
  visited.add(start);
  const order = [start];

  for (const neighbor of graph[start]) {
    if (!visited.has(neighbor)) {
      order.push(...dfsGraph(graph, neighbor, visited));
    }
  }

  return order;
}
```

## Complexity

O(n) time (visits every node once), O(h) space for the recursion/stack, where h is the tree height (O(log n) balanced, O(n) worst case skewed).

## Recognize this pattern when...

The problem involves exploring full paths, backtracking, or needs one of preorder/inorder/postorder — e.g. "path sum," "validate BST," "serialize a tree."
