// Core lesson data model for the Video Shadowing module.
// Everything is local-only (IndexedDB metadata + OPFS/IndexedDB binary files).

export type VideoSourceType = 'BuiltInVoa' | 'UploadedFile' | 'DirectUrl' | 'YouTube';

export type LessonStatus = 'Draft' | 'Pending' | 'Processing' | 'Ready' | 'Failed';

export type TranscriptSource =
  | 'ProviderScript'
  | 'UploadedSubtitle'
  | 'EmbeddedSubtitle'
  | 'LocalTranscription';

export type SegmentMode = 'Sentence' | 'ShortPhrase' | 'Paragraph';

export type LessonLevel = 'Auto' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type SafetyStatus = 'Curated' | 'UserProvided';

export interface VideoShadowingLesson {
  id: string;
  title: string;
  description?: string;
  sourceType: VideoSourceType;
  provider?: string;
  providerItemId?: string;
  /** Direct media URL (DirectUrl source) or static asset URL for curated lessons. */
  sourceUrl?: string;
  /** Reference into the local file store (OPFS / IndexedDB blob). */
  localVideoFileId?: string;
  thumbnailFileId?: string;
  durationMs: number;
  level: LessonLevel;
  topic: string;
  accent?: string;
  segmentMode: SegmentMode;
  transcriptSource?: TranscriptSource;
  status: LessonStatus;
  /** 0–100. */
  processingProgress: number;
  errorCode?: string;
  errorMessage?: string;
  sourceCredit?: string;
  safetyStatus: SafetyStatus;
  createdAt: string;
  updatedAt: string;
}
