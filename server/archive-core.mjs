// Pure, dependency-free Internet Archive parsing helpers, shared by both the
// build-time curate script (web/scripts/curate-archive-lessons.mjs) and the
// runtime proxy (server/archive-proxy.mjs) so live + curated lessons are
// segmented identically. No Node/DOM APIs here — just string crunching.

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

// Subtitle priority ladder: align > en.vtt > en.srt > vtt > cc5 > asr > srt.
// Returns { filename, type, priority } or null.
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

// "HH:MM:SS,mmm" | "HH:MM:SS.mmm" | "MM:SS.mmm" → milliseconds.
export function clockToMs(clock) {
  const norm = clock.trim().replace(',', '.');
  const parts = norm.split(':').map(Number);
  const [h, m, s] = parts.length === 3 ? parts : [0, parts[0], parts[1]];
  return Math.round((h * 3600 + m * 60 + s) * 1000);
}

const TAGS = /<[^>]+>/g;
const cleanCue = (s) => s.replace(TAGS, '').replace(/\s+/g, ' ').trim();
const TIMECODE = /(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{1,3})/;

// Parse a SubRip (.srt) or WebVTT (.vtt) cue list into { startMs, endMs, text }.
// Both formats share the "start --> end" cue line; the differences we care about
// (header line, comma vs dot ms) are handled by the shared logic.
export function parseSubtitle(raw) {
  const body = raw.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const blocks = body.split(/\n{2,}/);
  const cues = [];
  for (const block of blocks) {
    const lines = block.split('\n');
    const tcIndex = lines.findIndex((l) => TIMECODE.test(l));
    if (tcIndex === -1) continue;
    const m = TIMECODE.exec(lines[tcIndex]);
    const text = cleanCue(lines.slice(tcIndex + 1).join(' '));
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
