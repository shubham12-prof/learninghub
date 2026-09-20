# BST (Binary Search Tree)

A binary tree with an ordering rule: for every node, everything in its **left** subtree is smaller, and everything in its **right** subtree is larger. This makes search, insert, and delete O(log n) on average (O(h) in general).

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

## Search

```javascript
function search(root, target) {
  if (root === null) return null;
  if (root.val === target) return root;
  return target < root.val
    ? search(root.left, target)
    : search(root.right, target);
}
```

## Insert

```javascript
function insert(root, val) {
  if (root === null) return new TreeNode(val);

  if (val < root.val) {
    root.left = insert(root.left, val);
  } else if (val > root.val) {
    root.right = insert(root.right, val);
  }
  // if val === root.val, typically ignore (no duplicates)

  return root;
}
```

## Delete

```javascript
function deleteNode(root, key) {
  if (root === null) return null;

  if (key < root.val) {
    root.left = deleteNode(root.left, key);
  } else if (key > root.val) {
    root.right = deleteNode(root.right, key);
  } else {
    // found the node to delete
    if (root.left === null) return root.right;
    if (root.right === null) return root.left;

    // two children: replace with the in-order successor (smallest in right subtree)
    let successor = root.right;
    while (successor.left !== null) successor = successor.left;

    root.val = successor.val;
    root.right = deleteNode(root.right, successor.val);
  }

  return root;
}
```

## Validate BST

```javascript
function isValidBST(root, min = -Infinity, max = Infinity) {
  if (root === null) return true;
  if (root.val <= min || root.val >= max) return false;

  return (
    isValidBST(root.left, min, root.val) &&
    isValidBST(root.right, root.val, max)
  );
}
```

## Why in-order traversal matters here

Running an in-order traversal (left → root → right) on a BST always yields values in **sorted order** — a quick way to validate a BST or extract sorted data without a separate sort step.

## Complexity

Search, insert, delete: O(h) time, where h = O(log n) if balanced, O(n) if skewed (essentially a linked list).
Space: O(h) for recursion.

## Recognize this pattern when...

The problem mentions "sorted order," "kth smallest," "closest value," or building a structure that needs fast ordered search/insert.
