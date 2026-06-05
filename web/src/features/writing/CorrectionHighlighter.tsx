import React, { useMemo } from 'react';
import { cn } from '../../components/classNames';

interface Correction {
  original: string;
  replacement: string;
  explanation: string;
}

interface CorrectionHighlighterProps {
  text: string;
  corrections: Correction[];
  className?: string;
}

type Segment =
  | { type: 'text'; value: string }
  | { type: 'upgrade'; original: string; replacement: string }
  | { type: 'cut'; value: string };

// Highlights only the targeted corrections inline over the learner's own text,
// matching the design (clean, focused edits) instead of diffing against the
// full model answer, which produces a noisy whole-document highlight.
export const CorrectionHighlighter: React.FC<CorrectionHighlighterProps> = ({ text, corrections, className }) => {
  const segments = useMemo<Segment[]>(() => {
    // Locate each correction's first non-overlapping occurrence in the text.
    const hits: { start: number; end: number; correction: Correction }[] = [];
    const taken: boolean[] = new Array(text.length).fill(false);

    for (const correction of corrections) {
      const needle = correction.original?.trim();
      if (!needle) continue;
      let from = 0;
      while (from <= text.length - needle.length) {
        const idx = text.indexOf(needle, from);
        if (idx === -1) break;
        const overlaps = taken.slice(idx, idx + needle.length).some(Boolean);
        if (!overlaps) {
          for (let i = idx; i < idx + needle.length; i++) taken[i] = true;
          hits.push({ start: idx, end: idx + needle.length, correction });
          break;
        }
        from = idx + 1;
      }
    }

    hits.sort((a, b) => a.start - b.start);

    const out: Segment[] = [];
    let cursor = 0;
    for (const hit of hits) {
      if (hit.start > cursor) out.push({ type: 'text', value: text.slice(cursor, hit.start) });
      const replacement = hit.correction.replacement?.trim() ?? '';
      if (replacement) {
        out.push({ type: 'upgrade', original: text.slice(hit.start, hit.end), replacement });
      } else {
        out.push({ type: 'cut', value: text.slice(hit.start, hit.end) });
      }
      cursor = hit.end;
    }
    if (cursor < text.length) out.push({ type: 'text', value: text.slice(cursor) });

    return out;
  }, [text, corrections]);

  return (
    <div className={cn('text-lg leading-loose font-medium whitespace-pre-wrap', className)}>
      {segments.map((seg, index) => {
        // The original text is never altered — wrong spots only change colour,
        // with no strikethrough, replacement, background or border. The actual
        // fixes live in the "Suggested edits" list below.
        if (seg.type === 'upgrade') {
          return (
            <span key={index} className="font-bold text-orange-600 dark:text-orange-400">
              {seg.original}
            </span>
          );
        }
        if (seg.type === 'cut') {
          return (
            <span key={index} className="font-bold text-red-500 dark:text-red-400">
              {seg.value}
            </span>
          );
        }
        return (
          <span key={index} className="text-slate-700 dark:text-slate-300">
            {seg.value}
          </span>
        );
      })}
    </div>
  );
};

export default CorrectionHighlighter;
