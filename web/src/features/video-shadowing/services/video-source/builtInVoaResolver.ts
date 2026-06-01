// Loads the curated VOA manifest and maps it into runtime lessons + segments.
// Only Curated entries are ever exposed (spec §11). No runtime crawling/fetching
// of VOA — everything comes from the static manifest bundled with the app.

import rawManifest from '../../data/built-in-video-lessons.json';
import { normalizeForCompare } from '../../utils/textNormalizer';
import type { VideoShadowingLesson, LessonLevel } from '../../models/lesson';
import type { VideoTranscriptSegment } from '../../models/segment';
import { GRADS, type GradKey } from '../../components/videoThumbStyles';

interface ManifestSegment {
  startMs: number;
  endMs: number;
  text: string;
}

interface ManifestLesson {
  id: string;
  title: string;
  description?: string;
  provider?: string;
  providerItemId?: string;
  sourceUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  durationMs: number;
  level: LessonLevel;
  topic: string;
  accent?: string;
  grad?: string;
  category?: string;
  sourceCredit?: string;
  safetyStatus: 'Curated' | 'UserProvided';
  segments: ManifestSegment[];
}

export interface BuiltInVoaLesson extends VideoShadowingLesson {
  category: string;
  grad: GradKey;
  videoUrl: string;
  segments: VideoTranscriptSegment[];
}

function gradFor(value: string | undefined): GradKey {
  return value && value in GRADS ? (value as GradKey) : 'indigo';
}

// Placeholder, CORS-enabled sample clips so the player works end-to-end until
// real curated VOA direct URLs are added to the manifest (`videoUrl`). Replace
// per-entry by filling `videoUrl` in built-in-video-lessons.json.
// Clips chosen to include an audio track (Big Buck Bunny / Sintel / flower).
const SAMPLE_VIDEOS = [
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://mdn.github.io/shared-assets/videos/flower.mp4',
  'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_2MB.mp4',
];

function toSegments(lessonId: string, segs: ManifestSegment[]): VideoTranscriptSegment[] {
  const now = '1970-01-01T00:00:00.000Z';
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

let cache: BuiltInVoaLesson[] | null = null;

export function getBuiltInVoaLessons(): BuiltInVoaLesson[] {
  if (cache) return cache;
  const manifest = rawManifest as ManifestLesson[];
  cache = manifest
    .filter((m) => m.safetyStatus === 'Curated')
    .map((m, index) => {
      const now = '1970-01-01T00:00:00.000Z';
      const lesson: BuiltInVoaLesson = {
        id: m.id,
        title: m.title,
        description: m.description,
        sourceType: 'BuiltInVoa',
        provider: m.provider ?? 'VOA Learning English',
        providerItemId: m.providerItemId,
        sourceUrl: m.sourceUrl || undefined,
        durationMs: m.durationMs,
        level: m.level,
        topic: m.topic,
        accent: m.accent,
        segmentMode: 'Sentence',
        transcriptSource: 'ProviderScript',
        status: 'Ready',
        processingProgress: 100,
        sourceCredit: m.sourceCredit ?? 'Source: VOA Learning English',
        safetyStatus: 'Curated',
        createdAt: now,
        updatedAt: now,
        category: m.category ?? 'VOA Learning English',
        grad: gradFor(m.grad),
        videoUrl: m.videoUrl || SAMPLE_VIDEOS[index % SAMPLE_VIDEOS.length],
        segments: toSegments(m.id, m.segments),
      };
      return lesson;
    });
  return cache;
}

export function getBuiltInVoaLesson(id: string): BuiltInVoaLesson | undefined {
  return getBuiltInVoaLessons().find((l) => l.id === id);
}

/**
 * Random subset of the curated pool — recomputed on each call so the Library
 * shows a fresh selection every visit (no hard-coded order). Fisher–Yates.
 */
export function getRandomVoaLessons(count = 10): BuiltInVoaLesson[] {
  const pool = [...getBuiltInVoaLessons()];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

export function getVoaCategories(lessons?: BuiltInVoaLesson[]): string[] {
  const set = new Set<string>(['All']);
  for (const l of lessons ?? getBuiltInVoaLessons()) set.add(l.category);
  return [...set];
}
