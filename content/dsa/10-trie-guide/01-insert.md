# Insert (Trie)

A Trie (prefix tree) stores strings character by character in a tree, where each path from the root spells out a prefix. Inserting builds this path, creating new nodes only where needed.

## Node structure

```javascript
class TrieNode {
  constructor() {
    this.children = {}; // char -> TrieNode
    this.isEndOfWord = false;
  }
}
```

## Insert implementation

```javascript
class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;

    for (const ch of word) {
      if (!node.children[ch]) {
        node.children[ch] = new TrieNode(); // create path only if it doesn't exist
      }
      node = node.children[ch];
    }

    node.isEndOfWord = true; // mark the last node as a complete word
  }
}

const trie = new Trie();
trie.insert("cat");
trie.insert("car");
trie.insert("card");
// shared path: c -> a -> (t | r -> (end | d))
```

## What the tree looks like after inserting "cat", "car", "card"

```
root
 └── c
      └── a
           ├── t*        (end of "cat")
           └── r*        (end of "car")
                └── d*   (end of "card")
```

`*` marks `isEndOfWord = true`. Notice "car" and "card" share the same "c-a-r" path — this sharing is what makes Tries space-efficient for large sets of words with common prefixes.

## Complexity

O(L) time per insert, where L = length of the word being inserted.
O(total characters across all inserted words) space, in the worst case (no shared prefixes).

## Where it shows up

Autocomplete systems, spell checkers, IP routing (longest prefix match), word games (Boggle, Scrabble validation).
