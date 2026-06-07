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

## Built-in library: Internet Archive (curated at build time)

Curated lessons stream the video **directly from archive.org** at runtime; the
app bundles only lightweight metadata + pre-parsed segments (no video download,
no backend, no runtime Archive API calls).

Curate with the Node script (runs outside the app, bypassing browser CORS):

```bash
npm run curate:archive -- --dry-run          # preview the CONFIG list
npm run curate:archive -- ControlY1950        # curate one identifier
npm run curate:archive -- --publish           # write + mark Curated
```

Pipeline (`scripts/curate-archive-lessons.mjs`): `GET /metadata/{id}` → reject
dark items → pick a streamable `.mp4` → pick the best subtitle by the priority
ladder (`.align.srt` › `.en.vtt` › … › `.asr.srt`) → parse SRT/VTT → merge
sentence-ish segments → merge into `data/built-in-video-lessons.json` (dedupe by
id). Pure parsers are unit-tested in `scripts/__tests__/`.

**Content safety (gate):** without `--publish` a lesson is written as
`PendingReview` and is **hidden** in the app. A developer must verify the
license and check the content against the §11 checklist (no politics / religion
/ war / conflict / protest / sensitive / adult / disallowed violence) and
confirm captions match audio before re-running with `--publish`. The runtime
resolver only ever surfaces `safetyStatus === 'Curated'` entries.

Shipped examples (public-domain Prelinger educational films, ASR captions):
*Control Your Emotions* (`ControlY1950`), *Ask Me, Don't Tell Me*
(`AskMeDon1961`). ASR timing is approximate — fine for a demo, re-time in Review
if needed.

## Live Internet Archive library (browse + search + shadow)

The **Library** tab is live: on entry it loads ~30 items from
`archive.org/advancedsearch.php` and the search box queries the Archive directly
(both endpoints send `Access-Control-Allow-Origin: *`, so the browser calls them
with no backend). Card thumbnails use `archive.org/services/img/{id}`.

**Captions need a tiny helper.** archive.org does **not** send CORS headers on
`/download` files, so the browser can't fetch + parse a live item's subtitle (nor
its audio for local Whisper). One small Node service does just that step:

```bash
npm run proxy        # starts server/archive-proxy.mjs on :8787
```

`GET /api/archive/lesson/{identifier}` → fetches metadata, picks the best video +
subtitle, parses the captions into timed segments (reusing the curate script's
parsers), and returns a ready-to-shadow lesson as JSON (CORS `*`). The **video
itself is never proxied** — it still streams straight from archive.org via the
`<video>` element. Point the app at a different host with
`VITE_ARCHIVE_PROXY=https://my-host` (defaults to `http://localhost:8787`).

Clicking a live card calls the proxy, persists the lesson + segments locally
(IndexedDB), and opens the normal practice screen — full per-segment shadowing,
identical to curated lessons. Items with no caption track can't be segmented and
report that on click.

The build-time `npm run curate:archive` path still exists for baking lessons into
the static manifest (works fully offline, no proxy needed).

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
