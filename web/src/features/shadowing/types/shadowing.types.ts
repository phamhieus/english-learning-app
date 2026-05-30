export type ShadowingSegmentType = "sentence" | "paragraph" | "dialogue_line";

export type ShadowingSegmentStatus =
  | "not_started"
  | "practicing"
  | "completed"
  | "need_retry";

export type WordResultStatus =
  | "correct"
  | "wrong"
  | "missing"
  | "extra"
  | "weak_pronunciation";

export type WordResult = {
  word: string;
  spokenWord?: string;
  status: WordResultStatus;
  comment?: string;
};

export type ShadowingAttempt = {
  id: string;
  sessionId: string;
  segmentId: string;
  originalText: string;
  recognizedText: string;
  originalAudioUrl?: string;
  userAudioUrl: string;
  userAudioFileName?: string;
  audioDurationMs?: number;
  pronunciationScore: number;
  completenessScore: number;
  fluencyScore: number;
  rhythmScore: number;
  intonationScore: number;
  finalScore: number;
  feedback: string;
  wordResults: WordResult[];
  createdAt: string;
};

export type ShadowingSegment = {
  id: string;
  lessonId: string;
  type: ShadowingSegmentType;
  order: number;
  paragraphIndex?: number;
  speaker?: string;
  text: string;
  audioUrl?: string;
  status: ShadowingSegmentStatus;
  latestAttempt?: ShadowingAttempt;
  attempts: ShadowingAttempt[];
};

export type ShadowingLesson = {
  id: string;
  title: string;
  description?: string;
  level: "beginner" | "intermediate" | "advanced";
  topic?: string;
  totalSegments: number;
  segments: ShadowingSegment[];
  coverImage?: string;
  durationMinutes?: number;
};

export type ShadowingSession = {
  id: string;
  lessonId: string;
  startedAt: string;
  completedAt?: string;
  totalSegments: number;
  completedSegments: number;
};

export type ShadowingSegmentSummary = {
  segmentId: string;
  order: number;
  text: string;
  finalScore: number;
  status: "completed" | "need_retry" | "not_started";
};

export type WeakWord = {
  word: string;
  phoneme?: string;
  mistakeType:
    | "final_sound"
    | "stress"
    | "vowel"
    | "consonant"
    | "linking"
    | "intonation";
  count: number;
  examples: string[];
};

export type ShadowingSessionResult = {
  sessionId: string;
  lessonId: string;
  totalSegments: number;
  completedSegments: number;
  overallScore: number;
  averagePronunciationScore: number;
  averageCompletenessScore: number;
  averageFluencyScore: number;
  averageRhythmScore: number;
  averageIntonationScore: number;
  weakWords: WeakWord[];
  weakSegments: ShadowingSegmentSummary[];
  bestSegments: ShadowingSegmentSummary[];
  segmentResults: ShadowingAttempt[];
  aiSummaryFeedback: string;
};
