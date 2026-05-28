import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  Mic,
} from 'lucide-react';
import { cn } from '../../../components/classNames';
import type { ShadowingSegment } from '../types/shadowing.types';

const STATUS_ICON = {
  not_started: Circle,
  practicing: Mic,
  completed: CheckCircle2,
  need_retry: AlertTriangle,
};

const STATUS_COLOR = {
  not_started: 'text-slate-400',
  practicing: 'text-indigo-500 animate-pulse',
  completed: 'text-green-500',
  need_retry: 'text-amber-500',
};

const SCORE_COLOR = (score: number) =>
  score >= 80
    ? 'text-green-600 dark:text-green-400'
    : score >= 65
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-500 dark:text-red-400';

interface ShadowingProgressSidebarProps {
  segments: ShadowingSegment[];
  activeSegmentId: string | null;
  analyzingSegmentId: string | null;
  onSegmentClick: (segmentId: string) => void;
  className?: string;
}

export const ShadowingProgressSidebar: React.FC<
  ShadowingProgressSidebarProps
> = ({
  segments,
  activeSegmentId,
  analyzingSegmentId,
  onSegmentClick,
  className,
}) => {
  const completed = segments.filter(
    s => s.status === 'completed' || s.status === 'need_retry'
  ).length;
  const total = segments.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <aside
      className={cn(
        'flex flex-col gap-3 h-full',
        className
      )}
    >
      {/* Header */}
      <div className="glass-card rounded-2xl px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Progress
          </h3>
          <span className="text-xs font-bold text-indigo-500 tabular-nums">
            {pct}%
          </span>
        </div>
        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5 text-right tabular-nums">
          {completed}/{total} completed
        </p>
      </div>

      {/* Segment list */}
      <div className="glass-card rounded-2xl overflow-hidden flex-1">
        <div className="overflow-y-auto max-h-full">
          {segments.map((segment, idx) => {
            const Icon = STATUS_ICON[segment.status];
            const isActive = segment.id === activeSegmentId;
            const isAnalyzing = segment.id === analyzingSegmentId;
            const score = segment.latestAttempt?.finalScore;

            return (
              <button
                key={segment.id}
                onClick={() => onSegmentClick(segment.id)}
                className={cn(
                  'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0',
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                )}
              >
                {/* Status icon */}
                <div className="shrink-0 mt-0.5">
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                  ) : (
                    <Icon
                      className={cn('w-4 h-4', STATUS_COLOR[segment.status])}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px] font-bold text-slate-400 tabular-nums">
                      #{idx + 1}
                    </span>
                    {score !== undefined && (
                      <span
                        className={cn(
                          'text-[11px] font-bold tabular-nums',
                          SCORE_COLOR(score)
                        )}
                      >
                        {score}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                    {segment.text}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
