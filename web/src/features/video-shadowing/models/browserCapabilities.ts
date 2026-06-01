// Snapshot of what the current browser can do for local video processing.
// Detected up-front (e.g. when opening Add Video) so we can pick backends and
// warn the user instead of crashing.

export type TranscriptionBackend = 'webgpu' | 'wasm' | 'unsupported';

export interface BrowserCapabilities {
  webWorker: boolean;
  webGPU: boolean;
  indexedDB: boolean;
  opfs: boolean;
  mediaRecorder: boolean;
  /** ffmpeg.wasm can run (WebAssembly available). */
  wasm: boolean;
  /** Audio MIME types MediaRecorder can produce, best-first. */
  supportedAudioMimeTypes: string[];
  /** Preferred transcription backend given what's available. */
  transcriptionBackend: TranscriptionBackend;
  /** navigator.storage.estimate() result, if exposed. */
  storageQuotaBytes?: number;
  storageUsageBytes?: number;
}

export type ProcessingMode = 'webgpu' | 'compatibility' | 'unsupported';

export function describeProcessingMode(caps: BrowserCapabilities): {
  mode: ProcessingMode;
  label: string;
  detail: string;
} {
  if (!caps.wasm || !caps.webWorker) {
    return {
      mode: 'unsupported',
      label: 'Browser unsupported',
      detail: 'Please use a recent version of Chrome or Edge to process videos.',
    };
  }
  if (caps.webGPU) {
    return {
      mode: 'webgpu',
      label: 'WebGPU enabled',
      detail: 'Fast on-device processing using your GPU.',
    };
  }
  return {
    mode: 'compatibility',
    label: 'Compatibility mode',
    detail: 'WebGPU is unavailable — processing runs on CPU and may be slower.',
  };
}
