// Pure CEFR-by-vocabulary-profile logic, with NO Node/DOM/fs dependency, so it
// can run identically in Node (server/cefr-classifier.mjs feeds it the wordlist
// via fs) and on the Cloudflare Worker edge (server/worker.mjs feeds it the same
// wordlist via a bundled JSON import). See cefr-classifier.mjs for the method.

const ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const COVERAGE_TARGET = 0.85;

// Strip common inflections so forms hit their Oxford base entry.
function lookup(word, wordlist) {
  let b = wordlist[word];
  if (b) return b;
  const tries = [];
  if (word.endsWith("'s")) tries.push(word.slice(0, -2));
  if (word.endsWith('ing')) tries.push(word.slice(0, -3), word.slice(0, -3) + 'e');
  if (word.endsWith('ed')) tries.push(word.slice(0, -2), word.slice(0, -1), word.slice(0, -3));
  if (word.endsWith('ies')) tries.push(word.slice(0, -3) + 'y');
  if (word.endsWith('es')) tries.push(word.slice(0, -2));
  if (word.endsWith('s')) tries.push(word.slice(0, -1));
  if (word.endsWith('er')) tries.push(word.slice(0, -2), word.slice(0, -1));
  if (word.endsWith('est')) tries.push(word.slice(0, -3), word.slice(0, -2));
  if (word.endsWith('ly')) tries.push(word.slice(0, -2));
  for (const t of tries) {
    if (t.length >= 2 && wordlist[t]) return wordlist[t];
  }
  return null; // off-list
}

/**
 * Estimate the CEFR level of an English text by Oxford 5000 vocabulary profile.
 * @param {string} text
 * @param {Record<string,'A1'|'A2'|'B1'|'B2'|'C1'>} wordlist
 * @returns {'A1'|'A2'|'B1'|'B2'|'C1'|'C2'}
 */
export function classifyCefr(text, wordlist) {
  const tokens = (text.toLowerCase().match(/[a-z][a-z']+|[ai]/g) || []);
  if (tokens.length < 10) return 'A2'; // too little signal → safe default

  const counts = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, OFF: 0 };
  for (const w of tokens) {
    const band = lookup(w, wordlist);
    counts[band ?? 'OFF']++;
  }
  const n = tokens.length;

  // Cumulative lexical coverage up to each band.
  let cum = 0;
  let level = 'C2';
  for (const band of ['A1', 'A2', 'B1', 'B2', 'C1']) {
    cum += counts[band] / n;
    if (cum >= COVERAGE_TARGET) {
      level = band;
      break;
    }
  }

  // Sentence-length nudge: long sentences push one band up, very short pull down.
  const sentences = (text.match(/[.!?]+/g) || []).length || 1;
  const avgSentLen = n / sentences;
  let idx = ORDER.indexOf(level);
  if (avgSentLen > 22 && idx < ORDER.length - 1) idx++;
  else if (avgSentLen < 7 && idx > 0) idx--;

  return ORDER[idx];
}
