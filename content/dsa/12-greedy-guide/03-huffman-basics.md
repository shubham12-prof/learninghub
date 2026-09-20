# Huffman Basics

A greedy algorithm for building an optimal **prefix-free** binary encoding of characters based on frequency — more frequent characters get shorter codes, less frequent ones get longer codes. Used in data compression (e.g. the basis of DEFLATE/ZIP, JPEG).

## Core idea

1. Count frequency of each character.
2. Repeatedly take the two **least frequent** nodes and merge them into a new node (frequency = sum of both), until only one node (the root) remains.
3. Walking left = `0`, walking right = `1` — the path from root to a leaf is that character's code.

## Implementation (using a Min Heap / Priority Queue)

```javascript
class HuffmanNode {
  constructor(char, freq, left = null, right = null) {
    this.char = char;
    this.freq = freq;
    this.left = left;
    this.right = right;
  }
}

class MinPriorityQueue {
  constructor() {
    this.heap = [];
  }
  isEmpty() {
    return this.heap.length === 0;
  }
  size() {
    return this.heap.length;
  }

  push(node) {
    this.heap.push(node);
    this.heap.sort((a, b) => a.freq - b.freq); // simple version — swap for a real heap for performance
  }

  pop() {
    return this.heap.shift();
  }
}

function buildHuffmanTree(text) {
  const freqMap = new Map();
  for (const ch of text) freqMap.set(ch, (freqMap.get(ch) || 0) + 1);

  const pq = new MinPriorityQueue();
  for (const [char, freq] of freqMap) {
    pq.push(new HuffmanNode(char, freq));
  }

  // repeatedly merge the two least frequent nodes
  while (pq.size() > 1) {
    const left = pq.pop();
    const right = pq.pop();
    const merged = new HuffmanNode(null, left.freq + right.freq, left, right);
    pq.push(merged);
  }

  return pq.pop(); // root of the Huffman tree
}

function buildCodes(node, prefix = "", codes = {}) {
  if (node === null) return codes;

  if (node.char !== null) {
    codes[node.char] = prefix || "0"; // handle single-character edge case
    return codes;
  }

  buildCodes(node.left, prefix + "0", codes);
  buildCodes(node.right, prefix + "1", codes);
  return codes;
}

const root = buildHuffmanTree("aaabbc");
const codes = buildCodes(root);
console.log(codes);
// e.g. { a: "0", b: "10", c: "11"  } -- exact codes can vary, but 'a' (most frequent) gets the shortest
```

## Why it's "greedy"

At every step, you make the locally optimal choice — merge the two _currently_ smallest-frequency nodes — without reconsidering earlier merges. This greedy strategy is provably optimal for minimizing total encoded length (proven via an exchange argument).

## Why codes are "prefix-free"

No character's code is a prefix of another's, because every character ends up at a **leaf** node in the tree — you never stop partway down a path that another code continues along. This means a decoder can read bit by bit and always know exactly when one code ends and the next begins, with no ambiguity or separator needed.

## Complexity

O(n log n) time, where n = number of distinct characters (each heap push/pop is O(log n), done n times).

## Where it shows up

File compression (ZIP, gzip components), image compression (JPEG), any lossless compression scheme needing optimal variable-length codes.
