// Pluggable scoring contract. MVP implementation is rule-based / heuristic
// (see services/scoring/heuristicScoringService.ts). Designed so a phoneme-level
// engine can replace it later without touching any UI.

export interface ScoreAttemptInput {
  referenceText: string;
  recognizedText: string;
  /** Length of the user's recording. */
  attemptDurationMs: number;
  /** Length of the original segment audio. */
  segmentDurationMs: number;
}

export interface ShadowingScoreResult {
  /** 0–100 each. */
  totalScore: number;
  completionScore: number;
  fluencyScore: number;
  rhythmScore: number;
  /** MVP heuristic approximation — NOT phoneme-level assessment. */
  pronunciationScore: number;
  missingWords: string[];
  extraWords: string[];
  mispronouncedWords: string[];
  wordMatchRatio: number;
  /** Short, Vietnamese, rule-based feedback. */
  feedback: string;
  rating: 'good' | 'ok' | 'retry';
}

export interface ShadowingScoringService {
  scoreAttempt(input: ScoreAttemptInput): Promise<ShadowingScoreResult>;
}
