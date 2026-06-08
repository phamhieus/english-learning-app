// Cloudflare Worker port of server/archive-proxy.mjs.
//
// Why this exists: archive.org's search + metadata APIs are CORS-enabled (the
// browser calls them directly), but the /download files — including subtitle
// tracks — are NOT. So the browser cannot fetch + parse captions to build
// per-segment shadowing for an arbitrary live item. This Worker does that one
// CORS-blocked step at the edge: given an identifier it fetches the metadata,
// picks the best video + subtitle, parses the captions into timed segments, and
// returns a ready-to-shadow lesson as JSON. The video itself still streams
// straight from archive.org to the browser — this only returns lightweight JSON.
//
// It reuses the exact pure helpers the Node proxy and the build-time curate
// script use (archive-core.mjs, cefr-core.mjs), so live + curated lessons are
// segmented and levelled identically.
//
//   Local dev:  npm run proxy:dev      (wrangler dev, defaults to :8787)
//   Deploy:     npm run proxy:deploy    (wrangler deploy)
//
// Routes:
//   GET /health                          → { ok: true }
//   GET /api/archive/lesson/<identifier> → ProxyLesson JSON

import {
  pickVideoFile,
  getTranscriptCandidate,
  parseSubtitle,
  mergeIntoSentences,
} from './archive-core.mjs';
import { classifyCefr } from './cefr-core.mjs';
import WORDLIST from './cefr-wordlist.json';

const cleanText = (s) => String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const downloadUrl = (id, name) => `https://archive.org/download/${id}/${encodeURIComponent(name)}`;

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
  const level = segments.length ? classifyCefr(segments.map((s) => s.text).join(' '), WORDLIST) : 'Auto';
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

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
      ...corsHeaders(origin),
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    // Lock this to your site in production, e.g.
    // ALLOWED_ORIGIN=https://phamhieus.github.io (set as a Worker var/secret).
    const allowOrigin = env.ALLOWED_ORIGIN || '*';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(allowOrigin) });
    }

    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true }, 200, allowOrigin);
    }

    const match = url.pathname.match(/^\/api\/archive\/lesson\/(.+)$/);
    if (request.method === 'GET' && match) {
      const identifier = decodeURIComponent(match[1]);

      // Archive items are immutable, so cache built lessons at the edge. Key by a
      // stable same-origin URL (no request headers) so the cache isn't fragmented.
      const cache = caches.default;
      const cacheKey = new Request(`${url.origin}/api/archive/lesson/${encodeURIComponent(identifier)}`);
      const cached = await cache.match(cacheKey);
      if (cached) {
        const res = new Response(cached.body, cached);
        res.headers.set('Access-Control-Allow-Origin', allowOrigin);
        return res;
      }

      try {
        const lesson = await buildLesson(identifier);
        const res = json(lesson, 200, allowOrigin);
        ctx.waitUntil(cache.put(cacheKey, res.clone()));
        return res;
      } catch (err) {
        return json({ error: err.message }, 502, allowOrigin);
      }
    }

    return json({ error: 'Not found' }, 404, allowOrigin);
  },
};
