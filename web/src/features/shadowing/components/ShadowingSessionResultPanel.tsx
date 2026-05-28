import React, { useEffect, useRef } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Mic,
  Star,
  Trophy,
  X,
} from 'lucide-react';
import { cn } from '../../../components/classNames';
import type {
  ShadowingSegment,
  ShadowingSessionResult,
} from '../types/shadowing.types';
import { AudioPlayback } from './AudioPlayback';

// ─── Score Circle ────────────────────────────────────────────────────────────

const ScoreCircle: React.FC<{ score: number; size?: 'sm' | 'lg' }> = ({
  score,
  size = 'lg',
}) => {
  const radius = size === 'lg' ? 36 : 22;
  const stroke = size === 'lg' ? 5 : 3.5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const dim = (radius + stroke) * 2;

  const color =
    score >= 80
      ? '#22c55e'
      : score >= 65
        ? '#f59e0b'
        : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={dim} height={dim} className="-rotate-90">
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-200 dark:text-slate-700"
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <span
        className={cn(
          'absolute font-bold tabular-nums',
          size === 'lg' ? 'text-2xl' : 'text-sm'
        )}
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
};

// ─── Score Bar ───────────────────────────────────────────────────────────────

const ScoreBar: React.FC<{ label: string; value: number }> = ({
  label,
  value,
}) => {
  const color =
    value >= 80 ? 'bg-green-500' : value >= 65 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 dark:text-slate-400 w-32 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums w-7 text-right text-slate-700 dark:text-slate-300">
        {value}
      </span>
    </div>
  );
};

// ─── Main Panel ──────────────────────────────────────────────────────────────

interface ShadowingSessionResultPanelProps {
  isVisible: boolean;
  result: ShadowingSessionResult | null;
  segments: ShadowingSegment[];
  isLoading: boolean;
  onClose: () => void;
}

export const ShadowingSessionResultPanel: React.FC<
  ShadowingSessionResultPanelProps
> = ({ isVisible, result, segments, isLoading, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isVisible, onClose]);

  const segmentMap = new Map(segments.map(s => [s.id, s]));

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/40 backdrop-blur-sm z-30 transition-opacity duration-300',
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'fixed top-0 right-0 h-full w-full sm:w-[420px] lg:w-[480px] z-40',
          'bg-[var(--card)] border-l border-[var(--border)]',
          'flex flex-col shadow-2xl',
          'transition-transform duration-400 ease-out',
          isVisible ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[var(--foreground)]">
                Session Result
              </h2>
              {result && (
                <p className="text-xs text-slate-400">
                  {result.completedSegments}/{result.totalSegments} segments
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Computing your results…</p>
            </div>
          )}

          {!isLoading && !result && (
            <div className="text-center py-12 text-slate-400">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                No results yet. Complete some segments first.
              </p>
            </div>
          )}

          {result && !isLoading && (
            <>
              {/* Overall Score */}
              <div className="flex flex-col items-center gap-2 py-2">
                <ScoreCircle score={result.overallScore} size="lg" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Overall Score
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    {result.completedSegments} done
                  </span>
                  {result.weakSegments.length > 0 && (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      {result.weakSegments.length} need retry
                    </span>
                  )}
                </div>
              </div>

              {/* Score Breakdown */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                  Score Breakdown
                </h3>
                <div className="space-y-2.5">
                  <ScoreBar
                    label="Pronunciation"
                    value={result.averagePronunciationScore}
                  />
                  <ScoreBar
                    label="Completeness"
                    value={result.averageCompletenessScore}
                  />
                  <ScoreBar label="Fluency" value={result.averageFluencyScore} />
                  <ScoreBar label="Rhythm" value={result.averageRhythmScore} />
                  <ScoreBar
                    label="Intonation"
                    value={result.averageIntonationScore}
                  />
                </div>
              </section>

              {/* AI Summary */}
              <section className="flex gap-3 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900">
                <MessageSquare className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
                  {result.aiSummaryFeedback}
                </p>
              </section>

              {/* Best Segments */}
              {result.bestSegments.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    Best Segments
                  </h3>
                  <div className="space-y-2">
                    {result.bestSegments.map(seg => (
                      <div
                        key={seg.segmentId}
                        className="flex items-start gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/40"
                      >
                        <span className="text-xs font-bold text-green-600 dark:text-green-400 tabular-nums shrink-0 mt-0.5">
                          #{seg.order}
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-400 flex-1 line-clamp-2 leading-snug">
                          {seg.text}
                        </p>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400 tabular-nums shrink-0">
                          {seg.finalScore}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Weak Segments */}
              {result.weakSegments.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Needs Improvement
                  </h3>
                  <div className="space-y-2">
                    {result.weakSegments.map(seg => (
                      <div
                        key={seg.segmentId}
                        className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/40"
                      >
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums shrink-0 mt-0.5">
                          #{seg.order}
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-400 flex-1 line-clamp-2 leading-snug">
                          {seg.text}
                        </p>
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums shrink-0">
                          {seg.finalScore}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Weak Words */}
              {result.weakWords.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                    Weak Words / Sounds
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.weakWords.map((w, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {w.word}
                        </span>
                        <span className="text-xs text-slate-400 tabular-nums">
                          ×{w.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* All Segment Results */}
              {result.segmentResults.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                    All Segments
                  </h3>
                  <div className="space-y-3">
                    {result.segmentResults.map((attempt, idx) => {
                      const seg = segmentMap.get(attempt.segmentId);
                      const order = seg?.order ?? idx + 1;
                      const scoreColor =
                        attempt.finalScore >= 80
                          ? 'text-green-600 dark:text-green-400'
                          : attempt.finalScore >= 65
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-500 dark:text-red-400';

                      return (
                        <div
                          key={attempt.id}
                          className="glass-card rounded-2xl p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-slate-700 dark:text-slate-200 leading-snug flex-1 min-w-0 line-clamp-2">
                              <span className="text-xs font-bold text-slate-400 mr-1.5">
                                #{order}
                              </span>
                              {attempt.originalText}
                            </p>
                            <span
                              className={cn(
                                'text-base font-bold tabular-nums shrink-0',
                                scoreColor
                              )}
                            >
                              {attempt.finalScore}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex-1 min-w-[120px]">
                              <p className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                                <Mic className="w-3 h-3" />
                                Your recording
                              </p>
                              <AudioPlayback
                                src={attempt.userAudioUrl}
                                durationMs={attempt.audioDurationMs}
                                compact
                              />
                            </div>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2">
                            "{attempt.recognizedText}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};
