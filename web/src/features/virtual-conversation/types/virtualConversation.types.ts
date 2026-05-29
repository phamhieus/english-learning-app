export type ConversationState =
  | "idle"
  | "listening"
  | "speaking"
  | "silenceCounting"
  | "stopping"
  | "uploading"
  | "aiThinking"
  | "aiSpeaking"
  | "stopped"
  | "error";

export type ConversationLevel = "beginner" | "intermediate" | "advanced";

export interface ConversationFeedback {
  grammar?: string;
  vocabulary?: string;
  fluency?: string;
  pronunciation?: string;
  suggestion?: string;
}

export interface ConversationTurnResponse {
  turnId: string;
  transcript: string;
  correctedText?: string;
  aiReply: string;
  nextQuestion?: string;
  feedback?: ConversationFeedback;
  audioUrl?: string;
}

export interface ConversationTurn {
  id: string;
  turnIndex: number;
  role: "user" | "ai";
  text: string;
  correctedText?: string;
  feedback?: ConversationFeedback;
  timestamp: number;
}

export interface ConversationScenario {
  id: string;
  title: string;
  description: string;
  level: ConversationLevel;
  openingLine: string;
}

export interface RecorderConfig {
  silenceMs: number;
  minSpeechMs: number;
  maxRecordMs: number;
  calibrationMs: number;
  speakingThresholdMultiplier: number;
  silenceThresholdMultiplier: number;
}

export const DEFAULT_RECORDER_CONFIG: RecorderConfig = {
  silenceMs: 3000,
  minSpeechMs: 700,
  maxRecordMs: 60000,
  calibrationMs: 800,
  speakingThresholdMultiplier: 2.5,
  silenceThresholdMultiplier: 1.5,
};

export interface SendConversationTurnPayload {
  conversationId: string;
  scenarioId: string;
  turnIndex: number;
  audioBlob: Blob;
  mimeType?: string;
  transcript: string;
  conversationHistory: ConversationTurn[];
  level: ConversationLevel;
  abortSignal?: AbortSignal;
}

export interface AutoTurnRecorderCallbacks {
  onTurnReady: (audioBlob: Blob, mimeType: string, durationMs: number) => void;
  onStateChange: (state: ConversationState) => void;
  onAudioLevel: (level: number) => void;
  onSilenceCountdown: (remainingMs: number) => void;
  onError: (message: string) => void;
}
