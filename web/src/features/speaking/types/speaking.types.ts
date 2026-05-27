export type SpeakingMode =
  | "repeat_sentence"
  | "read_aloud"
  | "shadowing"
  | "ielts_part_1"
  | "ielts_part_2"
  | "ielts_part_3"
  | "free_speaking";

export interface SpeakingPrompt {
  id: string | number;
  mode: SpeakingMode;
  title: string;
  question?: string;
  targetText?: string;
  sampleAnswer?: string;
  tips?: string[];
  image?: string;
  level?: string;
  type?: string;
}

export interface SpeakingTranscript {
  text: string;
  isFinal: boolean;
  segments?: SpeakingTranscriptSegment[];
}

export interface SpeakingTranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface ProsodyResult {
  totalDurationSeconds: number;
  speakingRateWpm?: number;
  finalTone?: "rising" | "falling" | "flat" | "unknown";
  isPlaceholder: boolean;
}

export interface SpeakingIssue {
  type:
    | "missing_word"
    | "substituted_word"
    | "missing_ending_sound"
    | "speaking_too_slow"
    | "speaking_too_fast"
    | "placeholder_prosody";
  severity: "low" | "medium" | "high";
  word?: string;
  message: string;
}

export interface SpeakingAnalysisResult {
  overallScore: number;
  pronunciationScore: number;
  fluencyScore: number;
  rhythmScore: number;
  intonationScore: number;
  stressScore: number;

  targetText?: string;
  recognizedText: string;

  transcript: SpeakingTranscript;
  prosody: ProsodyResult;
  issues: SpeakingIssue[];
  feedback: string[];

  source: "whisper";
}
