import { parseCueTimestamp } from './timestampUtils';
import { stripMarkup } from './textNormalizer';
import { VideoShadowingError } from './errorCodes';
import type { ParsedCue } from './subtitleParser';

const ARROW = /-->/;

/**
 * Parse WebVTT (.vtt) content into time-ordered cues. Skips the WEBVTT header,
 * NOTE/STYLE/REGION blocks, and optional cue identifiers.
 */
export function parseVtt(content: string): ParsedCue[] {
  const stripped = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
  const normalized = stripped.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n{2,}/);
  const cues: ParsedCue[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    if (/^WEBVTT/.test(trimmed)) continue;
    if (/^(NOTE|STYLE|REGION)\b/.test(trimmed)) continue;

    const lines = block.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) continue;

    // A cue identifier may precede the timing line.
    let cursor = 0;
    if (!ARROW.test(lines[0]) && lines[1] && ARROW.test(lines[1])) {
      cursor = 1;
    }

    const timingLine = lines[cursor];
    if (!timingLine || !ARROW.test(timingLine)) continue;

    // Strip cue settings (e.g. "line:90% align:middle") after the end timestamp.
    const [rawStart, rest] = timingLine.split(ARROW).map((s) => s.trim());
    const rawEnd = rest.split(/\s+/)[0];
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
