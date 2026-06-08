// Talks to the local Archive proxy (server/archive-proxy.mjs) to turn a live
// Internet Archive identifier into a ready-to-shadow lesson: the proxy does the
// one CORS-blocked step (fetch + parse the caption track) and returns timed
// segments; the video itself still streams straight from archive.org.
//
// The resulting lesson is persisted into the same local stores curated/uploaded
// lessons use, so the existing practice/session/scoring pipeline runs unchanged.

import { lessonRepo, segmentRepo } from '../storage/videoShadowingRepository';
import { normalizeForCompare } from '../../utils/textNormalizer';
import type { VideoShadowingLesson, LessonLevel } from '../../models/lesson';
import type { VideoTranscriptSegment } from '../../models/segment';

const PROXY_BASE =
  (import.meta.env.VITE_ARCHIVE_PROXY as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8787';

interface ProxySegment {
  startMs: number;
  endMs: number;
  text: string;
}

interface ProxyLesson {
  identifier: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  sourcePageUrl: string;
  durationMs: number;
  level: LessonLevel;
  topic: string;
  sourceCredit: string;
  hasCaptions: boolean;
  segments: ProxySegment[];
}

export class ArchiveProxyError extends Error {}

/** Returns true if the local Archive proxy service is reachable. */
export async function checkProxyAvailable(): Promise<boolean> {
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 3000);
    const res = await fetch(`${PROXY_BASE}/health`, { signal: ac.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchArchiveLesson(identifier: string, signal?: AbortSignal): Promise<ProxyLesson> {
  let res: Response;
  try {
    res = await fetch(`${PROXY_BASE}/api/archive/lesson/${encodeURIComponent(identifier)}`, { signal });
  } catch {
    throw new ArchiveProxyError(
      'Cannot reach the Archive helper service. Start it with `npm run proxy` (or set VITE_ARCHIVE_PROXY).',
    );
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new ArchiveProxyError(body?.error || `Archive helper returned ${res.status}.`);
  }
  return (await res.json()) as ProxyLesson;
}

function toSegments(lessonId: string, segs: ProxySegment[]): VideoTranscriptSegment[] {
  const now = new Date().toISOString();
  return segs.map((s, i) => ({
    id: `${lessonId}-seg-${i}`,
    lessonId,
    orderIndex: i,
    startMs: s.startMs,
    endMs: s.endMs,
    durationMs: s.endMs - s.startMs,
    text: s.text,
    normalizedText: normalizeForCompare(s.text),
    isEdited: false,
    createdAt: now,
    updatedAt: now,
  }));
}

export interface PreparedArchiveLesson {
  lessonId: string;
  hasCaptions: boolean;
}

// Fetch a live item via the proxy, persist it locally, and return its lesson id
// so the caller can navigate straight into the practice screen.
export async function prepareArchiveLesson(
  identifier: string,
  signal?: AbortSignal,
): Promise<PreparedArchiveLesson> {
  const data = await fetchArchiveLesson(identifier, signal);
  if (!data.hasCaptions || data.segments.length === 0) {
    throw new ArchiveProxyError('This item has no caption track, so it can’t be split into shadowing segments.');
  }

  const lessonId = `archive-${data.identifier}`;
  const now = new Date().toISOString();
  const lesson: VideoShadowingLesson = {
    id: lessonId,
    title: data.title,
    description: data.description || undefined,
    // 'BuiltInVoa' keeps it out of the "My Videos" tab; the session resolves it
    // from local storage (it isn't in the static manifest) and the practice page
    // streams it via sourceUrl.
    sourceType: 'BuiltInVoa',
    provider: 'Internet Archive',
    providerItemId: data.identifier,
    sourceUrl: data.videoUrl,
    durationMs: data.durationMs,
    level: data.level,
    topic: data.topic,
    accent: 'US',
    segmentMode: 'Sentence',
    transcriptSource: 'ProviderScript',
    status: 'Ready',
    processingProgress: 100,
    sourceCredit: data.sourceCredit,
    safetyStatus: 'Curated',
    createdAt: now,
    updatedAt: now,
  };

  await lessonRepo.save(lesson);
  await segmentRepo.replaceForLesson(lessonId, toSegments(lessonId, data.segments));
  return { lessonId, hasCaptions: true };
}
