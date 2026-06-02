// Rule-based segmentation of a transcript (with rough timestamps) into
// practiceable segments. Pure + deterministic so it can be unit-tested later.

import { normalizeForCompare } from './textNormalizer';
import type { SegmentMode } from '../models/lesson';
import type { VideoTranscriptSegment, SegmentWarning } from '../models/segment';
import type { TranscriptionChunk } from '../models/transcription';

interface ModeRule {
  idealMinMs: number;
  idealMaxMs: number;
  maxMs: number;
  /** Max sentences grouped together (Paragraph mode). */
  groupSentences: number;
}

const RULES: Record<SegmentMode, ModeRule> = {
  Sentence: { idealMinMs: 3000, idealMaxMs: 10000, maxMs: 15000, groupSentences: 1 },
  ShortPhrase: { idealMinMs: 2000, idealMaxMs: 6000, maxMs: 8000, groupSentences: 1 },
  Paragraph: { idealMinMs: 10000, idealMaxMs: 25000, maxMs: 30000, groupSentences: 4 },
};

const MIN_SEGMENT_MS = 500;

interface RawPiece {
  text: string;
  startMs: number;
  endMs: number;
}

/** Split a chunk's text into sentences, distributing its time range by length. */
function splitChunkToSentences(chunk: TranscriptionChunk): RawPiece[] {
  const parts = chunk.text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length <= 1) return [{ text: chunk.text.trim(), startMs: chunk.startMs, endMs: chunk.endMs }];

  const totalChars = parts.reduce((n, p) => n + p.length, 0) || 1;
  const span = chunk.endMs - chunk.startMs;
  let cursor = chunk.startMs;
  return parts.map((text) => {
    const slice = (text.length / totalChars) * span;
    const startMs = cursor;
    const endMs = Math.round(cursor + slice);
    cursor = endMs;
    return { text, startMs, endMs };
  });
}

/** For ShortPhrase mode, break an over-long sentence at commas. */
function splitByPhrase(piece: RawPiece, maxMs: number): RawPiece[] {
  if (piece.endMs - piece.startMs <= maxMs) return [piece];
  const parts = piece.text.split(/,\s*/).filter(Boolean);
  if (parts.length <= 1) return [piece];

  const totalChars = parts.reduce((n, p) => n + p.length, 0) || 1;
  const span = piece.endMs - piece.startMs;
  let cursor = piece.startMs;
  return parts.map((text, i) => {
    const slice = (text.length / totalChars) * span;
    const startMs = cursor;
    const endMs = i === parts.length - 1 ? piece.endMs : Math.round(cursor + slice);
    cursor = endMs;
    return { text, startMs, endMs };
  });
}

export function segmentTranscript(
  chunks: TranscriptionChunk[],
  mode: SegmentMode,
  lessonId: string,
): VideoTranscriptSegment[] {
  const rule = RULES[mode];

  // 1. Flatten chunks → sentence-level pieces.
  let pieces: RawPiece[] = chunks.flatMap(splitChunkToSentences);

  // 2. Mode-specific grouping / phrase splitting.
  if (mode === 'Paragraph') {
    const grouped: RawPiece[] = [];
    for (let i = 0; i < pieces.length; i += rule.groupSentences) {
      const slice = pieces.slice(i, i + rule.groupSentences);
      grouped.push({
        text: slice.map((p) => p.text).join(' '),
        startMs: slice[0].startMs,
        endMs: slice[slice.length - 1].endMs,
      });
    }
    pieces = grouped;
  } else if (mode === 'ShortPhrase') {
    pieces = pieces.flatMap((p) => splitByPhrase(p, rule.maxMs));
  }

  // 3. Merge anything below the hard minimum into its neighbour.
  const cleaned: RawPiece[] = [];
  for (const p of pieces) {
    const text = p.text.trim();
    if (!text) continue;
    const prev = cleaned[cleaned.length - 1];
    if (prev && p.endMs - p.startMs < MIN_SEGMENT_MS) {
      prev.endMs = Math.max(prev.endMs, p.endMs);
      prev.text = `${prev.text} ${text}`.trim();
      continue;
    }
    cleaned.push({ ...p, text, endMs: Math.max(p.endMs, p.startMs + 1) });
  }

  // Cover the lead-in: the first line should start at the very beginning.
  if (cleaned.length > 0) cleaned[0].startMs = 0;

  const now = new Date().toISOString();
  return cleaned.map((p, i) => ({
    id: `${lessonId}-seg-${i}`,
    lessonId,
    orderIndex: i,
    startMs: p.startMs,
    endMs: p.endMs,
    durationMs: p.endMs - p.startMs,
    text: p.text,
    normalizedText: normalizeForCompare(p.text),
    isEdited: false,
    createdAt: now,
    updatedAt: now,
  }));
}

/** Re-index + recompute durations after manual edits (split/merge/reorder). */
export function reindexSegments(segments: VideoTranscriptSegment[]): VideoTranscriptSegment[] {
  return [...segments]
    .sort((a, b) => a.startMs - b.startMs)
    .map((s, i) => ({
      ...s,
      orderIndex: i,
      durationMs: Math.max(0, s.endMs - s.startMs),
    }));
}

/** Non-blocking advisories for the Review screen (overlap / gap / length). */
export function computeSegmentWarnings(
  segments: VideoTranscriptSegment[],
  mode: SegmentMode,
): SegmentWarning[] {
  const rule = RULES[mode];
  const warnings: SegmentWarning[] = [];
  const ordered = [...segments].sort((a, b) => a.startMs - b.startMs);

  ordered.forEach((s, i) => {
    if (!s.text.trim()) {
      warnings.push({ segmentId: s.id, code: 'empty', message: 'Empty segment — please enter text or delete it.' });
    }
    if (s.endMs <= s.startMs) {
      warnings.push({ segmentId: s.id, code: 'too_short', message: 'End time must be after start time.' });
    }
    if (s.endMs - s.startMs > rule.maxMs) {
      warnings.push({ segmentId: s.id, code: 'too_long', message: 'Segment too long — consider splitting it for easier practice.' });
    }
    const next = ordered[i + 1];
    if (next) {
      if (next.startMs < s.endMs) {
        warnings.push({ segmentId: s.id, code: 'overlap', message: 'This segment overlaps with the next segment.' });
      } else if (next.startMs - s.endMs > 4000) {
        warnings.push({ segmentId: s.id, code: 'large_gap', message: 'Large gap before the next segment.' });
      }
    }
  });
  return warnings;
}
