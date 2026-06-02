import React from 'react';
import { cn } from '../../../components/classNames';
import type { WordResult, WordResultStatus } from '../types/shadowing.types';

const STATUS_STYLES: Record<
  WordResultStatus,
  { bg: string; text: string; border: string; label: string }
> = {
  correct: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    label: 'Correct',
  },
  wrong: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    label: 'Wrong',
  },
  missing: {
    bg: 'bg-slate-100 dark:bg-slate-800/60',
    text: 'text-slate-400 dark:text-slate-500',
    border: 'border-slate-200 dark:border-slate-700',
    label: 'Missing',
  },
  extra: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    label: 'Extra',
  },
  weak_pronunciation: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    label: 'Weak',
  },
};

interface WordChipProps {
  wordResult: WordResult;
}

const WordChip: React.FC<WordChipProps> = ({ wordResult }) => {
  const style = STATUS_STYLES[wordResult.status];
  const hasDetail =
    wordResult.status !== 'correct' &&
    (wordResult.comment || wordResult.spokenWord);

  return (
    <span className="inline-flex max-w-full align-top flex-col items-start gap-1">
      <span
        className={cn(
          'inline-block max-w-full px-1.5 py-0.5 rounded text-sm font-medium border transition-all break-words',
          style.bg,
          style.text,
          style.border,
          wordResult.status === 'missing' && 'line-through opacity-60',
          wordResult.status === 'extra' && 'italic'
        )}
      >
        {wordResult.word}
        {wordResult.status === 'missing' && (
          <span className="sr-only"> (missing)</span>
        )}
      </span>

      {hasDetail && (
        <span className="max-w-[160px] rounded-md bg-slate-900/90 dark:bg-slate-700 text-white text-[10px] leading-snug px-2 py-1 shadow-sm break-words">
          <span className="font-semibold text-slate-300">{style.label}</span>
          {wordResult.spokenWord && (
            <span> heard: {wordResult.spokenWord}</span>
          )}
          {wordResult.comment && (
            <span> {wordResult.comment}</span>
          )}
        </span>
      )}
    </span>
  );
};

interface WordHighlightProps {
  words: WordResult[];
  className?: string;
}

export const WordHighlight: React.FC<WordHighlightProps> = ({
  words,
  className,
}) => {
  if (words.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-start gap-x-1.5 gap-y-2 leading-relaxed', className)}>
      {words.map((w, i) => (
        <WordChip key={`${w.word}-${i}`} wordResult={w} />
      ))}
    </div>
  );
};

export const WordLegend: React.FC = () => (
  <div className="flex flex-wrap gap-3 text-[11px]">
    {(
      Object.entries(STATUS_STYLES) as [WordResultStatus, (typeof STATUS_STYLES)[WordResultStatus]][]
    ).map(([status, style]) => (
      <span key={status} className="flex items-center gap-1">
        <span
          className={cn(
            'inline-block w-3 h-3 rounded border',
            style.bg,
            style.border
          )}
        />
        <span className="text-slate-500 dark:text-slate-400">{style.label}</span>
      </span>
    ))}
  </div>
);
