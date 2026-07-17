/**
 * Multi-part practice ("combo") — chains several exam parts into one
 * continuous Speaking or Writing session, mirroring the real test flow.
 */

export type ComboSkill = 'speaking' | 'writing';
export type ComboExam = 'TOEIC' | 'IELTS';

export type ComboPartKey =
  // TOEIC Speaking
  | 'toeic-read'
  | 'toeic-pic'
  | 'toeic-resp'
  | 'toeic-info'
  | 'toeic-op'
  // IELTS Speaking
  | 'ielts-p1'
  | 'ielts-p2'
  | 'ielts-p3'
  // TOEIC Writing
  | 'toeic-sent'
  | 'toeic-email'
  | 'toeic-essay'
  // IELTS Writing
  | 'ielts-t1a'
  | 'ielts-t1g'
  | 'ielts-t2';

export interface ComboPartDef {
  key: ComboPartKey;
  exam: ComboExam;
  skill: ComboSkill;
  label: string;
  /** Question range or timing hint shown on the part chip, e.g. "Q1–2". */
  question: string;
  description: string;
  durationLabel: string;
  /** Route the part's own session navigates to when it finishes. */
  resultRoute: string;
  /** Checked by default in the builder (real-test composition). */
  defaultSelected: boolean;
}

export interface ComboLaunchTarget {
  route: string;
  state?: unknown;
}

export interface ComboPartOutcome {
  /** 0–100 score when the part evaluates inline; null when the part's result page scores on open (IELTS parts). */
  score: number | null;
  title: string;
  /** location.state the part's result page expects — replayed for "View details". */
  resultState: unknown;
  completedAt: string;
  /** True while the part's AI evaluation is still running in the background. */
  pending?: boolean;
  /** True when the background evaluation failed — no score or details available. */
  error?: boolean;
}

export interface ComboPartState {
  key: ComboPartKey;
  label: string;
  question: string;
  resultRoute: string;
  launch: ComboLaunchTarget;
  outcome?: ComboPartOutcome;
}

export interface ComboSessionState {
  id: string;
  exam: ComboExam;
  skill: ComboSkill;
  status: 'active' | 'finished';
  currentIndex: number;
  parts: ComboPartState[];
  startedAt: string;
  finishedAt?: string;
}
