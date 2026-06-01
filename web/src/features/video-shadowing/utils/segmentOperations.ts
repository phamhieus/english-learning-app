// Pure split/merge/delete/add/edit operations on a segment list. Each returns a
// new, re-indexed array (callers persist via the repository).

import { normalizeForCompare } from './textNormalizer';
import { reindexSegments } from './transcriptSegmenter';
import { clampTimeRange } from './timestampUtils';
import type { VideoTranscriptSegment } from '../models/segment';

const now = () => new Date().toISOString();

function withText(seg: VideoTranscriptSegment, text: string): VideoTranscriptSegment {
  return { ...seg, text, normalizedText: normalizeForCompare(text), isEdited: true, updatedAt: now() };
}

export function editText(
  segments: VideoTranscriptSegment[],
  id: string,
  text: string,
): VideoTranscriptSegment[] {
  return segments.map((s) => (s.id === id ? withText(s, text) : s));
}

export function editTiming(
  segments: VideoTranscriptSegment[],
  id: string,
  startMs: number,
  endMs: number,
): VideoTranscriptSegment[] {
  return reindexSegments(
    segments.map((s) => {
      if (s.id !== id) return s;
      const clamped = clampTimeRange(startMs, endMs);
      return { ...s, ...clamped, durationMs: clamped.endMs - clamped.startMs, isEdited: true, updatedAt: now() };
    }),
  );
}

export function deleteSegment(
  segments: VideoTranscriptSegment[],
  id: string,
): VideoTranscriptSegment[] {
  return reindexSegments(segments.filter((s) => s.id !== id));
}

/** Split one segment into two at the midpoint of its time + a text boundary. */
export function splitSegment(
  segments: VideoTranscriptSegment[],
  id: string,
  /** Character offset to split text at; defaults to nearest word to the middle. */
  charOffset?: number,
): VideoTranscriptSegment[] {
  const idx = segments.findIndex((s) => s.id === id);
  if (idx < 0) return segments;
  const seg = segments[idx];

  const words = seg.text.split(/\s+/);
  let cut = charOffset;
  if (cut == null) {
    // pick the space nearest the text midpoint
    const mid = Math.floor(seg.text.length / 2);
    let best = seg.text.indexOf(' ');
    let bestDist = Infinity;
    let pos = 0;
    for (const w of words) {
      pos += w.length + 1;
      const d = Math.abs(pos - mid);
      if (d < bestDist) {
        bestDist = d;
        best = pos;
      }
    }
    cut = best;
  }
  const firstText = seg.text.slice(0, cut).trim() || seg.text;
  const secondText = seg.text.slice(cut).trim() || '';
  if (!secondText) return segments;

  const midMs = Math.round((seg.startMs + seg.endMs) / 2);
  const first: VideoTranscriptSegment = {
    ...withText(seg, firstText),
    endMs: midMs,
    durationMs: midMs - seg.startMs,
  };
  const second: VideoTranscriptSegment = {
    ...seg,
    id: `${seg.id}-b-${Date.now()}`,
    text: secondText,
    normalizedText: normalizeForCompare(secondText),
    startMs: midMs,
    durationMs: seg.endMs - midMs,
    isEdited: true,
    createdAt: now(),
    updatedAt: now(),
  };

  const next = [...segments];
  next.splice(idx, 1, first, second);
  return reindexSegments(next);
}

/** Merge a segment with the one after it. */
export function mergeWithNext(
  segments: VideoTranscriptSegment[],
  id: string,
): VideoTranscriptSegment[] {
  const ordered = reindexSegments(segments);
  const idx = ordered.findIndex((s) => s.id === id);
  if (idx < 0 || idx >= ordered.length - 1) return segments;
  const a = ordered[idx];
  const b = ordered[idx + 1];
  const text = `${a.text} ${b.text}`.trim();
  const merged: VideoTranscriptSegment = {
    ...a,
    text,
    normalizedText: normalizeForCompare(text),
    endMs: b.endMs,
    durationMs: b.endMs - a.startMs,
    isEdited: true,
    updatedAt: now(),
  };
  const next = [...ordered];
  next.splice(idx, 2, merged);
  return reindexSegments(next);
}

export function addSegmentAfter(
  segments: VideoTranscriptSegment[],
  id: string,
  lessonId: string,
): VideoTranscriptSegment[] {
  const ordered = reindexSegments(segments);
  const idx = ordered.findIndex((s) => s.id === id);
  const anchor = idx >= 0 ? ordered[idx] : ordered[ordered.length - 1];
  const startMs = anchor ? anchor.endMs : 0;
  const fresh: VideoTranscriptSegment = {
    id: `${lessonId}-seg-new-${Date.now()}`,
    lessonId,
    orderIndex: idx + 1,
    startMs,
    endMs: startMs + 3000,
    durationMs: 3000,
    text: '',
    normalizedText: '',
    isEdited: true,
    createdAt: now(),
    updatedAt: now(),
  };
  const next = [...ordered];
  next.splice(idx + 1, 0, fresh);
  return reindexSegments(next);
}
