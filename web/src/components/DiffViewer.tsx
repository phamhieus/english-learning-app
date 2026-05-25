import React, { useMemo } from 'react';
import { diffWords } from 'diff';
import { cn } from './Sidebar';

interface DiffViewerProps {
  original: string;
  modified: string;
  className?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ original, modified, className }) => {
  const diffResult = useMemo(() => {
    // We use diffWords to compare word by word
    const changes = diffWords(original, modified);
    
    // Post-process to group replacements (a removal immediately followed by an addition)
    const processed = [];
    for (let i = 0; i < changes.length; i++) {
      const current = changes[i];
      const next = changes[i + 1];
      
      if (current.removed && next && next.added) {
        // This is a replacement
        processed.push({
          type: 'replace',
          oldValue: current.value,
          newValue: next.value
        });
        i++; // skip next
      } else if (current.added && next && next.removed) {
        // This is a replacement (order inverted)
        processed.push({
          type: 'replace',
          oldValue: next.value,
          newValue: current.value
        });
        i++; // skip next
      } else if (current.removed) {
        processed.push({ type: 'remove', value: current.value });
      } else if (current.added) {
        processed.push({ type: 'add', value: current.value });
      } else {
        processed.push({ type: 'unchanged', value: current.value });
      }
    }
    
    return processed;
  }, [original, modified]);

  return (
    <div className={cn("text-lg leading-loose font-medium whitespace-pre-wrap", className)}>
      {diffResult.map((part, index) => {
        if (part.type === 'replace') {
          return (
            <span key={index} className="mx-1 inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-800">
              <span className="line-through text-orange-400/70 text-sm">{part.oldValue}</span>
              <span className="text-orange-600 dark:text-orange-400 font-bold">{part.newValue}</span>
            </span>
          );
        }
        if (part.type === 'remove') {
          return (
            <span key={index} className="mx-1 line-through text-red-500 bg-red-50 dark:bg-red-900/20 px-1 rounded">
              {part.value}
            </span>
          );
        }
        if (part.type === 'add') {
          return (
            <span key={index} className="mx-1 font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1 rounded">
              {part.value}
            </span>
          );
        }
        return <span key={index} className="text-slate-700 dark:text-slate-300">{part.value}</span>;
      })}
    </div>
  );
};
