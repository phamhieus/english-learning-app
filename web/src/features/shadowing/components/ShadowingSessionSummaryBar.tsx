import React from 'react';
import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../../components/classNames';
import type { ShadowingSegment } from '../types/shadowing.types';

interface ShadowingSessionSummaryBarProps {
  segments: ShadowingSegment[];
  onViewResult: () => void;
  className?: string;
}

export const ShadowingSessionSummaryBar: React.FC<
  ShadowingSessionSummaryBarProps
> = ({ segments, onViewResult, className }) => {
  const completed = segments.filter(
    s => s.status === 'completed' || s.status === 'need_retry'
  );
  const needRetry = segments.filter(s => s.status === 'need_retry');
  const total = segments.length;

  const scores = completed
    .map(s => s.latestAttempt?.finalScore)
    .filter((n): n is number => n !== undefined);
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

  const avgColor =
    avgScore === null
      ? 'text-slate-400'
      : avgScore >= 80
        ? 'text-green-600 dark:text-green-400'
        : avgScore >= 65
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-red-500 dark:text-red-400';

  return (
    <div
      className={cn(
        'glass-card rounded-2xl px-4 py-3 flex items-center gap-4 flex-wrap',
        className
      )}
    >
      {/* Completed count */}
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          <span className="text-green-600 dark:text-green-400">
            {completed.length}
          </span>
          <span className="text-slate-400">/{total}</span>
        </span>
        <span className="text-xs text-slate-400 hidden sm:inline">
          segments done
        </span>
      </div>

      <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 hidden sm:block" />

      {/* Average score */}
      <div className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-indigo-400 shrink-0" />
        <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">
          Avg score
        </span>
        <span className={cn('text-sm font-bold tabular-nums', avgColor)}>
          {avgScore !== null ? `${avgScore}/100` : '—'}
        </span>
      </div>

      {needRetry.length > 0 && (
        <>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              {needRetry.length}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              need retry
            </span>
          </div>
        </>
      )}

      <div className="ml-auto">
        <button
          onClick={onViewResult}
          disabled={completed.length === 0}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
            completed.length > 0
              ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/25 hover:scale-105 active:scale-95'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          )}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Session Result</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
