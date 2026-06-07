// Build-time curator for the Video Shadowing library, sourcing from the
// Internet Archive (https://archive.org). Runs in Node (NOT the browser) so it
// can read the Archive metadata API and download subtitle files without the
// CORS limits the app would hit at runtime.
//
// What it does (mirrors the curate flow in the spec):
//   1. For each Internet Archive identifier, GET /metadata/{id}
//   2. Reject dark / empty items
//   3. Pick a browser-streamable video file (.mp4 preferred)
//   4. Pick the best subtitle by the priority ladder (§14)
//   5. Download + parse the subtitle (SRT or VTT) into timed segments
//   6. Build a lesson and MERGE it into
//        src/features/video-shadowing/data/built-in-video-lessons.json
//
// The app stays keyless + offline at runtime: it only ever reads the JSON, and
// streams the video directly from archive.org when the learner practises.
//
// Usage:
//   node scripts/curate-archive-lessons.mjs                 # curate the CONFIG list
//   node scripts/curate-archive-lessons.mjs ControlY1950    # curate ad-hoc id(s)
//   node scripts/curate-archive-lessons.mjs --dry-run       # log, don't write
//   node scripts/curate-archive-lessons.mjs --publish        # mark Curated (else PendingReview)
//
// IMPORTANT (content safety, spec §11): by default a curated lesson is written
// with safetyStatus "PendingReview" and is NOT shown in the app. A developer
// must review license + content against the checklist and re-run with --publish
// (or hand-edit safetyStatus to "Curated") before it appears.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../src/features/video-shadowing/data/built-in-video-lessons.json');

const DRY_RUN = process.argv.includes('--dry-run');
const PUBLISH = process.argv.includes('--publish');
const ID_ARGS = process.argv.slice(2).filter((a) => !a.startsWith('--'));

// Default curation list. Each entry pairs an Archive identifier with the
// teaching metadata the API can't supply (CEFR level, topic, card colour).
// grad keys: see web/src/features/video-shadowing/components/videoThumbStyles.ts
const CONFIG = [
  { id: 'ControlY1950', level: 'B1', topic: 'Personal Development', grad: 'teal' },
  { id: 'AskMeDon1961', level: 'B1', topic: 'Communication', grad: 'emerald' },
  // Neutral public-domain Prelinger health / daily-life shorts (ASR captions).
  { id: 'GoodEati1951', level: 'A2', topic: 'Health & Habits', grad: 'cyan' },
  { id: 'Exercise1949', level: 'B1', topic: 'Health & Fitness', grad: 'rose' },
  { id: 'Sleepfor1950', level: 'A2', topic: 'Health & Habits', grad: 'blue' },
  { id: 'JoanAvoi1947', level: 'A2', topic: 'Daily Life', grad: 'amber' },
  { id: 'Careofth1949', level: 'B1', topic: 'Health', grad: 'violet' },
];

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'application/json,text/plain,*/*',
};

const GRADS = ['amber', 'blue', 'violet', 'cyan', 'emerald', 'rose', 'teal', 'indigo'];

// ── network ──────────────────────────────────────────────────────────────────

async function getText(url) {
  const res = await fetch(url, { headers: HEADERS, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function getJson(url) {
  return JSON.parse(await getText(url));
}

// ── file selection ───────────────────────────────────────────────────────────

// Prefer a smaller, progressive MP4 (best for streaming), then the full MP4,
// then other browser-playable containers. Skip derivative "_edit" cuts.
export function pickVideoFile(files) {
  const playable = files
    .map((f) => f.name)
    .filter((n) => /\.(mp4|webm|ogv)$/i.test(n) && !/_edit\.\w+$/i.test(n));
  const score = (n) => {
    const ext = n.toLowerCase().split('.').pop();
    let s = ext === 'mp4' ? 30 : ext === 'webm' ? 20 : 10; // mp4 > webm > ogv
    if (/_512kb\.mp4$/i.test(n)) s += 5; // small progressive mp4 streams best
    return s;
  };
  return playable.sort((a, b) => score(b) - score(a))[0] ?? null;
}

// Subtitle priority ladder (spec §14): align > en.vtt > en.srt > vtt > cc5 >
// asr > srt. Returns { filename, type } or null.
export function getTranscriptCandidate(files) {
  const ladder = [
    { test: /\.align\.srt$/i, type: 'srt', priority: 100 },
    { test: /\.en\.vtt$/i, type: 'vtt', priority: 95 },
    { test: /\.en\.srt$/i, type: 'srt', priority: 90 },
    { test: /\.vtt$/i, type: 'vtt', priority: 85 },
    { test: /\.cc5\.srt$/i, type: 'srt', priority: 80 },
    { test: /\.asr\.srt$/i, type: 'srt', priority: 70 },
    { test: /\.srt$/i, type: 'srt', priority: 60 },
  ];
  const candidates = [];
  for (const file of files) {
    for (const rule of ladder) {
      if (rule.test.test(file.name)) {
        candidates.push({ filename: file.name, type: rule.type, priority: rule.priority });
        break;
      }
    }
  }
  return candidates.sort((a, b) => b.priority - a.priority)[0] ?? null;
}

// ── subtitle parsing ─────────────────────────────────────────────────────────

// "HH:MM:SS,mmm" | "HH:MM:SS.mmm" | "MM:SS.mmm" → milliseconds.
export function clockToMs(clock) {
  const norm = clock.trim().replace(',', '.');
  const parts = norm.split(':').map(Number);
  const [h, m, s] = parts.length === 3 ? parts : [0, parts[0], parts[1]];
  return Math.round((h * 3600 + m * 60 + s) * 1000);
}

const TAGS = /<[^>]+>/g;
const cleanText = (s) => s.replace(TAGS, '').replace(/\s+/g, ' ').trim();

const TIMECODE = /(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{1,3})/;

// Parse a SubRip (.srt) or WebVTT (.vtt) cue list into { startMs, endMs, text }.
// Both formats share the "start --> end" cue line; the only differences we care
// about (header line, comma vs dot ms) are handled by the shared logic.
export function parseSubtitle(raw) {
  const body = raw.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const blocks = body.split(/\n{2,}/);
  const cues = [];
  for (const block of blocks) {
    const lines = block.split('\n');
    const tcIndex = lines.findIndex((l) => TIMECODE.test(l));
    if (tcIndex === -1) continue;
    const m = TIMECODE.exec(lines[tcIndex]);
    const text = cleanText(lines.slice(tcIndex + 1).join(' '));
    if (!text) continue;
    const startMs = clockToMs(m[1]);
    const endMs = clockToMs(m[2]);
    if (endMs <= startMs) continue;
    cues.push({ startMs, endMs, text });
  }
  return cues;
}

// Merge consecutive ASR fragments into sentence-ish segments so shadowing has
// natural units rather than 1–2 word cues. Joins until a sentence-ending
// punctuation or a max duration / char budget is reached.
export function mergeIntoSentences(cues, { maxMs = 7000, maxChars = 140 } = {}) {
  const out = [];
  let cur = null;
  for (const cue of cues) {
    if (!cur) {
      cur = { startMs: cue.startMs, endMs: cue.endMs, text: cue.text };
    } else {
      cur.endMs = cue.endMs;
      cur.text = `${cur.text} ${cue.text}`.replace(/\s+/g, ' ').trim();
    }
    const longEnough = cur.endMs - cur.startMs >= maxMs || cur.text.length >= maxChars;
    if (/[.!?]["')\]]?$/.test(cur.text) || longEnough) {
      out.push(cur);
      cur = null;
    }
  }
  if (cur) out.push(cur);
  return out;
}

// ── lesson assembly ──────────────────────────────────────────────────────────

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

function inferLicense(meta) {
  const url = (meta.licenseurl || '').toLowerCase();
  if (url.includes('publicdomain') || (meta.rights || '').toLowerCase().includes('public domain')) {
    return 'PublicDomain';
  }
  if (url.includes('creativecommons')) return 'CreativeCommons';
  return 'Unknown';
}

const downloadUrl = (id, name) => `https://archive.org/download/${id}/${encodeURIComponent(name)}`;

async function curateOne(entry, index) {
  const id = entry.id;
  console.log(`[curate] ${id}`);
  const meta = await getJson(`https://archive.org/metadata/${id}`);

  if (meta.is_dark || !meta.files || meta.files.length === 0) {
    console.warn(`  skip: item is dark or has no files`);
    return null;
  }

  const videoName = pickVideoFile(meta.files);
  if (!videoName) {
    console.warn(`  skip: no browser-streamable video file`);
    return null;
  }

  const sub = getTranscriptCandidate(meta.files);
  if (!sub) {
    console.warn(`  skip: no subtitle/transcript (run Whisper locally for this one)`);
    return null;
  }

  const rawSub = await getText(downloadUrl(id, sub.filename));
  const cues = parseSubtitle(rawSub);
  if (!cues.length) {
    console.warn(`  skip: subtitle parsed to 0 cues`);
    return null;
  }
  const segments = mergeIntoSentences(cues);
  const durationMs = segments[segments.length - 1].endMs;

  const md = meta.metadata || {};
  const licenseType = inferLicense(md);
  const thumb = `https://archive.org/services/img/${id}`;
  const usedAsr = /asr/i.test(sub.filename);
  const safetyStatus = PUBLISH ? 'Curated' : 'PendingReview';

  const lesson = {
    id: `archive-${slugify(id)}`,
    title: md.title || id,
    description: typeof md.description === 'string' ? cleanText(md.description).slice(0, 240) : undefined,
    sourceType: 'BuiltInArchive',
    provider: 'Internet Archive',
    providerItemId: id,
    // Page URL is attribution only. `sourceUrl` is reserved for a *direct media*
    // URL (DirectUrl uploads); leaving it unset makes built-ins resolve to
    // `videoUrl`, same as the VOA entries. Putting the /details/ page here would
    // make the player try to stream an HTML page.
    sourcePageUrl: `https://archive.org/details/${id}`,
    videoUrl: downloadUrl(id, videoName),
    thumbnailUrl: thumb,
    transcriptUrl: downloadUrl(id, sub.filename),
    transcriptSource: usedAsr ? 'LocallyGenerated' : 'ProviderSubtitle',
    durationMs,
    level: entry.level || 'Auto',
    topic: entry.topic || md.subject?.[0] || 'General English',
    accent: entry.accent || 'US',
    grad: entry.grad || GRADS[index % GRADS.length],
    category: entry.category || 'Internet Archive',
    licenseType,
    sourceCredit: `Source: Internet Archive — ${md.title || id}`,
    safetyStatus,
    blockedTopicsChecked: PUBLISH,
    reviewedAt: PUBLISH ? new Date().toISOString() : undefined,
    segments,
  };

  console.log(
    `  + "${lesson.title}" — ${segments.length} segments, ${(durationMs / 1000).toFixed(0)}s, ` +
      `license=${licenseType}, sub=${sub.filename} (${sub.type}), status=${safetyStatus}`,
  );
  printChecklist(lesson);
  return lesson;
}

function printChecklist(lesson) {
  if (lesson.safetyStatus === 'Curated') return;
  console.log(
    `    REVIEW before publishing (spec §11): license=${lesson.licenseType}; verify content has no ` +
      `politics/religion/war/conflict/protest/sensitive/adult/violence; confirm captions match audio; ` +
      `then re-run with --publish.`,
  );
}

// ── manifest merge ───────────────────────────────────────────────────────────

function loadManifest() {
  try {
    return JSON.parse(readFileSync(OUT, 'utf8'));
  } catch {
    return [];
  }
}

function mergeManifest(existing, additions) {
  const byId = new Map(existing.map((l) => [l.id, l]));
  for (const lesson of additions) byId.set(lesson.id, lesson);
  return [...byId.values()];
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const entries = ID_ARGS.length
    ? ID_ARGS.map((id) => CONFIG.find((c) => c.id === id) || { id })
    : CONFIG;

  if (entries.length === 0) {
    console.error('[curate] nothing to do — pass an Archive identifier or fill CONFIG.');
    process.exit(1);
  }

  const curated = [];
  for (let i = 0; i < entries.length; i++) {
    try {
      const lesson = await curateOne(entries[i], i);
      if (lesson) curated.push(lesson);
    } catch (err) {
      console.warn(`  failed (${entries[i].id}): ${err.message}`);
    }
  }

  console.log(`[curate] ${curated.length}/${entries.length} lessons built.`);
  if (DRY_RUN) {
    console.log('[curate] --dry-run: not writing manifest.');
    return;
  }
  if (curated.length === 0) {
    console.error('[curate] nothing to write — leaving existing manifest untouched.');
    process.exit(1);
  }

  const merged = mergeManifest(loadManifest(), curated);
  writeFileSync(OUT, JSON.stringify(merged, null, 2) + '\n');
  console.log(`[curate] wrote ${merged.length} lessons → ${OUT}`);
  if (!PUBLISH) {
    console.log('[curate] new lessons are PendingReview and hidden in the app until --publish.');
  }
}

// Only run the pipeline when executed directly (so tests can import the helpers).
const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error('[curate] fatal:', err);
    process.exit(1);
  });
}
