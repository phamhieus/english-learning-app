# Video Shadowing

Practice speaking by shadowing short video segments. Three sources: a curated
**VOA Learning English** library, **uploaded videos**, and **direct video URLs**.
Everything runs **locally in the browser** — no backend, no cloud transcription,
no uploads of personal video/audio/transcripts.

## Status (iteration 1 — scaffold)

Built and working now:

- Library (VOA + My Videos), VOA Lesson Detail, Add Video (Upload / Paste link),
  Script Processing, Review Segments, Practice, Result — all wired into routing
  and matching the Lingua design (light + dark).
- Local storage layer: IndexedDB metadata + OPFS file storage (with an
  IndexedDB-blob fallback when OPFS is unavailable). Cascade cleanup on delete.
- Subtitle import (`.srt` / `.vtt`) → segments. **Upload video + subtitle is a
  fully working end-to-end flow** (import → review/edit → practice → result).
- Rule-based transcript segmentation (Sentence / ShortPhrase / Paragraph) and
  segment edit ops (edit / split / merge / delete / add / re-time).
- Segment-based video player (seek/stop/loop, event-driven) and microphone
  recording (reuses the Shadowing module's `useAudioRecorder`).
- Heuristic, pluggable scoring service (`ShadowingScoringService`).
- Browser capability detection (WebGPU / WASM / OPFS / MediaRecorder / quota).

Local AI processing (now wired, web-only):

- `ffmpegService` — real, using `@ffmpeg/ffmpeg` with the single-threaded core
  loaded from CDN via `toBlobURL` (no SharedArrayBuffer / COOP-COEP). Extracts
  mono 16 kHz WAV from video; runs in ffmpeg's own worker; lazy-loaded.
- `transcriptionService` — real, runs Whisper (`@huggingface/transformers`) in a
  dedicated Web Worker (`workers/transcription.worker.ts`). WebGPU preferred,
  WASM fallback. Model downloads once (~40 MB tiny.en) and is browser-cached.
  Audio is decoded to Float32 16 kHz on the main thread (`audioDecode.ts`).
- Practice records → transcribes locally → scores → fills the quick-feedback
  card. Generate-Script (upload without subtitle) runs extract → transcribe →
  segment with progress/cancel/retry.

Heavy worker + ONNX wasm are emitted as separate chunks, loaded only when
transcription runs — not on app start or while browsing the Library.

## Web-only processing plan (no special headers)

The full local pipeline is achievable with **zero COOP/COEP / cross-origin
isolation**, so it works on plain static hosting and inside the Uno WebView:

- **ffmpeg.wasm** → use the **single-threaded core** (`@ffmpeg/core-st`). No
  `SharedArrayBuffer`. Lazy-loaded in a Web Worker only when first needed.
- **Whisper** via `@huggingface/transformers` → **WebGPU** backend preferred,
  **single-threaded WASM** fallback. Neither requires cross-origin isolation.
  Model files are cached by the browser. Default model `whisper-tiny.en`.
- **Thumbnails** → `<video>` + `<canvas>` (no ffmpeg).

## Limits & browser support

- Video: `.mp4`, `.webm`, `.mov` · ≤ 300 MB · ≤ 30 min (warns > 15 min).
  Configurable in `utils/fileValidation.ts`.
- Best on recent **Chrome / Edge**. WebGPU → fast; otherwise compatibility mode.
- **Direct URL / CORS:** only `https` direct media links that allow browser
  access work. YouTube/TikTok/Facebook and login/DRM links are unsupported.
  If a source blocks CORS, the user is told to download legally and upload the
  file instead. We never scrape, proxy, or bypass CORS.

## Privacy

No personal video/audio/transcript leaves the device. Subtitle/transcript text
is escaped by React and never rendered as HTML (no `dangerouslySetInnerHTML`).
