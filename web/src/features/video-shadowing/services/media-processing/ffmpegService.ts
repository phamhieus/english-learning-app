// Real ffmpeg.wasm wrapper. Uses the SINGLE-THREADED core (@ffmpeg/core) loaded
// lazily from a CDN via toBlobURL — NO SharedArrayBuffer / COOP-COEP required,
// so it works on plain static hosting and inside the Uno WebView. @ffmpeg/ffmpeg
// already runs ffmpeg in its own worker, keeping the main thread free.

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { VideoShadowingError } from '../../utils/errorCodes';

export interface AudioExtractionOptions {
  /** Target sample rate for transcription (Whisper expects 16 kHz). */
  sampleRate: number;
  /** Mono downmix. */
  channels: 1 | 2;
}

export interface FfmpegService {
  load(onProgress?: (ratio: number) => void): Promise<void>;
  isLoaded(): boolean;
  extractAudio(
    input: Blob,
    options: AudioExtractionOptions,
    onProgress?: (ratio: number) => void,
    signal?: AbortSignal,
  ): Promise<Blob>;
  dispose(): Promise<void>;
}

// Same-origin ESM core copied into public/ffmpeg by scripts/copy-ffmpeg-core.mjs.
// @ffmpeg/ffmpeg 0.12 runs a *module* worker that loads the core via dynamic
// import(), so it must be the ESM build passed as a plain URL (not a blob).
const LOCAL_BASE = new URL(`${import.meta.env.BASE_URL}ffmpeg/`, window.location.href).href;
// CDN fallback (single-thread ESM core, no SharedArrayBuffer) matching @ffmpeg 0.12.
const CDN_BASE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/';

class RealFfmpegService implements FfmpegService {
  private ffmpeg: FFmpeg | null = null;
  private loaded = false;
  private loadPromise: Promise<void> | null = null;

  isLoaded(): boolean {
    return this.loaded;
  }

  private async loadFrom(base: string): Promise<void> {
    const ffmpeg = new FFmpeg();
    // Pass the ESM core + wasm as plain same-origin URLs — the module worker
    // dynamic-imports the core and reads wasmURL from it.
    await ffmpeg.load({ coreURL: `${base}ffmpeg-core.js`, wasmURL: `${base}ffmpeg-core.wasm` });
    this.ffmpeg = ffmpeg;
    this.loaded = true;
  }

  load(onProgress?: (ratio: number) => void): Promise<void> {
    if (this.loaded) return Promise.resolve();
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      onProgress?.(0.3);
      try {
        await this.loadFrom(LOCAL_BASE); // same-origin, offline-capable
        onProgress?.(1);
        return;
      } catch (localErr) {
        console.warn('[ffmpeg] local core load failed, trying CDN', localErr);
      }
      try {
        onProgress?.(0.6);
        await this.loadFrom(CDN_BASE);
        onProgress?.(1);
      } catch (err) {
        this.loadPromise = null;
        throw new VideoShadowingError('FFMPEG_LOAD_FAILED', err);
      }
    })();
    return this.loadPromise;
  }

  async extractAudio(
    input: Blob,
    options: AudioExtractionOptions,
    onProgress?: (ratio: number) => void,
    signal?: AbortSignal,
  ): Promise<Blob> {
    await this.load();
    const ffmpeg = this.ffmpeg;
    if (!ffmpeg) throw new VideoShadowingError('FFMPEG_LOAD_FAILED');

    const inputName = 'input-media';
    const outputName = 'normalized-audio.wav';
    const onAbort = () => {
      // Terminating the worker is the only reliable cancel for ffmpeg.wasm.
      ffmpeg.terminate();
      this.loaded = false;
      this.loadPromise = null;
      this.ffmpeg = null;
    };

    const progressHandler = ({ progress }: { progress: number }) => onProgress?.(Math.min(1, Math.max(0, progress)));
    ffmpeg.on('progress', progressHandler);

    try {
      if (signal?.aborted) throw new VideoShadowingError('TRANSCRIPTION_CANCELLED');
      signal?.addEventListener('abort', onAbort, { once: true });

      await ffmpeg.writeFile(inputName, await fetchFile(input));
      await ffmpeg.exec([
        '-i', inputName,
        '-vn',
        '-ac', String(options.channels),
        '-ar', String(options.sampleRate),
        '-f', 'wav',
        outputName,
      ]);
      const data = await ffmpeg.readFile(outputName);

      // Cleanup the virtual filesystem.
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});

      // Copy into a fresh ArrayBuffer-backed view (readFile may be SAB-backed).
      const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
      return new Blob([bytes], { type: 'audio/wav' });
    } catch (err) {
      if (err instanceof VideoShadowingError) throw err;
      if (signal?.aborted) throw new VideoShadowingError('TRANSCRIPTION_CANCELLED', err);
      throw new VideoShadowingError('FFMPEG_PROCESS_FAILED', err);
    } finally {
      ffmpeg.off('progress', progressHandler);
      signal?.removeEventListener('abort', onAbort);
    }
  }

  async dispose(): Promise<void> {
    try {
      this.ffmpeg?.terminate();
    } catch {
      /* ignore */
    }
    this.ffmpeg = null;
    this.loaded = false;
    this.loadPromise = null;
  }
}

export const ffmpegService: FfmpegService = new RealFfmpegService();
