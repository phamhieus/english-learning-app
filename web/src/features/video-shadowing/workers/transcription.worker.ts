// Web Worker running Whisper via Transformers.js. Keeps ASR inference off the
// main thread. WebGPU when available, else single-threaded WASM — neither needs
// cross-origin isolation. Model weights download once and are cached by the
// browser. The main thread decodes audio to Float32 (16 kHz) and posts it here.

import { pipeline, env } from '@huggingface/transformers';

// Always fetch models from the Hugging Face Hub (no bundled local models).
env.allowLocalModels = false;

type Device = 'webgpu' | 'wasm';

// Minimal local typing for the ASR pipeline — importing the full generated type
// produces a union too complex for TS to represent (TS2590).
interface AsrOutput {
  text?: string;
  chunks?: { text: string; timestamp: [number, number | null] }[];
}
type AsrPipeline = (audio: Float32Array, options?: Record<string, unknown>) => Promise<AsrOutput | AsrOutput[]>;

interface InitMsg {
  type: 'init';
  model: string;
  device: Device;
}
interface TranscribeMsg {
  type: 'transcribe';
  id: number;
  audio: Float32Array;
  returnTimestamps: boolean;
}
type InMsg = InitMsg | TranscribeMsg;

let transcriber: AsrPipeline | null = null;
let loadedKey = '';

const progressCb = (p: unknown) => {
  const info = p as { status?: string; progress?: number; file?: string };
  if (info.status === 'progress') {
    self.postMessage({ type: 'progress', phase: 'loading_model', progress: Math.round(info.progress ?? 0), file: info.file });
  }
};

async function buildPipeline(model: string, device: Device): Promise<AsrPipeline> {
  return (await pipeline('automatic-speech-recognition', model, {
    device,
    progress_callback: progressCb,
    // Quiet ONNX Runtime's benign "node not assigned to preferred EP" warnings
    // (3 = Error). Shape ops on CPU under WebGPU are expected, not a problem.
    session_options: { logSeverityLevel: 3 },
  })) as unknown as AsrPipeline;
}

async function ensurePipeline(model: string, device: Device) {
  const key = `${model}@${device}`;
  if (transcriber && loadedKey === key) return;
  try {
    transcriber = await buildPipeline(model, device);
    loadedKey = key;
  } catch (err) {
    // Preferred (e.g. base.en on WebGPU) failed → fall back to the fastest,
    // most reliable path so transcription still works.
    self.postMessage({ type: 'progress', phase: 'loading_model', progress: 0, fallback: true });
    console.warn('[whisper] pipeline load failed, falling back to tiny.en/wasm', err);
    transcriber = await buildPipeline('Xenova/whisper-tiny.en', 'wasm');
    loadedKey = 'Xenova/whisper-tiny.en@wasm';
  }
}

self.onmessage = async (e: MessageEvent<InMsg>) => {
  const msg = e.data;
  try {
    if (msg.type === 'init') {
      await ensurePipeline(msg.model, msg.device);
      self.postMessage({ type: 'ready' });
      return;
    }

    if (msg.type === 'transcribe') {
      if (!transcriber) throw new Error('Pipeline not initialized');
      self.postMessage({ type: 'progress', phase: 'transcribing', progress: 0, id: msg.id });
      const output = await transcriber(msg.audio, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: msg.returnTimestamps,
      });
      const single = Array.isArray(output) ? output[0] : output;
      self.postMessage({ type: 'result', id: msg.id, text: single.text ?? '', chunks: single.chunks ?? null });
    }
  } catch (err) {
    self.postMessage({ type: 'error', id: 'id' in msg ? msg.id : undefined, message: err instanceof Error ? err.message : String(err) });
  }
};
