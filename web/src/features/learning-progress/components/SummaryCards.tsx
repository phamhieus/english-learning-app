import { Flame, Trophy, Clock, CheckCircle2, Gauge } from 'lucide-react';
import { cn } from '../../../components/classNames';
import type { FilteredSummary, StreakSummary } from '../types/learningProgress.types';
import { formatDuration } from '../utils/dateUtils';

interface Props {
  streak: StreakSummary;
  summary: FilteredSummary;
  /** Label of the active program filter, surfaced on filter-aware cards. */
  programLabel: string;
}

interface CardDef {
  label: string;
  value: string;
  hint: string;
  icon: typeof Flame;
  /** Tailwind classes for the icon chip. */
  chip: string;
  /** Whether this card reacts to the program filter (vs. being global). */
  global?: boolean;
}

/**
 * Five summary cards. Current/Longest Streak are GLOBAL (they never change when
 * switching program). Total Time / Completed / Average Score react to the filter.
 */
export const SummaryCards = ({ streak, summary, programLabel }: Props) => {
  const cards: CardDef[] = [
    {
      label: 'Current Streak',
      value: streak.current > 0 ? `${streak.current} day${streak.current !== 1 ? 's' : ''}` : '—',
      hint: 'Global · all programs',
      icon: Flame,
      chip: 'bg-orange-100 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400',
      global: true,
    },
    {
      label: 'Longest Streak',
      value: streak.longest > 0 ? `${streak.longest} day${streak.longest !== 1 ? 's' : ''}` : '—',
      hint: 'Global · all-time best',
      icon: Trophy,
      chip: 'bg-amber-100 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400',
      global: true,
    },
    {
      label: 'Total Practice Time',
      value: summary.totalDurationMs > 0 ? formatDuration(summary.totalDurationMs) : '0m',
      hint: programLabel,
      icon: Clock,
      chip: 'bg-indigo-100 text-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-400',
    },
    {
      label: 'Completed Sessions',
      value: String(summary.completedSessions),
      hint: programLabel,
      icon: CheckCircle2,
      chip: 'bg-emerald-100 text-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    {
      label: 'Average Score',
      value: summary.averageScore !== null ? String(summary.averageScore) : '—',
      hint: programLabel,
      icon: Gauge,
      chip: 'bg-cyan-100 text-cyan-500 dark:bg-cyan-900/30 dark:text-cyan-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={cn(
            'glass-card rounded-2xl p-5 flex flex-col gap-3 hover:-translate-y-1 transition-transform',
            c.global && 'ring-1 ring-orange-200/60 dark:ring-orange-500/20',
          )}
        >
          <div className="flex items-center justify-between">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', c.chip)}>
              <c.icon className="w-5 h-5" />
            </div>
            {c.global && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400/80">
                Global
              </span>
            )}
          </div>
          <div>
            <p className="text-2xl font-bold leading-tight">{c.value}</p>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              {c.label}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{c.hint}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
