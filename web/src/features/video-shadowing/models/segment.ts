// A single practiceable chunk of the transcript, tied to a video time range.

export interface VideoTranscriptSegment {
  id: string;
  lessonId: string;
  orderIndex: number;
  startMs: number;
  endMs: number;
  durationMs: number;
  text: string;
  /** Lower-cased / punctuation-stripped form used for scoring comparisons. */
  normalizedText: string;
  translation?: string;
  /** True once the user has manually edited text or timing. */
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Non-blocking advisories surfaced in the Review Segments screen. */
export type SegmentWarningCode =
  | 'overlap'
  | 'large_gap'
  | 'too_long'
  | 'too_short'
  | 'empty';

export interface SegmentWarning {
  segmentId: string;
  code: SegmentWarningCode;
  message: string;
}
