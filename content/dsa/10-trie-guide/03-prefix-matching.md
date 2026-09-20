# Prefix Matching (Trie)

This is where Tries really shine: checking whether **any** word in the set starts with a given prefix, and listing all words that do — both far faster than scanning a list of strings.

## `startsWith` — does any word begin with this prefix?

```javascript
class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
  }
}

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

  startsWith(prefix) {
    return this._traverse(prefix) !== null; // path exists, don't care if it's a full word
  }

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
trie.insert("apple");
trie.insert("app");
trie.insert("application");

console.log(trie.startsWith("app")); // true
console.log(trie.startsWith("appl")); // true
console.log(trie.startsWith("banana")); // false
```

## Autocomplete — list all words with a given prefix

```javascript
class AutocompleteTrie extends Trie {
  getWordsWithPrefix(prefix) {
    const results = [];
    const startNode = this._traverse(prefix);
    if (startNode === null) return results; // no words match this prefix

    this._collectWords(startNode, prefix, results);
    return results;
  }

  _collectWords(node, currentWord, results) {
    if (node.isEndOfWord) results.push(currentWord);

    for (const ch in node.children) {
      this._collectWords(node.children[ch], currentWord + ch, results);
    }
  }
}

const auto = new AutocompleteTrie();
["app", "apple", "application", "apply", "banana"].forEach((w) =>
  auto.insert(w),
);

console.log(auto.getWordsWithPrefix("app"));
// ["app", "apple", "application", "apply"]
```

## Complexity

`startsWith`: O(L) time, where L = prefix length.
Autocomplete (`getWordsWithPrefix`): O(L + n) where n = total characters across all matching words (must visit each character of each result once).

## Where it shows up

Search bar autocomplete, IDE code completion, IP routing tables (longest matching prefix), T9 predictive text.
