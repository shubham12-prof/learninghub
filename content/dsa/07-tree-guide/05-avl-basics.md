# AVL Basics

An AVL tree is a **self-balancing** BST. After every insert/delete, it checks a "balance factor" at each node and performs rotations if needed to keep the tree height O(log n) — guaranteeing fast operations even in the worst case (unlike a plain BST, which can degrade to O(n)).

## Balance Factor

`balanceFactor(node) = height(node.left) - height(node.right)`

A node is balanced if this value is `-1`, `0`, or `1`. If it becomes `-2` or `2` after an insert/delete, a rotation is needed.

## Node definition (tracks height)

```javascript
class AVLNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
    this.height = 1;
  }
}

function height(node) {
  return node === null ? 0 : node.height;
}

function balanceFactor(node) {
  return node === null ? 0 : height(node.left) - height(node.right);
}

function updateHeight(node) {
  node.height = 1 + Math.max(height(node.left), height(node.right));
}
```

## The Four Rotations

```javascript
// Right rotation (fixes Left-Left case)
function rotateRight(y) {
  const x = y.left;
  const T2 = x.right;

  x.right = y;
  y.left = T2;

  updateHeight(y);
  updateHeight(x);

  return x; // new subtree root
}

// Left rotation (fixes Right-Right case)
function rotateLeft(x) {
  const y = x.right;
  const T2 = y.left;

  y.left = x;
  x.right = T2;

  updateHeight(x);
  updateHeight(y);

  return y; // new subtree root
}
```

## Insert with rebalancing

```javascript
function insert(node, val) {
  // 1. normal BST insert
  if (node === null) return new AVLNode(val);
  if (val < node.val) node.left = insert(node.left, val);
  else if (val > node.val) node.right = insert(node.right, val);
  else return node; // no duplicates

  // 2. update height of this ancestor
  updateHeight(node);

  // 3. check balance factor and rebalance if needed
  const balance = balanceFactor(node);

  // Left-Left case
  if (balance > 1 && val < node.left.val) return rotateRight(node);

  // Right-Right case
  if (balance < -1 && val > node.right.val) return rotateLeft(node);

  // Left-Right case
  if (balance > 1 && val > node.left.val) {
    node.left = rotateLeft(node.left);
    return rotateRight(node);
  }

  // Right-Left case
  if (balance < -1 && val < node.right.val) {
    node.right = rotateRight(node.right);
    return rotateLeft(node);
  }

  return node; // already balanced
}
```

## The four imbalance cases, at a glance

| Case        | Condition                         | Fix                               |
| ----------- | --------------------------------- | --------------------------------- |
| Left-Left   | balance > 1, new val < left.val   | single right rotation             |
| Right-Right | balance < -1, new val > right.val | single left rotation              |
| Left-Right  | balance > 1, new val > left.val   | left rotation then right rotation |
| Right-Left  | balance < -1, new val < right.val | right rotation then left rotation |

## Complexity

Search, insert, delete: O(log n) **guaranteed**, since the tree height is always kept O(log n) — this is the whole point of AVL trees over plain BSTs.

## AVL vs plain BST

A plain BST can degrade to O(n) operations if inserted in sorted order (becomes a linked list). AVL trees trade a bit of insert/delete overhead (rotations) for guaranteed O(log n) operations always.
