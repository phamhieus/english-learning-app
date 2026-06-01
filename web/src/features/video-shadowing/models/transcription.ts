// Interface for the local (in-browser) speech-to-text service. The MVP ships a
// stub; the real implementation runs Whisper via Transformers.js inside a Web
// Worker (WebGPU preferred, single-threaded WASM fallback — no COOP/COEP needed).

import type { TranscriptionBackend } from './browserCapabilities';

export type WhisperModelId = 'Xenova/whisper-tiny.en' | 'Xenova/whisper-base.en';

export interface TranscriptionInitializeOptions {
  model?: WhisperModelId;
  backend?: TranscriptionBackend;
}

export interface TranscriptionOptions {
  /** Sample rate of the supplied audio (we normalize to 16 kHz upstream). */
  sampleRate: number;
  language?: string;
  /** Request segment-level timestamps when the model/pipeline supports them. */
  returnTimestamps?: boolean;
}

export type TranscriptionPhase =
  | 'loading_model'
  | 'transcribing'
  | 'done'
  | 'error';

export interface TranscriptionProgress {
  phase: TranscriptionPhase;
  /** 0–100. */
  progress: number;
  message?: string;
  /** Bytes downloaded so far when fetching the model (first run only). */
  loadedBytes?: number;
  totalBytes?: number;
}

export interface TranscriptionChunk {
  text: string;
  startMs: number;
  endMs: number;
}

export interface TranscriptionResult {
  text: string;
  chunks: TranscriptionChunk[];
  /** True when timestamps are real (model-provided) vs. evenly estimated. */
  hasReliableTimestamps: boolean;
}

export interface LocalTranscriptionService {
  initialize(options?: TranscriptionInitializeOptions): Promise<void>;
  transcribe(
    audio: ArrayBuffer,
    options: TranscriptionOptions,
    onProgress?: (progress: TranscriptionProgress) => void,
    signal?: AbortSignal,
  ): Promise<TranscriptionResult>;
  dispose(): Promise<void>;
}

export interface WhisperModelInfo {
  id: WhisperModelId;
  label: string;
  approxDownloadMb: number;
  description: string;
}

export const WHISPER_MODELS: WhisperModelInfo[] = [
  {
    id: 'Xenova/whisper-tiny.en',
    label: 'Whisper Tiny (English)',
    approxDownloadMb: 40,
    description: 'Fastest. Recommended for lower-end devices.',
  },
  {
    id: 'Xenova/whisper-base.en',
    label: 'Whisper Base (English)',
    approxDownloadMb: 145,
    description: 'More accurate, needs a stronger device.',
  },
];
