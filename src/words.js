import raw from '../assets/words.json';
import { buildTrie } from './trie';

// Ñ -> N, strip accents, uppercase, letters only.
// "ng" needs no special handling: it simply becomes two tiles, N and G.
export const normalize = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');

const info = new Map();
for (const e of raw) {
  if (!e || !e.word) continue;
  const display = String(e.word).trim();
  if (/\s/.test(display)) continue; // skip multi-word entries
  const key = normalize(display);
  if (key.length < 3 || key.length > 12) continue;
  const prev = info.get(key);
  if (!prev) {
    info.set(key, { word: display, definition: e.definition || '', english: e.english || '' });
  } else {
    if (!prev.definition && e.definition) prev.definition = e.definition;
    if (!prev.english && e.english) prev.english = e.english;
  }
}

export const WORDS = [...info.keys()];
export const TRIE = buildTrie(WORDS);
export const getInfo = (key) => info.get(key);
