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
import {
  pickVideoFile,
  getTranscriptCandidate,
  clockToMs,
  parseSubtitle,
  mergeIntoSentences,
} from '../../server/archive-core.mjs';

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

// Parsing helpers live in server/archive-core.mjs so the runtime proxy can reuse
// them standalone. Re-export here for the unit tests that import from this file.
export { pickVideoFile, getTranscriptCandidate, clockToMs, parseSubtitle, mergeIntoSentences };

const TAGS = /<[^>]+>/g;
const cleanText = (s) => s.replace(TAGS, '').replace(/\s+/g, ' ').trim();

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
