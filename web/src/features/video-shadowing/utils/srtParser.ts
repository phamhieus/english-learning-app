import { parseCueTimestamp } from './timestampUtils';
import { stripMarkup } from './textNormalizer';
import { VideoShadowingError } from './errorCodes';
import type { ParsedCue } from './subtitleParser';

const ARROW = /-->/;

/**
 * Parse SubRip (.srt) content into time-ordered cues.
 * Tolerant of blank-line variation and missing numeric indices.
 */
export function parseSrt(content: string): ParsedCue[] {
  const stripped = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
  const normalized = stripped.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n{2,}/);
  const cues: ParsedCue[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) continue;

    // Optional numeric index on the first line.
    let cursor = 0;
    if (/^\d+$/.test(lines[0].trim()) && lines[1] && ARROW.test(lines[1])) {
      cursor = 1;
    }

    const timingLine = lines[cursor];
    if (!timingLine || !ARROW.test(timingLine)) continue;

    const [rawStart, rawEnd] = timingLine.split(ARROW).map((s) => s.trim().split(' ')[0]);
    const startMs = parseCueTimestamp(rawStart);
    const endMs = parseCueTimestamp(rawEnd);
    if (startMs == null || endMs == null) continue;

    const text = stripMarkup(lines.slice(cursor + 1).join(' '));
    if (!text) continue;

    cues.push({ startMs, endMs, text });
  }

  if (cues.length === 0) {
    throw new VideoShadowingError('SUBTITLE_PARSE_FAILED');
  }
  return cues;
}
