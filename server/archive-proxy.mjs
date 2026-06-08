// Tiny CORS proxy for live Internet Archive shadowing.
//
// Why this exists: archive.org's advancedsearch + metadata APIs are CORS-enabled
// (the browser calls them directly), but the /download files — including the
// subtitle tracks — are NOT. So the browser cannot fetch + parse captions to
// build per-segment shadowing for an arbitrary live item. This minimal Node
// service does that one CORS-blocked step server-side: given an identifier it
// fetches the metadata, picks the best video + subtitle, parses the captions
// into timed segments, and returns a ready-to-shadow lesson as JSON.
//
// It reuses the exact parsing helpers from the build-time curate script, so live
// and curated lessons are segmented identically.
//
// Run:  node server/archive-proxy.mjs           (defaults to port 8787)
//       ARCHIVE_PROXY_PORT=9000 node server/archive-proxy.mjs
//
// The video itself is still streamed directly from archive.org by the browser
// (no proxying of media bytes) — this only returns lightweight JSON.

import http from 'node:http';
import {
  pickVideoFile,
  getTranscriptCandidate,
  parseSubtitle,
  mergeIntoSentences,
} from './archive-core.mjs';
import { classifyCefr } from './cefr-classifier.mjs';

const PORT = Number(process.env.ARCHIVE_PROXY_PORT) || 8787;
// Lock CORS to your site in production, e.g. ALLOWED_ORIGIN=https://you.github.io
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const cleanText = (s) => String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const downloadUrl = (id, name) => `https://archive.org/download/${id}/${encodeURIComponent(name)}`;

// Archive items are immutable, so cache built lessons in memory (cheap, bounded).
const cache = new Map();
const CACHE_MAX = 200;

async function buildLesson(identifier) {
  const meta = await fetch(`https://archive.org/metadata/${identifier}`).then((r) => r.json());
  if (meta.is_dark || !meta.files || meta.files.length === 0) {
    throw new Error('Item is unavailable (dark or empty).');
  }

  const videoName = pickVideoFile(meta.files);
  if (!videoName) throw new Error('No browser-streamable video file.');

  const sub = getTranscriptCandidate(meta.files);
  let segments = [];
  if (sub) {
    const raw = await fetch(downloadUrl(identifier, sub.filename)).then((r) => r.text());
    segments = mergeIntoSentences(parseSubtitle(raw));
  }

  const md = meta.metadata || {};
  const durationMs = segments.length ? segments[segments.length - 1].endMs : 0;
  // Auto-classify CEFR by vocabulary profiling over the whole transcript.
  const level = segments.length ? classifyCefr(segments.map((s) => s.text).join(' ')) : 'Auto';
  return {
    identifier,
    title: md.title || identifier,
    description: typeof md.description === 'string' ? cleanText(md.description).slice(0, 240) : '',
    videoUrl: downloadUrl(identifier, videoName),
    thumbnailUrl: `https://archive.org/services/img/${identifier}`,
    sourcePageUrl: `https://archive.org/details/${identifier}`,
    durationMs,
    level,
    topic: (Array.isArray(md.subject) ? md.subject[0] : md.subject) || 'Internet Archive',
    sourceCredit: `Source: Internet Archive — ${md.title || identifier}`,
    hasCaptions: segments.length > 0,
    segments, // [{ startMs, endMs, text }]
  };
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=86400',
  });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const match = url.pathname.match(/^\/api\/archive\/lesson\/(.+)$/);
  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, { ok: true });
  }
  if (req.method === 'GET' && match) {
    const identifier = decodeURIComponent(match[1]);
    try {
      let lesson = cache.get(identifier);
      if (!lesson) {
        lesson = await buildLesson(identifier);
        if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
        cache.set(identifier, lesson);
      }
      console.log(`[proxy] ${identifier} → ${lesson.segments.length} segments, captions=${lesson.hasCaptions}`);
      return sendJson(res, 200, lesson);
    } catch (err) {
      console.warn(`[proxy] ${identifier} failed: ${err.message}`);
      return sendJson(res, 502, { error: err.message });
    }
  }
  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`[archive-proxy] listening on http://localhost:${PORT}`);
  console.log(`[archive-proxy] GET /api/archive/lesson/<identifier>`);
});
