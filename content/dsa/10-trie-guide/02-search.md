# Search (Trie)

Searching a Trie means walking down the tree one character at a time, following the path that matches the query string, then checking whether that path represents a **complete word** (not just a prefix that happens to exist).

## Node structure (same as Insert)

```javascript
class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
  }
}
```

## Search implementation

```javascript
class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children[ch]) node.children[ch] = new TrieNode();
      node = node.children[ch];
    }
    node.isEndOfWord = true;
  }

  search(word) {
    const node = this._traverse(word);
    return node !== null && node.isEndOfWord; // must be a complete word, not just a prefix
  }

  // helper: walk the tree following `str`, return the final node or null if path breaks
  _traverse(str) {
    let node = this.root;
    for (const ch of str) {
      if (!node.children[ch]) return null;
      node = node.children[ch];
    }
    return node;
  }
}

const trie = new Trie();
trie.insert("cat");
trie.insert("car");

console.log(trie.search("cat")); // true
console.log(trie.search("ca")); // false -> "ca" exists as a path but isn't a complete word
console.log(trie.search("dog")); // false -> path doesn't even exist
```

## The key distinction: search vs prefix check

`search("ca")` returns `false` because "ca" was never inserted as a full word — even though the path `c -> a` exists in the tree (it's a prefix of "cat" and "car"). This is why `isEndOfWord` is essential — without it, you couldn't tell a real word from a partial path.

## Complexity

O(L) time, where L = length of the search string. No dependency on how many words are stored in the Trie — a big advantage over scanning a list of strings.

## Where it shows up

Dictionary/word validation, checking if an exact word exists (as opposed to `startsWith`, covered in Prefix Matching).
