import { useCallback, useEffect, useState } from 'react';
import type {
  ShadowingAttempt,
  ShadowingLesson,
  ShadowingSegment,
  ShadowingSegmentStatus,
  ShadowingSession,
  ShadowingSessionResult,
} from '../types/shadowing.types';
import { shadowingApi } from '../services/shadowingApi';
import type { AppSettings } from '../../../components/settings-context';

interface UseShadowingSessionReturn {
  session: ShadowingSession | null;
  segments: ShadowingSegment[];
  activeSegmentId: string | null;
  analyzingSegmentId: string | null;
  sessionResult: ShadowingSessionResult | null;
  isInitializing: boolean;
  initError: string | null;
  startPracticing: (segmentId: string) => void;
  submitAttempt: (
    segmentId: string,
    audioBlob: Blob,
    originalText: string,
    recognizedText: string,
    audioDurationMs?: number
  ) => Promise<ShadowingAttempt | undefined>;
  retrySegment: (segmentId: string) => void;
  loadSessionResult: () => Promise<void>;
  clearSessionResult: () => void;
}

export function useShadowingSession(
  lesson: ShadowingLesson | null,
  settings?: AppSettings
): UseShadowingSessionReturn {
  const [session, setSession] = useState<ShadowingSession | null>(null);
  const [segments, setSegments] = useState<ShadowingSegment[]>([]);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [analyzingSegmentId, setAnalyzingSegmentId] = useState<string | null>(null);
  const [sessionResult, setSessionResult] = useState<ShadowingSessionResult | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Auto-initialize session when lesson is set
  useEffect(() => {
    if (!lesson) return;

    let cancelled = false;
    setIsInitializing(true);
    setInitError(null);

    shadowingApi
      .createShadowingSession(lesson.id)
      .then(newSession => {
        if (cancelled) return;
        setSession(newSession);
        setSegments(
          lesson.segments.map(s => ({
            ...s,
            status: 'not_started' as ShadowingSegmentStatus,
            attempts: [],
            latestAttempt: undefined,
          }))
        );
      })
      .catch(() => {
        if (cancelled) return;
        setInitError('Failed to start session. Please refresh and try again.');
      })
      .finally(() => {
        if (!cancelled) setIsInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lesson?.id]);

  const startPracticing = useCallback((segmentId: string) => {
    setActiveSegmentId(segmentId);
    setSegments(prev =>
      prev.map(s =>
        s.id === segmentId ? { ...s, status: 'practicing' } : s
      )
    );
  }, []);

  const submitAttempt = useCallback(
    async (
      segmentId: string,
      audioBlob: Blob,
      originalText: string,
      recognizedText: string,
      audioDurationMs?: number
    ): Promise<ShadowingAttempt | undefined> => {
      if (!session || !lesson) return undefined;

      setAnalyzingSegmentId(segmentId);
      try {
        const attempt = await shadowingApi.analyzeShadowingSegment({
          sessionId: session.id,
          segmentId,
          audioBlob,
          audioDurationMs,
          originalText,
          recognizedText,
          lessonId: lesson.id,
          settings,
        });

        setSegments(prev =>
          prev.map(s => {
            if (s.id !== segmentId) return s;
            const newStatus: ShadowingSegmentStatus =
              attempt.finalScore >= 70 ? 'completed' : 'need_retry';
            return {
              ...s,
              status: newStatus,
              latestAttempt: attempt,
              attempts: [...s.attempts, attempt],
            };
          })
        );

        // Invalidate cached session result
        setSessionResult(null);

        return attempt;
      } catch {
        setSegments(prev =>
          prev.map(s =>
            s.id === segmentId ? { ...s, status: 'need_retry' } : s
          )
        );
        throw new Error('Analysis failed. Please try again.');
      } finally {
        // Always clear active/analyzing state so other segments stay unlocked
        setAnalyzingSegmentId(null);
        setActiveSegmentId(null);
      }
    },
    [session, lesson, settings]
  );

  const retrySegment = useCallback((segmentId: string) => {
    setActiveSegmentId(segmentId);
    setSegments(prev =>
      prev.map(s =>
        s.id === segmentId ? { ...s, status: 'practicing', latestAttempt: undefined } : s
      )
    );
  }, []);

  const loadSessionResult = useCallback(async () => {
    if (!session) return;
    try {
      const result = await shadowingApi.getShadowingSessionResult(
        session.id,
        segments
      );
      setSessionResult(result);
    } catch {
      throw new Error('Failed to load session result.');
    }
  }, [session, segments]);

  const clearSessionResult = useCallback(() => {
    setSessionResult(null);
  }, []);

  return {
    session,
    segments,
    activeSegmentId,
    analyzingSegmentId,
    sessionResult,
    isInitializing,
    initError,
    startPracticing,
    submitAttempt,
    retrySegment,
    loadSessionResult,
    clearSessionResult,
  };
}
