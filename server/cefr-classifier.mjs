// CEFR level estimator by vocabulary profiling against the Oxford 5000.
//
// Method: tokenise the text, map each (lemmatised) word to its Oxford CEFR band,
// then walk the cumulative lexical coverage A1 → C1. The text level is the
// lowest band at which the easy-to-that-band vocabulary covers ~85% of the
// tokens (the classic "lexical coverage → comprehension" idea). Words absent
// from the Oxford 5000 count as off-list (≈ C2 / proper nouns / rare). A light
// sentence-length signal breaks ties. Output: A1 | A2 | B1 | B2 | C1 | C2.
//
// This is the Node entry point: it loads the wordlist from disk and delegates to
// the pure, fs-free logic in cefr-core.mjs (which the Cloudflare Worker reuses
// with a bundled JSON import). Data: server/cefr-wordlist.json — the official
// Oxford 3000/5000 (4,945 single words).

import { readFileSync } from 'node:fs';
import { classifyCefr as classifyCefrCore } from './cefr-core.mjs';

/** @type {Record<string,'A1'|'A2'|'B1'|'B2'|'C1'>} */
const WORDLIST = JSON.parse(readFileSync(new URL('./cefr-wordlist.json', import.meta.url), 'utf8'));

/**
 * Estimate the CEFR level of an English text by Oxford 5000 vocabulary profile.
 * @param {string} text
 * @returns {'A1'|'A2'|'B1'|'B2'|'C1'|'C2'}
 */
export function classifyCefr(text) {
  return classifyCefrCore(text, WORDLIST);
}
