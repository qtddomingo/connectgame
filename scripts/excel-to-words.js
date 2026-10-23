// Usage: node scripts/excel-to-words.js path/to/RootWordsUpdatedv5.xlsx
// Reads the Tagalog sheets and writes assets/words.json for the app.
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/excel-to-words.js <path-to-xlsx>');
  process.exit(1);
}

const wb = XLSX.readFile(file);
let sheets = wb.SheetNames.filter((n) => /tagalog|root/i.test(n));
if (!sheets.length) sheets = wb.SheetNames;

const col = (headers, re, fallback) => {
  const i = headers.findIndex((h) => re.test(h));
  return i >= 0 ? i : fallback;
};

const entries = new Map();

for (const name of sheets) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' });
  if (rows.length < 2) continue;
  const headers = rows[0].map((h) => String(h).trim().toLowerCase());
  const wordCol = col(headers, /^(root\s*word|rootword|word|salita|ugat)/, 0);
  const defCol = col(headers, /definition|kahulugan|depinisyon|meaning/, -1);
  const engCol = col(headers, /english|translation/, -1);
  const sentCol = col(headers, /sample|sentence|halimbawa|pangungusap/, -1);
  console.log(
    `Sheet "${name}": word=${headers[wordCol]} | definition=${headers[defCol] ?? '-'} | english=${headers[engCol] ?? '-'} | sentence=${headers[sentCol] ?? '-'}`
  );

  for (const row of rows.slice(1)) {
    const word = String(row[wordCol] ?? '').trim();
    if (!word) continue;
    const key = word.toLowerCase();
    const next = {
      word,
      definition: defCol >= 0 ? String(row[defCol] ?? '').trim() : '',
      english: engCol >= 0 ? String(row[engCol] ?? '').trim() : '',
      sentence: sentCol >= 0 ? String(row[sentCol] ?? '').trim() : '',
    };
    const prev = entries.get(key);
    if (!prev) entries.set(key, next);
    else for (const k of ['definition', 'english', 'sentence']) if (!prev[k] && next[k]) prev[k] = next[k];
  }
}

const out = path.join(__dirname, '..', 'assets', 'words.json');
fs.writeFileSync(out, JSON.stringify([...entries.values()], null, 1));
console.log(`Wrote ${entries.size} words to ${out}`);
