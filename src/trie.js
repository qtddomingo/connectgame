// Prefix tree. "$" marks the end of a complete word.
export function buildTrie(words) {
  const root = {};
  for (const word of words) {
    let node = root;
    for (const ch of word) node = node[ch] || (node[ch] = {});
    node.$ = true;
  }
  return root;
}
