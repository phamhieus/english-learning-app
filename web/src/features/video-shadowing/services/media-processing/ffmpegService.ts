// Real ffmpeg.wasm wrapper. Uses the SINGLE-THREADED core (@ffmpeg/core) loaded
// lazily from a CDN via toBlobURL — NO SharedArrayBuffer / COOP-COEP required,
// so it works on plain static hosting and inside the Uno WebView. @ffmpeg/ffmpeg
// already runs ffmpeg in its own worker, keeping the main thread free.

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
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

// Single-thread core (no SharedArrayBuffer). Pinned to match @ffmpeg/ffmpeg 0.12.
const CORE_VERSION = '0.12.10';
const CORE_BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

class RealFfmpegService implements FfmpegService {
  private ffmpeg: FFmpeg | null = null;
  private loaded = false;
  private loadPromise: Promise<void> | null = null;

  isLoaded(): boolean {
    return this.loaded;
  }

  load(onProgress?: (ratio: number) => void): Promise<void> {
    if (this.loaded) return Promise.resolve();
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        const ffmpeg = new FFmpeg();
        const [coreURL, wasmURL] = await Promise.all([
          toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
          toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
        ]);
        onProgress?.(0.5);
        await ffmpeg.load({ coreURL, wasmURL });
        this.ffmpeg = ffmpeg;
        this.loaded = true;
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
