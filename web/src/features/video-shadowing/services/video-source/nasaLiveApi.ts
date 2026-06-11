// Live NASA Image and Video Library — queried directly from the browser.
//
// Unlike the Internet Archive flow, NO helper service is needed: both
// images-api.nasa.gov (search / asset / captions) and images-assets.nasa.gov
// (media + caption files) send `Access-Control-Allow-Origin: *`, so searching,
// caption fetching/parsing and video streaming all run browser-side — this
// source works even on static hosting where the Archive proxy isn't available.
// NASA media is generally public domain (NASA does not copyright its works).
//
// The resulting lesson is persisted into the same local stores curated/uploaded
// lessons use, so the existing practice/session/scoring pipeline runs unchanged.

import { classifyCefr, type CefrLevel } from '../../utils/cefr';
import { parseSrt } from '../../utils/srtParser';
import { parseVtt } from '../../utils/vttParser';
import type { ParsedCue } from '../../utils/subtitleParser';
import { normalizeForCompare } from '../../utils/textNormalizer';
import { lessonRepo, segmentRepo } from '../storage/videoShadowingRepository';
import type { VideoShadowingLesson } from '../../models/lesson';
import type { VideoTranscriptSegment } from '../../models/segment';

const API_BASE = 'https://images-api.nasa.gov';

// Default landing queries — neutral, modern NASA topics that tend to have
// clear narration (better shadowing audio than 1960s mission footage).
const DEFAULT_QUERIES = [
  'Artemis moon mission',
  'space station science',
  'Mars rover discovery',
  'James Webb telescope',
  'astronaut training',
  'earth from space',
];

const NON_SPEECH_CUE = /\b(music|applause|laughter|laughing|cheering|inaudible|silence|sound|noise|ambient)\b/i;
const WORD_RE = /[\p{L}\p{N}][\p{L}\p{N}'-]*/gu;

export class NasaApiError extends Error {}

export interface NasaLibraryItem {
  nasaId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  topic?: string;
  /** Verified caption track (.srt/.vtt) — every listed item has one. */
  captionUrl: string;
  /** Quick CEFR estimate from title + description (refined from the full
   *  transcript when the lesson is opened). 'Auto' = unknown. */
  level: CefrLevel | 'Auto';
}

interface NasaSearchItem {
  data?: { nasa_id?: string; title?: string; description?: string; keywords?: string[] }[];
  links?: { href?: string; rel?: string }[];
}

// The API returns asset hrefs as plain-http with raw spaces; normalize to
// https + percent-encoded so they work as fetch / <video> / <img> URLs.
function normalizeAssetUrl(href: string): string {
  const u = new URL(href);
  u.protocol = 'https:';
  return u.href;
}

function speechText(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[♪♫]+/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isSpeechCue(cue: ParsedCue): boolean {
  const raw = cue.text.trim();
  const text = speechText(raw);
  if (!text) return false;
  if (NON_SPEECH_CUE.test(raw) && !/[a-z]{3,}\s+[a-z]{3,}/i.test(text)) return false;
  return (text.match(WORD_RE) ?? []).length >= 2;
}

function hasVoiceCaptions(content: string): boolean {
  const cues = parseCaption(content);
  const speechCues = cues.filter(isSpeechCue);
  const wordCount = speechCues.reduce((sum, cue) => sum + (speechText(cue.text).match(WORD_RE) ?? []).length, 0);
  return speechCues.length >= 2 && wordCount >= 8;
}

function voiceCues(cues: ParsedCue[]): ParsedCue[] {
  return cues
    .map((cue) => ({ ...cue, text: speechText(cue.text) }))
    .filter(isSpeechCue);
}

// `/captions/{id}` always answers 200 with a *guessed* file location, so the
// file itself must be downloaded before an item can be listed as shadowable.
// We also require spoken caption content, not just music / ambient cues.
// (Missing files 403 without CORS headers, which surfaces as a fetch error.)
async function probeCaptionUrl(nasaId: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/captions/${encodeURIComponent(nasaId)}`, { signal });
    if (!res.ok) return null;
    const { location } = (await res.json()) as { location?: string };
    if (!location) return null;
    const url = normalizeAssetUrl(location);
    const caption = await fetch(url, { signal });
    if (!caption.ok) return null;
    return hasVoiceCaptions(await caption.text()) ? url : null;
  } catch (err) {
    if (signal?.aborted) throw err;
    return null;
  }
}

/** Search NASA's video library live. Empty query → a rotating safe default.
 *  Only items with a verified caption track are returned (captions are what
 *  make an item shadowable — same guarantee the Archive tab gives via its
 *  `format:(SubRip)` filter). */
export async function searchNasaItems(
  query: string,
  limit = 30,
  signal?: AbortSignal,
): Promise<NasaLibraryItem[]> {
  const q = query.trim() || DEFAULT_QUERIES[Math.floor(Math.random() * DEFAULT_QUERIES.length)];
  const params = new URLSearchParams({ q, media_type: 'video', page_size: String(limit) });

  const res = await fetch(`${API_BASE}/search?${params.toString()}`, { signal });
  if (!res.ok) throw new NasaApiError(`NASA search failed (${res.status})`);
  const data = (await res.json()) as { collection?: { items?: NasaSearchItem[] } };

  const candidates = (data.collection?.items ?? []).flatMap((item) => {
    const d = item.data?.[0];
    if (!d?.nasa_id) return [];
    const title = d.title?.trim() || d.nasa_id;
    const thumb = item.links?.find((l) => l.rel === 'preview' && l.href)?.href;
    return [{
      nasaId: d.nasa_id,
      title,
      description: d.description,
      thumbnailUrl: thumb ? normalizeAssetUrl(thumb) : undefined,
      topic: d.keywords?.[0],
      level: classifyCefr(`${title}. ${d.description ?? ''}`),
    }];
  });

  // Probe caption availability + spoken content in parallel; items without
  // voice captions are dropped rather than failing on click.
  const captionUrls = await Promise.all(candidates.map((c) => probeCaptionUrl(c.nasaId, signal)));
  return candidates.flatMap((c, i) => {
    const captionUrl = captionUrls[i];
    return captionUrl ? [{ ...c, captionUrl }] : [];
  });
}

function parseCaption(content: string): ParsedCue[] {
  if (/^WEBVTT/.test(content.trim())) return parseVtt(content);
  try {
    return parseSrt(content);
  } catch {
    return parseVtt(content);
  }
}

// Merge raw caption cues into sentence-ish segments — same rules as the curate
// script / Archive proxy (`server/archive-core.mjs`), so NASA lessons are
// segmented identically to Archive ones.
function mergeIntoSentences(cues: ParsedCue[], maxMs = 7000, maxChars = 140): ParsedCue[] {
  const out: ParsedCue[] = [];
  let cur: ParsedCue | null = null;
  for (const cue of cues) {
    if (!cur) {
      cur = { ...cue };
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

// mp4 rendition ladder: medium is the streaming sweet spot (~480p); orig can
// be hundreds of MB and stalls playback.
const VIDEO_PRIORITY = ['~medium.mp4', '~small.mp4', '~large.mp4', '~mobile.mp4', '~orig.mp4'];

async function resolveVideoUrl(nasaId: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(`${API_BASE}/asset/${encodeURIComponent(nasaId)}`, { signal });
  if (!res.ok) throw new NasaApiError(`NASA asset lookup failed (${res.status}).`);
  const data = (await res.json()) as { collection?: { items?: { href?: string }[] } };
  const hrefs = (data.collection?.items ?? []).map((i) => i.href ?? '');

  for (const suffix of VIDEO_PRIORITY) {
    const hit = hrefs.find((h) => h.toLowerCase().endsWith(suffix));
    if (hit) return normalizeAssetUrl(hit);
  }
  const anyMp4 = hrefs.find((h) => h.toLowerCase().endsWith('.mp4'));
  if (anyMp4) return normalizeAssetUrl(anyMp4);
  throw new NasaApiError('This NASA item has no streamable MP4 video.');
}

function toSegments(lessonId: string, cues: ParsedCue[]): VideoTranscriptSegment[] {
  const now = new Date().toISOString();
  return cues.map((c, i) => ({
    id: `${lessonId}-seg-${i}`,
    lessonId,
    orderIndex: i,
    startMs: c.startMs,
    endMs: c.endMs,
    durationMs: c.endMs - c.startMs,
    text: c.text,
    normalizedText: normalizeForCompare(c.text),
    isEdited: false,
    createdAt: now,
    updatedAt: now,
  }));
}

export interface PreparedNasaLesson {
  lessonId: string;
}

// Resolve a NASA item fully in the browser (video URL + parsed captions),
// persist it locally, and return its lesson id so the caller can navigate
// straight into the practice screen.
export async function prepareNasaLesson(
  item: NasaLibraryItem,
  signal?: AbortSignal,
): Promise<PreparedNasaLesson> {
  const [videoUrl, captionText] = await Promise.all([
    resolveVideoUrl(item.nasaId, signal),
    fetch(item.captionUrl, { signal }).then((r) => {
      if (!r.ok) throw new NasaApiError('Could not download the caption track.');
      return r.text();
    }),
  ]);

  const sentences = mergeIntoSentences(voiceCues(parseCaption(captionText)));
  if (sentences.length === 0) {
    throw new NasaApiError('This NASA item has no spoken captions, so it can’t be used for shadowing.');
  }

  const lessonId = `nasa-${item.nasaId}`;
  const now = new Date().toISOString();
  // Refine the CEFR estimate by profiling the whole transcript.
  const transcript = sentences.map((s) => s.text).join(' ');
  const lesson: VideoShadowingLesson = {
    id: lessonId,
    title: item.title,
    description: item.description?.slice(0, 240) || undefined,
    // 'BuiltInVoa' keeps it out of the "My Videos" tab; the session resolves it
    // from local storage (it isn't in the static manifest) and the practice
    // page streams it via sourceUrl — same trick as live Archive lessons.
    sourceType: 'BuiltInVoa',
    provider: 'NASA',
    providerItemId: item.nasaId,
    sourceUrl: videoUrl,
    durationMs: sentences[sentences.length - 1].endMs,
    level: classifyCefr(transcript),
    topic: item.topic || 'NASA',
    accent: 'US',
    segmentMode: 'Sentence',
    transcriptSource: 'ProviderScript',
    status: 'Ready',
    processingProgress: 100,
    sourceCredit: `Source: NASA Image and Video Library — ${item.title}`,
    safetyStatus: 'Curated',
    createdAt: now,
    updatedAt: now,
  };

  await lessonRepo.save(lesson);
  await segmentRepo.replaceForLesson(lessonId, toSegments(lessonId, sentences));
  return { lessonId };
}
