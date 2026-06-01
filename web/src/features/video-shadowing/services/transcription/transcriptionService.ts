// Real LocalTranscriptionService: decodes audio on the main thread and runs
// Whisper inside a Web Worker (Transformers.js, WebGPU/WASM). Lazy-initialized;
// the worker + model persist across calls so we don't reload per lesson.

import { decodeToMono16k } from './audioDecode';
import { VideoShadowingError } from '../../utils/errorCodes';
import type {
  LocalTranscriptionService,
  TranscriptionInitializeOptions,
  TranscriptionOptions,
  TranscriptionProgress,
  TranscriptionResult,
  TranscriptionChunk,
  WhisperModelId,
} from '../../models/transcription';
import type { TranscriptionBackend } from '../../models/browserCapabilities';

interface WorkerResultMsg {
  type: 'result';
  id: number;
  text: string;
  chunks: { text: string; timestamp: [number, number | null] }[] | null;
}
interface WorkerProgressMsg {
  type: 'progress';
  phase: 'loading_model' | 'transcribing';
  progress: number;
  id?: number;
}
interface WorkerReadyMsg { type: 'ready' }
interface WorkerErrorMsg { type: 'error'; id?: number; message: string }
type WorkerMsg = WorkerResultMsg | WorkerProgressMsg | WorkerReadyMsg | WorkerErrorMsg;

const DEFAULT_MODEL: WhisperModelId = 'Xenova/whisper-tiny.en';

function backendToDevice(backend?: TranscriptionBackend): 'webgpu' | 'wasm' {
  return backend === 'webgpu' ? 'webgpu' : 'wasm';
}

class WorkerTranscriptionService implements LocalTranscriptionService {
  private worker: Worker | null = null;
  private nextId = 1;
  private model: WhisperModelId = DEFAULT_MODEL;
  private device: 'webgpu' | 'wasm' = 'wasm';
  private readyPromise: Promise<void> | null = null;
  private progressForInit: ((p: TranscriptionProgress) => void) | null = null;

  private spawn(): Worker {
    if (this.worker) return this.worker;
    this.worker = new Worker(new URL('../../workers/transcription.worker.ts', import.meta.url), { type: 'module' });
    return this.worker;
  }

  /** Pick the strongest model the device can run fast: base.en on WebGPU,
   *  else the fast tiny.en on WASM. Explicit options always win. */
  private async detectConfig(
    options?: TranscriptionInitializeOptions,
  ): Promise<{ model: WhisperModelId; device: 'webgpu' | 'wasm' }> {
    let webgpu = false;
    try {
      const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
      if (gpu) webgpu = (await gpu.requestAdapter()) != null;
    } catch {
      webgpu = false;
    }
    const device: 'webgpu' | 'wasm' = options?.backend ? backendToDevice(options.backend) : webgpu ? 'webgpu' : 'wasm';
    const model: WhisperModelId =
      options?.model ?? (device === 'webgpu' ? 'Xenova/whisper-base.en' : 'Xenova/whisper-tiny.en');
    return { model, device };
  }

  initialize(options?: TranscriptionInitializeOptions): Promise<void> {
    if (this.readyPromise) return this.readyPromise;
    this.readyPromise = (async () => {
      const cfg = await this.detectConfig(options);
      this.model = cfg.model;
      this.device = cfg.device;
      const worker = this.spawn();

      await new Promise<void>((resolve, reject) => {
        const onMsg = (e: MessageEvent<WorkerMsg>) => {
          const m = e.data;
          if (m.type === 'ready') {
            worker.removeEventListener('message', onMsg);
            resolve();
          } else if (m.type === 'progress' && m.phase === 'loading_model') {
            this.progressForInit?.({ phase: 'loading_model', progress: m.progress });
          } else if (m.type === 'error') {
            worker.removeEventListener('message', onMsg);
            this.readyPromise = null;
            reject(new VideoShadowingError('WHISPER_MODEL_LOAD_FAILED', m.message));
          }
        };
        worker.addEventListener('message', onMsg);
        worker.postMessage({ type: 'init', model: this.model, device: this.device });
      });
    })();
    return this.readyPromise;
  }

  async transcribe(
    audio: ArrayBuffer,
    options: TranscriptionOptions,
    onProgress?: (progress: TranscriptionProgress) => void,
    signal?: AbortSignal,
  ): Promise<TranscriptionResult> {
    if (signal?.aborted) throw new VideoShadowingError('TRANSCRIPTION_CANCELLED');

    onProgress?.({ phase: 'loading_model', progress: 0 });
    this.progressForInit = (p) => onProgress?.(p);
    await this.initialize();
    this.progressForInit = null;

    const float32 = await decodeToMono16k(audio);
    const worker = this.spawn();
    const id = this.nextId++;

    return new Promise<TranscriptionResult>((resolve, reject) => {
      const onAbort = () => {
        worker.removeEventListener('message', onMsg);
        reject(new VideoShadowingError('TRANSCRIPTION_CANCELLED'));
      };
      const onMsg = (e: MessageEvent<WorkerMsg>) => {
        const m = e.data;
        if ('id' in m && m.id !== id) return;
        if (m.type === 'progress') {
          onProgress?.({ phase: 'transcribing', progress: m.progress });
        } else if (m.type === 'result') {
          worker.removeEventListener('message', onMsg);
          signal?.removeEventListener('abort', onAbort);
          onProgress?.({ phase: 'done', progress: 100 });
          resolve(mapResult(m));
        } else if (m.type === 'error') {
          worker.removeEventListener('message', onMsg);
          signal?.removeEventListener('abort', onAbort);
          reject(new VideoShadowingError('TRANSCRIPTION_FAILED', m.message));
        }
      };
      worker.addEventListener('message', onMsg);
      signal?.addEventListener('abort', onAbort, { once: true });
      // Transfer the audio buffer to avoid a copy.
      worker.postMessage({ type: 'transcribe', id, audio: float32, returnTimestamps: options.returnTimestamps ?? true }, [float32.buffer]);
    });
  }

  async dispose(): Promise<void> {
    this.worker?.terminate();
    this.worker = null;
    this.readyPromise = null;
  }
}

function mapResult(m: WorkerResultMsg): TranscriptionResult {
  const text = (m.text ?? '').trim();
  let chunks: TranscriptionChunk[] = [];
  let hasReliableTimestamps = false;

  if (m.chunks && m.chunks.length > 0) {
    hasReliableTimestamps = m.chunks.every((c) => c.timestamp?.[0] != null);
    chunks = m.chunks.map((c, i, arr) => {
      const startS = c.timestamp?.[0] ?? 0;
      const endS = c.timestamp?.[1] ?? (arr[i + 1]?.timestamp?.[0] ?? startS + 3);
      return { text: c.text.trim(), startMs: Math.round(startS * 1000), endMs: Math.round(endS * 1000) };
    }).filter((c) => c.text.length > 0);
  }

  // Fallback: one chunk covering the whole transcript (user can re-time).
  if (chunks.length === 0 && text) {
    chunks = [{ text, startMs: 0, endMs: 0 }];
  }
  return { text, chunks, hasReliableTimestamps };
}

export const transcriptionService: LocalTranscriptionService = new WorkerTranscriptionService();

export { WHISPER_MODELS } from '../../models/transcription';
