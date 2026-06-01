// Detects what the current browser supports for local video processing.
// Pure detection — no heavy libraries loaded here.

import type { BrowserCapabilities, TranscriptionBackend } from '../models/browserCapabilities';
import { estimateStorage } from './storage/storageQuotaService';

const AUDIO_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
];

function detectAudioMimeTypes(): string[] {
  if (typeof MediaRecorder === 'undefined') return [];
  return AUDIO_MIME_CANDIDATES.filter((t) => {
    try {
      return MediaRecorder.isTypeSupported(t);
    } catch {
      return false;
    }
  });
}

async function detectWebGPU(): Promise<boolean> {
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
  if (!gpu) return false;
  try {
    const adapter = await gpu.requestAdapter();
    return adapter != null;
  } catch {
    return false;
  }
}

export async function detectBrowserCapabilities(): Promise<BrowserCapabilities> {
  const webWorker = typeof Worker !== 'undefined';
  const indexedDBOk = typeof indexedDB !== 'undefined';
  const opfs =
    typeof navigator !== 'undefined' && 'storage' in navigator && 'getDirectory' in navigator.storage;
  const mediaRecorder =
    typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  const wasm = typeof WebAssembly !== 'undefined';
  const webGPU = await detectWebGPU();
  const supportedAudioMimeTypes = detectAudioMimeTypes();

  let transcriptionBackend: TranscriptionBackend = 'unsupported';
  if (wasm && webWorker) transcriptionBackend = webGPU ? 'webgpu' : 'wasm';

  const { quotaBytes, usageBytes } = await estimateStorage();

  return {
    webWorker,
    webGPU,
    indexedDB: indexedDBOk,
    opfs,
    mediaRecorder,
    wasm,
    supportedAudioMimeTypes,
    transcriptionBackend,
    storageQuotaBytes: quotaBytes,
    storageUsageBytes: usageBytes,
  };
}
