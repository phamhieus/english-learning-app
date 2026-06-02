import { CalendarDays, CalendarRange, CalendarClock } from 'lucide-react';
import { cn } from '../../../components/classNames';
import type { TimeRangeMode } from '../types/learningProgress.types';

const OPTIONS: { value: TimeRangeMode; label: string; icon: typeof CalendarDays }[] = [
  { value: '7d', label: '7 Days', icon: CalendarClock },
  { value: '30d', label: '30 Days', icon: CalendarRange },
  { value: 'calendar', label: 'Calendar', icon: CalendarDays },
];

interface Props {
  value: TimeRangeMode;
  onChange: (value: TimeRangeMode) => void;
}

/** Segmented control switching the view mode (7 Days / 30 Days / Calendar). */
export const TimeRangeFilter = ({ value, onChange }: Props) => (
  <div
    role="tablist"
    aria-label="Time range"
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
            'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-300',
            active
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
          )}
        >
          <opt.icon className="w-4 h-4" />
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      );
    })}
  </div>
);
