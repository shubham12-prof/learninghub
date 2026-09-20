# Union Find (Disjoint Set Union)

A data structure that tracks a set of elements partitioned into disjoint (non-overlapping) groups, supporting two near-constant-time operations: `find` (which group is this element in?) and `union` (merge two groups). Extremely useful for connectivity problems.

## Implementation — with Path Compression + Union by Rank

```javascript
class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i); // each node is its own parent initially
    this.rank = new Array(n).fill(0);
    this.count = n; // number of disjoint groups
  }

  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // path compression: point directly to root
    }
    return this.parent[x];
  }

  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return false; // already in the same group

    // union by rank: attach smaller tree under the larger one
    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
    } else {
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
    }

    this.count--;
    return true;
  }

  connected(x, y) {
    return this.find(x) === this.find(y);
  }
}

const uf = new UnionFind(6);
uf.union(0, 1);
uf.union(1, 2);
uf.union(3, 4);

console.log(uf.connected(0, 2)); // true
console.log(uf.connected(0, 3)); // false
console.log(uf.count); // 3 groups: {0,1,2}, {3,4}, {5}
```

## Example — Number of Connected Components in a Graph

```javascript
function countComponents(n, edges) {
  const uf = new UnionFind(n);
  for (const [a, b] of edges) uf.union(a, b);
  return uf.count;
}

console.log(
  countComponents(5, [
    [0, 1],
    [1, 2],
    [3, 4],
  ]),
); // 2
```

## Example — Detect a cycle in an undirected graph

```javascript
function hasCycle(n, edges) {
  const uf = new UnionFind(n);
  for (const [a, b] of edges) {
    if (!uf.union(a, b)) return true; // a and b already connected -> adding this edge creates a cycle
  }
  return false;
}
```

## Why path compression + union by rank matter

Without them, `find` can degrade to O(n) if the tree becomes a long chain. Together, these two optimizations keep operations nearly O(1) amortized (technically O(α(n)), the inverse Ackermann function — grows so slowly it's effectively constant for any realistic input).

## Complexity

`find` and `union`: O(α(n)) amortized — practically constant time.

## Where it shows up

Connected components, cycle detection in undirected graphs, Kruskal's minimum spanning tree algorithm, "accounts merge" / "friend circles" style problems.
