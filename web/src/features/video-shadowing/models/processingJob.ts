// Tracks long-running local jobs (audio extraction, transcription, segmenting)
// so the UI can show progress / cancel / retry without blocking the main thread.

export type ProcessingJobType =
  | 'ImportVideo'
  | 'DownloadVideo'
  | 'ExtractAudio'
  | 'ParseSubtitle'
  | 'GenerateTranscript'
  | 'SplitSegments';

export type ProcessingJobStatus =
  | 'Queued'
  | 'Running'
  | 'Completed'
  | 'Failed'
  | 'Cancelled';

export interface ProcessingJob {
  id: string;
  lessonId: string;
  type: ProcessingJobType;
  status: ProcessingJobStatus;
  /** 0–100. */
  progress: number;
  currentStep: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

/** Ordered processing steps shown on the ScriptProcessing screen. */
export interface ProcessingStep {
  key: string;
  label: string;
  state: 'idle' | 'active' | 'done' | 'failed';
}
