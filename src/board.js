export const SIZE = 4;
export const N = SIZE * SIZE;

// Rough Tagalog letter frequencies (A, N, I, G dominate).
const FREQ = {
  A: 26, N: 10, I: 9, G: 7, O: 6, T: 5, S: 6, U: 6, L: 5, M: 5,
  K: 5, B: 4, P: 4, D: 4, H: 3, Y: 3, W: 2, R: 3, E: 2,
};
const BAG = Object.entries(FREQ).flatMap(([l, n]) => Array(n).fill(l));
const randLetter = () => BAG[Math.floor(Math.random() * BAG.length)];

export const NEIGHBORS = Array.from({ length: N }, (_, i) => {
  const r = Math.floor(i / SIZE);
  const c = i % SIZE;
  const out = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr;
      const cc = c + dc;
      if (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE) out.push(rr * SIZE + cc);
    }
  }
  return out;
});

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Random self-avoiding walk that spells `word` on empty cells.
function walk(grid, word, i, cell, path) {
  if (grid[cell] !== null) return null;
  const next = [...path, cell];
  if (i === word.length - 1) return next;
  for (const nb of shuffle(NEIGHBORS[cell])) {
    if (next.includes(nb)) continue;
    const found = walk(grid, word, i + 1, nb, next);
    if (found) return found;
  }
  return null;
}

function tryPlace(grid, word) {
  for (const start of shuffle([...Array(N).keys()])) {
    const path = walk(grid, word, 0, start, []);
    if (path) {
      path.forEach((cell, i) => (grid[cell] = word[i]));
      return true;
    }
  }
  return false;
}

// Every dictionary word (3+ letters) that can be traced on the grid.
export function solve(grid, trie) {
  const found = new Set();
  const used = new Set();
  const visit = (cell, node, prefix) => {
    const ch = grid[cell];
    const next = node[ch];
    if (!next) return;
    const word = prefix + ch;
    if (next.$ && word.length >= 3) found.add(word);
    used.add(cell);
    for (const nb of NEIGHBORS[cell]) if (!used.has(nb)) visit(nb, next, word);
    used.delete(cell);
  };
  for (let i = 0; i < N; i++) visit(i, trie, '');
  return found;
}

// Seed the board with a few real words, fill the rest with weighted random
// letters, then solve it so we know every word that is findable.
export function generateBoard(words, trie) {
  const long = words.filter((w) => w.length >= 4 && w.length <= 7);
  const source = long.length ? long : words;
  let best = null;
  for (let attempt = 0; attempt < 25; attempt++) {
    const grid = Array(N).fill(null);
    let used = 0;
    for (const w of shuffle(source)) {
      if (used + w.length > N) continue;
      if (tryPlace(grid, w)) used += w.length;
      if (used >= 12) break;
    }
    for (let i = 0; i < N; i++) if (grid[i] === null) grid[i] = randLetter();
    const solutions = solve(grid, trie);
    if (!best || solutions.size > best.solutions.size) best = { grid, solutions };
    if (solutions.size >= 15) break;
  }
  return best;
}
