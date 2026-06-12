import { useState } from 'react';
import { ChevronDown, CheckCircle, ArrowUpCircle } from 'lucide-react';
import { cn } from '../../../components/classNames';
import type { CriterionFeedback, FeedbackIssue } from '../types/feedback.types';
import { IssueItem } from './IssueItem';

interface CriterionFeedbackAccordionProps {
  criterion: CriterionFeedback;
  issues: FeedbackIssue[];
  onIssueClick?: (issue: FeedbackIssue) => void;
  defaultOpen?: boolean;
}

const scoreColor = (score?: number): string => {
  if (score === undefined) return 'text-slate-500';
  // Works for both band (0-9) and 0-100
  const normalized = score > 9 ? score / 100 * 9 : score;
  if (normalized >= 7) return 'text-emerald-600 dark:text-emerald-400';
  if (normalized >= 5.5) return 'text-indigo-600 dark:text-indigo-400';
  return 'text-orange-600 dark:text-orange-400';
};

const scoreBorder = (score?: number): string => {
  if (score === undefined) return 'border-slate-200 dark:border-slate-700';
  const normalized = score > 9 ? score / 100 * 9 : score;
  if (normalized >= 7) return 'border-emerald-200 dark:border-emerald-900/50';
  if (normalized >= 5.5) return 'border-indigo-200 dark:border-indigo-900/50';
  return 'border-orange-200 dark:border-orange-900/50';
};

export function CriterionFeedbackAccordion({
  criterion,
  issues,
  onIssueClick,
  defaultOpen = false,
}: CriterionFeedbackAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const mustFix = issues.filter(i => i.group === 'must-fix');
  const niceToImprove = issues.filter(i => i.group === 'nice-to-improve');

  return (
    <div className={cn('glass-card rounded-2xl border overflow-hidden transition-all', scoreBorder(criterion.score))}>
      {/* Header row */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        {/* Score badge */}
        <div className={cn('flex-shrink-0 text-center', scoreColor(criterion.score))}>
          <div className="text-xl font-black leading-none">{criterion.scoreLabel}</div>
        </div>

        {/* Name + summary */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-800 dark:text-slate-200">{criterion.name}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 truncate">{criterion.summary}</div>
        </div>

        {/* Issue count chips */}
        <div className="flex gap-1.5 shrink-0">
          {mustFix.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
              {mustFix.length} fix
            </span>
          )}
          {niceToImprove.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 px-2 py-0.5 rounded-full">
              {niceToImprove.length} tip
            </span>
          )}
        </div>

        <ChevronDown className={cn('w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-4 sm:px-5 pb-5 space-y-5 border-t border-slate-100 dark:border-slate-700/50 pt-4">
          {/* Why this score */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Why this score?</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{criterion.whyThisScore}</p>
          </div>

          {/* Strengths */}
          {criterion.strengths.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Strengths</h4>
              <ul className="space-y-1.5">
                {criterion.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Must-fix issues */}
          {mustFix.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-500 dark:text-red-400 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Must Fix
              </h4>
              <div className="space-y-2">
                {mustFix.map(issue => (
                  <IssueItem key={issue.id} issue={issue} onClick={onIssueClick} />
                ))}
              </div>
            </div>
          )}

          {/* Nice-to-improve */}
          {niceToImprove.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-500 dark:text-sky-400 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Nice to Improve
              </h4>
              <div className="space-y-2">
                {niceToImprove.map(issue => (
                  <IssueItem key={issue.id} issue={issue} onClick={onIssueClick} />
                ))}
              </div>
            </div>
          )}

          {/* Next band target */}
          {criterion.nextBandTarget && (
            <div className="flex items-start gap-2.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-3.5">
              <ArrowUpCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">To reach the next level: </span>
                <span className="text-sm text-indigo-700 dark:text-indigo-300">{criterion.nextBandTarget}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
