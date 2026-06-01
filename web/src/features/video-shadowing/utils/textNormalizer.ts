// Text normalization for scoring comparisons and subtitle sanitization.
// IMPORTANT (security): subtitle/transcript text is NEVER rendered as HTML.
// stripMarkup removes tags as a defense-in-depth measure; React still escapes
// all text on render and we never use dangerouslySetInnerHTML.

/** Remove SRT/VTT inline tags (<i>, <b>, {\an8}, <c.classname>) and stray HTML. */
export function stripMarkup(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // angle-bracket tags
    .replace(/\{[^}]*\}/g, '') // SubStation override blocks {\an8}
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lower-cased, punctuation-free, single-spaced form for word-level comparison. */
export function normalizeForCompare(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[‘’]/g, "'")
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toWords(text: string): string[] {
  const n = normalizeForCompare(text);
  return n.length ? n.split(' ') : [];
}

/** Sentence-ending boundary used by the segmenter. */
export const SENTENCE_END = /([.!?]+)(\s+|$)/;
