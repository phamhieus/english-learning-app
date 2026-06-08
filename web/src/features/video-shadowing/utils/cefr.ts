// CEFR level estimator by vocabulary profiling against the Oxford 5000.
// Browser/TS twin of server/cefr-classifier.mjs — same algorithm + wordlist so
// the in-app estimate (from a search result's title + description) and the
// proxy's precise estimate (from the full transcript) agree in spirit.
//
// Lexical-coverage method: map each word to its Oxford CEFR band, then take the
// lowest band whose cumulative coverage reaches ~85% of the tokens. Words not in
// the Oxford 5000 count as off-list (≈ C2). A light sentence-length nudge breaks
// ties.

import rawWordlist from '../data/cefr-wordlist.json';

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

const WORDLIST = rawWordlist as Record<string, CefrLevel>;
const ORDER: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const COVERAGE_TARGET = 0.85;

function lookup(word: string): CefrLevel | null {
  const direct = WORDLIST[word];
  if (direct) return direct;
  const tries: string[] = [];
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
  return null;
}

/** Estimate the CEFR level of an English text. Returns 'Auto' when there is too
 *  little text to judge (e.g. a one-word title with no description). */
export function classifyCefr(text: string): CefrLevel | 'Auto' {
  const tokens = text.toLowerCase().match(/[a-z][a-z']+|[ai]/g) ?? [];
  if (tokens.length < 10) return 'Auto';

  const counts: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, OFF: 0 };
  for (const w of tokens) counts[lookup(w) ?? 'OFF']++;
  const n = tokens.length;

  let cum = 0;
  let level: CefrLevel = 'C2';
  for (const band of ['A1', 'A2', 'B1', 'B2', 'C1'] as const) {
    cum += counts[band] / n;
    if (cum >= COVERAGE_TARGET) {
      level = band;
      break;
    }
  }

  const sentences = (text.match(/[.!?]+/g) ?? []).length || 1;
  const avgSentLen = n / sentences;
  let idx = ORDER.indexOf(level);
  if (avgSentLen > 22 && idx < ORDER.length - 1) idx++;
  else if (avgSentLen < 7 && idx > 0) idx--;
  return ORDER[idx];
}
