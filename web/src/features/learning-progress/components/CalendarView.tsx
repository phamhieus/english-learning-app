import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../components/classNames';
import { buildCalendarGrid, monthLabel, todayKey } from '../utils/dateUtils';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  year: number;
  month: number;
  /** Day keys (in this month) that have ≥1 completed session. */
  activeDays: Set<string>;
  selectedDate: string | null;
  onSelectDay: (key: string) => void;
  onMonthChange: (year: number, month: number) => void;
}

/** Monthly calendar with markers on active days and month navigation. */
export const CalendarView = ({
  year,
  month,
  activeDays,
  selectedDate,
  onSelectDay,
  onMonthChange,
}: Props) => {
  const cells = buildCalendarGrid(year, month);
  const today = todayKey();

  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    onMonthChange(d.getFullYear(), d.getMonth());
  };

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{monthLabel(year, month)}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => shift(-1)}
            aria-label="Previous month"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              const now = new Date();
              onMonthChange(now.getFullYear(), now.getMonth());
            }}
            className="px-3 h-9 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => shift(1)}
            aria-label="Next month"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, i) => {
          if (!cell.key) return <div key={`pad-${i}`} />;
          const isActive = activeDays.has(cell.key);
          const isSelected = cell.key === selectedDate;
          const isToday = cell.key === today;

          return (
            <button
              key={cell.key}
              onClick={() => onSelectDay(cell.key as string)}
              className={cn(
                'relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-semibold transition-all',
                'border',
                isSelected
                  ? 'border-indigo-400 bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                  : isActive
                    ? 'border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:border-indigo-300'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
                isToday && !isSelected && 'ring-2 ring-amber-400/70',
              )}
            >
              <span>{cell.dayOfMonth}</span>
              {isActive && (
                <span
                  className={cn(
                    'absolute bottom-1.5 w-1.5 h-1.5 rounded-full',
                    isSelected ? 'bg-white' : 'bg-indigo-500 dark:bg-indigo-400',
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Practiced
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full ring-2 ring-amber-400/70" /> Today
        </span>
      </div>
    </div>
  );
};
