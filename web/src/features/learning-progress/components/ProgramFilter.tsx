import { cn } from '../../../components/classNames';
import type { ProgramFilterValue } from '../types/learningProgress.types';

const OPTIONS: { value: ProgramFilterValue; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'IELTS', label: 'IELTS' },
  { value: 'TOEIC', label: 'TOEIC' },
];

interface Props {
  value: ProgramFilterValue;
  onChange: (value: ProgramFilterValue) => void;
}

/** Segmented control switching the active program (All / IELTS / TOEIC). */
export const ProgramFilter = ({ value, onChange }: Props) => (
  <div
    role="tablist"
    aria-label="Program"
    className="inline-flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
  >
    {OPTIONS.map((opt) => {
      const active = opt.value === value;
      return (
        <button
          key={opt.value}
          role="tab"
          aria-selected={active}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-300',
            active
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm scale-[1.02]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
          )}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);
