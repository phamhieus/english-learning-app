// Pure text-analysis helpers used by the prosody rules. No engine or DOM
// dependencies so they are trivial to unit test.

export const WH_WORDS = ['who', 'what', 'when', 'where', 'why', 'how', 'which', 'whom', 'whose'];

export const NEGATIONS = [
  'not',
  'never',
  'no',
  'none',
  'cannot',
  "can't",
  "don't",
  "won't",
  "doesn't",
  "didn't",
  "isn't",
  "aren't",
  "wasn't",
  "weren't",
  "shouldn't",
  "wouldn't",
  "couldn't",
  "haven't",
  "hasn't",
  "hadn't",
];

export const CONTRAST_WORDS = [
  'but',
  'however',
  'instead',
  'although',
  'though',
  'whereas',
  'yet',
  'nevertheless',
  'nonetheless',
];

// Multi-word contrast connectors handled as phrases.
export const CONTRAST_PHRASES = ['rather than', 'in contrast', 'on the other hand'];

// Number words we treat as quantities for emphasis (kept small + common).
export const NUMBER_WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'hundred',
  'thousand',
  'million',
];

const SHORT_RESPONSES = [
  'sure',
  'exactly',
  'i see',
  'right',
  'okay',
  'ok',
  'yes',
  'no',
  'yeah',
  'absolutely',
  'definitely',
  'of course',
  'no problem',
  'got it',
  'indeed',
];

const INTERJECTIONS = ['oh', 'wow', 'hmm', 'ah', 'oops', 'ouch', 'hey', 'huh', 'ugh', 'yay', 'aha'];

const REQUEST_OPENERS = [
  'could you',
  'would you',
  'can you',
  'will you',
  'would you mind',
  'do you mind',
  'may i',
  'might i',
];

const POLITE_MARKERS = ['please', 'kindly'];

// Collapse whitespace and trim, preserving paragraph breaks (double newline)
// so the paragraph-break rule can still see them.
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Split into sentences while keeping their trailing punctuation. Newlines are
// preserved as their own boundaries so structural breaks survive.
export function splitSentences(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [])
    .map((s) => s.trim())
    .filter(Boolean);
}

export function tokenizeWords(text: string): string[] {
  return text.match(/[A-Za-z']+/g) ?? [];
}

export function lower(text: string): string {
  return text.toLowerCase();
}

export function startsWithWord(text: string, word: string): boolean {
  return new RegExp(`^${escapeRegExp(word)}\\b`, 'i').test(text.trim());
}

export function containsWord(text: string, word: string): boolean {
  return new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i').test(text);
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Classifiers used by the sentence-type rule ─────────────────────────────

export function isWhQuestion(sentence: string): boolean {
  const trimmed = sentence.trim();
  if (!trimmed.endsWith('?')) return false;
  return WH_WORDS.some((w) => startsWithWord(trimmed, w));
}

export function isTagQuestion(sentence: string): boolean {
  // e.g. "You're coming, aren't you?"
  return /,\s*(is|are|was|were|do|does|did|have|has|had|will|would|can|could|should|won't|don't|doesn't|didn't|isn't|aren't|wasn't|weren't)n?'?t?\s+\w+\s*\?$/i.test(
    sentence.trim(),
  );
}

export function isChoiceQuestion(sentence: string): boolean {
  return sentence.trim().endsWith('?') && /\bor\b/i.test(sentence);
}

export function isYesNoQuestion(sentence: string): boolean {
  const trimmed = sentence.trim();
  if (!trimmed.endsWith('?')) return false;
  if (isWhQuestion(trimmed) || isTagQuestion(trimmed) || isChoiceQuestion(trimmed)) return false;
  return true;
}

export function isRequest(sentence: string): boolean {
  const t = sentence.trim().toLowerCase();
  return REQUEST_OPENERS.some((opener) => t.startsWith(opener));
}

export function isExclamation(sentence: string): boolean {
  return sentence.trim().endsWith('!');
}

export function isInterjection(sentence: string): boolean {
  const words = tokenizeWords(sentence);
  if (words.length === 0 || words.length > 2) return false;
  return INTERJECTIONS.includes(words[0].toLowerCase());
}

export function isShortResponse(sentence: string): boolean {
  const stripped = sentence.trim().replace(/[.!?]+$/, '').toLowerCase();
  const wordCount = tokenizeWords(stripped).length;
  return wordCount > 0 && wordCount <= 3 && SHORT_RESPONSES.includes(stripped);
}

export function isCommand(sentence: string): boolean {
  // Imperative: starts with a bare verb (heuristic) or "please <verb>".
  const t = sentence.trim();
  if (t.endsWith('?')) return false;
  const lowered = t.toLowerCase();
  if (POLITE_MARKERS.some((m) => lowered.startsWith(m))) return true;
  // Common imperative verbs at the start.
  return /^(open|close|read|write|listen|repeat|stop|start|press|click|select|choose|submit|review|describe|explain|complete|fill|answer|look|turn|take|give|put|move|wait|begin|continue|check)\b/i.test(
    t,
  );
}

export function isList(sentence: string): boolean {
  // At least two commas separating items, no terminal question mark.
  return !sentence.trim().endsWith('?') && (sentence.match(/,/g)?.length ?? 0) >= 2;
}

export function hasPoliteMarker(sentence: string): boolean {
  const lowered = sentence.toLowerCase();
  return POLITE_MARKERS.some((m) => containsWord(lowered, m));
}
