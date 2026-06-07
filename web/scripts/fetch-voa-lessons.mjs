// Build-time fetcher for the Video Shadowing VOA library. Runs in Node (NOT the
// browser) so it bypasses the CORS / 403 wall that blocks calling VOA directly
// from the app. Output: regenerates
//   src/features/video-shadowing/data/built-in-video-lessons.json
// The app stays keyless and offline at runtime — it only reads the JSON.
//
// Usage:  node scripts/fetch-voa-lessons.mjs            (real fetch)
//         node scripts/fetch-voa-lessons.mjs --dry-run  (log, don't write)
//
// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT — VOA has no official video API. The only public surface is RSS.
// 1. Open https://learningenglish.voanews.com/rssfeeds in a browser.
// 2. Copy the RSS URL of each program you want (right-click the RSS icon → copy
//    link) and paste it into FEEDS below, tagging level + category yourself
//    (RSS carries no CEFR level).
// The script is best-effort: it fetches each feed, then opens each article to
// pull a playable video URL (.m3u8 / .mp4) and a caption track (.vtt). An item
// is SKIPPED unless it has BOTH a video URL and captions — captions give the
// real segment timing the shadowing player needs; without them a lesson is
// useless here, so we don't import it.
// ─────────────────────────────────────────────────────────────────────────────

import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../src/features/video-shadowing/data/built-in-video-lessons.json');
const DRY_RUN = process.argv.includes('--dry-run');

// Paste real RSS URLs here. level: 'A1'|'A2'|'B1'|'B2'. grad picks a card color.
// (See web/src/features/video-shadowing/components/videoThumbStyles.ts for keys.)
const FEEDS = [
  // { url: 'https://learningenglish.voanews.com/api/<feed-id>', category: "Let's Learn English", level: 'A2', topic: 'Daily Conversation', grad: 'amber' },
  // { url: 'https://learningenglish.voanews.com/api/<feed-id>', category: 'English in a Minute', level: 'B1', topic: 'Vocabulary', grad: 'cyan' },
];

const MAX_ITEMS_PER_FEED = 12;
const GRADS = ['amber', 'blue', 'violet', 'cyan', 'emerald', 'rose', 'teal', 'indigo'];

// Browser-like headers — VOA returns 403 to default fetch/curl user agents.
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml,application/rss+xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function get(url) {
  const res = await fetch(url, { headers: HEADERS, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// ── tiny, dependency-free parsing helpers ───────────────────────────────────

function decodeEntities(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}

const stripTags = (html) => decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

// First capture group of the first match, or '' .
function pick(re, html) {
  const m = re.exec(html);
  return m ? decodeEntities(m[1]).trim() : '';
}

// Split a feed's XML into <item> blocks.
function parseRssItems(xml) {
  return [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]).map((item) => ({
    title: pick(/<title>([\s\S]*?)<\/title>/i, item),
    link: pick(/<link>([\s\S]*?)<\/link>/i, item),
    description: stripTags(pick(/<description>([\s\S]*?)<\/description>/i, item)),
  }));
}

// Find a playable media URL in an article's HTML. VOA serves HLS (.m3u8) and
// sometimes progressive .mp4 (often inside JSON blobs or <source> tags).
function findVideoUrl(html) {
  const m3u8 = /https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i.exec(html);
  if (m3u8) return m3u8[0];
  const mp4 = /https?:\/\/[^"'\s]+\.mp4[^"'\s]*/i.exec(html);
  return mp4 ? mp4[0] : '';
}

// Find a caption track (.vtt) — gives REAL segment timing when present.
function findVttUrl(html) {
  const m = /https?:\/\/[^"'\s]+\.vtt[^"'\s]*/i.exec(html);
  return m ? m[0] : '';
}

const thumbUrl = (html) =>
  pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i, html);

// ── timing (from captions) ───────────────────────────────────────────────────

const toMs = (clock) => {
  // "HH:MM:SS.mmm" | "MM:SS.mmm"
  const p = clock.trim().split(':').map(parseFloat);
  const [h, m, s] = p.length === 3 ? p : [0, p[0], p[1]];
  return Math.round((h * 3600 + m * 60 + s) * 1000);
};

// Parse WebVTT cues → real timed segments.
function parseVtt(vtt) {
  const cues = [];
  for (const block of vtt.split(/\r?\n\r?\n/)) {
    const m = /(\d{1,2}:\d{2}(?::\d{2})?\.\d{3})\s*-->\s*(\d{1,2}:\d{2}(?::\d{2})?\.\d{3})([\s\S]*)/.exec(block);
    if (!m) continue;
    const text = stripTags(m[3].split(/\r?\n/).slice(1).join(' '));
    if (text) cues.push({ startMs: toMs(m[1]), endMs: toMs(m[2]), text });
  }
  return cues;
}

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

// ── main ─────────────────────────────────────────────────────────────────────

async function buildLessonFromItem(item, feed, index) {
  const html = await get(item.link);
  const videoUrl = findVideoUrl(html);
  if (!videoUrl) {
    console.warn(`  skip (no video): ${item.title}`);
    return null;
  }

  // Captions are required: real VTT timing is the only way segment boundaries
  // line up with the audio. No caption track → skip the item entirely.
  const vttUrl = findVttUrl(html);
  if (!vttUrl) {
    console.warn(`  skip (no captions): ${item.title}`);
    return null;
  }
  let segments;
  try {
    segments = parseVtt(await get(vttUrl));
  } catch (err) {
    console.warn(`  skip (caption fetch failed): ${item.title} — ${err.message}`);
    return null;
  }
  if (!segments.length) {
    console.warn(`  skip (empty captions): ${item.title}`);
    return null;
  }
  const durationMs = segments[segments.length - 1].endMs;

  return {
    id: `voa-${slugify(feed.category)}-${slugify(item.title)}`.slice(0, 70),
    title: item.title,
    description: item.description.slice(0, 240),
    sourceType: 'BuiltInVoa',
    provider: 'VOA Learning English',
    providerItemId: slugify(item.title),
    sourceUrl: item.link,
    videoUrl,
    thumbnailUrl: thumbUrl(html),
    transcriptUrl: vttUrl,
    durationMs,
    level: feed.level || 'Auto',
    topic: feed.topic || feed.category,
    accent: 'US',
    grad: feed.grad || GRADS[index % GRADS.length],
    category: feed.category,
    sourceCredit: 'Source: VOA Learning English',
    safetyStatus: 'Curated',
    segments,
  };
}

async function main() {
  if (FEEDS.length === 0) {
    console.error(
      '[fetch-voa] No feeds configured. Edit FEEDS in scripts/fetch-voa-lessons.mjs\n' +
        '            (grab RSS URLs from https://learningenglish.voanews.com/rssfeeds).',
    );
    process.exit(1);
  }

  const lessons = [];
  for (const feed of FEEDS) {
    console.log(`[fetch-voa] feed: ${feed.category} <${feed.url}>`);
    let items;
    try {
      items = parseRssItems(await get(feed.url)).slice(0, MAX_ITEMS_PER_FEED);
    } catch (err) {
      console.warn(`  feed failed: ${err.message}`);
      continue;
    }
    for (let i = 0; i < items.length; i++) {
      try {
        const lesson = await buildLessonFromItem(items[i], feed, lessons.length);
        if (lesson) {
          lessons.push(lesson);
          console.log(`  + ${lesson.title} (${lesson.segments.length} segments)`);
        }
      } catch (err) {
        console.warn(`  item failed (${items[i].title}): ${err.message}`);
      }
    }
  }

  console.log(`[fetch-voa] ${lessons.length} lessons built.`);
  if (DRY_RUN) {
    console.log('[fetch-voa] --dry-run: not writing.');
    return;
  }
  if (lessons.length === 0) {
    console.error('[fetch-voa] nothing to write — leaving existing manifest untouched.');
    process.exit(1);
  }
  writeFileSync(OUT, JSON.stringify(lessons, null, 2) + '\n');
  console.log(`[fetch-voa] wrote ${OUT}`);
}

main().catch((err) => {
  console.error('[fetch-voa] fatal:', err);
  process.exit(1);
});
