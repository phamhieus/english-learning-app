// Copies the ffmpeg.wasm single-thread core (ESM build) from node_modules into
// public/ffmpeg so it's served same-origin at runtime — no CDN dependency, and
// the 31 MB wasm stays out of git (regenerated on install). Runs on postinstall.
// ESM (not UMD) because @ffmpeg/ffmpeg 0.12 runs a *module* worker that loads the
// core via dynamic import() — the UMD build has no default export and fails.

import { mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../node_modules/@ffmpeg/core/dist/esm');
const dest = resolve(here, '../public/ffmpeg');

const files = ['ffmpeg-core.js', 'ffmpeg-core.wasm'];

if (!existsSync(resolve(src, files[0]))) {
  console.warn('[copy-ffmpeg-core] @ffmpeg/core not found — skipping.');
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
for (const f of files) copyFileSync(resolve(src, f), resolve(dest, f));
console.log('[copy-ffmpeg-core] copied ffmpeg core to public/ffmpeg');
