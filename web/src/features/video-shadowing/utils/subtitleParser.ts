// Subtitle entry point: validates the file, dispatches to the .srt/.vtt parser,
// sanitizes + normalizes cues, and converts them into VideoTranscriptSegments.

import { parseSrt } from './srtParser';
import { parseVtt } from './vttParser';
import { VideoShadowingError } from './errorCodes';
import { normalizeForCompare } from './textNormalizer';
import type { VideoTranscriptSegment } from '../models/segment';

export interface ParsedCue {
  startMs: number;
  endMs: number;
  text: string;
}

/** Cues shorter than this are merged into their neighbour (spec §8). */
const MIN_CUE_MS = 500;

export interface SubtitleParser {
  supports(file: File): boolean;
  parse(content: string): Promise<VideoTranscriptSegment[]>;
}

function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

function sanitizeCues(cues: ParsedCue[]): ParsedCue[] {
  // Drop invalid/empty, sort by start time, then merge too-short cues forward.
  const valid = cues
    .filter((c) => c.text.trim().length > 0 && c.endMs > c.startMs)
    .sort((a, b) => a.startMs - b.startMs);

  const merged: ParsedCue[] = [];
  for (const cue of valid) {
    const prev = merged[merged.length - 1];
    if (prev && cue.endMs - cue.startMs < MIN_CUE_MS) {
      // fold this tiny cue into the previous one
      prev.endMs = Math.max(prev.endMs, cue.endMs);
      prev.text = `${prev.text} ${cue.text}`.trim();
      continue;
    }
    merged.push({ ...cue });
  }
  return merged;
}

export function cuesToSegments(cues: ParsedCue[], lessonId: string): VideoTranscriptSegment[] {
  const now = new Date().toISOString();
  return sanitizeCues(cues).map((cue, i) => ({
    id: `${lessonId}-seg-${i}`,
    lessonId,
    orderIndex: i,
    startMs: cue.startMs,
    endMs: cue.endMs,
    durationMs: cue.endMs - cue.startMs,
    text: cue.text,
    normalizedText: normalizeForCompare(cue.text),
    isEdited: false,
    createdAt: now,
    updatedAt: now,
  }));
}

/** Default parser used by hooks/UI; lessonId binds the produced segments. */
export function createSubtitleParser(lessonId: string): SubtitleParser {
  return {
    supports(file: File) {
      const ext = extOf(file.name);
      return ext === 'srt' || ext === 'vtt';
    },
    async parse(content: string) {
      const trimmed = content.trim();
      const cues = /^WEBVTT/.test(trimmed) ? parseVtt(content) : trySrtThenVtt(content);
      return cuesToSegments(cues, lessonId);
    },
  };
}

function trySrtThenVtt(content: string): ParsedCue[] {
  try {
    return parseSrt(content);
  } catch {
    return parseVtt(content);
  }
}

export function assertSubtitleSupported(file: File): void {
  const ext = extOf(file.name);
  if (ext !== 'srt' && ext !== 'vtt') {
    throw new VideoShadowingError('SUBTITLE_FORMAT_UNSUPPORTED');
  }
}
