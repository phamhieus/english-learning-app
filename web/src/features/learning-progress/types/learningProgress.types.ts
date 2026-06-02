// Domain models for the Learning Progress / Practice History feature.
// Everything is persisted locally (IndexedDB). Audio is never stored as base64 —
// only metadata + a local file reference is kept (see AudioMetadata).

/** The two learning programs the app supports. */
export type LearningProgram = 'IELTS' | 'TOEIC';

/** A practiced skill. Mirrors the existing feature areas of the app. */
export type PracticeSkill = 'Speaking' | 'Writing' | 'Shadowing' | 'Listening' | 'Reading';

/** Program segmented-control value — adds the "All" aggregate view. */
export type ProgramFilterValue = 'All' | LearningProgram;

/** Time-range / view mode for the progress page. */
export type TimeRangeMode = '7d' | '30d' | 'calendar';

/**
 * Lightweight pointer to a locally-stored audio recording. We deliberately keep
 * only metadata + a file reference (OPFS path or IndexedDB blob key) so the
 * history store never balloons with base64 audio payloads.
 */
export interface AudioMetadata {
  /** Local file reference (OPFS path / IndexedDB blob key). NOT base64 data. */
  fileRef: string;
  durationMs: number;
  mimeType?: string;
}

/**
 * A single completed practice session. Only completed sessions are ever stored
 * here — opening and leaving an exercise must not create a record.
 */
export interface PracticeSession {
  id: string;
  program: LearningProgram;
  skill: PracticeSkill;
  title: string;
  /** ISO timestamp the user started the exercise. */
  startedAt: string;
  /** ISO timestamp the session was completed. Presence implies "counts". */
  completedAt: string;
  /** Active practice duration in milliseconds. */
  durationMs: number;
  /** Normalized 0–100 score, when the activity produces one. */
  score?: number;
  /** Reference (route path or id) used by the "View Result" action. */
  resultRef?: string;
  /** Present only when a local audio recording exists — enables "Listen Again". */
  audio?: AudioMetadata;
  /** Present only when a transcript exists — enables "View Transcript". */
  transcript?: string;
  /** Reference (route path) used by the "Retry" action. */
  retryRef?: string;
}

/** Aggregated view of one calendar day (local timezone). */
export interface DailyPracticeSummary {
  /** YYYY-MM-DD in the user's local timezone. */
  date: string;
  sessions: PracticeSession[];
  sessionCount: number;
  totalDurationMs: number;
  /** Average of available scores, or null when no session had a score. */
  averageScore: number | null;
  ieltsCount: number;
  toeicCount: number;
  ieltsDurationMs: number;
  toeicDurationMs: number;
}

/**
 * Global learning streak. One streak for the whole app — both IELTS and TOEIC
 * completed sessions feed it. Never split per program.
 */
export interface StreakSummary {
  /** Consecutive active days ending today (or yesterday if today is idle). */
  current: number;
  /** Longest consecutive active-day run ever recorded. */
  longest: number;
  /** YYYY-MM-DD of the most recent active day, or null when none. */
  lastActiveDate: string | null;
}

/** Filter state driving every dependent view on the page. */
export interface PracticeHistoryFilter {
  program: ProgramFilterValue;
  range: TimeRangeMode;
  /** Calendar mode only — 0-indexed month and full year being viewed. */
  calendarMonth: number;
  calendarYear: number;
}

/** Summary cards that react to the active filter (streak excluded — it's global). */
export interface FilteredSummary {
  totalDurationMs: number;
  completedSessions: number;
  averageScore: number | null;
}
