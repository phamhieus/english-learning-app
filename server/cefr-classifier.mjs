// CEFR level estimator by vocabulary profiling against the Oxford 5000.
//
// Method: tokenise the text, map each (lemmatised) word to its Oxford CEFR band,
// then walk the cumulative lexical coverage A1 → C1. The text level is the
// lowest band at which the easy-to-that-band vocabulary covers ~85% of the
// tokens (the classic "lexical coverage → comprehension" idea). Words absent
// from the Oxford 5000 count as off-list (≈ C2 / proper nouns / rare). A light
// sentence-length signal breaks ties. Output: A1 | A2 | B1 | B2 | C1 | C2.
//
// Data: server/cefr-wordlist.json — { word: 'A1'|'A2'|'B1'|'B2'|'C1' } built
// from the official Oxford 3000/5000 (4,945 single words).

import { readFileSync } from 'node:fs';

/** @type {Record<string,'A1'|'A2'|'B1'|'B2'|'C1'>} */
const WORDLIST = JSON.parse(readFileSync(new URL('./cefr-wordlist.json', import.meta.url), 'utf8'));

const ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const COVERAGE_TARGET = 0.85;

// Strip common inflections so forms hit their Oxford base entry.
function lookup(word) {
  let b = WORDLIST[word];
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
    if (t.length >= 2 && WORDLIST[t]) return WORDLIST[t];
  }
  return null; // off-list
}

/**
 * Estimate the CEFR level of an English text by Oxford 5000 vocabulary profile.
 * @param {string} text
 * @returns {'A1'|'A2'|'B1'|'B2'|'C1'|'C2'}
 */
export function classifyCefr(text) {
  const tokens = (text.toLowerCase().match(/[a-z][a-z']+|[ai]/g) || []);
  if (tokens.length < 10) return 'A2'; // too little signal → safe default

  const counts = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, OFF: 0 };
  for (const w of tokens) {
    const band = lookup(w);
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
