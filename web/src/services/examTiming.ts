// Official exam timing reference for TOEIC and IELTS.
// Sources: ETS TOEIC Speaking & Writing sample tests, ETS Global L&R format,
// British Council / ielts.org test format pages (verified June 2026).

export type Exam = 'TOEIC' | 'IELTS';

export interface SpeakingTaskTiming {
  /** Seconds given to read/prepare before speaking. 0 = no prep time. */
  prepSeconds: number;
  /** Seconds allowed for the spoken response (per practice item). */
  responseSeconds: number;
  /** Official per-question response seconds when a part has several questions. */
  responseSecondsByQuestion?: number[];
  /** Short human-readable label, e.g. "45s prep · 45s speak". */
  label: string;
}

// ── TOEIC Speaking — 20 minutes, 11 questions, 5 parts (updated 2021 format) ─
// Keys match the task keys used in SpeakingList (read/pic/resp/info/op).
export const TOEIC_SPEAKING_TIMING: Record<string, SpeakingTaskTiming> = {
  // Q1–2 · Read a Text Aloud
  read: { prepSeconds: 45, responseSeconds: 45, label: '45s prep · 45s read' },
  // Q3–4 · Describe a Picture
  pic: { prepSeconds: 45, responseSeconds: 30, label: '45s prep · 30s speak' },
  // Q5–7 · Respond to Questions (no prep; 15s/15s/30s)
  resp: {
    prepSeconds: 0,
    responseSeconds: 30,
    responseSecondsByQuestion: [15, 15, 30],
    label: 'No prep · 15–30s answer',
  },
  // Q8–10 · Respond Using Information (45s to read the material; 15s/15s/30s)
  info: {
    prepSeconds: 45,
    responseSeconds: 30,
    responseSecondsByQuestion: [15, 15, 30],
    label: '45s read · 15–30s answer',
  },
  // Q11 · Express an Opinion
  op: { prepSeconds: 45, responseSeconds: 60, label: '45s prep · 60s speak' },
};

// ── IELTS Speaking — 11–14 minutes, 3 parts ─────────────────────────────────
export const IELTS_SPEAKING_TIMING = {
  p1: { minutesLabel: '4–5 min' },
  p2: {
    minutesLabel: '3–4 min',
    prepSeconds: 60,
    longTurnSeconds: 120,
  },
  p3: { minutesLabel: '4–5 min' },
} as const;

export const IELTS_P2_PREP_SECONDS: number = IELTS_SPEAKING_TIMING.p2.prepSeconds;
export const IELTS_P2_LONG_TURN_SECONDS: number = IELTS_SPEAKING_TIMING.p2.longTurnSeconds;

export interface WritingTaskTiming {
  /** Total seconds allowed for the task. */
  totalSeconds: number;
  /** Short label for cards, e.g. "30 mins". */
  label: string;
}

// ── TOEIC Writing — 60 minutes, 8 questions, 3 parts ────────────────────────
// Keys match the task keys used in WritingList (pic/sent/email/essay).
export const TOEIC_WRITING_TIMING: Record<string, WritingTaskTiming> = {
  // Q1–5 · Write a Sentence Based on a Picture — 8 minutes for the whole part
  sent: { totalSeconds: 8 * 60, label: '8 mins' },
  // Practice variant of the picture task uses the same 8-minute window
  pic: { totalSeconds: 8 * 60, label: '8 mins' },
  // Q6–7 · Respond to a Written Request — 10 minutes per email
  email: { totalSeconds: 10 * 60, label: '10 mins' },
  // Q8 · Opinion Essay — 30 minutes
  essay: { totalSeconds: 30 * 60, label: '30 mins' },
};

// ── IELTS Writing — 60 minutes, 2 tasks ─────────────────────────────────────
// Keys match the task keys used in WritingList (t1a/t1g/t2).
export const IELTS_WRITING_TIMING: Record<string, WritingTaskTiming> = {
  t1a: { totalSeconds: 20 * 60, label: '20 mins' }, // Task 1 Academic · 150+ words
  t1g: { totalSeconds: 20 * 60, label: '20 mins' }, // Task 1 General · 150+ words
  t2: { totalSeconds: 40 * 60, label: '40 mins' },  // Task 2 Essay · 250+ words
};

export const getWritingTaskTiming = (exam: Exam, taskKey: string): WritingTaskTiming | undefined =>
  exam === 'TOEIC' ? TOEIC_WRITING_TIMING[taskKey] : IELTS_WRITING_TIMING[taskKey];

// ── Section-level reference (Listening/Reading modules use these later) ─────
export const EXAM_SECTION_OVERVIEW = {
  TOEIC: {
    listening: { minutes: 45, questions: 100, parts: 4 },
    reading: { minutes: 75, questions: 100, parts: 3 },
    speaking: { minutes: 20, questions: 11, parts: 5 },
    writing: { minutes: 60, questions: 8, parts: 3 },
  },
  IELTS: {
    listening: { minutes: 30, questions: 40, parts: 4 },
    reading: { minutes: 60, questions: 40, parts: 3 },
    speaking: { minutesLabel: '11–14', parts: 3 },
    writing: { minutes: 60, tasks: 2 },
  },
} as const;

// ── Duration label per topic-bank section (used for practice cards) ─────────
const SECTION_DURATION_LABELS: Record<string, string> = {
  // TOEIC Speaking
  'Read a Text Aloud': '45s prep · 45s read',
  'Describe a Picture': '45s prep · 30s speak',
  'Respond to Questions': '15–30s per answer',
  'Respond Using Information': '45s read · 15–30s answer',
  'Express an Opinion': '45s prep · 60s speak',
  // TOEIC Writing
  'Write a Sentence Based on a Picture': '8 mins',
  'Respond to a Written Request': '10 mins',
  'Write an Opinion Essay': '30 mins',
  // IELTS Speaking
  'Part 1 - Introduction and Interview': '4–5 min',
  'Part 2 - Cue Card': '1 min prep · 2 min talk',
  'Part 3 - Discussion': '4–5 min',
  // IELTS Writing
  'Task 1 Academic': '20 mins',
  'Task 1 General': '20 mins',
  'Task 2 Essay': '40 mins',
};

export const getSectionDurationLabel = (section: string): string =>
  SECTION_DURATION_LABELS[section] ?? '5 mins';
