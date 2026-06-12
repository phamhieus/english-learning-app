import { useState } from 'react';
import { FileText, Mic } from 'lucide-react';
import { cn } from '../../../components/classNames';
import type { FeedbackIssue } from '../types/feedback.types';
import { IssueItem } from './IssueItem';

interface AnswerReviewPanelProps {
  originalAnswer?: string;
  transcript?: string;
  issues: FeedbackIssue[];
  onIssueClick?: (issue: FeedbackIssue) => void;
}

/**
 * Highlights issue text within the answer. Matches are case-insensitive and
 * show the severity colour. Uses character index if provided, falls back to
 * string search.
 */
function HighlightedText({ text, issues }: { text: string; issues: FeedbackIssue[] }) {
  // Build list of [start, end, issue] sorted by start
  type Span = { start: number; end: number; issue: FeedbackIssue };
  const spans: Span[] = [];

  for (const issue of issues) {
    if (issue.originalText) {
      const idx = text.toLowerCase().indexOf(issue.originalText.toLowerCase());
      if (idx !== -1) {
        spans.push({ start: idx, end: idx + issue.originalText.length, issue });
      }
    } else if (issue.startIndex !== undefined && issue.endIndex !== undefined) {
      spans.push({ start: issue.startIndex, end: issue.endIndex, issue });
    }
  }

  // Sort and deduplicate overlapping spans (keep first)
  spans.sort((a, b) => a.start - b.start);
  const merged: Span[] = [];
  for (const span of spans) {
    if (merged.length === 0 || span.start >= merged[merged.length - 1].end) {
      merged.push(span);
    }
  }

  const severityClass = (s: FeedbackIssue['severity']) => ({
    high: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 underline decoration-red-400',
    medium: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 underline decoration-orange-400',
    low: 'bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200 underline decoration-sky-400',
  })[s];

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const span of merged) {
    if (span.start > cursor) {
      parts.push(text.slice(cursor, span.start));
    }
    parts.push(
      <mark
        key={span.issue.id}
        title={span.issue.title}
        className={cn('rounded px-0.5 cursor-pointer transition-colors hover:opacity-80', severityClass(span.issue.severity))}
      >
        {text.slice(span.start, span.end)}
      </mark>
    );
    cursor = span.end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));

  return <>{parts}</>;
}

export function AnswerReviewPanel({ originalAnswer, transcript, issues, onIssueClick }: AnswerReviewPanelProps) {
  const [tab, setTab] = useState<'answer' | 'issues'>(originalAnswer || transcript ? 'answer' : 'issues');
  const displayText = originalAnswer ?? transcript ?? '';

  const mustFix = issues.filter(i => i.group === 'must-fix');
  const niceToImprove = issues.filter(i => i.group === 'nice-to-improve');
  const issuesWithText = issues.filter(i => i.originalText);

  if (!displayText && issues.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {displayText && (
          <button
            onClick={() => setTab('answer')}
            className={cn(
              'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors',
              tab === 'answer'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            {transcript ? <Mic className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            {transcript ? 'Your Transcript' : 'Your Answer'}
            {issuesWithText.length > 0 && (
              <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-bold">
                {issuesWithText.length} highlighted
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setTab('issues')}
          className={cn(
            'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors',
            tab === 'issues'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          )}
        >
          All Issues
          {issues.length > 0 && (
            <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-bold">
              {issues.length}
            </span>
          )}
        </button>
      </div>

      <div className="p-5 sm:p-6">
        {tab === 'answer' && displayText && (
          <div className="space-y-4">
            {issuesWithText.length > 0 && (
              <p className="text-xs text-slate-400 italic">
                Highlighted text has feedback — expand an issue below to see the correction.
              </p>
            )}
            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-serif bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
              <HighlightedText text={displayText} issues={issuesWithText} />
            </div>

            {/* Legend */}
            {issuesWithText.length > 0 && (
              <div className="flex flex-wrap gap-3 text-xs pt-2 border-t border-slate-100 dark:border-slate-700">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/40" aria-hidden />
                  High severity
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-orange-100 dark:bg-orange-900/40" aria-hidden />
                  Medium severity
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-sky-100 dark:bg-sky-900/40" aria-hidden />
                  Low severity
                </span>
              </div>
            )}
          </div>
        )}

        {tab === 'issues' && (
          <div className="space-y-5">
            {mustFix.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-red-500 dark:text-red-400 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" aria-hidden />
                  Must Fix — directly affects your score
                </h4>
                <div className="space-y-2">
                  {mustFix.map(issue => (
                    <IssueItem key={issue.id} issue={issue} onClick={onIssueClick} />
                  ))}
                </div>
              </div>
            )}
            {niceToImprove.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-500 dark:text-sky-400 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" aria-hidden />
                  Nice to Improve — optional refinements
                </h4>
                <div className="space-y-2">
                  {niceToImprove.map(issue => (
                    <IssueItem key={issue.id} issue={issue} onClick={onIssueClick} />
                  ))}
                </div>
              </div>
            )}
            {issues.length === 0 && (
              <p className="text-center text-slate-400 py-8">No issues detected.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
