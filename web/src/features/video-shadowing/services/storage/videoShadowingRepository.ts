// High-level local repository the UI/hooks talk to. Wraps the IndexedDB stores
// for metadata and the file storage for binaries, and handles cascade cleanup
// when a lesson is deleted (spec §9).

import {
  STORES,
  idbDelete,
  idbGet,
  idbGetAll,
  idbGetAllByIndex,
  idbPut,
} from './indexedDbRepository';
import { fileStorage, filePaths } from './opfsFileStorage';
import type { VideoShadowingLesson } from '../../models/lesson';
import type { VideoTranscriptSegment } from '../../models/segment';
import type { VideoShadowingSession, VideoShadowingAttempt } from '../../models/session';
import type { ProcessingJob } from '../../models/processingJob';

// ── Lessons ───────────────────────────────────────────────────────────────
export const lessonRepo = {
  getAll: () => idbGetAll<VideoShadowingLesson>(STORES.lessons),
  get: (id: string) => idbGet<VideoShadowingLesson>(STORES.lessons, id),
  save: (lesson: VideoShadowingLesson) =>
    idbPut(STORES.lessons, { ...lesson, updatedAt: new Date().toISOString() }),
};

// ── Segments ──────────────────────────────────────────────────────────────
export const segmentRepo = {
  listByLesson: (lessonId: string) =>
    idbGetAllByIndex<VideoTranscriptSegment>(STORES.segments, 'byLesson', lessonId).then((segs) =>
      segs.sort((a, b) => a.orderIndex - b.orderIndex),
    ),
  save: (segment: VideoTranscriptSegment) => idbPut(STORES.segments, segment),
  async replaceForLesson(lessonId: string, segments: VideoTranscriptSegment[]): Promise<void> {
    const existing = await idbGetAllByIndex<VideoTranscriptSegment>(STORES.segments, 'byLesson', lessonId);
    await Promise.all(existing.map((s) => idbDelete(STORES.segments, s.id)));
    await Promise.all(segments.map((s) => idbPut(STORES.segments, s)));
  },
};

// ── Sessions + attempts ─────────────────────────────────────────────────────
export const sessionRepo = {
  get: (id: string) => idbGet<VideoShadowingSession>(STORES.sessions, id),
  listByLesson: (lessonId: string) =>
    idbGetAllByIndex<VideoShadowingSession>(STORES.sessions, 'byLesson', lessonId),
  save: (session: VideoShadowingSession) =>
    idbPut(STORES.sessions, { ...session, updatedAt: new Date().toISOString() }),
};

export const attemptRepo = {
  listBySession: (sessionId: string) =>
    idbGetAllByIndex<VideoShadowingAttempt>(STORES.attempts, 'bySession', sessionId),
  listBySegment: (segmentId: string) =>
    idbGetAllByIndex<VideoShadowingAttempt>(STORES.attempts, 'bySegment', segmentId),
  save: (attempt: VideoShadowingAttempt) => idbPut(STORES.attempts, attempt),
};

// ── Processing jobs ─────────────────────────────────────────────────────────
export const jobRepo = {
  get: (id: string) => idbGet<ProcessingJob>(STORES.jobs, id),
  listByLesson: (lessonId: string) =>
    idbGetAllByIndex<ProcessingJob>(STORES.jobs, 'byLesson', lessonId),
  save: (job: ProcessingJob) => idbPut(STORES.jobs, { ...job, updatedAt: new Date().toISOString() }),
};

// ── Cascade delete (metadata + binaries) ────────────────────────────────────
export async function deleteLessonCompletely(lessonId: string): Promise<void> {
  const sessions = await sessionRepo.listByLesson(lessonId);
  for (const session of sessions) {
    const attempts = await attemptRepo.listBySession(session.id);
    await Promise.all(
      attempts.map(async (a) => {
        await fileStorage.delete(a.userAudioFileId);
        await idbDelete(STORES.attempts, a.id);
      }),
    );
    await idbDelete(STORES.sessions, session.id);
  }

  const segments = await segmentRepo.listByLesson(lessonId);
  await Promise.all(segments.map((s) => idbDelete(STORES.segments, s.id)));

  const jobs = await jobRepo.listByLesson(lessonId);
  await Promise.all(jobs.map((j) => idbDelete(STORES.jobs, j.id)));

  await fileStorage.delete(filePaths.video(lessonId));
  await fileStorage.delete(filePaths.audio(lessonId));
  await fileStorage.delete(filePaths.thumbnail(lessonId));

  await idbDelete(STORES.lessons, lessonId);
}
