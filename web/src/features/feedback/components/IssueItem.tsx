import { useState } from 'react';
import { ChevronDown, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../../components/classNames';
import type { FeedbackIssue, Severity } from '../types/feedback.types';

interface IssueItemProps {
  issue: FeedbackIssue;
  onClick?: (issue: FeedbackIssue) => void;
  highlighted?: boolean;
}

const severityConfig: Record<Severity, { icon: React.ReactNode; label: string; bg: string; border: string; text: string }> = {
  high: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    label: 'High',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-900/50',
    text: 'text-red-600 dark:text-red-400',
  },
  medium: {
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    label: 'Medium',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-900/50',
    text: 'text-orange-600 dark:text-orange-400',
  },
  low: {
    icon: <Info className="w-3.5 h-3.5" />,
    label: 'Low',
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    border: 'border-sky-200 dark:border-sky-900/50',
    text: 'text-sky-600 dark:text-sky-400',
  },
};

export function IssueItem({ issue, onClick, highlighted }: IssueItemProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = severityConfig[issue.severity];

  const handleClick = () => {
    setExpanded(v => !v);
    onClick?.(issue);
  };

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden transition-all duration-200',
      cfg.bg, cfg.border,
      highlighted && 'ring-2 ring-indigo-400 dark:ring-indigo-500'
    )}>
      {/* Summary row */}
      <button
        onClick={handleClick}
        className="w-full flex items-start gap-3 p-3 text-left"
      >
        {/* Severity icon + label */}
        <span className={cn('flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide mt-0.5 flex-shrink-0', cfg.text)}>
          {cfg.icon}
          <span className="sr-only">{cfg.label} severity</span>
        </span>

        {/* Title */}
        <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
          {issue.title}
        </span>

        <ChevronDown className={cn('w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5 transition-transform duration-200', expanded && 'rotate-180')} />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-white/50 dark:border-black/20 pt-3">
          {/* Original text */}
          {issue.originalText && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Original</div>
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-black/20 rounded-lg px-3 py-2 italic leading-relaxed font-mono text-xs">
                "{issue.originalText}"
              </p>
            </div>
          )}

          {/* Suggested revision */}
          {issue.suggestedRevision && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Suggested revision</div>
              <p className="text-sm text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg px-3 py-2 leading-relaxed font-mono text-xs">
                "{issue.suggestedRevision}"
              </p>
            </div>
          )}

          {/* Explanation */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Why</div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{issue.explanation}</p>
          </div>

          {/* Impact */}
          {issue.impactOnScore && (
            <div className={cn('flex items-start gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1.5', cfg.text, 'bg-white/60 dark:bg-black/10')}>
              {cfg.icon}
              {issue.impactOnScore}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
