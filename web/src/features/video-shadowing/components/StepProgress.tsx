// Horizontal step indicator for the Add Video flow.
/* eslint-disable react-refresh/only-export-components */

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../../components/classNames';

export const ADD_VIDEO_STEPS = ['Upload Video', 'Generate Script', 'Review Segments', 'Start Practice'];

export function StepProgress({ current, steps = ADD_VIDEO_STEPS }: { current: number; steps?: string[] }) {
  return (
    <div className="flex items-center justify-between max-w-3xl mx-auto mb-10">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={s}>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition',
                  done
                    ? 'bg-green-500 text-white'
                    : active
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500',
                )}
              >
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-sm font-semibold whitespace-nowrap hidden sm:inline',
                  active ? 'text-indigo-600 dark:text-indigo-400' : done ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400',
                )}
              >
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-3 rounded-full', done ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-700')} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
