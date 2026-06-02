import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { cn } from '../../../components/classNames';
import type { ShadowingLesson } from '../types/shadowing.types';
import { mockShadowingLesson } from '../data/mockShadowingData';
import { useShadowingSession } from '../hooks/useShadowingSession';
import { ShadowingSessionSummaryBar } from './ShadowingSessionSummaryBar';
import { ShadowingSegmentCard } from './ShadowingSegmentCard';
import { ShadowingProgressSidebar } from './ShadowingProgressSidebar';
import { ShadowingSessionResultPanel } from './ShadowingSessionResultPanel';
import { useSettings } from '../../../components/useSettings';
import { useVoiceReader } from '../../voice-reader/useVoiceReader';

const LEVEL_BADGE: Record<string, string> = {
  beginner:
    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  intermediate:
    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  advanced:
    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

export default function ShadowingPracticePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useSettings();

  // Lesson can be passed via router state, otherwise use mock
  const lesson: ShadowingLesson =
    (location.state as { lesson?: ShadowingLesson })?.lesson ??
    mockShadowingLesson;

  const {
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
  } = useShadowingSession(lesson, settings);

  const [showResultPanel, setShowResultPanel] = useState(false);
  const [isLoadingResult, setIsLoadingResult] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);

  const segmentCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const voiceReader = useVoiceReader({ exerciseId: `shadowing-${lesson.id ?? lesson.title}` });
  const shadowingOptions = useMemo(
    () => ({
      mode: 'shadowing' as const,
      gapMs: settings.userAudioSettings.shadowingGapMs,
      repeatEachLine: settings.userAudioSettings.repeatEachLine,
    }),
    [settings.userAudioSettings.repeatEachLine, settings.userAudioSettings.shadowingGapMs]
  );

  const handleSegmentClick = useCallback((segmentId: string) => {
    const el = segmentCardRefs.current[segmentId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const handleViewResult = useCallback(async () => {
    setResultError(null);
    setShowResultPanel(true);
    if (!sessionResult) {
      setIsLoadingResult(true);
      try {
        await loadSessionResult();
      } catch {
        setResultError('Failed to load results. Please try again.');
      } finally {
        setIsLoadingResult(false);
      }
    }
  }, [sessionResult, loadSessionResult]);

  const handleSubmitAttempt = useCallback(
    async (
      segmentId: string,
      audioBlob: Blob,
      originalText: string,
      recognizedText: string,
      audioDurationMs?: number
    ) => {
      await submitAttempt(
        segmentId,
        audioBlob,
        originalText,
        recognizedText,
        audioDurationMs
      );
    },
    [submitAttempt]
  );

  // ── Loading / Error states ────────────────────────────────────────────────

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Starting session…</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-slate-600 dark:text-slate-400">{initError}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 rounded-2xl bg-indigo-500 text-white font-semibold text-sm hover:bg-indigo-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // ── Main layout ───────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] animate-in slide-in-from-bottom-6 duration-500">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 mb-4 shrink-0 px-1">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />

          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
            <h1 className="font-bold text-base text-slate-800 dark:text-slate-100 truncate">
              {lesson.title}
            </h1>
          </div>

          <span
            className={cn(
              'hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize shrink-0',
              LEVEL_BADGE[lesson.level] ?? LEVEL_BADGE.intermediate
            )}
          >
            {lesson.level}
          </span>
        </div>

        {session && (
          <div className="text-xs text-slate-400 shrink-0 hidden md:block">
            Session {session.id.slice(-6).toUpperCase()}
          </div>
        )}
      </div>

      {/* ── Summary Bar ── */}
      <div className="relative shrink-0 mb-4">
        <ShadowingSessionSummaryBar
          segments={segments}
          onViewResult={handleViewResult}
        />
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex gap-4 min-h-0">

        {/* Script Panel — scrollable */}
        <div className="flex-1 overflow-y-auto no-scrollbar pr-1 space-y-4 min-w-0">
          {segments.length === 0 && !isInitializing && (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin opacity-40" />
              <p className="text-sm">Loading segments…</p>
            </div>
          )}

          {segments.map(segment => {
            const isLocked =
              analyzingSegmentId !== null && analyzingSegmentId !== segment.id;

            return (
              <ShadowingSegmentCard
                key={segment.id}
                ref={el => {
                  segmentCardRefs.current[segment.id] = el;
                }}
                segment={segment}
                isLocked={isLocked}
                isAnalyzing={analyzingSegmentId === segment.id}
                onStartPracticing={startPracticing}
                onSubmitAttempt={handleSubmitAttempt}
                onRetry={retrySegment}
                activeVoiceSegmentId={voiceReader.activeSegmentId}
                canUseVoiceReader={voiceReader.canPlayAudio}
                onReadSentence={(sentenceId, text) =>
                  voiceReader.speakSegments([{ id: sentenceId, text }], shadowingOptions)
                }
              />
            );
          })}

          {/* Bottom padding so last card isn't hidden by layout */}
          <div className="h-6" />
        </div>

        {/* Progress Sidebar — right side, hidden on small screens */}
        <div className="hidden lg:block w-64 shrink-0 overflow-y-auto no-scrollbar">
          <ShadowingProgressSidebar
            segments={segments}
            activeSegmentId={activeSegmentId}
            analyzingSegmentId={analyzingSegmentId}
            onSegmentClick={handleSegmentClick}
            className="h-full"
          />
        </div>
      </div>

      {/* ── Result Error Toast ── */}
      {resultError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-500 text-white text-sm font-medium shadow-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {resultError}
        </div>
      )}

      {/* ── Session Result Panel ── */}
      <ShadowingSessionResultPanel
        isVisible={showResultPanel}
        result={sessionResult}
        segments={segments}
        isLoading={isLoadingResult}
        onClose={() => setShowResultPanel(false)}
      />
    </div>
  );
}
