// Drives a practice session: resolves a lesson + its segments, tracks the active
// segment, scores recordings with the (pluggable) scoring service, and persists
// attempts/session locally.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getBuiltInVoaLesson } from '../services/video-source/builtInVoaResolver';
import {
  lessonRepo,
  segmentRepo,
  sessionRepo,
  attemptRepo,
} from '../services/storage/videoShadowingRepository';
import { fileStorage, filePaths } from '../services/storage/opfsFileStorage';
import { heuristicScoringService } from '../services/scoring/heuristicScoringService';
import type { VideoShadowingLesson } from '../models/lesson';
import type { VideoTranscriptSegment } from '../models/segment';
import type { VideoShadowingSession, VideoShadowingAttempt } from '../models/session';

interface SaveAttemptArgs {
  segment: VideoTranscriptSegment;
  audioBlob: Blob;
  audioDurationMs: number;
  recognizedText: string;
}

interface UseVideoShadowingSession {
  lesson: VideoShadowingLesson | null;
  segments: VideoTranscriptSegment[];
  session: VideoShadowingSession | null;
  attempts: VideoShadowingAttempt[];
  loading: boolean;
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  saveAttempt: (args: SaveAttemptArgs) => Promise<VideoShadowingAttempt>;
  completeSession: () => Promise<void>;
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function useVideoShadowingSession(lessonId: string): UseVideoShadowingSession {
  const [lesson, setLesson] = useState<VideoShadowingLesson | null>(null);
  const [segments, setSegments] = useState<VideoTranscriptSegment[]>([]);
  const [session, setSession] = useState<VideoShadowingSession | null>(null);
  const [attempts, setAttempts] = useState<VideoShadowingAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      // VOA lessons come from the static manifest; user lessons from IndexedDB.
      const voa = getBuiltInVoaLesson(lessonId);
      let resolvedLesson: VideoShadowingLesson | null;
      let resolvedSegments: VideoTranscriptSegment[];

      if (voa) {
        resolvedLesson = voa;
        resolvedSegments = voa.segments;
      } else {
        resolvedLesson = (await lessonRepo.get(lessonId)) ?? null;
        resolvedSegments = await segmentRepo.listByLesson(lessonId);
      }

      const now = new Date().toISOString();
      const newSession: VideoShadowingSession = {
        id: uid(),
        lessonId,
        startedAt: now,
        status: 'InProgress',
        practiceDurationMs: 0,
        createdAt: now,
        updatedAt: now,
      };
      await sessionRepo.save(newSession);

      if (!cancelled) {
        setLesson(resolvedLesson);
        setSegments(resolvedSegments);
        setSession(newSession);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const saveAttempt = useCallback(
    async ({ segment, audioBlob, audioDurationMs, recognizedText }: SaveAttemptArgs) => {
      if (!session) throw new Error('No active session');
      const prior = attempts.filter((a) => a.segmentId === segment.id).length;
      const attemptId = uid();
      const fileId = filePaths.attempt(lessonId, session.id, segment.id, attemptId);
      await fileStorage.put(fileId, audioBlob);

      const score = await heuristicScoringService.scoreAttempt({
        referenceText: segment.text,
        recognizedText,
        attemptDurationMs: audioDurationMs,
        segmentDurationMs: segment.durationMs,
      });

      const attempt: VideoShadowingAttempt = {
        id: attemptId,
        sessionId: session.id,
        segmentId: segment.id,
        attemptNumber: prior + 1,
        userAudioFileId: fileId,
        recognizedText,
        pronunciationScore: score.pronunciationScore,
        fluencyScore: score.fluencyScore,
        rhythmScore: score.rhythmScore,
        completionScore: score.completionScore,
        totalScore: score.totalScore,
        missingWords: score.missingWords,
        mispronouncedWords: score.mispronouncedWords,
        extraWords: score.extraWords,
        feedback: score.feedback,
        audioDurationMs,
        createdAt: new Date().toISOString(),
      };
      await attemptRepo.save(attempt);
      setAttempts((prev) => [...prev, attempt]);
      return attempt;
    },
    [session, attempts, lessonId],
  );

  const completeSession = useCallback(async () => {
    if (!session) return;
    const scored = attempts.filter((a) => a.totalScore != null);
    const avg = (pick: (a: VideoShadowingAttempt) => number | undefined) =>
      scored.length ? Math.round(scored.reduce((n, a) => n + (pick(a) ?? 0), 0) / scored.length) : undefined;

    const completed: VideoShadowingSession = {
      ...session,
      status: 'Completed',
      completedAt: new Date().toISOString(),
      totalScore: avg((a) => a.totalScore),
      pronunciationScore: avg((a) => a.pronunciationScore),
      fluencyScore: avg((a) => a.fluencyScore),
      rhythmScore: avg((a) => a.rhythmScore),
      completionScore: avg((a) => a.completionScore),
    };
    await sessionRepo.save(completed);
    setSession(completed);
  }, [session, attempts]);

  const value = useMemo(
    () => ({
      lesson,
      segments,
      session,
      attempts,
      loading,
      activeIndex,
      setActiveIndex,
      saveAttempt,
      completeSession,
    }),
    [lesson, segments, session, attempts, loading, activeIndex, saveAttempt, completeSession],
  );
  return value;
}
