// Practice session + per-segment recording attempts. All stored locally.

export type SessionStatus = 'InProgress' | 'Completed' | 'Abandoned';

export interface VideoShadowingSession {
  id: string;
  lessonId: string;
  startedAt: string;
  completedAt?: string;
  status: SessionStatus;
  totalScore?: number;
  pronunciationScore?: number;
  fluencyScore?: number;
  rhythmScore?: number;
  completionScore?: number;
  practiceDurationMs: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoShadowingAttempt {
  id: string;
  sessionId: string;
  segmentId: string;
  attemptNumber: number;
  /** Reference into the local file store for the recorded audio blob. */
  userAudioFileId: string;
  recognizedText?: string;
  pronunciationScore?: number;
  fluencyScore?: number;
  rhythmScore?: number;
  completionScore?: number;
  totalScore?: number;
  missingWords: string[];
  mispronouncedWords: string[];
  extraWords?: string[];
  feedback?: string;
  audioDurationMs?: number;
  createdAt: string;
}
